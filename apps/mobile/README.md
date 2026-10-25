# Prototype Radio — mobile app (Capacitor)

A Capacitor shell around a Vite + React + Tailwind bundle. It runs in the browser
during development and ships to iOS and Android from the same bundle.

The tab bar is **Home · News · Events · Tickets · Profile**.

| Screen | Route | File |
| --- | --- | --- |
| Onboarding | `/welcome` | `src/screens/OnboardingScreen.tsx` |
| Home | `/` | `src/screens/HomeScreen.tsx` |
| News | `/news` | `src/screens/NewsScreen.tsx` |
| Story reader | `/news/:slug` | `src/screens/ArticleScreen.tsx` |
| Events | `/explore` | `src/screens/ExploreScreen.tsx` |
| My Tickets | `/tickets` | `src/screens/TicketsScreen.tsx` |
| Event detail | `/events/:slug` | `src/screens/EventDetailScreen.tsx` |
| Profile | `/profile` | `src/screens/ProfileScreen.tsx` |

**Live radio is a nested page, not a tab** (`/live`, `src/screens/LiveScreen.tsx`).
It opens from any live-radio item — the Home "Up Next" rail and its See All — and
pushes over the tab bar with its own back affordance, the same way a story reader
and the event detail page do. Keeping it off the tab bar is what lets the
newsroom hold the second slot.

## One content source

Nothing is duplicated from the web app. The app reads the same monorepo content:

- **Live data** — `src/lib/api.ts` calls the repo's own Payload CMS
  (`/api/stations`, `/api/events`, `/api/tickets`, `/api/listeners`). Those
  collections are defined in `src/collections/` at the repo root and filled by
  `npm run seed`.
- **Fixtures** — programmes, presenters, articles and cover art come from
  `src/data/*` via the `@shared` alias (the same files the web build imports).
  The newsroom screen derives its lead carousel, breaking strip and "The latest"
  list from `src/data/articles.ts` in `src/lib/news.ts`; the Home "Up Next" rail
  derives the next broadcasts from each show's own schedule in
  `src/lib/schedule.ts` — no second copy of either.
- **Images** — every photograph and logo is served from the repo's
  `public/assets/images/`, mounted as Vite's `publicDir`. There is no second copy
  anywhere in `apps/mobile`.

If the CMS is unreachable the app falls back to the same seed data, and the
Profile → Settings row reports which source is live ("Payload CMS" or "Seeded
fixtures").

## Develop

```bash
# from the repo root, with the CMS up on :3000
npm run seed            # once, fills Postgres with the shared content
cd apps/mobile
npm install
npm run dev             # http://127.0.0.1:5173
```

Vite proxies `/api`, `/media` and `/admin` to the CMS. `/assets` is **not**
proxied — the dev server serves those files itself, which is also what happens on
a device.

`VITE_API_URL` overrides the API origin for a native build (point it at the
deployed CMS; on device there is no localhost proxy).

## Ship

```bash
npm run build           # tsc + vite build -> dist/
npm run sync            # build, then `cap sync` into the native projects
npm run ios / android   # open the native IDE
```

`capacitor.config.ts` holds the app id (`com.pulseradio.app`), the warm-white
background and the status-bar/keyboard plugins. Create the platform folders once
on a machine with the toolchains installed (`npx cap add ios` / `npx cap add
android`); they are not checked in.

## Design system

Tokens live in `src/styles/app.css` as a Tailwind v4 `@theme` block — orange
brand `#FC5303`, warm-white paper `#F6F3EF`, near-black ink, hairline `#E9E6E0`.
They are deliberately separate from the web app's red brand tokens.

The newsroom carries its own accent (`--color-news`, `#C01B2B`) and an editorial
serif (`--font-display`, Playfair Display) so a headline never reads as a call to
action and a story never looks like a ticket. Everything else stays on Inter.

Screen gutters are 20 px, cards are white with a hairline border and 13–14 px
radius, and the tab bar is 60 px with 21 px icons above 10 px labels. Icons are
inline SVG in `src/components/ui/Icon.tsx` (no icon font, no sprite request), so
the bundle works offline.

## Accessibility

Each screen exposes an `h1` (visually hidden where the mock has no visible page
title), the tab bar is a `<nav>` of links with `aria-current`, the ticket
segmented control is a real tablist, and the notification switch is a styled
checkbox rather than a clickable div. A single polite live region in `App.tsx`
announces playback and checkout, so state changes are not silent.
