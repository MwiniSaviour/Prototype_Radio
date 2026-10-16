# CMS Wave 1 — Async content layer + client-bundle data-leak fix

Agent: content-layer (owns `src/content/**` new, `src/data/**`, `src/components/**`,
`src/app/**` except `src/app/(payload)/**`).
Date: 2026-10-15/16. Build verified: Next.js 16.4.0, webpack (Turbopack blocked on this host).

## 1. What changed

The site's ~18 data consumers now read through an async facade, `@/content`.
`src/data/**` remains the untouched seed source; `src/lib/types.ts` unchanged.
The two client components that pulled fixtures into the browser bundle
(`Header`, `MobileMenu`) now receive their data as props from the server layout.

## 2. `src/content` public API

### `src/content/source.ts`
- `type ContentSource = "local" | "payload"`
- `const contentSource: ContentSource` — resolved once at module load from
  `process.env.CONTENT_SOURCE`; unset/empty → `"local"`.
- `"payload"` → throws (fail fast, no silent fallback):
  `CONTENT_SOURCE="payload" is selected but the Payload content backend is not implemented yet. Unset CONTENT_SOURCE (or set it to "local") to serve the src/data seed fixtures.`
- Any other value → throws listing valid values.

### `src/content/local.ts` (fixture implementation)
Every getter is `async` and returns a `Promise` of exactly the type the sync
fixture function returned. Types re-exported: `NextShow`, `ScheduleEntry`, `ScheduleByDay`.

| Getter | Resolves to |
|---|---|
| `getArticles(): Promise<Article[]>` | `Promise<Article[]>` |
| `getArticleBySlug(slug)` | `Article \| undefined` |
| `getLatestArticles(limit = 10)` | `Article[]` |
| `getFeaturedArticles(limit = 3)` | `Article[]` |
| `getBreakingArticles()` | `Article[]` |
| `getArticlesByCategory(category: Category)` | `Article[]` |
| `getTrendingArticles(limit = 5)` | `Article[]` |
| `getRelatedArticles(article, limit = 3)` | `Article[]` |
| `searchArticles(query, limit = 20)` | `Article[]` |
| `getCategories()` | `EditorialCategory[]` |
| `getCategoryBySlug(slug)` / `getCategoryById(id)` | `EditorialCategory \| undefined` |
| `getAuthors()` | `AuthorProfile[]` |
| `getAuthorById(id)` / `getAuthorBySlug(slug)` | `AuthorProfile \| undefined` |
| `getShows(limit?)` | `Show[]` |
| `getShowById(id)` / `getShowBySlug(slug)` | `Show \| undefined` |
| `getCurrentShow(now = new Date())` | `Show \| null` |
| `getNextShow(now = new Date())` | `NextShow \| null` (`{ show, slot }`) |
| `getPodcastEpisodes()` | `PodcastEpisode[]` |
| `getEpisodeBySlug(slug)` | `PodcastEpisode \| undefined` |
| `getEpisodesByShow(showId)` | `PodcastEpisode[]` |
| `getLatestEpisodes(limit = 4)` | `PodcastEpisode[]` |
| `getScheduleByDay()` | `ScheduleByDay` (`Record<Weekday, { show, start, end }[]>`) |

### `src/content/index.ts`
`export { contentSource, type ContentSource } from "./source"; export * from "./local";`
This is the single swap point: a future `payload` branch replaces the `./local`
re-export, and no call site changes.

## 3. Consumers changed (all now `await` from `@/content`)

