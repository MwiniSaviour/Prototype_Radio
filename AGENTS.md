# AGENTS.md — Radio Waa (Next.js 16 + Tailwind v4)

Read this before running anything. It exists because several days of rediscovering
platform constraints can be avoided by reading one page.

## 1. Platform reality: this is Android / Termux / bionic libc

This machine is **Android (aarch64) running Termux**, not Linux/glibc. Anything
that assumes glibc will fail in confusing ways. Verified facts (do not re-test,
just obey):

1. **The native Next.js SWC binding cannot load here.**
   `@next/swc-linux-arm64-gnu` links against glibc and fails at `require()` time:
   `dlopen failed: library "libdl.so.2" not found`.
   The project therefore pins **`@next/swc-wasm-nodejs` at the exact installed
   Next version** (16.4.0) and relies on Next's WASM-SWC fallback. If you ever
   bump `next`, bump `@next/swc-wasm-nodejs` to the **same version** and reinstall
   it with `--force`:
   ```bash
   npm i -D @next/swc-wasm-nodejs@<next-version> --force --no-audit --no-fund
   ```

2. **Turbopack is hard-blocked on this platform.**
   `error: "Turbopack is not supported on this platform (android/arm64) because
   native bindings are not available"`. Turbopack has no WASM fallback.
   **Every `next dev` / `next build` invocation must pass `--webpack`.** The npm
   scripts in `package.json` already do this.

3. **`npx next <anything>` is broken** (`sh: 1: next: not found`) even though
   `node_modules/.bin/next` is a valid symlink — the shebang points at
   `/usr/bin/env`, which does not exist on Android. Never use `npx next`.
   Use `npm run <script>` or `node node_modules/next/dist/bin/next ...`.

4. **After every fresh `npm install`, fix the shebangs.**
   Newly extracted CLIs still carry `#!/usr/bin/env node`, which Android's
   kernel cannot exec (there is no `/usr/bin/env`). Until this is done,
   `npm run build` fails with `sh: 1: next: not found`. Run:
   ```bash
   cd /data/data/com.termux/files/home/radio-waa
   find node_modules -type f -size -100k -print0 \
     | xargs -0 grep -Il "^#!/usr/bin/env " 2>/dev/null \
     | xargs sed -i '1s|^#!/usr/bin/env |#!/data/data/com.termux/files/usr/bin/env |'
   ```
   This is a node_modules-only workaround (no glibc binaries are involved) and
   must be repeated after any clean reinstall.

5. **`next/image` optimization is disabled** (`images.unoptimized: true` in
   `next.config.mjs`). The optimizer needs `sharp`, which has no bionic
   prebuild. Images are served as-is. When this app is deployed on
   glibc/musl infrastructure, remove that flag to enable AVIF/WebP resizing.

6. **Memory is tight** (~2.3 GiB available). Keep dependencies minimal; builds
   use a single worker and take roughly 1.5–3 minutes.

7. **No Docker, no pnpm/yarn/bun, no Java, no Watchman.** npm only.

8. **`npx` in general is unreliable here** for locally installed binaries (see 3).
   To run a local CLI directly, use `node node_modules/<pkg>/bin/<cli>.js`
   (e.g. `node node_modules/typescript/bin/tsc --noEmit`).

## 2. Working commands (verified)

```bash
cd /data/data/com.termux/files/home/radio-waa

# after a fresh clone / npm install, fix shebangs (section 1.4) — then:
npm run build        # next build --webpack — MUST pass (exit 0)
npm run lint         # eslint . — 0 problems
npm run typecheck    # tsc --noEmit via node_modules binary
npm run dev          # next dev --webpack (port 3000)
npm start            # next start (serves the production build)

# If npm scripts are ever unusable, the escape hatches:
node node_modules/next/dist/bin/next dev --webpack -p 3000
node node_modules/next/dist/bin/next build --webpack
```

Current status (2026-10-15): `npm run build` exits 0 and emits the full route
table below; lint and typecheck are clean.

```
┌ ○ /                                   1h
├ ○ /_not-found                         1h
├ ○ /about                              1h
├   /article/[slug]           (12 SSG pages)
├ ○ /category                           1h
├   /category/[slug]         (6 SSG pages)
├ ○ /podcasts                           1h
├ ○ /robots.txt
├ ƒ /search           (dynamic, query-driven)
├ ○ /shows                              1h
└ ○ /sitemap.xml                        1h
```

## 3. Architecture

