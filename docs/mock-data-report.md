# Radio Waa — Research & Mock Data Report

Companion to `docs/assets-provenance.md` and `docs/ux-analysis-homeradionews.md`.
This records what was actually found about Radio Waa, what could not be
verified, and how the mock fixtures were built from it.

---

## 1. What Radio Waa is (verified)

Radio Waa is a **real, licensed commercial FM broadcaster in Ghana**, based in
**Wa, Upper West Region**.

### Strongest source — official NCA licence register

The **National Communications Authority (NCA)**, Ghana's telecom regulator,
publishes an authoritative *List of Authorised VHF-FM Radio Stations in Ghana*.
The end-of-2022 edition, page 60, records:

```
14.  FRAGRANCE WORLD GHANA LIMITED   92.1MHz   ON AIR   WA   COMMERCIAL FM
     (RADIO WAA)
     P. O. BOX 2900, ACCRA
```

So the verifiable facts are:

| Field | Value | Source |
|---|---|---|
| Brand name | Radio Waa | NCA register, p.60 |
| Licence holder | Fragrance World Ghana Limited | NCA register, p.60 |
| Frequency | 92.1 MHz (VHF-FM) | NCA register, p.60 |
| Status | ON AIR (as at end 2022) | NCA register, p.60 |
| Location | Wa, Upper West Region | NCA register, p.60 |
| Type | Commercial FM | NCA register, p.60 |

The same register shows Wa hosts several other stations (community, public,
campus, commercial), so Radio Waa operates in a genuinely competitive radio market.

### Secondary sources

- **myradiowaa.com** — the broadcaster's own site. Its PWA manifest declares
  `name: "Radiowaa 92.1 FM"`, `theme_color: #dc2626`, `background_color: #ffffff`,
  and the tagline "Live news, stories, and entertainment from Upper West Region,
  Ghana". The site carries newsroom sections (Local News, Politics, Business,
  Sports, Entertainment, Technology) and a weekly schedule. The logo/icons were
  captured from its web manifest.
- Search-engine results and a captured article page corroborate the brand, the
  92.1 frequency, and the Upper West framing.

### Deliberately NOT used

- **Facebook is login-walled.** facebook.com returns a 302 login redirect and
  public page content is not reachable without a session. **No Facebook content
  — posts, follower counts, likes, page URL — was obtained or fabricated.** If the
  brief requires a Facebook-shaped asset (e.g. an engagement banner), it must come
  from a logged-in manual pass, not from this work. Any Facebook number appearing
  in the mock data would be invented, and none does.
- No follower counts, download counts, or "most-listened" statistics were used,
  because none were verifiable from an accessible source.

---

## 2. Editorial direction for the prototype

Because Radio Waa is a **Wa/Upper West newsroom**, the mock content is written in
that context, not as generic filler:

- Geography: Wa, Jirapa, Lawra, Wechiau, the Wa–Nandom road, the shea belt.
- Economy: groundnut and shea value chains, market traders, mobile money agents,
  district composite budgets.
- Topics: district assemblies, feeder roads, water/utilities, harmattan season,
  malaria outreach, grassroots football, diaspora remittances.
- Register: a local, listener-facing broadcast voice — plain, specific, no
  national-wire abstraction.

### The one strong asset in the real site

The UX audit (§9 of the homeradionews report and the myradiowaa captures) found
that Radio Waa's real site has a genuine editorial voice but, like most local
news sites, is light on **accessibility** (thin alt text, few focus styles). The
prototype deliberately keeps the voice and fixes the accessibility.

---

## 3. Data inventory

All fixtures live in `src/data/`, are strongly typed against `src/lib/types.ts`,
and carry a "fictional demo data" header. Referential integrity is enforced by a
script (see §5).

| File | Contents | Count |
|---|---|---|
| `articles.ts` | Full news articles: title, dek, multi-paragraph body, category, author, tags, dates, reading time, hero image + alt, featured/breaking flags | **23** |
| `categories.ts` | Editorial taxonomy with accent token, icon, article count | **10** |
| `authors.ts` | Presenters/journalists: bio, location, specialisms, avatar, social | **9** |
| `shows.ts` | Radio programmes with weekday schedules, hosts, category, cover | **21** |
| `podcasts.ts` | Podcast series episodes: season/episode number, duration, host show, cover | **12** |
| `nav.ts` | Primary nav, footer columns, socials, breaking ticker, weekly schedule derived from `shows` | — |
| `index.ts` | Single re-export entry point | — |

Article distribution across categories (matches `categories.ts` counts exactly):
Local News 5 · Politics 3 · Business 3 · Technology 3 · Sports 2 · Entertainment 2 ·
Health 2 · Opinion 1 · Diaspora 1 · Weather & Traffic 1.

### Editorial integrity

- Every `article.category.id` resolves to a real category.
- Every `article.author.id` resolves to a real author.
- Every `show.hosts[]` resolves to a real author; every show category exists.
- Every `episode.showId` resolves to a real show.
- Every referenced image is a root-relative local path and exists on disk.
- `readingMinutes` is computed from actual body length (~200 wpm).
- Headlines, quotes, people, events, and statistics are **invented**. Only the
  station's real identity (name, operator, frequency, location, sections) is used
  as fact.

---

## 4. Asset summary

See `docs/assets-provenance.md` for the full per-file table and licence status.
In brief: 6 trademark brand files (captured, not licensed), 69 photographs of
unverified provenance used as stand-in editorial imagery (do not ship as-is), and
12 generated line icons that this project owns outright. The generated cover,
podcast and avatar SVGs were retired once real photography replaced them.

---

## 5. Validation

```bash
cd ~/radio-waa
node src/data/validate.mjs
```

Compiles the fixtures with the project's own `tsc` and then asserts referential
integrity (IDs, slugs, categories, authors, shows, image existence, alt text,
date sanity, reading-time vs length, category icon presence). Current output:

```
articles=23 categories=10 authors=9 shows=21 episodes=12 uniqueAssets=51
OK: all referential integrity checks passed.
```

---

## 6. Known gaps / next steps

- **Facebook is a gap by design** — needs a logged-in manual pass if Facebook
  content is required for the design.
- **Brand photography** should be replaced with licensed images before any real
  deployment.
- **Postgres wiring** is not yet implemented (the scaffold is UI/UX-only by
  design). `.env.example` already documents `DATABASE_URL` for the next step.
- The prototype's palette is currently the scaffold's default; the **brand-red
  (#dc2626) from Radio Waa's real PWA manifest** has not yet been applied to the
  design tokens — a clear, high-impact follow-up (see the UX audit's §14 for the
  broader token direction).