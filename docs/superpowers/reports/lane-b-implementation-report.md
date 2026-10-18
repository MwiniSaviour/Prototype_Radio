# Lane B implementation report — RSS feed (Lane 1 of 6)

Date: 2026-10-18
Branch: `feat/audio-backend` (started from base HEAD `61e6569`)
Lane selection: Plan §2 Lane B · Lane 1 (prerequisite for routes/RSS generation)

## Summary

Delivered the pure RSS module promised by the plan's Lane B step: a
zero-import `src/lib/rss.ts` implementing `formatItunesDuration`,
`escapeXml`, `toRssItem`, and `buildRssChannel`, plus 16 passing unit
tests in `tests/rss.test.ts` (run with the project's resolve hook,
`node --import ./scripts/ts-ext-resolve.mjs`). One commit containing
exactly the two planned files was created, then verified. This is the
prerequisite validation step for the later feed/route lanes (routes/RSS
generation behavior lives in the plan's other lanes, not this one).

## Decisions / deviations

- Standard `<enclosure>` element used instead of the brief's proposed
  `itunes:enclosure`; the plan explicitly prefers the standard marker,
  which iTunes indexing also accepts.
- `buildRssChannel` takes a single-arg params object with an explicit
  `episodeItems: string[]`; the brief's two-arg shape was adapted for
  pure composition. `toRssItem(episode, siteUrl)` keeps the two-arg form.
- Added `xmlns:atom` on `<rss>` and an `<atom:link rel="self"
  type="application/rss+xml" href="…"/>` as the first child of
  `<channel>` (Express's default behavior could not be relied upon here
  since the module is pure and consumers assemble the document).
- Plain `<image>` guard element (link + title + url) emitted only when
  `imageUrl` is set; it precedes `<itunes:category>` elements.
- `escapeXml` preserves already-well-formed entities — a bare `&` is
  escaped only when not already starting `&name;`, `&#digits;`, or
  `&#xhex;` (lookahead). The five specials map to `&amp;`, `&lt;`,
  `&gt;`, `&quot;`, `&apos;`.
- `formatItunesDuration` returns `null` for null/undefined/NaN or
  non-finite/non-integer/≤0 inputs; otherwise `H:MM:SS` with hours > 0,
  else `M:SS` (e.g. 7345 → `2:02:25`, 810 → `13:30`, 59 → `0:59`).
- Item order: title, link (`siteUrl` trailing slashes trimmed →
  `/podcasts#<slug>`), description, `<guid isPermaLink="false">` (raw
  slug), pubDate (`new Date(publishedAt).toUTCString()`), optional
  `<itunes:duration>`, optional `<enclosure url type [length]>` (only
  when audioUrl AND audioMimeType are non-null; `length` omitted when
  audioByteLength is null), optional `<itunes:image href>`.
- Channel: xml declaration, `<rss>` with itunes/podcast/atom
  namespaces, `<channel>`, title, link, atom self link, description,
  `<language>` (default `en-gh`), `<podcast:guid>`, identical
  `<lastBuildDate>`/`<pubDate>` stamp from one `new Date().toUTCString()`
  call per feed build, `<itunes:author>`, `<itunes:explicit>false</
  itunes:explicit>`, optional itunes:image then `<image>` guard,
  escaped `<itunes:category text/>` per category (default `["News"]`),
  then `episodeItems` strings verbatim, then closing tags. No trailing
  newline.
- Escaped fields: all titles/descriptions, audioUrl, audioMimeType,
  imageUrl(s), selfUrl, author, categories. Deliberately raw: slug
  (guid), guid (already a UUID), language.
- Source-level workaround: because the initial entity-form literals
  were decoded by the writing tool on disk, the code/test spell
  entity strings as `\u0026`+name escapes (e.g. `"\u0026amp;"`),
  which JS parses identically and which cannot be mangled by the
  write layer.

## Files changed

- `src/lib/rss.ts` — new, 122 lines. Types `RssItemInput`,
  `RssChannelParams`; `trimTrailingSlash`, `formatItunesDuration`,
  `escapeXml`, `toRssItem`, `buildRssChannel`. Zero imports.
- `tests/rss.test.ts` — new, 255 lines. 16 tests covering duration
  validity, escape semantics (including entity-preserving rules),
  item rendering + canonical order + omission rules, and channel
  skeleton/defaults/stamps/escaping/image guard/verbatim items.
- Commit: `f5e40a1` — "feat(rss): self-contained podcast RSS channel
  + item builders with unit tests" (only these two files; no
  report file staged).