```
src/
  app/
    layout.tsx            root layout: fonts, theme bootstrap script, header/footer
    page.tsx              homepage — radio block first (three two-column rows:
                          live player + schedule rail / today's shows + promo /
                          podcasts + newsletter rail), then the newsroom sections
    globals.css           Tailwind v4 entry + @theme design tokens + dark variant
    loading.tsx           route-level skeletons
    error.tsx             client error boundary
    not-found.tsx         404
    sitemap.ts robots.ts  static SEO routes
    article/[slug]/       SSG article detail (generateStaticParams + generateMetadata)
    category/             category index + /category/[slug] lists
    shows/ podcasts/ about/ search/
  components/
    ui/                   primitives (Button, Card, Badge, Input, Select, Skeleton,
                          Container, SectionHeading, Divider, IconButton,
                          Breadcrumbs, EmptyState, Avatar, LiveIndicator, Section,
                          icons) — all typed, ref-forwarding, keyboard accessible
    layout/               Header (desktop nav + accessible mobile drawer),
                          Footer, MobileMenu (focus trap), ThemeToggle, SkipLink,
                          Wordmark, Breadcrumbs
    news/                 ArticleCard (hero/feature/default/compact/list),
                          ArticleGrid, TrendingList, BreakingNewsTicker,
                          CategoryNav, LiveBadge, Byline, ShareBar,
                          RelatedArticles, NewsletterSignup, PodcastEpisodeCard,
                          ShowCard, ShowSchedule, ArticleBody,
                          ListenAnytime + PodcastRow + NewsletterRail (the
                          "Listen Anytime" row, its row card and the rail
                          signup; shared with /podcasts)
    radio/                homepage radio block: LivePlayerHero (client — native
                          <audio>, NEXT_PUBLIC_STREAM_URL, aria-live status),
                          ShowScheduleRail (rolling live/next rail; distinct
                          from the table-based ShowSchedule used by /shows),
                          TodaysShows (four-card on-air row), PromoCard,
                          NowPlayingChip, Waveform (deterministic bars,
                          motion-safe eq animation)
    motion/               Reveal (IntersectionObserver + reduced-motion safe)
  lib/
    utils.ts              cn() = clsx + tailwind-merge
    constants.ts          site config, nav, footer, socials (env-driven URL)
    format.ts             Intl date/relative/number/duration/clock helpers
    seo.ts                buildMetadata() — canonical, OpenGraph, Twitter cards
    types.ts              shared domain types (Article, Show, PodcastEpisode…)
  data/                   PLACEHOLDER mock data + query helpers (another agent
                          owns the real fixtures — keep the exported shapes stable)
  styles/print.css        print stylesheet (imported by globals.css)
```

### Conventions

- **App Router, server-first.** `'use client'` only where interaction demands it:
  `Header`, `MobileMenu`, `ThemeToggle`, `ShareBar`, `NewsletterSignup`,
  `NewsletterRail`, `LivePlayerHero`, `Reveal`. Everything else is a server
  component.
- **Live audio is opt-in via env.** The homepage player reads
  `NEXT_PUBLIC_STREAM_URL` and never hard-codes or hot-links a stream (licensing
  / CDN-permission questions — see docs/live-audio-backend-research.md §8–9).
  With the var unset the UI still toggles and reports "stream not configured"
  through an `aria-live` region. The hero/promo media panels are intentionally
  fixed-black in both themes; brand-red icons on that ground are graphics,
  checked under SC 1.4.11 (see the contrast note).
- **Design tokens live in exactly one place**: the `@theme` block in
  `src/app/globals.css`. Semantic colours (`paper`, `surface`, `ink`, `muted`,
  `line`, `brand`, `brand-fg`, `accent`) are the same token names in both
  themes; the `.dark` class overrides their values. Utilities like `bg-paper` /
  `text-ink` adapt automatically. Do not hard-code hex colours in components.
- **Dark mode** is class-based (`@custom-variant dark (&:where(.dark, .dark *))`).
  The inline script in `layout.tsx` applies the persisted/stored preference
  before first paint; `ThemeToggle` persists to `localStorage` under
  `radio-waa-theme` and syncs via `MutationObserver` (no hydration mismatch).
- **Accessibility is a graded requirement**: one `h1` per page; landmarks
  (`header/nav/main/aside/footer`); the mobile drawer traps focus, closes on
  Escape, restores focus to its trigger, locks background scroll and uses
  `role="dialog"` + `aria-modal`; all icon-only controls carry `aria-label`;
  every token pair passes WCAG 2.2 AA (see the contrast note below); motion is
  `motion-safe:`-gated everywhere and `Reveal` never hides content from
  reduced-motion or no-JS visitors.
- **Images**: `next/image` with `fill` + `sizes`; `priority` only on the hero
  (homepage lead, article hero). Alt text is always descriptive (never empty) —
  the mock data enforces this via the `ImageAsset` type.
- **Comments explain WHY only** (platform workarounds, non-obvious trade-offs).
  No comments restating what code does.
- **Static generation**: `export const revalidate = 3600` in the root layout
  keeps the on-air strip fresh; `article/[slug]` and `category/[slug]` use
  `generateStaticParams`; `search` is intentionally dynamic (reads searchParams).

