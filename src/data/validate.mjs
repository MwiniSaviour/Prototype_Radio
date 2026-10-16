/**
 * Referential-integrity check for the mock fixtures.
 *
 *   node src/data/validate.mjs
 *
 * The fixtures are TypeScript. Rather than run the .ts directly (native ESM
 * will not resolve this project's extensionless / "@/" imports), this script
 * first compiles just the data + lib modules to CommonJS in a temp dir with the
 * project's own tsc, then runs the checks against the compiled output. Exits
 * non-zero on any failure.
 */

import { existsSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

// --- compile the fixtures to CJS in a temp dir -----------------------------
const BUILD = resolve(ROOT, ".validate-build");
const tsc = resolve(ROOT, "node_modules/typescript/bin/tsc");
const tsconfigValidate = resolve(HERE, "tsconfig.validate.json");

rmSync(BUILD, { recursive: true, force: true });
execFileSync(process.execPath, [tsc, "-p", tsconfigValidate], { cwd: ROOT, stdio: "inherit" });

// --- load compiled fixtures -----------------------------------------------
const require = createRequire(import.meta.url);
const load = (rel) => require(join(BUILD, "src/data", rel));

const { articles } = load("articles.js");
const { categories } = load("categories.js");
const { authors } = load("authors.js");
const { shows } = load("shows.js");
const { podcastEpisodes } = load("podcasts.js");

const failures = [];
const notes = [];
const fail = (msg) => failures.push(msg);

const categoryById = new Map(categories.map((c) => [c.id, c]));
const authorById = new Map(authors.map((a) => [a.id, a]));
const showById = new Map(shows.map((s) => [s.id, s]));

const assetPaths = new Set();
const checkAsset = (src, where) => {
  if (!src) return fail(`${where}: missing image src`);
  if (/^https?:\/\//.test(src)) return fail(`${where}: remote image URL not allowed -> ${src}`);
  if (!src.startsWith("/")) return fail(`${where}: image src must be root-relative -> ${src}`);
  assetPaths.add(src);
  const onDisk = resolve(ROOT, "public", src.replace(/^\//, ""));
  if (!existsSync(onDisk)) fail(`${where}: image missing on disk -> ${src}`);
};

// --- articles ---
const articleIds = new Set();
const articleSlugs = new Set();
for (const a of articles) {
  if (articleIds.has(a.id)) fail(`duplicate article id: ${a.id}`);
  articleIds.add(a.id);
  if (articleSlugs.has(a.slug)) fail(`duplicate article slug: ${a.slug}`);
  articleSlugs.add(a.slug);

  if (!categoryById.has(a.category.id)) fail(`${a.slug}: unknown category id ${a.category.id}`);
  if (!authorById.has(a.author.id)) fail(`${a.slug}: unknown author id ${a.author.id}`);
  if (!a.image?.alt?.trim()) fail(`${a.slug}: image alt text empty`);
  checkAsset(a.image?.src, a.slug);
  if (Number.isNaN(Date.parse(a.publishedAt))) fail(`${a.slug}: bad publishedAt ${a.publishedAt}`);
  if (a.updatedAt && Number.isNaN(Date.parse(a.updatedAt))) fail(`${a.slug}: bad updatedAt`);
  if (a.updatedAt && Date.parse(a.updatedAt) < Date.parse(a.publishedAt))
    fail(`${a.slug}: updatedAt earlier than publishedAt`);
  if (!Array.isArray(a.body) || a.body.length === 0) fail(`${a.slug}: empty body`);

  const words = (a.body ?? [])
    .map((b) => (b.text ?? (b.items ?? []).join(" ")))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  const implied = Math.max(1, Math.round(words / 200));
  if (Math.abs(implied - a.readingMinutes) > 3)
    notes.push(`${a.slug}: readingMinutes ${a.readingMinutes} vs ~${implied} implied by ${words} words`);
}

// --- categories ---
for (const c of categories) {
  const n = articles.filter((a) => a.category.id === c.id).length;
  if (c.articleCount !== n) fail(`category ${c.slug}: articleCount ${c.articleCount} != actual ${n}`);
  const icon = resolve(ROOT, "public/assets/icons", `icon-${c.icon}.svg`);
  if (!existsSync(icon)) fail(`category ${c.slug}: icon missing -> icon-${c.icon}.svg`);
}

// --- shows ---
const showIds = new Set();
for (const s of shows) {
  if (showIds.has(s.id)) fail(`duplicate show id: ${s.id}`);
  showIds.add(s.id);
  if (!s.hosts.length) fail(`${s.id}: no hosts`);
  for (const h of s.hosts) if (!authorById.has(h.id)) fail(`${s.id}: unknown host id ${h.id}`);
  if (s.category && !categoryById.has(s.category.id)) fail(`${s.id}: unknown category id ${s.category.id}`);
  if (!s.image?.alt?.trim()) fail(`${s.id}: image alt text empty`);
  checkAsset(s.image?.src, s.id);
  if (!s.schedule.length) fail(`${s.id}: empty schedule`);
  for (const slot of s.schedule) {
    if (!slot.start || !slot.end) fail(`${s.id}: incomplete slot`);
    if (slot.start >= slot.end) fail(`${s.id}: slot start ${slot.start} >= end ${slot.end}`);
  }
}

// --- schedule coverage ---
// The station broadcasts 24/7, so every weekday must be fully covered. Overlaps
// are allowed (handovers, e.g. the overnight block and the breakfast show share
// half an hour); gaps are dead air and fail.
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const asClock = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
for (const day of DAYS) {
  const intervals = shows
    .flatMap((s) => s.schedule.filter((sl) => sl.day === day).map((sl) => [toMinutes(sl.start), toMinutes(sl.end)]))
    .sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  for (const [start, end] of intervals) {
    if (start > cursor) fail(`dead air ${day}: ${asClock(cursor)}–${asClock(start)} uncovered`);
    cursor = Math.max(cursor, end);
  }
  if (cursor < 1440) fail(`dead air ${day}: ${asClock(cursor)}–24:00 uncovered`);
}

// --- podcast episodes ---
const epSlugs = new Set();
for (const e of podcastEpisodes) {
  if (epSlugs.has(e.slug)) fail(`duplicate episode slug: ${e.slug}`);
  epSlugs.add(e.slug);
  if (!showById.has(e.showId)) fail(`${e.slug}: unknown showId ${e.showId}`);
  if (!e.image?.alt?.trim()) fail(`${e.slug}: image alt text empty`);
  checkAsset(e.image?.src, e.slug);
  if (Number.isNaN(Date.parse(e.publishedAt))) fail(`${e.slug}: bad publishedAt`);
  if (e.durationSeconds <= 0) fail(`${e.slug}: non-positive duration`);
}

// --- authors ---
for (const a of authors) {
  if (a.avatarUrl) checkAsset(a.avatarUrl, `author ${a.slug}`);
  if (!a.bio || a.bio.split(/\s+/).filter(Boolean).length < 15) fail(`author ${a.slug}: bio too short`);
}

// --- report ---
rmSync(BUILD, { recursive: true, force: true });

const w = console.log;
w(`articles=${articles.length} categories=${categories.length} authors=${authors.length} shows=${shows.length} episodes=${podcastEpisodes.length} uniqueAssets=${assetPaths.size}`);
if (notes.length) {
  w(`\n${notes.length} note(s):`);
  for (const n of notes) w(`  ~ ${n}`);
}
if (failures.length) {
  w(`\nFAIL (${failures.length}):`);
  for (const f of failures) w(`  x ${f}`);
  process.exit(1);
}
w("\nOK: all referential integrity checks passed.");