# W93.5 FM

Live radio, real stories, every hour. A production-grade **Next.js 16 + Tailwind v4**
UI/UX foundation for a broadcast/news platform — App Router, TypeScript, strict
accessibility, WCAG 2.2 AA colour, dark mode, and statically generated pages.

No backend, no database, no auth: this repository is deliberately the front end
only. `DATABASE_URL` is documented in `.env.example` for the later integration.

## Running it

```bash
npm install
# Termux only, once after install — see AGENTS.md section 1:
find node_modules -type f -size -100k -print0 | xargs -0 grep -Il "^#!/usr/bin/env " 2>/dev/null | xargs sed -i '1s|^#!/usr/bin/env |#!/data/data/com.termux/files/usr/bin/env |'

npm run dev      # next dev --webpack
npm run build    # next build --webpack (production build)
npm start        # serve the production build
npm run lint     # eslint
npm run typecheck
```

## Routes

| Route | What it is |
|---|---|
| `/` | Homepage: breaking ticker, lead story, trending rail, latest grid, shows + podcasts previews |
| `/article/[slug]` | Article detail (12 generated pages): byline, share bar, structured body, related stories |
| `/category` + `/category/[slug]` | Category index and per-desk article lists (6 generated pages) |
| `/shows` | Weekly schedule table (today highlighted) + show cards |
| `/podcasts` | Episodes grouped by series |
| `/about` | Mission, editorial standards, team, contact |
| `/search` | Server-rendered keyword search over the archive |
| `/sitemap.xml`, `/robots.txt` | Static SEO routes |

## What's inside

- **Design tokens in one place** — `@theme` in `src/app/globals.css`. Semantic
  colour tokens (paper/surface/ink/muted/brand) flip for dark mode via a `.dark`
  class override; light and dark palettes are both AA-verified.
- **Primitives library** — Button, Card family, Badge/Tag, Input, Select,
  Skeleton, Container, SectionHeading, Divider, IconButton, Breadcrumbs,
  EmptyState, Avatar, LiveIndicator — typed, ref-forwarding, keyboard accessible.
- **News compositions** — five ArticleCard variants, grids, trending list,
  breaking marquee, share bar, newsletter form, podcast cards, show schedule.
- **Motion done properly** — the `Reveal` wrapper never hides content from
  no-JS or `prefers-reduced-motion` visitors.
- **SEO** — per-page `buildMetadata()` with canonical URLs, OpenGraph, Twitter
  cards; sitemap and robots generated from the data layer.
- **Fonts** — Playfair Display (display/serif) + Inter (UI/body) via
  `next/font`, `display: swap`, latin subset.

## Terminology

- **Section** = a vertical slice of a page (news, shows, podcasts…).
- **Desk** = a newsroom category (news, music, culture, sport, tech, community).
- **Show** = a recurring broadcast; **episode** = one podcast instalment.

## Platform note

Built and verified on **Android/Termux (aarch64, bionic libc)**. The native SWC
binding cannot load there, so the project pins the WASM SWC binding and forces
`--webpack` everywhere; Turbopack is unsupported on this platform. Everything an
agent or human needs to know is in **[AGENTS.md](./AGENTS.md)** — read it before
debugging anything.