| File | Notes |
|---|---|
| `src/app/layout.tsx` | **async**; awaits `getCurrentShow`, `getNextShow`, `getCategories`; passes as props to `SiteHeader` |
| `src/app/page.tsx` | **async**; all article/show/episode getters awaited; passes `currentShow`/`nextShow` props to `TodaysShows` and `LiveBadge` |
| `src/app/article/[slug]/page.tsx` | `generateStaticParams` **async** (`getArticles`), `generateMetadata` + page await `getArticleBySlug`, `getRelatedArticles` |
| `src/app/category/[slug]/page.tsx` | `generateStaticParams` async (`getCategories`); page awaits `getCategoryBySlug`, `getArticlesByCategory`, `getCategories` |
| `src/app/category/page.tsx` | **async**; `getCategories`, `getArticles` |
| `src/app/shows/page.tsx` | **async**; `getShows` |
| `src/app/podcasts/page.tsx` | **async**; `getShows`, `getPodcastEpisodes`, `getEpisodesByShow`, `getLatestEpisodes`, `getShowById` (Promise.all per show/episode) |
| `src/app/about/page.tsx` | **async**; `getAuthors`, `getShows` |
| `src/app/search/page.tsx` | already async; now `await searchArticles(query)` |
| `src/app/sitemap.ts` | `sitemap()` **async**; Promise.all of `getArticles`, `getCategories`, `getShows`, `getPodcastEpisodes` |
| `src/components/layout/Footer.tsx` | **async** server component; `await getCategories()` |
| `src/components/news/LiveBadge.tsx` | **async** server component; optional `nextShow` prop (preferred when the page already resolved it), falls back to `await getNextShow()` |
| `src/components/radio/ShowScheduleRail.tsx` | **async** server component; `await getScheduleByDay()` hoisted into the component, `buildRows(schedule, now)` |
| `src/components/radio/TodaysShows.tsx` | **async** server component; `getScheduleByDay`/`getShows` awaited in `buildEntries`; optional `currentShow`/`nextShow` props with content-layer fallback |

## 4. Client-bundle data leak — fixed

Before: `Header.tsx` (`"use client"`) imported `getCurrentShow`/`getNextShow` from
`@/data/shows`, and `MobileMenu.tsx` (`"use client"`) imported `categories` from
`@/data/categories`. Webpack therefore shipped the entire fixture dataset
(shows + schedules, all categories) in the browser JS.

After:
- `src/app/layout.tsx` (server) computes `currentShow`, `nextShow`, `categories`
  and passes them as props: `<SiteHeader currentShow={...} nextShow={...} categories={...} />`.
- `SiteHeader` forwards `currentShow`/`nextShow` to the presentational `OnAirStrip`
  (same markup, same live/up-next logic and `formatClock` formatting) and
  `categories` to `MobileMenu`; both client components are now prop-only.
- `Header.tsx` imports only `type { Category, Show, ShowSlot } from "@/lib/types"`
  (type-only, erased). `MobileMenu.tsx` likewise.
- `LiveBadge`/`TodaysShows` prefer page-supplied on-air state as props
  (homepage passes what it already resolved); they retain a content-layer
  fallback for standalone use. Rendered output unchanged.

Build-artifact proof — distinctive fixture strings in the browser-served tree:

```
$ for s in jambia-pumping-station-failure-water-rationing \
           "Eight communities on the northern spur" \
           "Abu Bakari Sule" "Request Line After Dark"; do
    grep -rl "$s" .next/static | wc -l; done
0
0
0
0
```

(same strings DO appear in `.next/server/**`, where they belong.)

## 5. Grep evidence

Prescribed command — prints nothing (exit 1):

```
$ grep -rn '@/data' src --include=*.tsx --include=*.ts | grep -v '^src/data/' | grep -v '^src/content/'
$ echo $?
1
```

The only `@/data` imports left in the app are inside `src/content/local.ts`
(the facade's fixture implementation). No `"use client"` file imports `@/data`
or `@/content`:

```
$ for f in $(grep -rl '"use client"' src --include="*.tsx" --include="*.ts"); do
    grep -Hn "from \"@/data\|from \"@/content" "$f"; done
$ echo $?
1
```

Client components affected: `Header.tsx`, `MobileMenu.tsx` (fixed); other
`"use client"` files (`ThemeToggle`, `Reveal`, `ShareBar`, `NewsletterSignup`,
`NewsletterRail`, `LivePlayerHero`, `error.tsx`) never imported content data.

## 6. Verification commands

```
$ node node_modules/typescript/bin/tsc --noEmit      → exit 0
$ npm run lint                                       → exit 0 (0 problems)
$ npm run build                                      → exit 0
```

Route table unchanged (43 static pages incl. 24 article SSG + 10 category SSG,
`/search` dynamic, `/sitemap.xml`, hourly revalidate). No errors originated in
the other agents' paths (`src/payload.config.ts`, `src/collections/**`,
`src/globals/**` did not exist on disk at build time).

