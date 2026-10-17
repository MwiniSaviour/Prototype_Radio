# Implementation Plan: Audio backend (live embed + podcast audio fields + public RSS)

Spec: `docs/superpowers/specs/2026-10-17-audio-backend-design.md` (approved; commits a3140c0, e28c61b, 8117433).
Progress ledger: `.superpowers/sdd/progress.md` (created at first dispatch).
Branch: `feat/audio-backend` (backend round-2 groundwork committed as `9d73123`).

## 0. Global constraints (every lane)

1. **Platform**: Windows pwsh (AGENTS.md Termux sections stale). Keep shell commands on one line (`&&`). Check state with `git status --short`, `git log --oneline -5` — never `pgrep`/`pkill -f` (would kill the invoking process on some hosts).
2. **Tests**: run only your own suite: `node --import ./scripts/ts-ext-resolve.mjs --test --test-reporter=spec tests/<mine>.test.ts` (Node v24.18.0). Do **not** run repo-wide typecheck/lint/build — other lanes have transient errors.
3. **No `@/` aliases** in any file that unit tests load (ts-ext-resolve maps only extensionless relative imports). Pure modules (A, B) are fully self-contained: zero imports.
4. **Commit contract**: each lane edits only the files listed in its brief, runs its tests to green, then makes exactly one commit containing only its listed files, using the commit message stated at the end of its lane section (never `git add -A`, never push). Write a report to `docs/superpowers/reports/<task-id>-implementation-report.md` per Verification & Evidence (complete every section; no verification, no completion). The coordinator commits nothing itself.
5. **Never edit**: `public/**`, real fixtures under `src/data/` (`shows.ts`, `podcasts.ts`, others), existing migrations (`src/migrations/20261016_003104_initial.*`, `20261017_204540.*`), `src/data/payload-types.ts` (Lane C regenerates `src/payload-types.ts` only), anything outside the brief's file list.
6. DB for Lane C: Lane C runs `scripts/pg.sh start` then `scripts/pg.sh ready` itself (postgres://postgres@127.0.0.1:5432/radiowaa). Both are idempotent and Postgres is already up on 127.0.0.1:5432.
7. Never print `PAYLOAD_SECRET`. Reserve `podcast:guid` = UUID literal (any stable string is spec-valid; UUID recommended).

## 1. Lane A — `resolveCurrentSlot` pure module + tests (ungated)

Create `src/lib/resolveCurrentSlot.ts` and `tests/resolveCurrentSlot.test.ts`.

Reference semantics (extract verbatim from `src/components/radio/ShowScheduleRail.tsx` `buildRows`, lines 45–87): DAY_ORDER sunday-first by `now.getDay()`; today at offset 0, tomorrow at offset +1 (1440 min); slot crosses midnight when `endMinutes <= startMinutes` → `endMinutes += 1440`; live = first occurrence with `nowMinutes ∈ [startMinutes, endMinutes)`; next = first occurrence with `startMinutes > nowMinutes`; no live → anchor falls back to next.

Exact API (self-contained — no imports, declare `type Weekday = "sunday"|"monday"|"tuesday"|"wednesday"|"thursday"|"friday"|"saturday"` locally):

```
export interface SlotOccurrence<T> { item: T; day: Weekday; start: string; end: string;
  startMinutes: number; endMinutes: number; isToday: boolean }
export function toMinutes(time: string): number            // "HH:MM" and "24:00" → 1440
export function extractSchedule<T extends { start: string; end: string }>(
  schedule: Record<Weekday, readonly T[]>): SlotOccurrence<T>[]
export function resolveCurrentSlot<T extends { start: string; end: string }>(
  schedule: Record<Weekday, readonly T[]>, now: Date)
: { live: SlotOccurrence<T> | null; next: SlotOccurrence<T> | null; anchorIsLive: boolean }
export function rollingWindow<T extends { start: string; end: string }>(
  schedule: Record<Weekday, readonly T[]>, now: Date, count: number)
: { occurrences: SlotOccurrence<T>[]; anchorIsLive: boolean }  // slice(startIndex, startIndex+count)
```

`extractSchedule` = today rows (offset 0) + tomorrow rows (offset +1), same field mapping as rail `dayRows` (`key` not needed — callers key). `rollingWindow` shares the extract + find-index logic with `resolveCurrentSlot` (one internal helper; public fn duplicates return shape of rail: rows + anchorIsLive).

Tests (≥14, fixed local Dates like `new Date(2026, 9, 17, 10, 30)`): toMinutes basic + "24:00" = 1440; extract offsets/isToday; midnight-crossing (e.g. Sat 23:00→01:00 occurrence endMinutes) and "24:00" end unaffected (`1440 > 1380`); live hit mid-slot (incl. end "24:00" so `nowMinutes (≤1439) < 1440`); live miss → next (today later slot, then tomorrow slot); empty schedule + empty weekday array; multiple slots same start stable order; rollingWindow slice/anchorIsLive; `now` exactly at start boundary (live) / exactly at end boundary (not live, next picks up).

Out of scope: component wiring (Lane E). `ShowSchedule.tsx` table untouched.

Commit message: `feat(resolver): extract current-slot resolver for radio schedule with unit tests`

## 2. Lane B — `rss.ts` pure XML builder + tests (ungated)

Create `src/lib/rss.ts` and `tests/rss.test.ts`. Self-contained (zero imports; own types).

```
export function escapeXml(value: string): string   // & < > " ' → &amp; &lt; &gt; &quot; &apos;
export function formatItunesDuration(seconds: number | null): string | null
  // hr>0 → "H:MM:SS" else "M:SS"; ≤0 or non-finite → null (tests assert parity with src/lib/format.ts formatDuration cases)
export interface RssItemInput { title: string; slug: string; description: string;
  publishedAt: string;               // ISO; pubDate = new Date(publishedAt).toUTCString()
  durationSeconds: number | null; audioUrl: string; audioMimeType: string;
  audioByteLength: number | null; imageUrl?: string | null }
export function toRssItem(item: RssItemInput): string   // caller filters to entries WITH audioUrl
export interface RssChannelParams { title; selfUrl; siteUrl; description; language?  // default "en-gh"
  author; categories?;               // default ["News"]
  guid; imageUrl?: string | null; episodeItems: string[] /* pre-rendered items */ }
export function buildRssChannel(params: RssChannelParams): string
```

Channel skeleton (attribute order + empty-line spacing exactly as spec table): `<?xml version="1.0" encoding="UTF-8"?>` then `<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0">`. `<channel>` children: title, link = `siteUrl` minus trailing slash (used in item links too: `siteUrl + "/podcasts#slug"`), description, `language` (default "en-gh"), `podcast:guid`, `lastBuildDate` + `pubDate` (same now-based UTC string), `itunes:author`, `itunes:explicit` = false, `itunes:owner` **omitted** (no contact email exists anywhere in siteConfig — Apple fills it during submission), optional `itunes:image href` + guards `<image>` (link+title+url) when `imageUrl` truthy, 0..n `itunes:category text="..."`. Items are caller-supplied lines. All text nodes content-passed through `escapeXml`; attribute values escaped via the same function; timestamps XML/render-time here (XML is pre-escaped). Route holds them through params.

Tests (12–16): escapeXml all five + already-escaped input unchanged ("&amp;" stays "&amp;"); formatItunesDuration 7345→"2:02:25", 810→"13:30", 0→null, null→null, NaN/Infinity→null; toRssItem full line (title/desc escaped, pubDate format `^Mon, 0\d|1\d|2\d|3\d ... GMT$`, GUID isPermaLink false, enclosure attrs, itunes:duration), missing bytes → no length attr, imageUrl null → no image; buildRssChannel skeleton (declaration, namespaces, defaults language/categories, explicit false, no owner, categories loop, items verbatim, no trailing whitespace issues).

Commit message: `feat(rss): self-contained podcast RSS channel + item builders with unit tests`

## 3. Lane C — podcast audio fields (ungated; backend committed as `9d73123`)

Touch: `src/collections/PodcastEpisodes.ts` (+ audio fields), `src/migrations/index.ts` (register), NEW `src/migrations/<timestamp>_add_podcast_audio_fields.ts/.json`, regen `src/payload-types.ts`, `src/lib/types.ts` (optional fields), `src/content/payload.ts` (`toEpisode` map), NEW `scripts/seed-audio.ts`.

Steps (`pg.sh start` + `ready` first):
1. Backend agent's collection work is committed (`9d73123`) — re-read the CURRENT `PodcastEpisodes.ts` before editing.
2. `PodcastEpisodes.ts`: `audioUrl` (text, optional, validate http/https), `audioMimeType` (regex `^audio/(mpeg|mp4|aac|ogg|opus|wav)$`), `audioByteLength` (number, integer, positive). No new field groups. Also extend the revalidate paths array at the top — `createRevalidateHooks(() => ["/", "/podcasts"])` — to include `"/feeds/radio-waa.xml"`. `durationSeconds` already exists (~line 43) — confirm on read.
3. Migration: only `ALTER TABLE podcast_episodes ADD COLUMN ...` for the three new columns (match prior migration template `20261017_204540.ts` structure exactly up/down `db.execute(sql...)`).
4. Regen payload-types via `node node_modules/payload/dist/bin.js generate:types --disable-transpile` (backend agent used import syntax to work around loader — replicate their approach if that one-off's file path differs).
5. `types.ts` optional fields + mapping in `toEpisode`; verify `content/index.ts` re-export path unchanged.
6. `scripts/seed-audio.ts`: sets audioUrl/audioMimeType/audioByteLength pointing at env `AUDIO_SAMPLE_BASE_URL` (no hardcoded host in code; values like `${url}/sample.mp3`) for episodes whose `legacyId` matches the sample list; Local API auth token inbreathes PAYLOAD_SECRET? NO — Local API doesn't need auth secrets; from bash source `.env`.
7. NO produced audio bytes are downloaded into the repo (public/media stays empty); `audioUrl` may 404 until a real host is deployed.
8. Tests: none required (schema-level); after migrating, verify the three columns exist yourself with an `information_schema` psql query.
9. Commit message: `feat(audio-schema): podcast episode audio fields + migration + payload regen`

## 4. Lane D (wave 2) — RSS route + wiring (needs A+B done; C not required)

- Create `src/app/feeds/radio-waa.xml/route.ts`: `export const revalidate = 600;` route handler loads ALL episodes via data layer (`getEpisodes()`), filter `audioUrl != null`, sort newest → `toRssItem`, then `buildRssChannel()` with exact title `<siteConfig.name> — All Episodes` (i.e. `siteConfig.name + " — All Episodes"`), description = siteConfig.tagline, author = siteConfig.legalName, selfUrl = absoluteUrl("/feeds/radio-waa.xml"), siteUrl = absoluteUrl("/"), guid = `"135bc6f2-df4a-5fcc-b7e7-97e03e5ee52f"` (constant), language omitted (default).
- `src/lib/seo.ts`: add `alternates.types["application/rss+xml"] = "/feeds/radio-waa.xml"` on pages where relevant (all) — check context arg availability.
- `src/components/layout/Footer.tsx`: social icon RSS href "/podcasts" → "/feeds/radio-waa.xml" (constants still list "/podcasts"; change value directly or via constants — leave siteConfig constant alone? Better keep single source: update socials.RSS href in `src/lib/constants.ts` IF footer reads it — confirm on read — target/footer both route via constants.ts as single source).
- `src/app/(frontend)/sitemap.ts`: add `{ url: absoluteUrl("/feeds/radio-waa.xml"), changeFrequency: "daily", priority: 0.6 }` after the article block.

Commit message: `feat(rss-route): public /feeds/radio-waa.xml route + autodiscovery wiring`

## 5. Lane E (wave 2) — hero wiring + diagnostics (needs Lane A)

`src/components/radio/LivePlayerHero.tsx`: replace internal now/next computation with `resolveCurrentSlot` via `ShowScheduleRail`-equivalent mapping — plus offline diagnostics per spec §8.6: explicit network error message rendered below toggle when fetch/Audio errors and Zeno diagnostics checklist covers (extension id: the section 8.6 checklist mentions CORS/wireup of `?embed=1` stream). Keep current copy behavior, re-render, hydration. `ShowSchedule.tsx` untouched.

Commit message: `fix(hero): wire schedule resolver + offline diagnostics`

## 6. Wave dispatch + coordinator integration

Wave 1 (parallel): Lane A, Lane B, Lane C. Wave 2: Lane D (requires B), Lane E (requires A).
Each implementer: tests green → exactly one commit per its brief (files + message fixed in the lane section); implementation report; reviewed by reviewer agent (diff package scoped to lane paths); fixer loop; the coordinator commits nothing. Final integration: `scripts/pg.sh start && scripts/pg.sh ready`, then `node node_modules/next/dist/bin/next build --webpack` + `next start`, `curl /feeds/radio-waa.xml` sanity (HTTP 200 + valid XML + namespaces present), `npm run typecheck`, full test suite run.
