# Lane D Implementation Report — Public RSS Feed Route

Lane/Plan: Lane D of `docs/superpowers/plans/2026-10-17-audio-backend.md` §4
Branch: `feat/audio-backend` · Commit: this one · Report left **untracked** (not in §4 commit list)

## Files touched (4, all committed)

| File | Change |
|---|---|
| `src/app/feeds/radio-waa.xml/route.ts` | NEW route handler; `revalidate = 600`; builds channel from all episodes |
| `src/lib/seo.ts` | `buildMetadata` `alternates` now also emits `types: { "application/rss+xml": "/feeds/radio-waa.xml" }` (RSS autodiscovery via `metadataBase` resolution) |
| `src/lib/constants.ts` | Footer social row `RSS` href `/podcasts` → `/feeds/radio-waa.xml` |
| `src/app/(frontend)/sitemap.ts` | Feed entry appended: `{ url: /feeds/radio-waa.xml, lastModified: now, changeFrequency: "daily", priority: 0.6 }` |

## Tests
N/A — plan §4 prescribes no test file; runtime/build/typecheck smoke was out of scope for
this lane (device constraints). Route verified statically against `src/lib/rss.ts` types
(`RssItemInput` / `RssChannelParams.episodeItems`) and confirmed auto-generated sitemap/SEO wiring.

## Decisions
- **Source getter: `getPodcastEpisodes()`** via `@/content` (`src/content/index.ts:41`). It returns ALL
  episodes (`payload.ts` `pagination: false`; `local.ts` returns the full fixture array). The brief's
  "no all-episodes query exists" is stale — no workaround needed.
- **Channel `imageUrl` omitted.** The only site-owned image asset on disk is
  `public/assets/images/podcast-wa-files.svg` (episode art); `/assets/images/og-default.png`
  referenced by `seo.ts:45` does not exist. Feed readers render default artwork — acceptable;
  `buildRssChannel` skips `<itunes:image>` when `imageUrl` is absent.
- **Item `imageUrl` = `absoluteUrl(episode.image.src)`** (`ImageAsset.src`, site-relative) for every item.
- **Sort newest-first** with `Date.parse` comparator (avoids TS Date-subtraction); **`audioUrl != null` filter**
  drops non-audio entries so every `<item>` carries a valid enclosure.
- **Channel meta**: title `${siteConfig.name} — All Episodes`, description `siteConfig.tagline`,
  author `siteConfig.legalName`, fixed `podcast:guid` constant, language/categories left to
  `rss.ts` defaults (`en-gh`, `News`), `Content-Type: application/rss+xml; charset=utf-8`.

## Deviations from plan/brief
- Route uses `getPodcastEpisodes()` (see above) — same semantics the brief wanted, cleaner call site.
- Report untracked by design; no test file written.

## Residual risks
- **`CONTENT_SOURCE=local` yields an empty channel.** Lane C's audio seeding touched only the
  Payload DB (`scripts/seed-audio.ts` + migration); `src/data/podcasts.ts` fixtures carry no
  audio fields (edge-case shell intentionally). The filter then produces zero items → syntactically
  valid feed with no `<item>`s. Fixing fixtures is lane-owned file work, out of Lane D scope.
- No channel artwork (reader-default shown) until a real `og-default.png`/channel image lands.
- Runtime smoke at `/feeds/radio-waa.xml` pending the next CI/preview run.
