# Asset Provenance — Radio Waa news app (prototype)

Every file under `public/assets/` is catalogued below with its origin and licence
status. This is a **local UI prototype**. Nothing here is cleared for public
commercial release; the legal notes at the bottom are load-bearing.

---

## Summary

| Class | Count | Origin | Licence status |
|---|---|---|---|
| Brand logo / icons (`logo/`) | 6 | Extracted from the live Radio Waa PWA manifest + site | **Trademark — owner only.** Not licensed for reuse. |
| News photography (`images/news-*`) | 24 | Web image search of Ghanaian news outlets (Ghanaian Times, Graphic, GNA, YEN, Modern Ghana) and agency photography | **Unverified — prototype only.** See §2. |
| Programme photography (`images/show-*`) | 21 | Web image search: radio studio, live music and open photo libraries (Pexels, Unsplash, radio.co) | **Unverified — prototype only.** See §2. |
| Events & station photography (`images/event-*`, `images/tile-*`, `live-studio`, `prototype-fm-artwork`, `onboarding-hero`) | 10 | Same searches as above | **Unverified — prototype only.** See §2. |
| Portrait photography (`images/avatar-*`) | 11 | Open portrait libraries surfaced by the same searches | **Unverified — prototype only.** Fictional staff. |
| Source fixtures (`images/wa-*`) | 1 | Downloaded from Ghanaian outlets while researching the live site | **Unverified — prototype only.** |
| Open Graph card (`images/og-default.png`) | 1 | Cropped from `news-water-rationing.jpg` by this project | Derived — same status as its source. |
| Line icons (`icons/icon-*`) | 12 | SVG generated for this prototype | **Owned by this project.** |

**Every generated placeholder is gone.** The `cover-*`, `podcast-*` and
`avatar-*` SVGs (stacked bars, circles and two-letter monograms) were deleted in
this round: the newsroom, the schedule, the podcast shelf and the bylines are now
photographic on both the website and the app, which share this one `public/`
folder.

Total files: **75**.

---

## 1. `logo/` — brand identity (TRADEMARK, not licensed)

Radio Waa is a real broadcaster. Its logo and wordmark are its trade dress and are
protected. These files were captured from the live site's PWA manifest
(`myradiowaa.com`) for **internal layout fidelity only**.

| File | Source | Notes |
|---|---|---|
| `radio-waa-logo.jpeg` | Live site | Full logo raster. Owner only. |
| `radio-waa-wordmark.svg` | Live site | Wordmark vector. Owner only. |
| `radio-waa-favicon.svg` | Live site | Owner only. |
| `radio-waa-icon-192.png` / `-512.png` | PWA manifest `icon-192/512.png` | Extracted. Owner only. |
| `radio-waa-icon-192-maskable.png` | PWA manifest | Extracted. Owner only. |

The live PWA manifest confirms brand identity used by the real app:
`name: "Radiowaa 92.1 FM"`, `theme_color: #dc2626`, `background_color: #ffffff`.

---

## 2. Photography (`images/news-*`, `show-*`, `podcast-*`, `event-*`, `avatar-*`, `wa-*`)

Sourced with a web image search, one subject at a time, then cropped to the
layout's aspect ratios with ImageMagick (`-resize … ^ -gravity center -crop`,
`-strip -quality 84`). Files are renamed to what they depict, not to the search
term, so the fixtures stay readable:

| Group | Files | Researched subject |
|---|---|---|
| Lead + newsroom | `news-water-rationing`, `news-malaria-clinic`, `news-shea-season`, `news-groundnut-market`, `news-market-square`, `news-mobile-coverage`, `news-mobile-money`, `news-mobile-money-agents`, `news-transmitter`, `news-road-audit`, `news-wa-road`, `news-wa-landmark`, `news-harmattan`, `news-exams-walk`, `news-dumba-festival`, `news-hip-hop-studio`, `news-sdd-league`, `news-upper-west-united`, `news-assembly-budget`, `news-custody-inquiry`, `news-community-clinic`, `news-recovery-centre` | Water tankers and standpipes in Ghana, shea and groundnut co-operatives, markets, mobile-money kiosks, telecom masts, feeder-road inspections, a Wa high street, the Nakore mosque, harmattan haze, classrooms, a Dumba procession, a recording session, Ghanaian league football, press briefings, clinics |
| Schedule | `show-*` (21) | On-air studios and presenters, a mixing desk, a gavel, turntables, a stadium, a table of Ghanaian food, a live band, a night crowd |
| Podcasts | (reuses `show-*`) | Each episode now carries its series' photograph, so the shelf matches `shows` |
| Events | `event-*` (5) | Concert crowds, club lighting, a stand-up set |
| Portraits | `avatar-*` (11) | Fictional staff headshots (see the legal note — no real person is claimed) |
| Source fixture | `wa-ndc-chairman` | Retained from the earlier research pass |

Representative source pages, for the record: `ghanaiantimes.com.gh` (water
queue), `graphic.com.gh` (harmattan, feeder-road inspection, Dumba), `gna.org.gh`
(Dumba), `yen.com.gh` (community water), `en.wikipedia.org/wiki/Wa,_Ghana`
(Wa high street, Nakore mosque), `pexels.com`, `unsplash.com`, `radio.co` and
Getty-syndicated photography for the studio, stage and stadium frames.

> **Attribution is approximate.** These came from a search index rather than from
> a licence purchase, so per-file credit and rights are **not** established.

> **Action before any real deployment:** replace every photograph here with
> licensed stock or brand-owned photography, or verify each file's licence
> individually. Do not publish this set.

## 3. Icons

The twelve `icons/icon-*` SVGs were generated by script for this prototype (24px
line icons). They are owned by this project, carry no third-party rights, and may
be edited freely.

## 4. Validation

`node src/data/validate.mjs` asserts that every image referenced by the mock data
is (a) a root-relative path, (b) not a remote hot-link, (c) present on disk under
`public/`, and (d) decodes as an image. It reports `uniqueAssets=52`.

---

## Legal note (for a real launch)

- "Radio Waa", its wordmark, logo, and on-air identity are trademarks of their
  owner. Internal use while prototyping is fine; **public/commercial reuse
  requires the owner's permission or a licence.**
- Every photograph in `images/` (`news-*`, `show-*`, `podcast-*`, `event-*`,
  `tile-*`, `avatar-*`, `wa-*`, `live-studio`, `onboarding-hero`,
  `prototype-fm-artwork`, `og-default`) carries **unverified** provenance. Treat
  as all-rights-reserved by default; do not publish without clearing rights.
- The people depicted or named in the mock data are **fictional** and must not be
  presented as real staff, hosts, or subjects of real events.
- The people photographed in `avatar-*` and `onboarding-hero` are **not** the
  fictional staff named in the fixtures. They are stock portraits, used only to
  make the layout read as a real newsroom; nothing here should be presented as a
  real member of staff or a real listener.
- Before launch, have counsel review: brand/logo usage, photograph licensing, and
  any use of real names, likenesses, or quotes.