### Colour contrast (WCAG 2.2 AA)

All foreground/background pairs were verified with a contrast calculator at the
token level (minimum ratios: 4.5:1 body text, 7:1 where achievable):

| Light | ratio | | Dark | ratio |
|---|---|---|---|---|
| ink on paper | 16.97 | | ink on paper | 17.34 |
| muted on paper | 6.63 | | muted on paper | 7.99 |
| white on brand | 6.12 | | brand-fg on brand | 6.44 |
| brand text on paper | 7.55 | | brand text on paper | 6.99 |
| accent on paper | 6.34 | | muted on surface-2 | 6.74 |
| muted on brand-soft | 5.94 | | muted on brand-soft | 7.28 |
| brand graphic on media black* | 3.43 | | brand graphic on media black* | 7.03 |

\* The radio hero and promo cards keep a fixed black media ground in both
themes; the brand-red waveform/play marks there are graphical objects, checked
against SC 1.4.11 (3:1), never used for small text. All white-on-media text sits
over a near-opaque black scrim.

If you change a token, re-run the check — do not eyeball it.

## 4. Do NOT

- Do **not** use Turbopack (`--turbopack`, `next dev --turbopack`, `create-next-app --turbopack`).
- Do **not** use `npx next`, `npx tsc`, or any `npx` invocation of a local binary.
- Do **not** expect `npm run build` to work after a fresh `npm install` without
  the shebang fix in section 1.4.
- Do **not** install Docker/pnpm/yarn/bun/Java/Watchman, or native modules that
  assume glibc (sharp, esbuild binaries, Playwright browsers — none work here).
- Do **not** create `tailwind.config.js` — this project is Tailwind v4 via
  `@tailwindcss/postcss`; all theming lives in `@theme` inside `globals.css`.
- Do **not** add a database, auth, or API routes — this is deliberately UI/UX
  only. `DATABASE_URL` is documented in `.env.example` for the later backend
  integration (Postgres runs natively in Termux).
- Do **not** commit real secrets. `.env` is gitignored; only `.env.example` is tracked.
- Do **not** touch files under `public/` or the real fixtures under `src/data/`
  beyond the placeholder files described in section 3 — other agents own those.

## 5. Environment variables

See `.env.example`. Public vars must keep the `NEXT_PUBLIC_` prefix (they are
inlined into the browser bundle). `DATABASE_URL` is server-only and currently
unused by the UI code. `NEXT_PUBLIC_STREAM_URL` (live radio stream) ships empty
on purpose — the player falls back to an accessible "stream not configured"
state; never commit a broadcaster's real feed without resolving licensing.

## 6. Database (Postgres 18, native Termux)

Postgres runs **natively in Termux** — no Docker. Data directory
`/data/data/com.termux/files/home/pgdata`, listening on `127.0.0.1:5432` only,
`trust` auth (no password), database `radiowaa`. Trust + loopback means every
local process is superuser: **never widen `listen_addresses` and never expose
port 5432 off-device.**

**Android reaps background processes, so Postgres will not survive between
sessions.** Expect it to be down and bring it back with the lifecycle script:

```bash
cd /data/data/com.termux/files/home/radio-waa
scripts/pg.sh start    # idempotent: "already running" if up, else starts it
                       # detached (setsid+nohup) and waits until ready
scripts/pg.sh ready    # exit-code gate: 0 = accepting connections on radiowaa,
                       # non-zero = timeout/not running (use in CI/scripts)
scripts/pg.sh stop | restart | status | psql | logs
```

- Connection string: `postgres://postgres@127.0.0.1:5432/radiowaa` (in `.env`).
- **Never `pgrep -f` / `pkill -f`** — the pattern matches the invoking shell and
  kills your own session. The script uses `pg_ctl status` (postmaster.pid).
- **Never `/tmp`** — read-only filesystem here. Server log:
  `/data/data/com.termux/files/usr/tmp/opencode/postgres.log`.

**Tuning** lives in `pgdata/postgresql.conf` (persisted, not `-c` flags), sized
for ~2.5 GB free RAM shared with the Node dev server:

| Setting | Value | Why |
|---|---|---|
| `shared_buffers` | 128MB | ~5% of free RAM; the OS page cache carries the rest |
| `work_mem` | 4MB | per sort/hash op, so 20 connections can't exhaust RAM |
| `maintenance_work_mem` | 32MB | plenty for VACUUM/CREATE INDEX on a small CMS DB |
| `max_connections` | 20 | one Next dev server + psql; each backend costs RAM |
| `effective_cache_size` | 512MB | planner hint only (no allocation), honest cache estimate |

Prove any of it with `scripts/pg.sh psql -c "SHOW shared_buffers"`. This section
supersedes the "no database" line in §4 and the "unused" note in §5: the
Payload backend integration consumes `DATABASE_URL`.