Manual `CONTENT_SOURCE` checks:

```
default          → "local"
CONTENT_SOURCE=payload → throws: CONTENT_SOURCE="payload" is selected but the Payload content
                          backend is not implemented yet. …
CONTENT_SOURCE=bogus   → throws: … not a recognised content source. Valid values: "local" (default), "payload".
```

## 7. Render-equivalence evidence (old vs new)

Reference snapshots of the **old production build** were taken from port 3000 at
23:47 (2026-10-15Z) *before* the first rebuild. Note: the rebuilds happened
after midnight (00:17Z), and the user's :3000 server runs from this same
directory, so both ports now serve the new build; the snapshots are the only
old-code artifacts.

### 7a. Prescribed live comparison (identical counts)

```
port 3000:       1 LIVE ON AIR
port 3000:       2 Listen Anytime
port 3000:       2 SHOW SCHEDULE
port 3000:       2 Today’s Shows
port 3000:       2 UP NEXT
port 3500:       1 LIVE ON AIR
port 3500:       2 Listen Anytime
port 3500:       2 SHOW SCHEDULE
port 3500:       2 Today’s Shows
port 3500:       2 UP NEXT

port3500 /shows: 200
port3500 /podcasts: 200
port3500 /about: 200
port3500 /category: 200
port3500 /search: 200
```

### 7b. Old snapshot vs new build (token-level diff)

After normalizing Next chunk hashes, inline RSC payloads (`<script>` → marker),
the header date string, and sitemap `<lastmod>`, every remaining difference is
confined to `new Date()`-driven regions — and is explained by the midnight
boundary:

- `/about`, `/podcasts`, article page: exactly **1 hunk** each — header on-air
  show name (`Request Line After Dark` at Thu 23:47 → `The Night Frequency` at
  Fri 00:17). Both validated against `src/data/shows.ts`:
  Request Line After Dark = Thu 20:00–24:00; The Night Frequency = Fri 00:00–06:00.
- `/category`, `/category/local-news`, `/search?q=water`: on-air name + 1–2
  extra RSC flight chunks (streaming detail only; both builds contain the same
  4 content scripts: theme bootstrap, `$RT`, `$RB/$RV`, flight bootstrap).
- `/shows`: on-air name + the `aria-current="date"`/"Today" markers moving from
  Thursday's rows to Friday's rows in the weekly table (day changed).
- `/`: on-air name + radio block only (hero show/tagline/slot/play label,
  Today's Shows four-card running order, Show Schedule rail rows, LiveBadge
  name/hosts, one ON AIR badge placement). All newsroom sections (ticker,
  lead stories, trending, latest grid, categories, podcast rail) are
  byte-identical.
- `/sitemap.xml`: identical modulo build-time `<lastmod>`.

No structural, copy, or styling differences found.

## 8. Files

Created: `src/content/index.ts`, `src/content/local.ts`, `src/content/source.ts`.
Changed: the 14 consumer files in §3 plus `src/components/layout/Header.tsx`
and `src/components/layout/MobileMenu.tsx` (props + dead-import removal =
16 files total).
Untouched: `src/data/**` fixtures, `src/lib/types.ts`, `next.config.mjs`,
`package.json`, `src/app/(payload)/**` (does not exist).

## 9. Environment

- Turbopack blocked on this host — build used `--webpack` via `npm run build`.
- Verification server run on :3500 (`next start`), killed after verification —
  the user's :3000 server (pid 9962) was never touched.
- No dependencies added.