## Test results (exact tail)

Command: `node --import ./scripts/ts-ext-resolve.mjs --test
--test-reporter=spec tests/rss.test.ts`

```text
✔ formatItunesDuration formats valid exact-second values (3.8793ms)
✔ formatItunesDuration returns null for invalid inputs (0.2811ms)
✔ escapeXml escapes all five special characters (1.0199ms)
✔ escapeXml preserves existing well-formed entities (0.2783ms)
✔ toRssItem includes every element in canonical order (11.4397ms)
✔ toRssItem escapes XML specials in title and description (1.1365ms)
✔ toRssItem omits the length attribute when audioByteLength is null (0.5993ms)
✔ toRssItem renders itunes:duration only for valid values (0.4783ms)
✔ toRssItem trims trailing slash from siteUrl (0.5156ms)
✔ toRssItem omits the enclosure when audioUrl or audioMimeType is missing (0.6575ms)
✔ toRssItem renders itunes:image only when imageUrl is set (0.6526ms)
✔ buildRssChannel emits declaration, namespaces and skeleton (0.6484ms)
✔ buildRssChannel applies defaults and omits itunes:owner (0.3959ms)
✔ buildRssChannel escapes metadata and renders the atom self link (0.3366ms)
✔ buildRssChannel stamps lastBuildDate and pubDate in RFC 822 GMT (0.6209ms)
✔ buildRssChannel renders image guard, categories and verbatim items (0.4325ms)
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 401.1442
```

Node v24.18.0 emitted a `MODULE_TYPELESS_PACKAGE_JSON` reparse warning
(package has no `"type"` field); cosmetic, matches existing tests.

## Self-check (commands + output)

- `git log --oneline -1` →
  `f5e40a1 feat(rss): self-contained podcast RSS channel + item builders with unit tests`
- `git show --stat` →
  ` src/lib/rss.ts    | 122 ++++…` / ` tests/rss.test.ts | 255 +++…` /
  ` 2 files changed, 377 insertions(+)` — exactly the two files, no
  extra paths stained into the commit, and the report is untracked.

## Residual risks

- An invalid `publishedAt` string would render pubDate as
  `Invalid Date`; the plan accepts this (SQLite-validated upstream in
  later lanes). Consumers should pass well-formed `ISODateStr`.
- Empty-string input `audioUrl`/`audioMimeType` (truthiness: they are
  non-null) would still render an `<enclosure>` with an empty url/type
  attribute; `null` is the documented "absent" marker.
- `audioByteLength: 0` renders `length="0"` (allowed by the plan;
  flagged during plan review as unknown-ish but acceptable).
- `guid`/`language`/`slug` are intentionally not escaped by decision;
  callers passing untrusted strings there would need to escape first.
- CSP's "preserve existing well-formed entities" behavior means a
  value like `AT&amp;T` stays `AT&amp;T` (correct for feed consumers)
  while a bare `AT&T` gets escaped to `AT&amp;T` — both render as `AT&T`
  downstream, but callers storing pre-escaped strings should not
  double-escape by concatenation.

## Next steps for coordinator

1. Face your printf-style formatting: when this module's output is
   composed into HTTP responses or file writes, keep composition
   whitespace-free (string concat with `\n` joins, as done here).
2. Wire `buildRssChannel` output into the feed endpoint lane; per
   deployment reality the served HEAD path should come from the
   station artwork URL configured in the plan's artwork lane, not
   hard-coded here (buildRssChannel takes `imageUrl?: string|null`).
3. The plan's品味 notes (see `docs/superpowers/plans/…audio-backend.md`)
   list a W3C feed-validation step in the next lane; run it there —
   this module's tests encode the validator's canonical order
   expectations already.
