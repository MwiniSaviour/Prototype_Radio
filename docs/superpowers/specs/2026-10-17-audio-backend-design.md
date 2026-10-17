# Audio Backend Design — Radio Waa live stream + podcast

- **Date:** 2026-10-17
- **Status:** Draft for review
- **Inputs:** [Brainstorm session decisions](#decisions), [docs/live-audio-backend-research.md](../../live-audio-backend-research.md) (§8.6 diagnostics, §8.7 licensing)

## Context

Radio Waa (https://myradiowaa.com/, Wa, Upper West Region, Ghana) already broadcasts live via Zeno.fm fronting SurferNetwork (research doc §8.7). The site needs a backend story for (1) the live stream and (2) podcast episodes. Agents.md mandates live audio be env-gated (`NEXT_PUBLIC_STREAM_URL`) because embedding a broadcaster's feed raises licensing questions (§8–9). The mock `PodcastEpisode` type (`src/lib/types.ts:80`) has no audio field, so podcast audio cannot be served today at all.

## Decisions (user-confirmed)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Live stream scope | Integrate the existing Zeno.fm feed; rights-clearance for embedding on this domain is the station's task |
| Q2 | Episode audio storage | External audio host or CDN; the site (Payload CMS) stores only metadata + public URLs |
| Q3 | Distribution | Public podcatcher-ready RSS feed |
| Q4 | Now-playing source | Schedule-based, computed from the CMS `shows` schedule (all known Zeno metadata endpoints 404) |
| Q5 | Feed structure | One combined station feed |
| — | Implementation approach | Approach A: Payload-driven audio layer, feed generated on-site, env-gated player |

## Goals

- Listeners can play the live stream on the site once the station wires `NEXT_PUBLIC_STREAM_URL`, with honest failure states (§8.6).
- Podcast episodes are first-class content in Payload (episode editor, relations, SEO) with audio hosted externally.
- A standards-compliant combined RSS feed is served by the app so Apple/Spotify submission and per-episode enclosures work.
- "Now on air" on the homepage/rails comes from the schedule, handles kindergarten midnight-crossing slots, and has an "off-air / next up" state.

## Non-goals

- No upload pipeline, transcoding, or audio processing inside the app.
- No live now-playing API integration (schedule-based only).
- No analytics platform changes, auth changes, or edits to `src/data` fixtures or migration files.
- No multiple per-show feeds (Q5); a single feed until user demand says otherwise.

## Approach chosen (A) and alternatives rejected

- **A (chosen):** Payload `episodes` collection + external audio host + on-site RSS route. Full URL/feed ownership, `"@/content"` getters stay the single switch; smallest ops surface. Chosen because it honors Q2 (site stores metadata only) and Q3 (public RSS) without adding a third vendor.
- **B (rejected):** Third-party podcast platform owns hosting + feed; site mirrors. Trades ownership and SEO for less work; duplicates data between CMS and platform.
- **C (rejected):** Self-hosted media stack. Maximum control; unacceptable bandwidth/ops/licensing burden for a small station site.

## Architecture

### Content model (Payload + content layer)

- New Payload `episodes` collection, required fields: `slug`, `title`, `description`, `showId` (relation), `season`, `episodeNumber`, `publishedAt`, `durationSeconds`, `image`, `tags`, `audioUrl`, `audioMimeType`, `audioByteLength`.
- `PodcastEpisode` type (`src/lib/types.ts`) gains optional `audioUrl?`, `audioMimeType?`, `audioByteLength?` so the read-only fixtures (which lack audio) remain type-valid; the CMS collection enforces presence at storage. RSS includes only episodes with `audioUrl`.
- Audio lives on the external host (station or admin uploads there; Zeno podcast hosting preferred if their account offers it, else S3-compatible object store like R2). The episode editor takes the public URL, MIME, byte length — no upload infra (Q2: "site stores only metadata + URLs").
- `src/content/payload.ts` gains: `getPodcastEpisodes`, `getEpisodesByShow`, `getLatestEpisodes`, `getEpisodeBySlug`, `getShowByIdEpisodePayload` (or an existing `getShowById` reuse) — the same getter surface `/podcasts` and `PodcastRow` already consume, so both `CONTENT_SOURCE=payload` and `mock` work unchanged in page code.

### Live stream

- `NEXT_PUBLIC_STREAM_URL` = Zeno CDN URL. `src/components/radio/LivePlayerHero.tsx` unchanged in behavior; add §8.6 diagnostics:
  - Boot-time `fetch(url, { method: 'HEAD', mode: 'cors' })` preflight → human sentence in the UI (aria-live), full detail to console/telemetry; CORS failures never surface as bare `MEDIA_ERR_NETWORK`.
  - Time-to-first-audio measurement recorded (§4.7 gap).
- Optional abstraction point only: keep the stream URL in one env var so a future Zeno API metadata source (if the station obtains access) can swap in without touching components.

### Now-playing (schedule-based)

- New server-side util `resolveCurrentSlot(shows, now)` in `src/lib/` — single source of truth for the homepage hero, `ShowScheduleRail`, and `ShowSchedule`.
- Timezone `Africa/Accra` (GMT, no DST); weekly slots from the `shows` schedule; midnight-crossing slots handled; off-air fallback shows "next up: …" with the next scheduled start.

### RSS feed

- Route handler `src/app/feeds/radio-waa.xml/route.ts`, cached (`revalidate` aligned with CMS query TTL, default 600s).
- Channel: title/description/author/owner/keywords/category derived from `siteConfig` and show data; `language="en-gh"`; stable `podcast:guid`.
- Items: GUID = episode slug (stable, URL-independent), enclosure `url`/`type`/`length` from the audio fields, `itunes:duration` (from `durationSeconds`), image URL, item categories from tags.
- Subscription wiring: `<link rel="alternate" type="application/rss+xml">` via `buildMetadata` (`src/lib/seo.ts`), footer link, sitemap entry. Apple/Spotify submission is the station's post-ship task after the feed passes validators.

## Prerequisites (block live-audio go-live, not the build)

1. **Zeno embed rights:** station obtains written confirmation from Zeno that this domain may embed the live CDN URL (embed/whitelist risk in §8.7). Player stays env-gated so the ship can precede this gate.
2. **Ghana NCA/MGCSD internet-streaming authorisation** — station's legal task (§8.7).
3. **Royalties posture:** now-playing is display-only; no published play logs or replay features, keeping the royalty surface unchanged.

## Security & privacy

- Stream URL and episode audio URLs are public literary hyperlinks only; no authenticated playback, no signed URLs needed.
- No new PII collection; telemetry limited to anonymous playback stream diagnostics (error class, time-to-first-audio).
- No secrets in feed, sitemap, or client bundles; `PAYLOAD_SECRET` never committed (existing policy).

## Verification plan

- **Player states:** configured stream (real URL), unconfigured (`stream not configured` via aria-live), and HEAD-preflight failure human sentence. Play audio in both light/dark and both config states.
- **Feed:** output passes the W3C RSS validator and Apple Podcasts feed validator; test with a Zeno-hosted URL and an R2/S3-style URL; verify enclosure length matches the file byte size.
- **Podcast surfaces:** `/podcasts` and `PodcastRow` render episodes from Payload with audio; related getters return expected shapes; graceful rendering for episodes lacking audio (mock mode).
- **Schedule correctness:** on-air mid-day, entering a slot, crossing midnight, off-air with "next up" — all visually and semantically verified (aria-live text).
- **Status codes:** verified on the production build only (dev `notFound()` quirk documented in AGENTS.md/prior sessions).

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Zeno embed contract unknown until the station asks | Player remains env-gated; ship may precede the licence gate |
| Feed validator strictness is our responsibility | Validators in the verification plan; feed generated as pure function of collection data |
| Fixture/type drift (mock lacks audio) | Optional audio fields on the shared type; presence-checked everywhere audio is used |
| Midnight-crossing schedule bugs | `resolveCurrentSlot` unit-level checks in verification plan; single util shared by all surfaces |
| Host choice deferred (Zeno vs R2) | Collection stores URL/MIME/length agnostically; the design works for either without schema changes |

## Open questions (deferred)

- Final audio host (Zeno podcast hosting availability vs R2/S3) — resolved when the station asks Zeno; no schema impact.
- Apple/Spotify URLs for the podcast page "listen on" links — post-submission.
- Admin user credentials for a full editor walkthrough ahead of implementation (blocked in prior sessions).

## Follow-ups after this design

1. User review of this doc → 2. invoke writing-plans skill → 3. implementation plan → 4. implementation + verification.
