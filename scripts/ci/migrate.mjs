#!/usr/bin/env node
/**
 * Applies (or inspects) Payload's Postgres migrations.
 *
 * Why not call the Payload CLI directly? This host runs Node's native type
 * stripping through `scripts/ts-ext-resolve.mjs`, and the same flags are needed
 * on Vercel so the TypeScript config loads identically in both places. Wrapping
 * the CLI here means `npm run migrate` is the one command for a laptop, CI and
 * the Vercel build step.
 *
 * Usage:
 *   node scripts/ci/migrate.mjs            # apply pending migrations
 *   node scripts/ci/migrate.mjs --status   # show what is pending, change nothing
 */
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { assertDatabaseUrl, assertPayloadSecret } from "./env.mjs";

const status = process.argv.includes("--status");

if (!process.env.DATABASE_URL) {
  console.warn("▸ DATABASE_URL is not set — nothing to migrate.\n  Docs: docs/deployment.md");
  process.exit(0);
}

// Migrations need exactly what the app needs; report it the same way the build
// does instead of with a stack trace.
try {
  assertDatabaseUrl();
  assertPayloadSecret();
} catch (error) {
  console.error(`\n${error.message}\n`);
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "../..");

const args = [
  "--no-warnings",
  "--import",
  "./scripts/ts-ext-resolve.mjs",
  path.join(root, "node_modules/payload/bin.js"),
  // Hand module loading to Node instead of tsx: tsx double-loads undici on this
  // Node version and dies before the config is read (see ts-ext-resolve.mjs).
  "--disable-transpile",
  status ? "migrate:status" : "migrate",
];

console.log(`▸ payload ${status ? "migrate:status" : "migrate"}\n`);

const child = spawn(process.execPath, args, { stdio: "inherit", cwd: root, env: process.env });

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
