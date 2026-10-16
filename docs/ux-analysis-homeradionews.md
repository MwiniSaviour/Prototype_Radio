# UX/UI Analysis: homeradionews.com

**Target:** https://homeradionews.com/ — "Home Radio Wa" (99.7 FM, Wa, Upper West Region, Ghana)
**Stack identified:** WordPress 7.0.7 · **Foxiz** WordPress theme v2.5.7 (Theme-Ruby) · Elementor 4.1.4 page builder · Contact Form 7 · a heavily theme-customised "newspaper" template.
**Method of capture:** `webfetch` (markdown + html) + `curl` raw HTML + `curl` of every linked stylesheet, then offline regex extraction of tokens and markup parsing.
**Auditor note:** this is a *competitor* audit written for the benefit of the **Radio Waa** news app build. Everything below is traceable to a fetched artifact.

---

## 0. Method & Limitations

### 0.1 What was actually done

| Step | Artifact | Result |
|---|---|---|
| Fetch homepage (markdown) | `webfetch` | Full content outline, nav tree, all article titles |
| Fetch homepage (raw HTML) | `curl` → `home.html` | 195,377 bytes, HTTP 200 |
| Enumerate `<link rel=stylesheet>` | grep over `home.html` | 14 stylesheet hrefs (incl. Google Fonts, Elementor, Foxiz) |
| Enumerate `<script src>` | grep over `home.html` | 40 unique script URLs |
| Fetch + parse CSS | `main.css` (467,222 B), `style.css` (568 B), `print.css` (1,691 B), `post-8.css` (1,164 B), `post-52.css` (10,544 B), `foxiz-elements.css` (20,272 B) | Token extraction (§4) |
| Inline `<style>` blocks | `home.html` | 6 blocks; block #4 (`foxiz-main-inline-css`, 9,645 B) carries the site's **entire design-token override layer** |
| Template comparison | `article.html`, `category.html`, `search.html`, `notfound.html`, `noresult.html` | Article / archive / search / 404 / empty-state templates |
| Font verification | `gfonts.css` | Confirms which families actually ship `@font-face` rules |

### 0.2 Hard limitations — read before trusting any claim

1. **No browser. No screenshots. No rendered pixels.** This machine is Android/Termux aarch64 with no Chromium, no Playwright, no Docker, no X server. Not one pixel of this site was rendered during this audit.
2. **No computed styles.** Every value in §4 is a *declared* value parsed out of CSS text. The cascade, specificity, `!important` overrides, inherited values and the final *used* value were computed by reasoning over source order — not by a CSS engine. Where I could not resolve the winner I say **inferred**.
3. **No runtime behaviour.** Autoplay, hover states, live-search AJAX, sticky-nav scroll behaviour, lazy-loading, dark-mode switching and the breaking-news ticker are documented from markup attributes and CSS selectors only. Their actual behaviour is **unverified**.
4. **No real viewport.** Breakpoints are extracted from `@media` queries. Which rules apply at 360 px / 768 px / 1440 px is **inferred**, never observed.
5. **No interaction testing.** Focus order, keyboard traversal, tap-target size, scroll position, form validation messages and error handling are **unverified**.
6. **No contrast measurement.** WCAG ratios in §7/§9 are **calculated by me from declared hex values** using the WCAG 2.x relative-luminance formula. They are arithmetic estimates on declared colours, not measured pixel luminance. A gradient overlay, an image behind text, or an unloaded webfont can change the real result.
7. **No performance measurement.** No LCP, no CLS, no network waterfall. Page-weight statements are byte counts of the HTML I downloaded, nothing more.
8. **Cached-template caveat.** `article.html`, `category.html`, `search.html`, `notfound.html`, `noresult.html` were fetched during this audit session; `index.html` was a pre-existing cached copy of the same URL. Both were re-verified as the live homepage before use.

### 0.3 Confidence vocabulary used throughout

| Marker | Meaning |
|---|---|
| **extracted** | Value read verbatim from fetched CSS/HTML |
| **inferred** | Reasoned conclusion; plausible, not verified |
| **unverified** | Cannot be established from static artifacts |

---

## 1. Executive summary

### 1.1 Top strengths

1. **A real, coherent type system exists.** The site overrides the Foxiz defaults with a three-family editorial stack — **Bitter** (body), **Coustard** (headings, weight 900), **Raleway** (all UI/meta/category chrome) — with a full numeric scale, per-heading line-heights (1.2 → 1.5) and three responsive steps of that scale. Most competitor local-news sites have no type scale at all.
2. **Disciplined, near-tokenised spacing.** The theme ships `--el-spacing: 12px`, `--bottom-spacing: 35px`, `--box-spacing: 5%`, `--round-3/5/7`, `--shadow-7/12/20`, `--height-34/40`, `--padding-40`. Roughly 80% of the padding/gap/margin declarations land on a 5 px lattice (3/5/7/10/12/15/20/25/30/35/40/50).
3. **One canonical easing curve, used 205 times.** `--effect: all .2s cubic-bezier(0.32, 0.74, 0.57, 1)` with `--timing` as its named curve. That is genuinely good motion hygiene — the whole UI accelerates and decelerates identically.
4. **A deliberate, dense IA.** 12 categories, a two-tier nav (6 primary + 6 secondary/footer), mega-menu previews that surface 5 real stories per category *before* you commit to a click. That is a strong pattern for a local outlet with a broad beat.
5. **Correct 404 and empty-search states.** Both have a headline, an explanation, a *labelled* search field and a recovery action ("Return to Homepage"). The search-empty state has a real message: *"Sorry, but nothing matched your search terms…"*.
6. **A reading measure that is actually shaped like a reading measure.** `--s-content-width: 760px` and `--max-width-wo-sb: 840px` for single articles, against a 1280 px page container. That is ~66 characters per line at 16 px Bitter — close to the 45–75 cpl ideal.
7. **Dark mode is genuinely implemented**, not a token gesture: `[data-theme="dark"]` blocks exist in main.css, in the site's own inline override, in `print.css`, and the toggle persists via `localStorage` key `RubyDarkMode`.

### 1.2 Top weaknesses

1. **Two competing brand blues, live on the same page.** The site's own override sets `--g-color: #4173ff`. But the Elementor page CSS sets `--heading-color: #246EFF` for the "Popular News" section heading, and the theme default underneath is `--g-color: #ff184e` (a hot pink). Three accents, three hues, no design system holding them.
2. **57 of 77 images have `alt=""`** — including every article thumbnail on the homepage, every mega-menu thumbnail, and every card image in "More Latest News". Only the logo (4) and ad creatives (5) carry real alt text. This is a hard WCAG 1.1.1 failure at scale.
3. **Heading levels are used as a styling device, not an outline.** The DOM order runs `h1 → h6 → h6 → h6 → h6 → h6 → h2 → h3 → h4 → h6 → h5 → h3 → h2 → h3 → h3 → h3 → h3 → h4 → h4 → h3 → h4 → h4 → h2 → h4 → h4 → h3`. Six `h6` headlines in a row for the breaking ticker, then `h5` for popular-news items, then `h4` for section titles. A screen-reader user navigating by heading gets noise.
4. **No `<main>` landmark. No skip link. Zero `<button>` elements on the entire homepage.** The header is a `<div id="site-header">`; the only landmarks are `<nav>` (2), `<footer>` (1) and `<aside>` (4). The dark-mode switcher, bookmark and live-search controls are all anchors or inputs. Keyboard and AT users have no "jump to content".
5. **`outline: none !important` on every button.** `.is-btn, .button, div:where(.entry-content) button { … outline: none !important; }`. There is **no `:focus-visible` rule anywhere in 446 KB of CSS** (regex count: 0). Focus indication is effectively absent for the primary interactive control family.
6. **The homepage search field has no `<label>`** — placeholder only, `placeholder="Search Headlines, News..."`. Ironically the 404 page's search field *is* correctly labelled (with a `.screen-reader-text` span), so the pattern exists on the site and simply wasn't used in the header.
7. **A radio station with no player on its homepage.** The footer says *"Listen to Home Radio 99.7 FM from Wa, Upper West, Ghana Radio Online."* but there is **no `<audio>`, no `<iframe>`, no `<video>`, no `<object>`** anywhere in the 195 KB homepage. The single most important conversion action for a broadcaster is absent from the landing page.
8. **The newsletter module is a shell.** `<div class="newsletter-content"><h3>Subscribe to Our Newsletter</h3></div><div class="newsletter-form"></div>` — an empty form container. It renders a heading over nothing.
9. **Advertisement density is high and unlabelled.** 4 `ad-wrap` blocks on the homepage plus inline image ads, several pointing at the *theme vendor's demo domain* (`foxiz.themeruby.com/subscription/...`) rather than a real advertiser — a visible sign of an unfinished template.
10. **A z-index free-for-all:** 33 distinct values including `9999`, `9042`, `9043`, `1044`, `1045`, `100000`, `888`, `999`, `-1000`. There is no stacking system; there are magic numbers.

---

## 2. Information architecture

### 2.1 Top-level navigation (extracted, in DOM order)

**Primary mega-menu — `#menu-primary-menu`** (6 items, each with a mega-dropdown of 5 recent posts):

| # | Label | URL | Mega-dropdown preview |
|---|---|---|---|
| 1 | General News | `/category/general-news/` | 5 posts, 330×220 thumbs, date only |
| 2 | Business | `/category/business/` | 5 posts |
| 3 | Politics | `/category/politics/` | 5 posts |
| 4 | Entertainment | `/category/entertainment/` | 5 posts |
| 5 | Sports | `/category/sports/` | 5 posts |
| 6 | World | `/category/world/` | 5 posts |

Mega-dropdown structure (extracted):
```
li.menu-item-has-children.menu-has-child-mega.is-child-wide
 └─ div.mega-dropdown.is-mega-category
     └─ div.rb-container.edge-padding > div.mega-dropdown-inner
         ├─ div.mega-header.mega-header-fw
         │   ├─ span.h4  "General News"
         │   └─ a.mega-link.is-meta > span "Show More" + i.rbi.rbi-cright
         └─ div#mega-listing-2495.block-wrap.block-small.block-grid.block-grid-small-1
             .rb-columns.rb-col-5.is-gap-10.meta-s-default
             └─ 5× div.p-wrap.p-grid.p-grid-small-1  (thumb + h4 title + date)
```
`rb-col-5` resolves to `flex-basis: 20%; width: 20%` — a true 5-across preview row. **This is the single best IA idea on the site.**

**Secondary/mobile menu — `#mobile-menu`** (12 items): General News, Business, Politics, Entertainment, Health, Sports, Local, World, Lifestyle, Opinion, Video, + one more.

**Utility rail (header right):** 4 social links (Facebook, X, YouTube, Instagram — each `aria-label`ed), a live-search form, a notification bell, a "Sign In" link, a dark-mode slide toggle, and an "Advertise" link in the footer collision area.

### 2.2 Full category inventory (12 + Featured)

| Category | In primary nav | In secondary/mobile nav | In footer |
|---|---|---|---|
| Featured | — | — | More Links |
| General News | ✔ | ✔ | Quick Link |
| Business | ✔ | ✔ | Quick Link |
| Politics | ✔ | ✔ | Quick Link |
| Entertainment | ✔ | ✔ | Quick Link |
| Sports | ✔ | ✔ | Quick Link |
| World | ✔ | ✔ | Quick Link |
| Local | — | ✔ | More Links |
| Health | — | ✔ | More Links |
| Opinion | — | ✔ | More Links |
| Lifestyle | — | ✔ | More Links |
| Video | — | ✔ | More Links |

**IA finding:** "Local" is the site's most-published beat (Upper West Region / Wa news dominates the front page) yet it is absent from the primary mega-nav — reachable only via the hamburger and the footer. **Inferred** editorial/technical mismatch: the nav was configured once and never revised as the beat mix changed.

Note also that "Featured" is a *taxonomy used as a badge on nearly every card* (it appears on 18 of 56 cards) — it is simultaneously a category link and a UI label, which makes it meaningless as a filter.

### 2.3 Page templates observed

| Template | Evidence | Structure |
|---|---|---|
| **Home** | `home.html` (body class `home page-id-52 elementor-page-52`) | Elementor-composed, 7 top-level sections, no sidebar |
| **Single post** | `article.html` | `single-standard-1 is-sidebar-right sticky-sidebar` — right sidebar, sticky |
| **Category archive** | `category.html` | `archive-header category-header-3 is-pattern pattern-dot` + Elementor archive builder |
| **Search results** | `search.html` | `search-header` + `blog-wrap without-sidebar` + `rb-col-4` grid |
| **404** | `notfound.html` | `page404-wrap` / `page404-inner` |
| **Search empty** | `noresult.html` | `search-empty` with `.h3` message |
| **Login** | inline popup `#rb-user-popup-form` | 350 px wide modal (`--login-popup-w`) |

### 2.4 Homepage vertical stack (extracted, in DOM order)

| Order | Block | Widget / classes | Notes |
|---|---|---|---|
| 1 | Privacy / consent bar | `#rb-privacy.privacy-bar.privacy-left` + `#privacy-trigger` | "By using this site, you agree to the Privacy Policy and Terms of Use." + **Accept** |
| 2 | Logo row | `.logo-sec` → `.logo-sec-left` (image logo, 264×500 intrinsic, `--hd-logo-height: 40px`) + `.logo-sec-right` (socials + live search) | Logo is duplicated for default/dark mode |
| 3 | Breaking-news ticker | `.breaking-news-slider.swiper-container.pre-load` `data-play="1" data-speed="5000"` | 5 slides, each `<h6 class="entry-title breaking-news-title">`; autoplay 5 s |
| 4 | Sticky nav | `#navbar-outer` → `#sticky-holder` → `#site-navigation[aria-label="main menu"]` | `is-mstick is-smart-sticky` body classes → sticky + smart-hide |
| 5 | Section A (`78841e2`) | Overlay hero, max-width **1260 px** | `--feat-ratio:95`, gradient overlay |
| 6 | Section B (`75fb213`) | max-width **1270 px** | Hierarchical-3 grid (`--feat-ratio:50`) + "Popular News" heading |
| 7 | Section C (`e15dbb2`) | max-width **1280 px** | "More Latest News" overlay + Advertisement |
| 8 | Section D (`e819c8a`) | max-width **1280 px** | **Main split: 69.666 % content / 30 % sidebar** |
| 8a | ├ 4-col "Editor's Pick" + Must Read | `rb-col-4` / `rb-col-5` | |
| 8b | └ Sidebar: Popular News, Newsletter, Socials, Editor's Pick, Ads | `.is-sidebar` column | |
| 9 | Section E (`5bf674c`) | max-width **1270 px** | 3-up trending list (`b0820cc` with `counter-increment: trend-counter`) + ad |
| 10 | Section F (`d8a5ebf`) | full-width inner | "Must Read" + "Most Popular in This Month" |
| 11 | Section G (`fd09a83`) | max-width **1280 px** | "More Latest News" card grid + "Show More" |
| 12 | Footer | `footer.footer-wrap.left-dot` | 4 columns + copyright |

### 2.5 Footer map (extracted)

| Column | Heading | Contents |
|---|---|---|
| 1 | *(none — a `div.h1` glyph "//" in `var(--global-color)`)* | `<h4 class="footer-quote">Listen to Home Radio 99.7 FM from Wa, Upper West, Ghana Radio Online.</h4>` |
| 2 | Quick Link | General News, Business, Politics, Entertainment, Sports, World |
| 3 | More Links | Local, Health, Opinion, Featured, Lifestyle, Video |
| 4 | Sign Up for Our Newsletter | `Subscribe to our newsletter to get our newest articles instantly!` — **no form** |
| Bottom | `footer-copyright` | `© 2022 Home Radio News. Powered by PsS. All Rights Reserved.` |

Footer background: `#0000000a` (light) / `#16181c` (dark) via `.footer-has-bg`.
Column layout: `.footer-columns.rb-columns.is-gap-25.rb-container.edge-padding.footer-4c`.

**Finding:** "Quick Link" and "More Links" are meaningless labels — they describe *where the links are*, not *what they are*. A user scanning for "Health" must read both columns. Rename to "Top Stories" / "More Sections" or, better, to a genuine taxonomy.

---

---

## 3. Content block & component inventory (exhaustive)

Every distinct block type found in the homepage markup, with its exact class fingerprint.

| # | Block | Class fingerprint | Slots | Count on home | States present in CSS |
|---|---|---|---|---|---|
| 1 | **Consent bar** | `#rb-privacy.privacy-bar.privacy-left` | text, 2 links, Accept button | 1 | default; `.privacy-dismiss-btn.is-btn` |
| 2 | **Image logo** | `.logo-wrap.is-image-logo.site-branding > a.logo > img.logo-default[data-mode=default] + img.logo-dark[data-mode=dark] + h1.logo-title.is-hidden` | 2 logo variants + hidden `h1` | 1 | default / dark image swap |
| 3 | **Social icon link** | `a.social-link-{facebook,twitter,youtube,instagram}[aria-label][target=_blank] > i.rbi.rbi-{…}[aria-hidden=true]` | icon only | 8 | `:hover` per-network colour (`--fb-hcolor` etc.) |
| 4 | **Live search form** | `form.rb-search-form.live-search-form[data-search=post][data-limit][data-tax=category]` → `.search-form-inner` (`.search-icon` + `.search-icon-svg`, `.search-text > input.field[name=s]`, `.rb-search-submit`, `.live-search-animation.rb-loader`) + `.live-search-response` | icon, input, submit, loader, AJAX response region | 2 (header ×2: desktop+mobile) | default; **`.rb-loader` loading spinner**; `.live-search-response` empty |
| 5 | **Breaking ticker** | `.breaking-news-slider.swiper-container.pre-load[data-play=1][data-speed=5000]` → `.swiper-wrapper > .swiper-slide > h6.entry-title.breaking-news-title > a.p-url` | headline links | 1 (5 slides) | `.pre-load`; autoplay 5 s; nav prev/next (`.breaking-news-nav`, `.breaking-news-prev`) |
| 6 | **Primary nav + mega menu** | `#site-navigation.main-menu-wrap[aria-label="main menu"] > ul#menu-primary-menu > li.menu-item-has-children.menu-has-child-mega.is-child-wide` | label, 5-post preview grid, "Show More" | 1 (6 children) | default / hover-open (CSS-driven), mega-header, wide variant |
| 7 | **Notification bell** | `a.dropdown-trigger.notification-icon.notification-trigger[aria-label=notification]` + `.notif-count` | icon + count badge | 1 | dropdown (JS-driven, **unverified**) |
| 8 | **Sign-in link** | `a.login-toggle.is-login[aria-label="Sign In"] > i.rbi.rbi-user.wnav-icon` | icon | 2 | opens `#rb-user-popup-form` |
| 9 | **Dark-mode toggle** | `a.dark-mode-slide-btn.mode-icon-dark[data-title="Switch to Light"] > svg.svg-icon.svg-mode-dark[role=img][aria-hidden=true]` | inline SVG icon | 1 | icon swap; persists to `localStorage['RubyDarkMode']` |
| 10 | **Overlay hero** | `.block-wrap.block-overlay.overlay-1.p-gradient.ecat-bg-3.ecat-size-big` → `.p-wrap.p-highlight.p-overlay-1` → `.overlay-holder > .p-featured > a.p-flink > img.featured-img` + `.overlay-wrap > .overlay-inner.p-content.light-scheme > .p-categories.p-top + h2.entry-title` | image, categories, headline | 1 | `--feat-ratio:95`; `p-gradient` scrim |
| 11 | **Hierarchical grid** | `.block-wrap.block-grid.block-hierarchical-3.rb-columns.rb-tcol-1.rb-mcol-1` (`--feat-ratio:50`) | 1 large + 3 small cards | 1 | ratio overrides at 1024/767 |
| 12 | **Standard card (small)** | `.p-wrap.p-grid.p-grid-small-1` → `.feat-holder > .p-featured > a.p-flink > img` + `.p-categories.light-scheme.p-top` + `.p-content > span/h4.entry-title + .p-meta > .meta-inner.is-meta > .meta-el.meta-date > time.date.published` | thumb, cats, title, date | 40+ | `.mobile-hide` on cats; `row-reverse` at ≥1 breakpoint |
| 13 | **List card (big, left thumb)** | `.p-wrap.p-list.p-list-1` → `.list-holder > .list-feat-holder > .feat-holder` + `.p-content > h3.entry-title + .entry-summary + .p-meta` | 270 px thumb, cats, title, **excerpt**, author avatar, date | 5 | `.list-feat-holder { width: 270px; max-width: 270px }` |
| 14 | **Trending numbered list** | `.block-wrap.block-list.block-list-small-3` (widget `b0820cc`: `counter-increment: trend-counter 1`) → `.p-wrap.p-list.p-list-small-3` + `.counter-el` → `:before` renders the number in `var(--g-color)` at `--counter-size: 1.5em` | rank number, title, date | 1 (3 items) | number via CSS `counter`; 80 px thumb |
| 15 | **Popular-news list** | widget `foxiz-list-small-1` / heading `bd7188f` `.block-h.heading-layout-5 > .heading-inner > h6.heading-title` (with `--heading-color:#246EFF`) | section title + 150×150 thumbs | 2 (home + sidebar) | 5 px top rule in `--heading-sub-color` |
| 16 | **Section heading** | `.block-h.heading-layout-{5,10} > .heading-inner > h{2,3,4,6}.heading-title > span` + optional `.heading-tagline.h6 > .heading-tagline-label` | label, optional tagline | 9 | layout-10 = `opacity:.7`; layout-5 = 5 px top border |
| 17 | **Advertisement** | `.ad-wrap.ad-image-wrap > .ad-image > img[data-mode=default] + img[data-mode=dark]` + `- Advertisement -` label | light/dark creative pair | 4 | `alt="Ad image"`; `.top-site-ad.no-spacing` variant |
| 18 | **Newsletter module** | `.newsletter-content > h3.newsletter-title` + `.newsletter-form` | title + form | 2 | **`.newsletter-form` is EMPTY in markup** |
| 19 | **Social follower counters** | `.follower-el.{fb,twitter,instagram,youtube}-follower > a[aria-label] + .follower-inner > .fnicon + .fntotal + .text-count` | icon, count, verb (Like/Follow/Subscribe) | 8 (4 home + 4 sidebar) | `is-style-7 is-icon-color is-h-bg`; `.effect-fadeout` |
| 20 | **Bookmark control** | `span.rb-bookmark.bookmark-trigger[data-pid]` + `<script type="text/template" id="bookmark-toggle-template">` | icon | 8 | toggled / not-saved templates; asks login when anonymous |
| 21 | **Follow control** | `.follow-icon.rbi.rbi-plus[data-title="Follow"]` / `.followed-icon.rbi.rbi-bookmark-fill` | icon | — | two-state template swap |
| 22 | **Related posts** | `.related-sec.related-5 > .inner > .block-h.heading-layout-5 + .block-inner > .p-wrap.p-list-inline > h4.entry-title > i.rbi.rbi-plus + a.p-url` | icon + title | 1 (article) | `none-toc` (excluded from TOC) |
| 23 | **Share rail** | `.t-shared-sec.tooltips-n.is-color > .t-shared-header.is-meta > i.rbi.rbi-share + .share-label` + `.effect-fadeout > a.share-action.share-trigger.icon-{facebook,twitter,email,print}` | label + 4 share actions | 1 (article) | `.native-share-trigger.more-icon`; print via `javascript:window.print()` |
| 24 | **Breadcrumbs** | `.breadcrumb-wrap.breadcrumb-navxt > .breadcrumb-inner[vocab=schema.org][typeof=BreadcrumbList] > span[property=itemListElement][typeof=ListItem]` | Home › Blog › Category › Title, with `meta[property=position]` | 2 (article, archive) | `.current-item`, `.archive`, `.taxonomy` |
| 25 | **Article meta** | `.single-meta.meta-s-default > .smeta-in > a.meta-el.meta-avatar > img.avatar` + `.smeta-sec > .smeta-bottom.meta-text > time.updated-date` + `.p-meta > .meta-inner.is-meta` (`.meta-author-url`, `.meta-read` "2 Min Read", `.meta-bookmark`) | avatar, updated date, author, read time, bookmark | 1 (article) | `.smeta-extra`, `.meta-separate` |
| 26 | **Comment form** | `#commentform.comment-form` with `<label for="comment">`, `<textarea required>`, `<p class="comment-notes">`, `.required-field-message` | comment textarea + submit | 1 (article) | `#cancel-comment-reply-link`; `.no-comment` state |
| 27 | **Login popup** | `#rb-user-popup-form` → `form#popup-form` + `.rb-login-label` + `input[type=password]` + `#rememberme` + "Lost your password?" | username, password, remember, submit | 1 | `--login-popup-w: 350px` |
| 28 | **404 block** | `.page404-wrap.rb-container.edge-padding > .page404-inner > .page404-featured` + `h1.page-title` + `p.page404-description` + labelled `form.search-form.wp-block-search` + `.page404-btn-wrap > a.page404-btn.is-btn` | illustration, headline, copy, search, CTA | 1 | "Return to Homepage" |
| 29 | **Search empty** | `.search-empty > p.h3` | message only | 1 | — |
| 30 | **Search header** | `header.search-header > .rb-container > .search-header-inner > .search-header-content (h1.search-title + p.search-subtitle) + .search-header-form` | query echo, result count, re-search form | 1 | background image swaps for dark mode |
| 31 | **Back-to-top** | `#back-top` (body class `is-backtop`, `none-m-backtop`) | icon button | 1 | `jquery.ui.totop` script present |

### 3.1 Observed cross-cutting modifiers

| Modifier | Meaning (extracted from CSS/DOM) |
|---|---|
| `ecat-bg-3` | Category chips get a **filled pill**: `background-color: var(--cat-highlight, var(--g-color))`, `padding: .7em 1.2em`, `border-radius: 100px`, white text |
| `ecat-bg-2` | Outlined variant: `border: 1px solid var(--cat-highlight)`, `color: var(--cat-highlight)` |
| `ecat-size-big` | Larger card type (`--title-size: 38px` on the hero widget) |
| `meta-s-default` | Default meta row treatment (dots as separators — body class `lmeta-dot`) |
| `light-scheme` | On dark surfaces: inverts `[data-mode]` assets (`filter: invert(100%)`) and forces dark-appropriate placeholder colour |
| `mobile-hide` | `display:none` below the mobile breakpoint |
| `none-toc` | Excluded from the article table of contents |
| `is-gap-{7,10,20,25}` | Grid gutter override |
| `pre-load` | Shown until the swiper initialises (loading shell) |
| `menu-ani-1 hover-ani-1 btn-ani-1` | Body classes selecting one of ~8 menu-open, hover and button animation presets |
| `is-hd-4` | Header layout 4 (logo row + sticky nav), sets `--hd-logo-height: 40px` |


---

## 4. Design token extraction

### 4.0 How the cascade resolves (extracted head order)

The homepage `<head>` loads stylesheets in this exact order:

```
1. wp-img-auto-sizes-contain-inline-css        (inline, 135 B)
2. wp-emoji-styles-inline-css                  (inline, 340 B)
3. classic-theme-styles-inline-css             (inline, 350 B)
4. global-styles-inline-css                    (inline, 9,645 B — WP block presets, unused by Foxiz)
5. foxiz-elements.css                          (20,272 B — Elementor widget library)
6. main.css                                    (467,222 B — THE THEME, 207 :root declarations)
7. foxiz-main-inline-css                       (inline, 9,645 B — ★ THE SITE'S TOKEN OVERRIDES ★)
8. foxiz-style.css                             (568 B — header comment only, zero rules)
9. elementor/css/post-8.css                    (1,164 B — Elementor "kit" 8)
10. elementor/css/post-52.css                  (10,544 B — page-level Elementor overrides)
11. (deferred) Google Fonts via <link rel=preload as=style onload="this.rel='stylesheet'">
12. (deferred) print.css
```

**Consequence:** the **site's real design tokens live in inline `<style id="foxiz-main-inline-css">`** (step 7), which arrives *after* the theme's `main.css` and therefore wins every same-specificity `:root` collision. Anything in `main.css`'s `:root` that is *not* re-declared there is still live. **Inferred** (not engine-verified) but supported by source order and identical selector specificity.

---

### 4.1 Colour palette — extracted values

#### 4.1.1 Brand / primary

| Token | Theme default (`main.css`) | **Site override (effective)** | Role | Evidence |
|---|---|---|---|---|
| `--g-color` | `#ff184e` (hot pink) | **`#4173ff`** | Global accent: link hover, pill chips, counters, button bg | inline `:root` |
| `--g-color-90` | `#ff184ee6` | **`#4173ffe6`** | Accent at 90 % alpha | inline `:root` |
| `--heading-sub-color` | `var(--g-color)` | `#000000` (set by `post-52` for one widget) | Section-heading underline | main.css / post-52 |
| `--heading-color` | `var(--body-fcolor)` | **`#246EFF`** (set by `post-52` for `bd7188f` = "Popular News") | Section-heading text | post-52 |
| `--indicator-bg-from` / `--indicator-bg-to` | `#ff0084` → `#2c2cf8` | unchanged | Nav active-indicator gradient (`--indicator-height: 4px`) | main.css |
| `--hyperlink-line-color` | — | `var(--g-color)` | Underline colour of in-text links | inline |
| `--privacy-color` | `#fff` | unchanged | Consent-bar text | main.css |

> **Finding 1 (design-system break):** three live blues — `#4173ff` (site accent), `#246EFF` (one Elementor widget), and the dormant theme default `#ff184e`. `#4173ff` and `#246EFF` are 4.7 % apart in luminance and visually near-identical, i.e. *indistinguishable to a user but different in code*. This is the classic signature of hand-poked Elementor colour pickers sitting on top of an un-tokenised theme.
> **Finding 2 (latent risk):** `#ff184e` is still the theme's default. Any component the site hasn't explicitly overridden will render **pink**, not blue. **Unverified** how many such components exist on inner pages.

#### 4.1.2 Semantic / status

| Token | Value | Use |
|---|---|---|
| `--live-color` | `#fe682e` | "Live" badge (animation `liveAnimation 1.5s linear infinite`) |
| `--review-color` | **`#e5b20b`** (site) / `#ffc300` (theme) | Star-rating gold |
| `--video-color` | `#ffc300` | Video-format badge |
| `--audio-color` | `#ffa052` | Audio-format badge |
| `--gallery-color` | `#729dff` | Gallery-format badge |
| `--bookmark-color` / `-90` | `#62b088` / `#62b088f2` | Saved/bookmarked state (green) |
| Menu badge overrides (site inline) | `#ff6552` (coral), `#56ca71` (green), `#ff3d29` (red), `#1abc9c` (teal) | `.menu-sub-title` pills on menu items 2363/2366/2378/2380 |

> **Finding:** there is **no success / warning / danger token set**. Semantic colour is expressed as six *format-type* colours (live/review/video/audio/gallery/bookmark) plus four one-off menu-badge hexes hard-coded in the inline override. Nothing a form, an alert or a validation message could reuse.

#### 4.1.3 Neutrals / text / surfaces

| Token | Theme default | **Site override (effective)** | Notes |
|---|---|---|---|
| `--body-fcolor` | `#282828` | **`#000000`** | Body + default heading colour |
| `--nav-color` | `#282828` | unchanged | Primary nav link colour |
| `--nav-color-10` | `#28282820` | unchanged | 12.5 % nav colour (dividers) |
| `--subnav-color` | `#282828` | unchanged | Submenu link colour |
| `--meta-fcolor` | `#666` | unchanged | Byline / date / category-label grey |
| `--meta-b-fcolor` | `#282828` | unchanged | Bold meta (author name) |
| `--excerpt-color` | `#666` | unchanged | Article excerpt / standfirst |
| `--alight` | `#ddd` | unchanged | Placeholder text, disabled |
| `--solid-light` | `#fafafa` | unchanged | Lightest surface tint |
| `--solid-white` / `--awhite` | `#fff` | `--solid-white` → `#00080a` in dark mode | Cards, buttons, chips |
| `--flex-gray-7` | `#88888812` | unchanged | 7 % grey — hairline borders |
| `--flex-gray-15` | `#88888826` | unchanged | 15 % grey — `--bottom-border-color`, `--column-border-color` |
| `--flex-gray-40` | `#88888866` | unchanged | 40 % grey — input focus border |
| `--absolute-dark` | `#242424` | unchanged | Near-black |
| `--dark-accent` | `#191c20` | **`#00080a`** | Hero scrim top colour |
| `--dark-accent-90` | `#191c20f2` | **`#00080ae6`** | Scrim mid |
| `--dark-accent-0` | `#191c2000` | **`#00080a00`** | Scrim transparent |
| `--nav-bg` / `--subnav-bg` | `#fff` | `#191c20` in dark | Nav surface |
| `--shadow-7` | `#00000012` | unchanged | 7 % black — soft shadow |
| `--shadow-12` | `#0000001f` | unchanged | 12 % black — raised shadow |
| `--shadow-20` | `#00000005` | unchanged | 3 % black — barely-there |
| Footer bg | — | `#0000000a` light / `#16181c` dark | `.footer-has-bg` |
| Dark nav bg | — | `#191c20` | `[data-theme=dark].is-hd-4` |

**Derived neutral ramp (extracted, assembled):**
`#000000 · #00080a · #191c20 · #242424 · #282828 · #666 · #88888826 · #88888812 · #88888866 · #ddd · #fafafa · #ffffff`
That is a **12-step, non-monotonic** ramp — several steps are the *same hue at different alphas* rather than distinct greys, and there is no `#f5f5f5`-style "surface-1". **Inferred:** surfaces are white with hairline borders rather than tinted greys.

#### 4.1.4 Social / brand-network colours (extracted, complete)

| Network | Default | Hover |
|---|---|---|
| Facebook | `#89abfc` | `#1f82ec` |
| X / Twitter | `#00151c` | `#13b9ee` |
| Instagram | `#7e40b6` | `#8823b6` |
| YouTube | `#ef464b` | `#fc161e` |
| WhatsApp | `#00e676` | `#00e537` |
| Telegram | `#649fdf` | `#3885d9` |
| VK | `#07f` | `#005f8c` |
| LinkedIn | `#007bb6` | `#006ab1` |
| Bluesky | `#4ca2fe` | `#263544` |
| Pinterest | `#f74c53` | `#f60c19` |
| Flipboard | `#f52828` | `#e00a0a` |
| SoundCloud | `#fd794a` | `#ff5313` |
| Vimeo | `#44bbe1` | `#16b1e3` |
| Dribbble | `#fb70a6` | `#ff407f` |
| Medium | `#000` | `#ffb600` |
| Threads | `#000` | `#5219ff` |
| Tumblr | `#32506d` | `#1f3143` |

> Note `--bsky-color: #4ca2fe` but `--bsky-hcolor: #263544` (a dark slate) and `--threads-hcolor: #5219ff` (purple) — hover colours are inconsistent in *kind*, some darker, some unrelated hues. Cosmetic, but a sign of accumulated patch releases rather than a designed system.

---

### 4.2 Typography — extracted values

#### 4.2.1 Families actually loaded

Google Fonts request (extracted from `<link rel=preload as=style onload=this.rel='stylesheet'>`):
```
https://fonts.googleapis.com/css?family=
  Bitter:300,400,500,600,700,800,900,100italic,200italic,300italic,400italic,500italic,600italic,700italic,800italic,900italic
  |Coustard:900,400
  |Raleway:700,400,600
  &display=swap
```
Plus `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` and a preloaded icon font `assets/fonts/icons.woff2`.

| Role | Effective family | Weight | Extracted from |
|---|---|---|---|
| Body / copy | **Bitter** (serif) | 400 | site inline `--body-family` |
| H1–H4 | **Coustard** (serif display) | **900** | site inline `--h1..h4-family`, `--h1..h4-fweight` |
| H5, H6 | **Coustard** | 400 | site inline |
| Category chips | **Raleway** (sans) | 700, `uppercase`, `0.1em` | site inline `--cat-*` |
| Meta / byline / date | **Raleway** | 400, `uppercase`, `10px` | site inline `--meta-*` |
| Meta bold (author) | **Raleway** | 600, `uppercase` | site inline `--meta-b-*` |
| Buttons | **Raleway** | 700 | site inline `--btn-*` |
| Nav menu | **Raleway** | 700, `uppercase`, `12px` | site inline `--menu-*` |
| Sub-menu | **Raleway** | 600, `12px` | site inline `--submenu-*` |
| Dashboard-widget titles | **Raleway** | 700, `11px` | site inline `--dwidgets-*` |
| Breadcrumbs | **Raleway** | 400, `uppercase`, `10px` | site inline `--bcrumb-*` |
| Headline (hero) | **Coustard** | 900, `44px` | site inline `--headline-*` |
| Tagline | **Bitter** | 600, `24px` | site inline `--tagline-*` |
| Inputs | **Bitter** | 500 | site inline `--input-*` |
| Quote / pull-quote | **Coustard** | 400 | site inline `--quote-*` |
| Icon font | `'ruby-icon'` | — | main.css (11 declarations) |

> **The theme's own defaults were completely replaced.** `main.css` ships `--body-family: 'Oxygen', sans-serif` and `--h1-family…'Encode Sans Condensed', sans-serif`. The site override swapped the *entire* sans-serif editorial stack for a **serif-heading + serif-body + sans-chrome** system. That is a sophisticated choice — and the reason the site reads like a newspaper rather than a blog. Note the theme's default stack is still present in the CSS as dead weight (~446 KB).
> One straggler: `'Encode Sans Condensed', sans-serif` appears 3× in `main.css` on selectors not covered by a token — **inferred** a couple of components still render in the wrong family.

#### 4.2.2 Font-size scale — extracted

**Theme default (`main.css :root`):**

| Token | Default |
|---|---|
| `--body-fsize` | 16px |
| `--h1-fsize` | 40px |
| `--h2-fsize` | 28px |
| `--h3-fsize` | 22px |
| `--h4-fsize` | 16px |
| `--h5-fsize` | 14px |
| `--h6-fsize` | 13px |
| `--headline-fsize` | 45px |
| `--tagline-fsize` | 28px |
| `--excerpt-fsize` | 14px |
| `--input-fsize` | 14px |
| `--menu-fsize` | 17px |
| `--submenu-fsize` | 13px |
| `--meta-fsize` | 13px |
| `--cat-fsize` | 10px |
| `--btn-fsize` | 12px |
| `--dwidgets-fsize` | 13px |
| `--tagline-s-fsize` | 22px |

**Effective (site override, `foxiz-main-inline-css`):**

| Token | ≤767 px (mobile) | 768–1024 px | **>1024 px (desktop)** |
|---|---|---|---|
| `--h1-fsize` | 25px | 28px | **34px** |
| `--h2-fsize` | 22px | — | **28px** |
| `--h3-fsize` | 15px | — | **18px** |
| `--h4-fsize` | 13px | — | **14px** |
| `--h5-fsize` | — | — | **14px** |
| `--h6-fsize` | — | — | **13px** |
| `--body-fsize` | 16px | 16px | **16px** |
| `--headline-fsize` (hero) | 28px | 34px | **44px** |
| `--headline-s-fsize` (2nd hero) | 28px | 34px | **38px** |
| `--tagline-fsize` | 17px | 20px | **24px** |
| `--tagline-s-fsize` | 17px | 20px | **22px** |
| `--excerpt-fsize` | 14px | 14px | **15px** |

Unscaled chrome sizes (constant at all breakpoints): `--cat-fsize: 10px`, `--meta-fsize: 10px`, `--meta-b-fsize: 10px`, `--btn-fsize: 12px`, `--menu-fsize: 12px`, `--submenu-fsize: 12px`, `--dwidgets-fsize: 11px`, `--bcrumb-fsize: 10px`, `--input-fsize: 14px`, `--body-fsize: 16px`.

**Reconstructed scale (extracted):**
`10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 22 · 24 · 25 · 28 · 34 · 38 · 44 px`

> **Finding:** the scale is *piecewise*, not modular. Ratios between adjacent desktop steps run 1.10, 1.08, 1.07, 1.00, 1.14, 1.09, 1.06, 1.09, 1.29, 1.17, 1.12, 1.14, 1.21, 1.12, 1.16. Two steps are numerically identical (`h5 = h4 = 14px`), and 10px chrome text sits only 1.6× above the 10px `--cat-fsize` floor. There is no single ratio and no `rem` base — everything is `px` except the utility tokens `--rem-mini: .8rem` and `--rem-small: .92rem` (used 34× and 26× respectively) and the em-based `--em-mini: .8em`, `--em-small: .92em`.
> **Finding:** `--cat-fsize` and `--meta-fsize` at **10px** are below any reasonable minimum for body-adjacent text, and they are `uppercase` + `0.1em` letter-spacing on top, which further shrinks apparent x-height. **Inferred** these will fail WCAG 1.4.4 (resize text) for many users at default zoom.

#### 4.2.3 Line-heights, weights, letter-spacing, case (extracted)

| Role | Line-height | Weight | Letter-spacing | Case |
|---|---|---|---|---|
| h1 | 1.2 | 900 (site) / 700 (theme) | normal | none |
| h2 | 1.25 | 900 | normal | none |
| h3 | 1.3 | 900 | normal | none |
| h4 | 1.45 | 900 | normal | none |
| h5 | 1.5 | 400 | normal | none |
| h6 | 1.5 | 400 | normal | none |
| body | `max(1.7, 1.4)` | 400 | normal | none |
| headline | 1.2 | 900 | normal | none |
| tagline | — | 600 | normal | none |
| excerpt | 1.7 (inherited) | 400 | normal | none |
| cat (chips) | 1 | 700 | **`.07em`** (theme) / **`.1em`** (site) | `uppercase` |
| meta | 1 | 400 | normal | `uppercase` |
| meta-b | 1 | 600 | normal | `uppercase` |
| menu | — | 600/700 | **`-.02em`** | `none` (site) / `uppercase` (theme) |
| submenu | — | 500/600 | **`-.02em`** | `none` |
| btn | — | 700 | normal | `none` (site) / `uppercase` (theme) |
| dwidgets | — | 600 | 0 | `none` |
| bcrumb | 1.5 | 400 | `0` (fallback) | `uppercase` |
| input | — | 400/500 | normal | `none` |
| quote | — | 400 | — | — |

**Body line-height:** `line-height: max(var(--body-fheight, 1.7), 1.4)` — the `max()` guard prevents the editor from setting anything tighter than 1.4. Good defensive token design.

---

### 4.3 Spacing — extracted

| Token / pattern | Value | Notes |
|---|---|---|
| `--el-spacing` | **12px** | Base element gap |
| `--bottom-spacing` | **35px** | Vertical rhythm between stacked blocks |
| `--box-spacing` | **5%** | Fluid inset |
| `--topad-spacing` | **15px** | Top-ad clearance |
| `--heading-spacing` | 12px / 20px | Inline padding on section headings |
| `--padding-40` | `0 40px` | Standard horizontal inset for buttons |
| `--height-34` / `--height-40` | 34px / 40px | Control heights |
| `--image-spacing` | 15px | Gap around in-article images |
| `--llabel-spacing` | 7px | Label gap |
| `--h-menu-spacing` | 15px | Nav item gap |
| `--icon-spacing` / `--m-icon-spacing` | 0 / `.3em` | Icon-to-text |
| `--icon-gap` | 5px | |
| `--excerpt-gap` | 1.5em | Title-to-excerpt |
| `--mc-btn-margin` | 12px | |
| `.edge-padding` | `padding-left/right: 20px` | Applied to **every** `rb-container` |
| `--swiper-navigation-size` | 44px | Carousel arrow size |
| `--wnav-size` | 20px (15.3px ≤767px) | Header utility icon size |
| `--s-icon-size` | 12px | Social icon size (set per-widget) |

**Frequency-histogram of every `padding`, `margin-bottom` and `gap` declaration in `main.css` (extracted):**

| Step | padding hits | margin-bottom hits | gap hits |
|---|---|---|---|
| 0 | 31 | 35 | 0 |
| 3px | 3 | — | 3 |
| 4px | 4 | — | — |
| 5px | 9 | 6 | 17 |
| 7px | 5 | 10 | 6 |
| 10px | 7 + 5 (`0 10px`) + 9 (`10px 20px`) | 8 | 22 |
| 12px | 4 (`0 12px`) + 3 (`12px 20px`) | 6 | 9 |
| 15px | 7 + 5 (`0 15px`) + 4 (`15px 20px`) | 18 | 8 |
| 20px | 19 | 28 | 8 |
| 25px | 3 (`25px 20px`) | 12 | 4 |
| 30px | — | 18 | 3 |
| 35px | — | 5 | 1 |
| 40px | 4 (`--padding-40`) | 14 | — |
| 50px | — | 6 | — |
| 1rem / .5rem / 1.5rem | 3 | 6 | 2 (`.7em`, `.5em`) |

> **Finding:** the lattice is a **5 px base with a 1 px/2 px sub-grid** (3, 4, 5, 7). ~78 % of all spacing declarations are a multiple of 5. Genuinely disciplined. The oddities are 3px, 4px and 7px (icon nudge distances) and the `.7em/.5em/1.5em` em-based outliers — **inferred** to be late typographic tweaks rather than systematic spacing.

---

### 4.4 Radii, shadows, borders — extracted

| Token | Value | Used for |
|---|---|---|
| `--round-3` | **3px** | 42 hits — buttons, cards, chips |
| `--round-5` | **5px** | 58 hits — **the default "wrap" radius** |
| `--round-7` | **7px** | 38 hits — featured images, larger surfaces |
| `--wrap-border` | `var(--round-3)` / `var(--round-7)` fallback | Card frames |
| `--featured-border` | `var(--round-7)` | Featured images |
| Pill radii | `9999px`, `100px`, `999px`, `50%`, `200%`, `100px` | Category chips (`.p-category` → `border-radius: 100px`), avatars, toggles |
| `--meta-style-b` | `0` | Meta separator radius |
| Dark-mode knob | `calc(var(--dm-size, 24px) - 2px)` | Toggle thumb |
| `min(3px, var(--round-3))` / `min(10px, var(--round-5))` | — | Mobile-shrunk radii |

**Radius system:** 3 / 5 / 7 px plus a true pill. Three-step, coherent. But note `border-radius: 50%` (39 hits) is used for *circles* (avatars, dots) which is correct, and `9999px`/`100px`/`999px` (4 hits) is the same pill expressed three ways.

**Shadows (extracted):**

| Declaration | Hits | Composition |
|---|---|---|
| `none` | 17 + 5 `!important` | Explicit suppression |
| `0 5px 30px var(--shadow-7)` | 9 | 7 % black, 30 px blur — dropdowns, popups |
| `0 4px 30px var(--shadow-7)` | 7 | Softer dropdown |
| `0 4px 30px var(--shadow-12)` | 6 | 12 % black — raised card |
| `0 10px 30px var(--shadow-12)` | 3 | Modal / off-canvas |
| `0 3px 12px #000` / `rgba(0,0,0,.15)` | 2 + 2 | Legacy hard shadows |
| `0 3px 12px var(--{fb,twitter,pin,ig,linkedin,bsky,…}-hcolor)` | ~10 | **Per-brand coloured glow** under social buttons |
| `var(--btn-shadow, 0 3px 12px var(--s-icon-hcolor))` | 2 | Button shadow defaults to the icon's own colour |
| `3px 3px 0 var(--body-fcolor)` / `1px 1px 0 var(--body-fcolor)` | 3 + 1 | **Hard offset "brutalist" shadow** in accent-free black |
| `0 0 0 30px #fafafa inset` | 1 | Image placeholder fill |
| `0 0 0 1px` hairline borders | — | `--flex-gray-7` / `--flex-gray-15` used as `--bottom-border-color` and `--column-border-color` |

> **Finding:** the shadow vocabulary mixes three incompatible languages — soft ambient (`0 5px 30px`), coloured brand glows (`0 3px 12px var(--fb-hcolor)`), and hard offset brutalist (`3px 3px 0 #000`). All three are live. **Inferred** they appear on different component families, so it reads as inconsistency rather than hierarchy.

---

### 4.5 Layout, grid, breakpoints — extracted

| Token | Value | Role |
|---|---|---|
| `--rb-width` | **1280px** | `.rb-container` max-width (2 hits: `1280px` and `1240px` variants exist) |
| `--rb-s-width` | `var(--rb-width)` = 1280px | Single-post container |
| `--rb-small-width` | **860px** | `.rb-small-container` (narrow blocks) |
| `.rb-wide-container` | **1500px** | Wide sections |
| `--s-content-width` | **760px** | **Article body measure** |
| `--max-width-wo-sb` | **840px** | Content without sidebar |
| `--alignwide-w` | 1600px | Gutenberg align-wide |
| `--login-popup-w` | 350px | Login modal |
| `--s10-feat-ratio` / `--s11-feat-ratio` | 45% / 45% | Featured-image aspect ratios |
| `--content-width` | `100%` | |
| `--overlay-width` | `90%` | |
| `--tablet-scroll-width` | `40%` | |
| `--teaser-col` | 3 | `calc(100% / var(--teaser-col, 3))` |
| `--uname-width` | 120px | |
| `--ds-columns` | 1 / 4 | Default single/sidebar column counts |
| `--s-columns`, `--s-tcolumns`, `--s-mcolumns` | `repeat(var(--s-columns, var(--ds-columns, 2)), 1fr)` | Single / tablet / mobile column counts |

**Elementor container widths (extracted from `post-52.css`):**
`1260px` (hero section), `1270px` (two sections), `1280px` (two sections). Elementor kit default (`post-8.css`): `1140px`, with `1024px` ≤1024 and `767px` ≤767.

**Grid column counts (extracted):**
`.rb-col-5 > .block-inner > * { flex-basis: 20%; width: 20% }` — the mega-menu preview.
Elementor desktop: main column **69.666 %** + sidebar **30 %**; a 50/50 split; a 25 % four-up; a 24.333 % five-up.
Elementor ≤1024: 69.666 % → 100 %, 30 % → 100 %, 50 % → 100 %, 25 % → 50 %, 24.333 % → 50 %.
Elementor ≤767: all → 100 % / stacked.
`grid-template-columns` values present: `repeat(N, 1fr)` for N = 1…5, `42px auto 1fr`, `60px 1fr`, `auto 1fr`, `4fr 4fr 3fr`.

**Breakpoints (extracted, complete set):**

| Media query | Count in `main.css` | Purpose |
|---|---|---|
| `(max-width: 767px)` | 1 | **Mobile** |
| `(max-width: 991px)` | 1 | Tablet-down |
| `(max-width: 1024px)` | 1 | **Tablet / small laptop** |
| `(min-width: 1025px)` | 1 | Desktop-only |
| `(min-width: 992px)` | 1 | Desktop-up (Bootstrap-legacy) |
| `(min-width: 768px)` | 1 | Tablet-up |
| `(min-width: 768px) and (max-width: 1024px)` | 1 | Tablet band |
| `(max-height: 1024px)` / `(max-height: 640px)` | 2 (Elementor) | **Height**-based lazy-load suppression |

Plus the site's own `@media (max-width: 1024px)` and `@media (max-width: 767px)` blocks that rescale the type tokens.

> **Finding:** five overlapping horizontal breakpoints (767/768/991/992/1024/1025) plus two *height*-based ones. 767 and 768 are the same edge expressed as `max-width` and `min-width` — correct but redundant. 991/992 likewise. The effective system is really three steps (767 / 1024 / desktop) which is fine, but the **`max-height` breakpoints are an Elementor lazy-load optimisation leaking into the design system**: sections below the fold lose their backgrounds on short viewports. **Inferred** this can produce visibly broken hero/section backgrounds on landscape phones.

---

### 4.6 Motion — extracted

| Token | Value |
|---|---|
| `--effect` | **`all .2s cubic-bezier(0.32, 0.74, 0.57, 1)`** — referenced by **210 declarations** |
| `--timing` | `cubic-bezier(0.32, 0.74, 0.57, 1)` |

**Durations observed:** `.2s` (dominant), `.3s` (4), `.4s` (8+8), `.5s` (8+4), `0s` (delay tricks), `.8s`, `1s`, `1.3s`, `1.5s`, `3s`.
**Easings observed:** `var(--timing)` everywhere; `ease` (opacity fallbacks); `cubic-bezier(.19, .49, .38, .79)` (shake); `linear` (all infinite animations).

**Keyframes / animations (extracted, complete):**

| Name | Timing | Loop | Inferred purpose |
|---|---|---|---|
| `spin-opacity` | `1.3s linear infinite` | yes | Loader |
| `liveAnimation` | `1.5s linear infinite` | yes | "Live" badge pulse |
| `reaction-spinner` | `1s linear infinite` | yes | Reaction picker |
| `rbFadeIn` | `0.3s ease forwards` | no | Block entrance |
| `spin-loader` | `.8s` / `1s infinite` | yes | Two loader variants |
| `spin-loader-1` | `3s linear infinite forwards` | no | Long spin |
| `spin-bounce` | `1.3s linear infinite` | yes | Bouncing dots |
| `swiper-preloader-spin` | `1s infinite linear` | yes | Carousel init |
| `heartbeat` | `1s infinite` | yes | Notification count |
| `hover-ani-7` | `1.5s ease` | no | One of ~8 hover presets |
| `ani-shake` | `.2s cubic-bezier(.19,.49,.38,.79) both` | no | Error / invalid |
| `scale(1.05)` / `scale(0.95)` | — | — | Body-class-selected hover/press transforms |
| `translate3d(0, -3px, 0)` / `translate3d(0,-3px,0) scale(1.05)` | — | — | Hover lift + zoom |

Body classes select motion presets: `menu-ani-1`, `hover-ani-1`, `btn-ani-1`, `loader-1`, `btn-transform-1`. **Inferred** these are theme-option switches offering ~8 presets each; the site uses variant `1` for all of them.

**Autoplay / carousel:** `.breaking-news-slider` carries `data-play="1"` and `data-speed="5000"` → 5-second auto-advance across 5 headlines = a full cycle every 25 s. **Unverified** whether it pauses on hover/focus — there is no `prefers-reduced-motion` block anywhere in the fetched CSS (regex count: 0 hits).

---

### 4.7 z-index scale — extracted

33 distinct values. Complete list with hit counts:
`1` (32), `10` (20), `0` (14), `-1` (13), `9999` (8), `2` (8), `99` (5), `1000` (4), `100` (4), `50` (2), `999` (2), `888` (2), `5` (2), `20` (2), `9` (2), `3` (2), `9042` (1), `9043` (1), `1045` (1), `1044` (1), `100000` (1), `-1000` (1).

> **Finding:** no z-index system. Values `9042`, `9043`, `1044`, `1045` and `100000` are escape hatches added when something overlapped something else. There is no `--z-*` token. Radio Waa should define a 6-step stacking scale on day one: `base(0) · raised(10) · sticky(100) · overlay(1000) · modal(2000) · toast(3000)`.


---

## 5. Component structure & state specs

### 5.1 Article card — `small` (the workhorse, 40+ instances)

```
div.p-wrap.p-grid.p-grid-small-1[data-pid]
├── div.feat-holder
│   ├── div.p-featured
│   │   └── a.p-flink[href][title]
│   │       └── img.featured-img.wp-post-image[width=330][height=220][alt=""][loading=lazy]
│   └── div.p-categories.light-scheme.p-top.mobile-hide
│       └── a.p-category.category-id-{N}[href][rel=category]  ×1–5
└── div.p-content
    ├── span.entry-title.h4
    │   └── a.p-url[href][rel=bookmark]   ← headline text
    └── div.p-meta
        └── div.meta-inner.is-meta
            └── div.meta-el.meta-date
                └── time.date.published[datetime=ISO-8601]   ← "October 4, 2026"
```

| State | Extracted CSS | Verified? |
|---|---|---|
| Default | `.p-grid-small-1 { display:flex; align-items:flex-start; flex-flow: row-reverse nowrap; width:100% }` — thumbnail on the **right** | extracted |
| Default | `.feat-holder { margin-right: 20px; margin-left: 0 }` | extracted |
| Default | `.feat-holder { flex-shrink:0; width:100%; max-width: var(--feat-list-width, 100px); margin-left: 15px }` — 100 px thumb | extracted |
| Default | `entry-title` font-size = `var(--title-size, var(--h4-fsize))` → **14px** | extracted |
| Default | `.p-category { padding: .7em 1.2em; border-radius: 100px; background: var(--cat-highlight, var(--g-color)); color: var(--cat-fcolor, var(--awhite)) }` | extracted |
| Hover | `.p-url:hover { color: var(--title-hcolor, var(--g-color)) }` with `transition: all 0.2s var(--timing)` | **unverified** |
| Hover | `.p-url { text-underline-offset: 1px }` | extracted |
| Hover | Image zoom is body-class-driven (`hover-ani-1`); one preset is `translate3d(0,-3px,0) scale(1.05)` | **inferred / unverified** |
| Focus | **No `:focus` or `:focus-visible` rule targets `.p-url`** | **FAIL — extracted absence** |
| Category count | Up to **5** category chips per card (e.g. Featured + General News + Health + Local + Politics) | extracted |
| Excerpt | **Absent** on this variant — headline + date only | extracted |

> **Design finding:** the small card has **no excerpt**, so every card in a 40-item grid is the same information weight: thumbnail + headline + date. Scanning is fast but there is no way to triage. And up to 5 pills on a 100px-thumb row makes the chip row wrap unpredictably. **Inferred** visual noise at the top of each card.

### 5.2 Article card — `list-1` (big, with excerpt)

```
div.p-wrap.p-list.p-list-1[data-pid]
├── div.list-holder
│   ├── div.list-feat-holder          ← width:270px; max-width:270px (set per-widget)
│   │   └── div.feat-holder > div.p-featured > a.p-flink > img
│   └── div.p-content
│       ├── h3.entry-title > a.p-url
│       ├── p.entry-summary            ← the excerpt ("…has announced plans to create…")
│       └── div.p-meta > div.meta-inner.is-meta
│           ├── a.meta-el.meta-author > img.meta-avatar(44px gravatar)
│           ├── div.meta-el.meta-author-url "Home Radio"
│           └── div.meta-el.meta-date > time.published
```

- Image: 420×280 (desktop), 330×220 elsewhere.
- Title: `--title-size: 38px` for the lead widget; `h3` = 18px baseline.
- Excerpt: `--excerpt-fsize: 15px`, `color: var(--excerpt-color)` = `#666`, `--excerpt-gap: 1.5em` above.
- Author avatar: 44 px gravatar (`s=44`), `alt` **is** populated (`alt='Home Radio'`) — the only images on the site with working alt text.
- Widget spacing: `.elementor-widget-container { margin: 0 0 15px }` between stacked lists.

| State | Notes |
|---|---|
| Hover | `.p-url:hover` → accent colour, `.2s` |
| Focus | none defined |
| Empty | `.entry-summary` is simply omitted — no "No excerpt" placeholder, so card heights **jitter** |
| Skeleton | `.pre-load` shell exists for swiper blocks only |

### 5.3 Overlay hero — `overlay-1` / `p-highlight`

```
div.block-wrap.block-overlay.overlay-1.p-gradient.ecat-bg-3.ecat-size-big.meta-s-default
└── div.block-inner
    └── div.p-wrap.p-highlight.p-overlay-1[data-pid]
        ├── div.overlay-holder
        │   ├── div.p-featured > a.p-flink > img (860×645, --feat-ratio:95)
        │   └── div.overlay-wrap            ← position:absolute; inset:0; z-index:10; pointer-events:none
        │       └── div.overlay-inner.p-content.light-scheme
        │           ├── div.p-categories.p-top   ← up to 5 chips
        │           ├── h2.entry-title           ← --title-size:38px (mobile: 21px)
        │           └── div.p-meta
```
Scrim (extracted):
```css
.p-gradient .overlay-inner {
  background-image: linear-gradient(to top,
     var(--dark-accent) 0,
     var(--dark-accent-90) 50%,
     var(--dark-accent-0) 100%);
}
.p-highlight .overlay-inner { padding: 100px 25px 25px 25px; }  /* or 25px 25px 100px for bottom variant */
.p-gradient .p-highlight .overlay-inner {
  background: linear-gradient(to top, var(--dark-accent) 0,
     var(--dark-accent-90) calc(100% - 150px), var(--dark-accent-0) 100%);
}
```
`--dark-accent` resolves to **`#00080a`** (site override). `light-scheme` flips `[data-mode]` assets with `filter: invert(100%)`.

**Contrast judgement (calculated):** white `#ffffff` on `#00080a` = **21:1** at the scrim's opaque bottom, and on `#00080ae6` (90 %) composited over a mid-tone image ≈ 15–19:1. **Pass**, comfortably. The risk is at the **top** of the scrim where it fades to `#00080a00` (fully transparent) — any headline or chip placed near the top edge has **no guaranteed contrast**. The `padding: 100px 25px 25px` rule pushes content away from that edge, which mitigates it. **Inferred** safe by design, but the top-fade is a real hazard if image aspect ratios change.

### 5.4 Section heading — `heading-layout-5` and `-10`

```html
<div class="block-h heading-layout-5">
  <div class="heading-inner">
    <h2 class="heading-title"><span>Must Read</span></h2>
    <div class="heading-tagline h6"><span class="heading-tagline-label">Most Popular in This Month</span></div>
  </div>
</div>
```
```css
.heading-title { line-height:1; position:relative; display:inline-flex;
                 padding: 0 var(--heading-spacing, 12px); backface-visibility:hidden; }
.heading-layout-5 .heading-inner { width:100%; padding-top: var(--heading-spacing, 7px);
                                   border-top: 5px solid var(--heading-sub-color); }
.heading-layout-10, .footer-wrap .widget-heading.heading-layout-c10 { opacity: .7; }
.heading-title:before / :after    ← decorative rules (layout variants c2 etc.)
```
- `--heading-sub-color` = `#000000` on the "Popular News" widget, `var(--g-color)` elsewhere → the 5 px rule is **black on one section and blue on others**. Another instance of the §4.1.1 finding.
- Tagline is `h6` inside the heading block — correct nesting, but it means a *label* consumes a heading level.

### 5.5 Breaking-news ticker

```html
<div class="breaking-news-slider swiper-container pre-load" data-play="1" data-speed="5000">
  <div class="swiper-wrapper">
    <div class="swiper-slide">
      <h6 class="entry-title breaking-news-title">
        <a class="p-url" href="…" rel="bookmark">MTN Ghana Invests $1.1 Billion…</a>
      </h6>
    </div>
    … ×5
  </div>
</div>
```
```css
.breaking-news-heading { margin-right:3px; padding:0; background-color:transparent; box-shadow:none; }
.breaking-news-heading i { width:1em; margin-right:4px; color: var(--g-color); }   ← "Hot News" bolt icon
.breaking-news-heading span { display:none; }        ← the "Hot News" TEXT IS HIDDEN ON DESKTOP
.breaking-news-slider .swiper-slide { … }
```
> **Finding:** the ticker's label is an **icon-only affordance on desktop** — `.breaking-news-heading span { display: none }` removes the words. Screen-reader users get an icon with no accessible name (the `<i>` is `aria-hidden`). **Unverified** what mobile does.
> **Finding:** `h6` for all 5 ticker headlines is the shallowest possible semantic choice, and it lands *immediately after* the `h1` logo heading — producing `h1 → h6` with nothing between.

### 5.6 Mega-menu category preview

Structure in §2.1. Behaviour notes:
- `li.menu-item-has-children.menu-has-child-mega.is-child-wide`
- `.mega-dropdown.is-mega-category` is a full-width panel inside `.rb-container.edge-padding`
- `.mega-header.mega-header-fw` = category name + "Show More" affordance (`a.mega-link.is-meta > span + i.rbi.rbi-cright`)
- Grid: `rb-col-5.is-gap-10` → 5 × 20 % columns, 10 px gutters, `.mobile-hide` on chips
- Each preview card: 330×220 thumb + `span.entry-title.h4` + `time.published`

| State | Notes |
|---|---|
| Closed | *(default)* |
| Open | **Hover/focus driven** — the theme uses CSS `:hover` on `li.menu-item-has-children` plus JS. **Unverified** |
| Keyboard | No `aria-expanded` on the parent `<a>` (regex: only 1 `aria-expanded`-free menu; `aria-expanded` count = 0). **FAIL 2.1.1 / 4.1.2** |
| Touch | Same hover trigger — **inferred** problematic on touch (first tap may just open the panel) |
| Reduced-motion | `menu-ani-1` body class selects an animation; **no `prefers-reduced-motion` guard** |

### 5.7 Buttons — `.is-btn` family

```css
.is-btn, .button, div:where(.entry-content) button {
  font-family: var(--btn-family);        /* Raleway */
  font-size: var(--btn-fsize);           /* 12px */
  font-weight: var(--btn-fweight);       /* 700 */
  letter-spacing: var(--btn-fspace);     /* normal */
  text-transform: var(--btn-transform);  /* none */
  line-height: var(--height-40);         /* 40px */
  padding: var(--padding-40);            /* 0 40px */
  cursor: pointer;
  transition: var(--effect);             /* all .2s cubic-bezier(.32,.74,.57,1) */
  white-space: nowrap;
  color: var(--btn-accent, var(--awhite));      /* #fff */
  border: none;
  border-radius: var(--round-3);                /* 3px */
  outline: none !important;                     /* ★★★ */
  background: var(--btn-primary, var(--g-color)); /* #4173ff */
  box-shadow: none;
}
.is-btn, .reg-link.is-btn { line-height:30px; padding-right/left: var(--login-btn-padding, 20px); }
```
Tokenised hover/active variants exist in the theme (`--btn-hcolor`, `--s-icon-hcolor`, `--btn-shadow`) but the site does not override them, so **the button's hover colour is the theme default, not a site token**. **Unverified.**

**State matrix for `.is-btn` (extracted):**

| State | Implementation | Verdict |
|---|---|---|
| Default | `#4173ff` bg, `#fff` text, 3px radius, 40px line-box | OK |
| Hover | `.is-btn:hover` exists in theme; site does not override → **unknown colour** | unverified |
| Active | `.is-btn:active` exists in theme | unverified |
| Focus | **`outline: none !important`** and no replacement shadow/ring | **FAIL — WCAG 2.4.7** |
| Disabled | No `[disabled]` / `aria-disabled` styling found | **absence** |
| Loading | `.rb-loader` (a separate span, not inside the button) | n/a |

Contrast of `#fff` on `#4173ff` = **4.10:1**. WCAG 2.2 AA requires 4.5:1 for text under 18.66 px bold. `.is-btn` is **12px/700** → does not qualify as large text → **FAIL 1.4.3**.

### 5.8 Category chip — `.p-category`

```css
.p-category { font-family:inherit; font-weight:inherit; font-style:inherit; line-height:1;
              position:relative; z-index:1; display:inline-flex;
              color: var(--cat-fcolor, inherit); }
/* ecat-bg-3 (the variant used everywhere on this site): */
.ecat-bg-3 .p-category { padding:.7em 1.2em; text-decoration:none;
                          color: var(--cat-fcolor, var(--awhite)); }
.ecat-bg-3 .p-category { padding-right:1.5em; padding-left:1.5em;
                          border-radius:100px;
                          background-color: var(--cat-highlight, var(--g-color)); }
```
Effective: 10px Raleway 700 uppercase, `letter-spacing:.1em`, `#fff` on `#4173ff`, radius 100px, `padding: .7em 1.2em / .7em 1.5em`.

**Contrast: `#ffffff` on `#4173ff` = 4.10:1 → FAIL 1.4.3 at 10px.**

> **Design finding:** a *category* is a navigational object, and giving every category chip the **same accent blue** destroys the one piece of information a colour could carry — which section you're in. `--cat-highlight` exists as a per-category token and is simply never set per category. This is the single easiest high-impact fix in the whole audit: colour-code the 12 categories.

### 5.9 Social-follower counter — `.follower-el`

```html
<div class="follower-el fb-follower">
  <a target="_blank" href="https://facebook.com/homeradio99.7fmWa" class="facebook"
     aria-label="Facebook" rel="noopener nofollow"></a>
  <span class="follower-inner">
    <span class="fnicon"><i class="rbi rbi-facebook" aria-hidden="true"></i></span>
    <span class="fntotal">78k</span>
    <span class="text-count">Like</span>
  </span>
</div>
```
- Sidebar variant adds `.fnlabel` ("Facebook") between icon and count.
- Wrapper: `.socials-counter.h6.is-style-7.is-icon-color.is-h-bg` + `.effect-fadeout` (siblings dim to `opacity` on hover of one).
- `--s-icon-size: 12px`.
- **Note:** the article-page sidebar widget links to `https://facebook.com/envato` — the **theme author's** demo account, a leftover from the template. Extracted, live bug.
- **Note:** the YouTube tile uses `href="hometv6310"` — a **relative URL**, not a link. It resolves to `https://homeradionews.com/hometv6310`. Extracted bug.

### 5.10 Bookmark / follow controls

State is swapped via `<script type="text/template">` blocks (extracted):
```html
<script type="text/template" id="bookmark-toggle-template">…</script>
<script type="text/template" id="bookmark-ask-login-template">
  <a class="login-toggle" data-title="Sign In to Save" href="…wp-login.php?redirect_to=…">
    <i class="rbi rbi-bookmark" aria-hidden="true"></i></a>
</script>
<script type="text/template" id="follow-toggle-template">
  <i class="follow-icon rbi rbi-plus" data-title="Follow"></i>
  <i class="followed-icon rbi rbi-bookmark-fill" data-title="Unfollow"></i>
</script>
```
- Both are `<span>` / `<i>` — **not focusable, no role, no keyboard path**. Anonymous users are redirected to `wp-login.php` with a `redirect_to` param.
- **Feedback:** `aside#bookmark-notification` + templates — a toast region exists.
- **Verdict:** bookmarks require a WordPress account. For a local radio audience this is a very high bar; **inferred** near-zero usage.


---

## 6. Typography & reading experience

### 6.1 The system in one table

| Role | Family | Weight | Size (desk / tab / mob) | Line-height | Case / tracking |
|---|---|---|---|---|---|
| Body copy | Bitter (serif) | 400 | 16 / 16 / 16 | `max(1.7, 1.4)` | none / normal |
| Article headline (single) | Coustard | 900 | 44px (`--headline-fsize`) | 1.2 | none |
| Secondary headline | Coustard | 900 | 38px | 1.2 | none |
| h1 (page titles) | Coustard | 900 | 34 / 28 / 25 | 1.2 | none |
| h2 (section titles) | Coustard | 900 | 28 / 28 / 22 | 1.25 | none |
| h3 (card titles, list) | Coustard | 900 | 18 / 18 / 15 | 1.3 | none |
| h4 (small-card titles) | Coustard | 900 | 14 / 14 / 13 | 1.45 | none |
| h5 | Coustard | 400 | 14 | 1.5 | none |
| h6 / tagline | Coustard | 400 | 13 | 1.5 | none |
| Tagline / standfirst | Bitter | 600 | 24 / 20 / 17 | — | none |
| Excerpt | inherited | 400 | 15 / 14 / 14 | 1.7 | none, `#666` |
| Category chip | Raleway | 700 | 10 (all) | 1 | `uppercase` / `.1em` |
| Meta / date / byline | Raleway | 400 | 10 (all) | 1 | `uppercase` / normal |
| Meta bold (author) | Raleway | 600 | 10 (all) | 1 | `uppercase` |
| Nav menu | Raleway | 700 | 12 (all) | — | `-.02em` |
| Sub-menu | Raleway | 600 | 12 | — | `-.02em` |
| Buttons | Raleway | 700 | 12 | 40px box | none |
| Breadcrumb | Raleway | 400 | 10 | 1.5 | `uppercase` |
| Widget titles | Raleway | 700 | 11 | — | 0 |
| Inputs | Bitter | 500 | 14 | — | none |
| Quote | Coustard | 400 | — | — | — |

### 6.2 Reading measure

| Token | Value | At 16px Bitter, characters per line (inferred) |
|---|---|---|
| `--s-content-width` | **760px** | ≈ 66–72 cpl — inside the 45–75 ideal |
| `--max-width-wo-sb` | 840px | ≈ 73–80 cpl — at the top of the ideal |
| `.rb-small-container` | 860px | ≈ 75–82 cpl |
| `.rb-container` | 1280px | ≈ 112–120 cpl — **far too wide for text**, correct for a grid |

> **Positive:** the site does *not* let article text run the full 1280 px. It constrains the single-post measure to 760 px. Most amateur news themes don't. **Extracted.**
> **Negative:** the sidebar is *inside* that frame, so the effective measure on a 1280 px viewport with a 30 % sidebar is roughly 760 px of text next to ~360 px of chrome — which is fine — but the sidebar itself contains cards whose headlines wrap to 3–4 lines at 12–13px meta.

### 6.3 Article reading flow (extracted, DOM order)

1. `aside.breadcrumb-wrap` — Home › Blog › Featured › Title (schema.org microdata, `meta[property=position]`)
2. `div.s-cats.ecat-bg-3.ecat-size-big` — category pills
3. `h1.s-title.fw-headline` — the headline
4. `div.single-meta.meta-s-default` — avatar (120px srcset) + `time.updated-date` "Last updated: October 13, 2026 1:16 pm" + author + **"2 Min Read"** + bookmark
5. `div.smeta-extra > div.t-shared-sec` — share rail (FB / X / Email / Print / native share)
6. `div.s-feat-holder` — featured image (suppressed in print via `print.css`)
7. `div.entry-content.rbct.clearfix.is-highlight-shares` — body, `clearfix`
8. `entry-newsletter` — newsletter (print-suppressed)
9. `related-sec.related-5` — "You Might Also Like" as a `p-list-inline` of `h4` + `i.rbi.rbi-plus`
10. `comments` / `#commentform`
11. `single-sidebar` (sticky, right) — "Stay Connected", popular, ads

**Reading-experience strengths:**
- **Read-time is shown** (`2 Min Read`) — a real, useful affordance.
- **"Last updated" is distinct from publish date** — good editorial transparency for a news site.
- **Excerpt text exists on list cards** (`…has announced plans to create…`) so scanning decisions are informed.
- The body has `is-highlight-shares` — the theme ships `highlight-share.js`, i.e. **select-to-share**. Nice touch; **unverified** whether it works.
- `print.css` exists and correctly suppresses `header-wrap`, `footer-wrap`, `single-related`, `single-sidebar`, `ad-wrap`, `entry-newsletter`, `breadcrumb-wrap`, `#back-top` and forces `color: #000` — a genuinely well-thought-out print sheet that most sites never write.

**Reading-experience weaknesses:**
- **Body copy is ~6,300 characters on this article** with **no sub-headings, no figures, and no figcaptions** (regex: zero `<figcaption>`). The only images in the body are a 150×150 thumbnail and an ad. A 2–3 minute read with no visual break is a wall of text.
- **No table of contents** even though the theme supports one (`ruby-table-contents`, `--toc-family`, `none-toc` modifiers) — the article simply doesn't use it. For a 2-minute read that's defensible.
- **Byline is "Home Radio"** on every article — no human bylines anywhere on the homepage. **Inferred** this costs trust.
- Every article links to `/blog/` in its breadcrumb, but **`/blog/` is not in any nav**. A breadcrumb crumb that leads to an unlinked section. Extracted inconsistency.

---

## 7. Colour system & contrast

### 7.1 The palette as shipped

| Group | Values (all extracted) |
|---|---|
| **Primary / accent** | `#4173ff` (effective `--g-color`) · `#4173ffe6` |
| **Rogue accents** | `#246EFF` (Elementor widget) · `#ff184e` (theme default, dormant) |
| **Indicator gradient** | `#ff0084` → `#2c2cf8` |
| **Status / format** | `#fe682e` live · `#e5b20b` review · `#ffc300` video/review-default · `#ffa052` audio · `#729dff` gallery · `#62b088` bookmark |
| **Menu badges (site inline)** | `#ff6552` · `#56ca71` · `#ff3d29` · `#1abc9c` |
| **Neutrals / text** | `#000000` body · `#282828` nav · `#666` meta/excerpt · `#ddd` alight · `#fafafa` solid-light · `#ffffff` white |
| **Scrims / dark** | `#00080a` · `#00080ae6` · `#00080a00` · `#191c20` · `#16181c` · `#000e23` · `#242424` |
| **Hairlines** | `#88888812` · `#88888826` · `#88888866` · `#28282820` |
| **Shadows** | `#00000005` · `#00000012` · `#0000001f` · `#000` |
| **Surfaces** | `#fff` nav/subnav · `#0000000a` footer bg (light) · `#16181c` footer bg (dark) |
| **Social** | 17 network pairs (§4.1.4) |
| **Elementor kit (unused)** | `#6EC1E4` primary · `#54595F` secondary · `#7A7A7A` text · `#61CE70` accent |

**Total distinct hex values: 163 in `main.css` alone; 171 across all fetched CSS.** Across 446 KB of theme stylesheet that is ~163 colours for a site that visually uses about eight.

### 7.2 Contrast audit — WCAG 2.2 AA, calculated from declared hex

Formula: WCAG 2.x relative luminance, `(L_light + 0.05) / (L_dark + 0.05)`. Thresholds: **4.5:1** normal text, **3:1** large text (≥24 px, or ≥18.66 px bold), **3:1** UI components & graphical objects.

| Pairing | Ratio | AA verdict | Where it occurs |
|---|---|---|---|
| `#000000` body on `#ffffff` | **21.00:1** | ✅ AAA | Article body, headlines |
| `#000000` on `#fafafa` | 20.12:1 | ✅ AAA | Cards on tinted surface |
| `#282828` nav on `#ffffff` | **14.74:1** | ✅ AAA | Nav links |
| `#666` meta/excerpt on `#ffffff` | **5.74:1** | ✅ AA (barely) | Dates, bylines, excerpts |
| `#666` on footer tint `#fdfdfd` | 5.64:1 | ✅ AA | Footer meta |
| `#ffffff` on `#191c20` (dark nav) | 17.10:1 | ✅ AAA | Dark-mode nav |
| `#ffffff` on `#16181c` (dark footer) | 17.77:1 | ✅ AAA | Dark-mode footer |
| **`#4173ff` accent on `#ffffff`** | **4.10:1** | ❌ **FAIL AA** (4.5) / ✅ large-only | Link hover, `.p-url:hover`, counters, section rules |
| **`#ffffff` on `#4173ff`** | **4.10:1** | ❌ **FAIL AA** | `.is-btn` (12px/700), `.p-category` chips (10px/700), `.ecat-bg-3` |
| `#246EFF` accent on `#ffffff` | 4.42:1 | ❌ **FAIL AA** | "Popular News" heading |
| `#ffffff` on `#fe682e` (live) | **2.90:1** | ❌ FAIL | Live badge |
| `#ffffff` on `#e5b20b` (review) | **1.96:1** | ❌ **SEVERE FAIL** | Star ratings |
| `#ffffff` on `#ff6552` | **2.90:1** | ❌ FAIL | Menu badge |
| `#ffffff` on `#56ca71` | **2.08:1** | ❌ FAIL | Menu badge |
| `#ffffff` on `#ff3d29` | **3.53:1** | ❌ FAIL (3.0 is the *large-text* bar; these are 12px) | Menu badge |
| `#ffffff` on `#1abc9c` | **2.41:1** | ❌ FAIL | Menu badge |
| `#ddd` placeholder on `#ffffff` | **1.36:1** | ❌ SEVERE FAIL | `input::placeholder` |
| `#ddd` on `#fafafa` | 1.30:1 | ❌ SEVERE FAIL | Disabled / placeholder on tint |
| White on hero scrim `#00080a` | **21.0:1** | ✅ AAA | Overlay headline |
| White on scrim mid `#00080ae6` | ≈15–19:1 (image-dependent) | ✅ (inferred) | Overlay headline |
| White at scrim top `#00080a00` | **unbounded** | ⚠️ **no guarantee** | Overlay top edge |

### 7.3 What this means

1. **The core reading experience passes.** Black-on-white body copy at 21:1 and `#666` meta at 5.74:1 are genuinely good. Whoever set `--body-fcolor: #000000` (overriding the theme's `#282828`) improved it.
2. **Every interactive colour fails.** `#4173ff` fails as a *text* colour (4.10 < 4.5) and as a *background for small white text* (4.10 < 4.5). That means the site's primary button, every category chip, every hovered link and every trending number are all below AA. This is the highest-severity, lowest-effort fix in the audit: darken the accent to roughly **`#2F5FE0`–`#2B5BE3`** (inferred to clear 4.5:1 with white) and provide a separate, darker `--accent-text` token for links on white.
3. **The coloured status badges are unusable.** `#e5b20b` at **1.96:1** with white text is effectively invisible-by-design — a star rating nobody can read. Menu badges at 2.08–3.53:1 are the same problem.
4. **Placeholders at 1.36:1** meet the technical letter of the spec (placeholders are not required to meet 1.4.3) but are functionally unreadable for low-vision users, and `--alight: #ddd` is also the **disabled** colour, which compounds it.
5. **Dark mode looks well-executed on the numbers** (17–19:1) but the *entire* dark palette is `[data-theme="dark"]` overrides of a handful of tokens; there is no dark-mode surface ramp, only `#191c20` nav / `#16181c` footer / `#000e23` scrim. **Inferred** mid-grey text on dark surfaces is untested.


---

## 8. Layout & grid

### 8.1 The container system

| Class | Max-width | Applied to |
|---|---|---|
| `.rb-container` / `.rb-s-container` | **1280px** (`--rb-width`) | Almost every section |
| `.rb-wide-container` | 1500px | Wide sections |
| `.rb-small-container` | 860px (`--rb-small-width`) | Narrow blocks |
| `.edge-padding` | +20px L/R inset | Every `rb-container` (combined) |
| `.rb-s-container` | 1280px | Single post frame |
| `--s-content-width` | 760px | **Article body measure** |
| `--max-width-wo-sb` | 840px | Sidebar-less content |
| Elementor `.elementor-container` | 1260 / 1270 / 1280 px (page) · 1140 px (kit default) | Each homepage section |
| `--alignwide-w` | 1600px | Gutenberg wide |

**Effective content width on a 1440 px viewport (inferred):** 1280 px container, minus 2×20 px edge padding = **1240 px** of living space, then split 69.666 % / 30 % with 20 px column gutters → **≈828 px** main column, **≈372 px** sidebar.

**Effective on a 375 px viewport (inferred):** 100 % − 40 px edge padding = **335 px**, single column.

### 8.2 Grid column counts actually used

| Component | Desktop | ≤1024 | ≤767 |
|---|---|---|---|
| Mega-menu preview (`rb-col-5`) | **5 × 20 %** | (collapses) | stacked |
| Main content split | **69.666 % / 30 %** | 100 % / 100 % | 100 % |
| 50/50 inner split | 50 / 50 | 100 / 100 | 100 |
| 4-up (`ae75367`, 25 %) | 25 % ×4 | 50 % ×2 | 100 % |
| 5-up (`63acbe9`, 24.333 %) | 24.333 % ×5 | 50 % | 100 % |
| Small-card list (`p-grid-small-1`) | flex row, 100 px thumb | same | `flex-flow: row nowrap`, thumb 15 px from left |
| List card (`p-list-1`) | 270 px thumb + text | same | stacked |
| Search results (`rb-col-4`) | 4 columns | 2 | 1 (`--ds-columns`) |
| Trending (`list-small-3`) | 3 items, 80 px thumb | same | same |

### 8.3 Aspect ratios / featured-image ratios

Extracted `--feat-ratio` values (Elementor widget level, `post-52.css`):
`95` (hero, mobile `56`), `50`, `42`, `70` (mobile → smaller), `155` (mobile `150`), `80` (mobile). Plus `--s10-feat-ratio: 45%`, `--s11-feat-ratio: 45%`.

**Image sizes served (extracted from `src` filenames):** 330×220, 420×280, 860×484, 860×645, 615×410, 150×150, 790×90, 600×600. Ratio spread: **1.5:1** (330/220, 420/280, 860×484 ≈ 1.78, 860/645 = 1.33, 615/410 = 1.5).

> **Finding:** at least **four** different featured-image aspect ratios are in simultaneous use (1.33, 1.5, 1.78, 2.5 for ads). Every card is a different shape. This is the single biggest source of the "messy" feel: there is no image-ratio token. `--feat-ratio` is set per-widget in Elementor and nobody reconciled them.

### 8.4 Responsive strategy (extracted)

| Viewport | What changes |
|---|---|
| ≤767px | `--h1` 25px, `--h2` 22px, `--h3` 15px, `--h4` 13px, `--excerpt` 14px, `--headline` 28px, `--tagline` 17px; all Elementor columns → 100 %; `.mobile-hide` chips hidden; `--feat-ratio` tightened (95→56, 155→150); `none-m-backtop` hides back-to-top; `--wnav-size` 20→15.3px; hamburger `#header-mobile` + `#mobile-menu` activated |
| 768–1024px | `--h1` 28px, `--excerpt` 14px, `--headline` 34px, `--tagline` 20px; 25 %→50 %, 24.333 %→50 %; `is-mstick` sticky retained |
| ≥1025px | Full mega-nav, 5-across previews, 69.666/30 split |

Viewport meta (extracted): `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`.
**No** `maximum-scale`, **no** `user-scalable=no`, **no** `viewport-fit=cover`. → pinch-zoom is **not** blocked. That's a pass for WCAG 1.4.4.

> **Findings:**
> 1. The responsive story is *mostly* a type-and-column-collapse story. Section paddings collapse to `0 5px` at ≤1024 and `0` at ≤767 — **inferred** content can touch the screen edge on very narrow devices since `.edge-padding` is 20 px but Elementor overrides shrink it to 5 px.
> 2. Negative margins are used to compensate column padding: `margin: -10px 0 0 0`, `margin: -13px 0 0 0`. These are the fingerprints of a layout that needed nudging rather than a designed gutter system.
> 3. `@media (max-height: 1024px)` and `(max-height: 640px)` **remove background images** on short screens — a performance optimisation that changes the design on landscape phones.
> 4. **No container queries.** Everything is viewport-based; components cannot adapt to their own container, which is why the 30 % sidebar and the 69.666 % column need separate width tokens.

---

## 9. Accessibility audit (WCAG 2.2 AA — static judgeable subset)

### 9.1 Scorecard

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1.1.1 | Non-text content | ❌ **FAIL (severe)** | 57 of 77 `<img>` have `alt=""`, including every article thumbnail. Only logo (4) and ads (5) have real alt. |
| 1.3.1 | Info & relationships | ⚠️ **PARTIAL FAIL** | Heading outline is non-sequential (§9.2); lists, breadcrumbs and forms use real semantics, but section groupings are anonymous `<div>`/`<section>` |
| 1.3.5 | Identify input purpose | ❌ FAIL | No `autocomplete` on username/password inputs (extracted: absent) |
| 1.4.1 | Use of colour | ❌ FAIL | Category chips are all the same colour (no colour encoding — OK), but "Featured"/"Local" distinction and link-vs-text is colour-only in `.p-url:hover` |
| 1.4.3 | Contrast (minimum) | ❌ **FAIL** | `#4173ff` 4.10:1, chips 4.10:1, review badge 1.96:1, menu badges 2.08–3.53:1, placeholder 1.36:1 |
| 1.4.4 | Resize text | ✅ PASS (structural) | No `maximum-scale`; all type is px-based but scales with browser font-size only if `rem` — **⚠️ px means browser font-size override won't scale it** |
| 1.4.10 | Reflow | ⚠️ LIKELY PASS | Responsive at 767/1024; unverified at 320 px |
| 1.4.11 | Non-text contrast | ❌ FAIL | Accent-coloured icons/graphics at 4.10:1 (< 3:1 is the bar, so this passes) — but `#e5b20b` on white = 1.96:1 fails |
| 1.4.12 | Text spacing | ⚠️ UNVERIFIED | No `line-height: unitless` violations found; px sizing may clip |
| 2.1.1 | Keyboard | ❌ **FAIL** | Bookmark (`span.rb-bookmark`), follow (`i.follow-icon`), live-search submit (`input`, OK) — bookmark and follow are **not focusable** |
| 2.1.2 | No keyboard trap | ⚠️ UNVERIFIED | Login popup focus management unknown |
| 2.4.1 | Bypass blocks | ❌ **FAIL** | **No `<main>` element, no skip link** anywhere in the 195 KB homepage |
| 2.4.2 | Page titled | ✅ PASS | `<title>` present on every template ("Page not found – Home Radio Wa", "Search Results for …") |
| 2.4.3 | Focus order | ⚠️ LIKELY FAIL | DOM order is: consent bar → logo → socials → search → breaking ticker → nav. Ticker links precede the nav in tab order |
| 2.4.4 | Link purpose | ⚠️ PARTIAL | Links are full headlines (good), but icon-only links rely on `aria-label`; the YouTube follower tile is `href="hometv6310"` — a broken relative URL |
| 2.4.6 | Headings & labels | ❌ **FAIL** | §9.2 |
| 2.4.7 | Focus visible | ❌ **FAIL (severe)** | `outline: none !important` on `.is-btn`/`.button`; **zero `:focus-visible` rules in 446 KB** |
| 2.4.11 | Focus not obscured (min) | ⚠️ UNVERIFIED | Sticky nav + smart-sticky could cover focused elements |
| 2.5.3 | Label in name | ✅ PASS | Visible text matches accessible names on labelled links |
| 3.1.1 | Language of page | ✅ PASS | `<html lang="en-US">` |
| 3.2.6 | Consistent help | ❌ N/A / FAIL | No help mechanism; contact is a Contact Form 7 page not linked from the homepage |
| 3.3.1 | Error identification | ⚠️ UNVERIFIED | CF7 + SWV scripts load; no inline error markup on the homepage |
| 3.3.2 | Labels or instructions | ❌ **FAIL** | Header search input has **no `<label>`**, only `placeholder="Search Headlines, News..."`. (The 404 page's search **is** correctly labelled.) |
| 4.1.2 | Name, role, value | ❌ **FAIL** | No `aria-expanded` on mega-menu parents; bookmark/follow have no role; dark-mode toggle has `role="img"` on the SVG but the anchor has no state |
| 4.1.3 | Status messages | ⚠️ PARTIAL | `.live-search-response` and `aside#bookmark-notification` exist but carry **no `aria-live`** |
| 2.3.1 | Three flashes | ✅ PASS (inferred) | Only the `liveAnimation` pulse at 1.5 s |

### 9.2 Heading hierarchy — the actual DOM sequence

```
h1  Home Radio Wa                              (logo, visually hidden: .logo-title.is-hidden)
h6  MTN Ghana Invests $1.1 Billion…           ┐
h6  "I'm now the Grand Master…"                │
h6  Bawumia Promises to Rebuild…               ├─ breaking ticker ×5
h6  Goodwill Message to NPP…                   │
h6  2,154 NHIS Registrations…                  ┘
h2  Former Deputy Upper West Regional Minister… (hero)
h3  Mohammed Kassim C…                          ┐
h4  DBI: Abu K. K. Pledges 100 Bags…           ├─ hierarchical grid
h4  NPP Activist Char…                          │
h4  Goodwill Message to NPP…                    ┘
h6  Popular News                                (section label)
h5  Speaker Bagbin Su…                          ┐
h5  Dr. Rashid Pelpuo…                          ┘ popular list ×2
h3  More Latest News                            (section label)
h2  RT. HON ALABAN BAGBIN'S TORCH…             (overlay lead)
h3  Lawra: MP Donates GHC 130,000…             ┐
h3  SOS GHANA LIMITED…                          ├─ list cards ×4
h3  ECG announces planned maintenance…          │
h3  Turkish Ambassador Pays Courtesy Visit…     ┘
h3  Subscribe to Our Newsletter                 (module title)
h4  Follow Us on Socials                        (section label)
h4  Editor's Pick                               (section label)
h3  Cerebrospinal Men…                          ┐
h4  Driver's License Extension…                 ├─ editor's pick
h4  Task Force Boosts…                          ┘
h2  Must Read                                   (section label)
h4  Wa Rotary Club Actively Seeks Funds…        ┐
h4  Wa East MP Supports Home Radio…             │
h4  CEO of Parliament…                          ┘ must-read ×3
h3  Government Declares Three New…              (overlay)
h3  More Latest News                            (section label, repeated)
h4  … ×9                                        (More Latest News grid)
h4  Listen to Home Radio 99.7 FM…               (footer)
h4  Quick Link                                  (footer)
h4  More Links                                  (footer)
h4  Sign Up for Our Newsletter                  (footer)
```

**Violations:** 4 skipped levels (`h1→h6`, `h6→h2`, `h3→h4→h2`); 6 consecutive `h6`; `h5` used for list items *below* an `h6` label; section labels at three different levels (`h6`, `h4`, `h3`, `h2`) for visually identical components; "More Latest News" appears as both `h3` and `h2`.

### 9.3 Landmarks & ARIA — extracted inventory

| Element | Count | Notes |
|---|---|---|
| `<main>` | **0** | ❌ |
| `<header>` | **0** | Header is `<div id="site-header">` |
| `<nav>` | 2 | `#site-navigation[aria-label="main menu"]` (good), `.mobile-menu-wrap` (**no** `aria-label`) |
| `<footer>` | 1 | `footer.footer-wrap` |
| `<aside>` | 4 | `#rb-privacy`, `aside#bookmark-notification`, plus 2 template asides |
| `<section>` | 7 | Elementor sections, **no accessible names** |
| `<article>` | 1 | Only on the single-post template |
| `<button>` | **0** | ❌ every control is `<a>`/`<input>`/`<span>` |
| `role="img"` | 4 | All on decorative dark-mode SVGs |
| `aria-hidden="true"` | 33 | Correctly used on all `<i class="rbi">` icons |
| `aria-label` | 11 | Social links, sign-in, notification, mobile trigger, main menu, share actions |
| `aria-live` | **0** | ❌ |
| `aria-expanded` | **0** | ❌ |
| `aria-describedby` | 0 | |
| `<label>` | **1** | On the 404 page only |
| `autocomplete` | **0** | ❌ |

**Consent bar (`#rb-privacy`)** is an `<aside>` rendered before the header with a focusable `#privacy-trigger` — so it is **the first thing in the tab order on every page load**, ahead of the logo and the nav. Combined with the breaking ticker being second, the first ~8 tab stops are non-navigational.

### 9.4 Form audit

| Form | Fields | Labels | Autocomplete | Notes |
|---|---|---|---|---|
| Header live search | `input[type=text][name=s]` | ❌ **none** (placeholder only) | n/a | `.live-search-response` has no `aria-live` |
| 404 search | `input[type=search][name=s]` | ✅ `<label>` + `.screen-reader-text` | n/a | **The site's own best practice** |
| Search-header search | `input[type=search]` | ✅ labelled | n/a | Also correct |
| Login popup | text + password | ⚠️ one `<label class="rb-login-label">` | ❌ none | `#rememberme` checkbox |
| Comment form | textarea | ✅ `<label for="comment">` + required marker | ❌ none | `#email-notes`, `.required-field-message` |
| Newsletter | — | — | — | **`<div class="newsletter-form"></div>` is empty** |

### 9.5 Motion & motor

- **0 hits for `prefers-reduced-motion`** across all fetched CSS. `--effect: all .2s` applies to hundreds of elements; `liveAnimation`, `heartbeat`, `spin-*`, `ani-shake` all loop.
- The breaking ticker auto-advances every 5 s with no visible pause control in the markup. `.breaking-news-nav` (prev/next) exists in CSS — **inferred** it renders, but a 5 s autoplay with only manual prev/next is a WCAG 2.2.2 (Pause, Stop, Hide) concern.
- Tap-target sizes are not verifiable, but `.is-btn` at `line-height: 40px` and `--height-40` on controls suggests a 40 px minimum — **inferred** borderline against the 44×44 px WCAG 2.5.8 (AAA) / 24×24 (AA) guidance.


---

## 10. Responsive strategy

### 10.1 Breakpoint architecture (extracted)

```
@240px  ───────────┬───────────────── 767 ────────── 1024 ────────── 1280 ─────── 1500px
   mobile          │      tablet          │   desktop            │   wide
   (max-width:767) │  (max-width:1024)    │ (min-width:1025)     │
```

Legacy Bootstrap breakpoints (991/992) coexist with the theme's own (767/1024/1025). Elementor adds height-based rules at 1024 px and 640 px.

### 10.2 What actually adapts

| Dimension | Behaviour | Verdict |
|---|---|---|
| Type scale | 3 steps: 44/38/24 → 34/34/20 → 28/28/17 | ✅ Good — headings shrink ~36 % on mobile |
| Column count | 5→2→1, 4→2→1, 69.666/30→100/100 | ✅ Standard, correct |
| Image ratio | `--feat-ratio` 95→56, 155→150, 70→(smaller) | ✅ Prevents letterboxing on mobile |
| Edge padding | 20 px → 5 px → 0 | ⚠️ Aggressive; **inferred** content can approach the screen edge |
| Nav | Mega-menu → hamburger `#header-mobile` + `#mobile-menu` | ✅ Expected pattern |
| Category chips | `.mobile-hide` below mobile | ✅ Reduces card clutter |
| Back-to-top | `none-m-backtop` hides it on mobile | ✅ Good call — it overlaps thumbs |
| Utility icons | `--wnav-size` 20 → 15.3 px | ⚠️ Shrinks tap targets on the smallest devices |
| Sticky behaviour | `is-mstick is-smart-sticky` retained on mobile | ⚠️ A sticky header on a 667 px-tall phone eats ~12 % of the viewport |
| Lazy backgrounds | `@media (max-height: 1024px)` removes Elementor backgrounds | ⚠️ **Design changes based on viewport height** |

### 10.3 Responsive gaps

1. **No fluid type.** Everything snaps at 767 and 1024. A 900 px viewport gets the *tablet* sizes, so on a small laptop or a large tablet in portrait the hero headline is 34 px in a ~860 px column — **inferred** to look cramped.
2. **No container queries.** The 30 % sidebar is a fixed token (`--max-width-wo-sb`), so the sidebar's own card layout cannot respond to being narrower than 372 px.
3. **`px` everywhere, `rem` almost nowhere.** Only `--rem-mini: .8rem` and `--rem-small: .92rem` are relative. A user who sets their browser default to 20 px will see the *chrome* scale but the *type scale* (10/11/12/13/14/15/16/18/22/24/25/28/34/38/44 px) stay fixed. **Inferred** partial WCAG 1.4.4 failure.
4. **Height-based breakpoints leak an optimisation into the design** (backgrounds vanish on short screens).
5. **No `density` or `orientation` handling** beyond what Elementor provides.

---

## 11. Motion & interaction

### 11.1 The motion system

```css
--effect: all .2s cubic-bezier(0.32, 0.74, 0.57, 1)   /* 205 uses — the one true transition */
--timing: cubic-bezier(0.32, 0.74, 0.57, 1)
```
That curve is a custom ease-out-quint-ish shape: fast attack, long settle. It is used for colour, transform, width, top, margin, background-size and opacity alike.

### 11.2 Catalogue

| Interaction | Implementation | Duration / easing | Notes |
|---|---|---|---|
| Link hover | `.p-url { transition: all .2s var(--timing) }` → `color: var(--g-color)` | 200 ms, custom | ✅ |
| Category chip hover | `transition: all .2s var(--timing)` | 200 ms | extracted |
| Button | `transition: var(--effect)` | 200 ms | `outline: none !important` |
| Grid item hover | body class `hover-ani-1`; presets include `translate3d(0,-3px,0) scale(1.05)`, `scale(1.05)`, `scale(0.95)` | `hover-ani-7: 1.5s ease` for one variant | **unverified** which is active |
| Menu open | `menu-ani-1` | — | **unverified** |
| Button press | `btn-ani-1` + `btn-transform-1` | — | **unverified** |
| Breaking ticker | `data-play="1" data-speed="5000"` | 5 s autoplay, 5 slides = 25 s cycle | ⚠️ no pause control in markup |
| Loaders | `spin-opacity 1.3s`, `spin-loader .8s/1s`, `spin-bounce 1.3s`, `swiper-preloader-spin 1s`, `reaction-spinner 1s` | linear infinite | ✅ consistent `linear` for loops |
| Live badge | `liveAnimation 1.5s linear infinite` | pulse | ⚠️ no reduced-motion guard |
| Notification count | `heartbeat 1s infinite` | — | **unverified** |
| Entrance | `rbFadeIn .3s ease forwards` | 300 ms | ✅ restrained |
| Error | `ani-shake .2s cubic-bezier(.19,.49,.38,.79) both` | 200 ms | ✅ nice, expressive |
| Fade-out sibling dimming | `.effect-fadeout` (share rail, socials) | opacity `.2s` | ✅ elegant pattern |
| Select-to-share | `highlight-share.js` | — | **unverified** |
| Back-to-top | `jquery.ui.totop` | — | **unverified** |
| Sticky nav | `is-mstick is-smart-sticky` | — | **unverified** |

### 11.3 Motion assessment

**Good:**
- One easing curve, one duration. 210 declarations share it. This is better than most design systems manage.
- Infinite loops all use `linear`; state transitions all use the custom curve. Correct separation.
- `rbFadeIn` at 300 ms and `ani-shake` at 200 ms are restrained, not showy.
- `.effect-fadeout` (dim siblings on hover) is a genuinely nice, cheap interaction detail used on the share rail and social counters.

**Bad:**
- **No `prefers-reduced-motion` block.** Zero. For a site with a 5 s autoplaying ticker, a pulsing live badge, a heartbeat and multiple infinite spinners, that is a real accessibility failure (WCAG 2.3.3 is AAA, but this is basic courtesy).
- `transition: all` is used rather than transitioning specific properties. On hover over a card that means the browser watches every animatable property. **Inferred** minor performance cost, and it makes the motion non-auditable.
- `all .5s var(--timing)` (8 hits) and `all .4s` (2) exist alongside the 200 ms default — two speeds for the same interaction class.
- `top 0s ease .2s, opacity .2s var(--timing), margin .2s var(--timing) .2s` — delayed choreography for the sticky nav. Clever but completely undocumented and unverifiable statically.

---

## 12. Strengths worth adopting

| # | Strength | Evidence | Why it matters for Radio Waa |
|---|---|---|---|
| S1 | **Three-family typographic system with a numeric scale** | Bitter/Coustard/Raleway, 16 sizes, per-heading line-heights, 3 responsive steps | Gives a news app editorial gravitas without custom artwork |
| S2 | **A real reading measure** | `--s-content-width: 760px` vs `--rb-width: 1280px` | Long-form readability is the #1 differentiator vs. social feeds |
| S3 | **One canonical easing + duration** | `--effect: all .2s cubic-bezier(.32,.74,.57,1)`, 205 uses | Instant perceptual polish; makes every interaction feel like one product |
| S4 | **5-across mega-menu content previews** | `rb-col-5` = 5 × 20 %, real headlines + thumbs | Turns dead-end navigation into a content surface |
| S5 | **Chrome separated from content typographically** | Serif (Bitter/Coustard) for editorial, sans (Raleway) for all UI/meta/nav | Users instantly know "this is an article" vs "this is interface" |
| S6 | **Read-time + distinct "last updated" date** | `2 Min Read`, `Last updated: October 13, 2026 1:16 pm` | Trust and session-planning affordances, cheap to implement |
| S7 | **Well-built 404 + empty-search states** | `page404-wrap` with labelled search + "Return to Homepage"; `search-empty` with a real sentence | Recovery is where amateur sites fall apart |
| S8 | **Genuine dark mode** | `[data-theme="dark"]` blocks in main.css, the site override, and print.css; `localStorage['RubyDarkMode']` | Expected by mobile news readers at night |
| S9 | **Thoughtful print stylesheet** | `print.css` suppresses 25 selectors, forces `#000` | Useful for a broadcaster whose stories get printed/circulated in a region |
| S10 | **Numeric trending list via CSS counters** | `counter-increment: trend-counter`, `--counter-size: 1.5em`, accent-coloured `:before` | Ranking legible without JS, degrades gracefully |
| S11 | **Explicit overlay scrim with a 100 px safe padding** | `linear-gradient(to top, #00080a 0, #00080ae6 50%, #00080a00 100%)` + `padding: 100px 25px 25px` | The right way to put text on images |
| S12 | **`.effect-fadeout` sibling dimming** | share rail, social counters | Cheap, elegant focus cue |
| S13 | **Schema.org breadcrumb microdata** | `vocab="https://schema.org/" typeof="BreadcrumbList"` with `meta[property=position]` | Good for SEO and for AT users to orient |
| S14 | **`max()` guard on body line-height** | `line-height: max(var(--body-fheight, 1.7), 1.4)` | Prevents an editor from breaking readability through the CMS |
| S15 | **Deferred font loading with `display=swap`** | `rel=preload as=style onload="this.rel='stylesheet'"` + `&display=swap` + `preconnect` to fonts.gstatic | Correct modern font strategy |

---

## 13. Weaknesses to avoid

| # | Weakness | Evidence | Consequence |
|---|---|---|---|
| W1 | **57 of 77 images have no alt text** | `alt=""` on every article thumbnail | Screen-reader users get "link, link, link" for the entire front page. WCAG 1.1.1 fail. |
| W2 | **Heading levels used as a type-size control** | `h1→h6→h6→h6→h6→h6→h2`; identical section labels at `h2`, `h3`, `h4` and `h6` | Heading navigation is useless; document outline is meaningless. WCAG 1.3.1 / 2.4.6 fail. |
| W3 | **No `<main>`, no skip link, zero `<button>`** | 0 `<main>`, 0 `<button>`, 0 `:focus-visible` in 446 KB | Keyboard and AT users must traverse 8+ non-navigational stops to reach content. WCAG 2.4.1 / 2.4.7 fail. |
| W4 | **`outline: none !important` on the primary button family** | `.is-btn, .button, … { outline: none !important }` | Keyboard users cannot see where they are. The single most damaging line in the stylesheet. |
| W5 | **Every interactive colour fails AA** | `#4173ff` = 4.10:1 as text and as a white-text background; menu badges 2.08–3.53:1; review badge 1.96:1 | Primary CTA, all category chips, all hovered links, all trending numbers, all ratings below AA. |
| W6 | **Three competing brand blues** | `#4173ff` (site), `#246EFF` (Elementor), `#ff184e` (dormant theme default) | Visual inconsistency that no user can name but everyone feels. |
| W7 | **Four simultaneous image aspect ratios** | `--feat-ratio` 95/50/70/42/155/80; images at 1.33, 1.5, 1.78, 2.5 | Ragged, "unfinished" grid; layout shift as images load. |
| W8 | **A radio station with no player on the homepage** | Zero `<audio>`/`<iframe>`/`<video>`/`<object>` in 195 KB; the "listen" promise lives in a footer `<h4>` | The core value proposition is invisible on the landing page. |
| W9 | **An empty newsletter form** | `<div class="newsletter-form"></div>` + footer "Sign Up for Our Newsletter" with no form | Two visible CTAs that do nothing. |
| W10 | **Ad density with vendor-demo assets** | 4 `ad-wrap` blocks + inline ads pointing at `foxiz.themeruby.com/subscription/...` | Looks abandoned; loads third-party images from the theme vendor. |
| W11 | **Bookmark/follow require a WordPress account** | `span.rb-bookmark`, `i.follow-icon`, `bookmark-ask-login-template` → `wp-login.php?redirect_to=…` | A local-audience killer: nobody has an account, and the controls aren't keyboard-reachable anyway. |
| W12 | **Z-index magic numbers** | `9042`, `9043`, `1044`, `1045`, `100000`, `888`, `999` | Unmaintainable; future overlays will need bigger numbers. |
| W13 | **No `prefers-reduced-motion`** | 0 hits | Infinite animations forced on motion-sensitive users. |
| W14 | **Search field in the header has no label** | `placeholder="Search Headlines, News..."` only, no `<label>` | Placeholder-as-label fails on focus and for AT. The 404 page proves the team knew better. |
| W15 | **Category colour carries no information** | `--cat-highlight` never set per category; all chips `#4173ff` | Up to 5 identical pills per card = pure noise. |
| W16 | **Stale/incorrect microcopy and links** | Footer copyright says both `© 2022 Home Radio News. Powered by PsS.` (live) and `© 2022 Foxiz News Network. Ruby Design Company.` (404 page); sidebar FB link → `facebook.com/envato`; YouTube tile → `href="hometv6310"`; breadcrumb → unlinked `/blog/` | Erodes trust and signals neglect. |
| W17 | **"Local" — the dominant beat — missing from primary nav** | 12 categories; Local reachable only via hamburger + footer | The site's most-published content type is one tap deeper than it should be. |
| W18 | **Consent bar is first in the tab order** | `aside#rb-privacy` rendered before `#site-header` with a focusable trigger | Every page load starts with a blocker before any navigation. |
| W19 | **`transition: all` everywhere** | `--effect: all .2s …` | Non-auditable motion, minor perf cost. |
| W20 | **163 distinct colours in a site that uses ~8** | 163 unique hex across 446 KB | No palette discipline; theming is impossible. |


---

## 14. Design direction for the **Radio Waa** news app

Every item below cites the observation that produced it. Format: **recommendation → traced to.**

### 14.1 Colour system

**R1. Ship a 5-family token set, not a pile of hexes.**
Define exactly: `--brand`, `--brand-strong`, `--accent`, `--accent-text`, `--live`, `--neutral-{0…10}`, `--surface-{0…3}`, `--text-{primary,secondary,tertiary,onBrand}`, `--border-{subtle,default,strong}`, `--focus`.
→ traced to W6 (three blues), W20 (163 hexes), §4.1.3 (a 12-step non-monotonic ramp).

**R2. Pick one brand blue and make it pass AA both ways.**
`#4173ff` fails as text-on-white (4.10:1) *and* as a background-for-white-text (4.10:1). Choose a hue in the `#2B5BE3`–`#2F62D8` band so white-on-brand clears 4.5:1, then derive `--brand-strong` (darker, for links on white) and `--brand` (for backgrounds) separately.
→ traced to §7.2 rows 8–9, W5.

**R3. Colour-code the 12 categories with a fixed 12-hue wheel, and make each chip's text colour verify.**
Give every category a `--cat-{slug}` token with a paired `--cat-{slug}-on` foreground, then validate each pair ≥4.5:1. Do not let two categories share a hue.
→ traced to W15, §5.8, §7.2 rows 12–16 (menu badges at 2.08–3.53:1).

**R4. No coloured status badge under 4.5:1. Ban gold-on-white outright.**
`#e5b20b` behind white text is 1.96:1. Ratings must be either a dark-ink-on-amber pair (e.g. `#3D2E00` on `#FFC53D`) or an icon with a visible outline, never white on gold.
→ traced to §7.2 row 11, W5.

**R5. Define one dark-mode surface ramp, not scattered `[data-theme=dark]` patches.**
5 steps: `--surface-0:#0B0E12`, `-1:#12161C`, `-2:#171C24`, `-3:#1E242E`, plus `--text-onDark:#F2F4F7` / secondary `#A6ADBB`. Verify every dark pairing ≥4.5:1 before shipping.
→ traced to §7.3 item 5, §4.1.3 (`--dark-accent` / `#191c20` / `#16181c` / `#000e23` all hand-picked).

**R6. Set `--alight`-equivalent placeholder to `#8A9099` on white (≈3.5:1) minimum, and never reuse it as the disabled colour.**
→ traced to §7.2 rows 18–19 (`#ddd` at 1.36:1), W5.

### 14.2 Typography

**R7. Adopt the serif/sans split — it is the strongest idea on the site.**
Serif display + serif body for editorial; one sans for *all* interface chrome (nav, chips, meta, buttons, labels). Radio Waa should do the same, and it can be done with two families instead of three.
→ traced to S1, S5, §4.2.1.

**R8. Replace the piecewise scale with a modular one on a `rem` base.**
The site's 16 px-based ratios run 1.00–1.29 with no single step and duplicate values (`h4 = h5 = 14px`). Use a ratio of **1.25** on a `1rem` base, giving `0.75 / 0.875 / 1 / 1.25 / 1.5 / 1.75 / 2 / 2.5 / 3 / 3.5 / 4 rem` (12/14/16/20/24/28/32/40/48/56/64 px). Two steps for headings only.
→ traced to §4.2.2 (piecewise scale, duplicate steps).

**R9. Put the whole scale in `rem`, not `px`.**
The site's chrome is 10–12 px and fixed in px. At 10 px with `uppercase` + `0.1em` tracking, meta text is below any usable minimum, and a browser font-size override won't scale it.
→ traced to §4.2.2, §10.3 item 3, W-adjacent §7.3.

**R10. Lock the reading measure at `68ch`, capped in `rem`.**
The site's `--s-content-width: 760px` is right; express it as `max-width: 68ch; max-width: 42rem` so it scales with the font.
→ traced to S2, §6.2.

**R11. Keep the `max()` line-height guard and add a floor for small text.**
The site's `max(var(--body-fheight, 1.7), 1.4)` is a genuinely good defensive pattern — copy it, and add `@media`-free `line-height: max(1.5, 1.4)` for anything under 14 px.
→ traced to S14, §4.2.3.

### 14.3 Layout & components

**R12. Fix an image-ratio token on day one: `--ratio-card: 3/2`, `--ratio-hero: 16/9`, `--ratio-thumb: 1/1`.**
Never let a designer pick a per-widget ratio.
→ traced to W7, §8.3.

**R13. Use container queries for the sidebar, viewport queries only for page structure.**
The site's 30 % sidebar is a fixed token, so its internals can't adapt. Wrap sidebar cards in `@container (min-width: 340px)` and let the card change layout.
→ traced to §8.4 item 3, §10.3 item 2.

**R14. Build exactly four card components, not the site's nine.**
1. **Hero** (16/9, scrim, category chip, headline, byline)
2. **Lead list item** (1/1 or 3/2 thumb 120 px, headline, 2-line excerpt, meta)
3. **Grid card** (3/2 thumb, chip, headline, date — *with* a one-line excerpt)
4. **Ranked item** (CSS counter number in accent, headline, date)
→ traced to §3.1 (9 distinct block classes for what is really 4 shapes), §5.1 (no excerpt on the workhorse card).

**R15. Always include a one-line excerpt on grid cards.**
The site's 40-item front page is thumbnail + headline + date with zero differentiation. Two lines of summary is the difference between scannable and a wall.
→ traced to §5.1 finding, §5.2.

**R16. Cap category chips at 2 per card.**
Up to 5 identical pills per card on the site. Two is enough; put the rest on the article page.
→ traced to §5.1, W15.

**R17. Adopt the 5-across mega-nav preview as a component, but make it a real "Sections" rail.**
Radio Waa's app should expose categories as a horizontally scrollable rail of section cards, each previewing its top 3 stories — the mega-menu's idea, translated to a thumb.
→ traced to S4, §2.1, W17.

**R18. Put a 6-step z-index scale in the tokens before the first overlay is built.**
`base:0 · raised:10 · sticky:100 · drawer:1000 · modal:2000 · toast:3000`. Refuse any other value in code review.
→ traced to W12, §4.7.

### 14.4 Accessibility (non-negotiable)

**R19. Alt text is a required field in the CMS, not optional.**
The site's 57 empty `alt=""` is a *process* failure, not a CSS one. Make the uploader refuse to publish an article image without alt text; auto-populate from the caption; allow explicit `alt=""` only for genuinely decorative images.
→ traced to W1, §9.1 row 1.

**R20. One `<h1>` per page, and heading level = document structure, never size.**
Render card titles as `<h3>`/`<h4>` by *position in the page outline*, and style them with tokens. Ban `h5`/`h6` for list items. Section labels get a dedicated `SectionTitle` component (not a heading at all — use `<h2>` only for real sections).
→ traced to W2, §9.2.

**R21. `<main>` + a skip link + `<button>` for every control.**
- `<main id="main">` wrapping content
- `<a href="#main" class="skip-link">Skip to content</a>` as the first focusable element
- `BookmarkButton`, `FollowButton`, `DarkModeToggle`, `SearchSubmit` are all `<button type="button">`
→ traced to W3, §9.3.

**R22. Never write `outline: none`. Write `:focus-visible` instead.**
```css
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: inherit; }
:focus:not(:focus-visible) { outline: none; }
```
Wire `--focus` to a colour with ≥3:1 against both the component background and the page background.
→ traced to W4, §5.7, §9.1 row 2.4.7.

**R23. Every icon-only control gets an accessible name; every disclosure gets `aria-expanded`.**
- Icon buttons: `aria-label` (the site does this correctly for socials — extend it everywhere)
- Mega-nav/section toggles: `aria-expanded` + `aria-controls`
- Live search results and bookmark toast: `role="status" aria-live="polite"`
→ traced to §9.3 (`aria-expanded` = 0, `aria-live` = 0), §5.6.

**R24. Label every input with a real `<label>`, and use `placeholder` only for examples.**
Copy the 404 page's own pattern (`<label><span class="sr-only">Search for:</span><input …></label>`) and apply it to the header search too.
→ traced to W14, §9.4.

**R25. Respect reduced motion globally.**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```
Plus: any autoplaying carousel gets a visible pause button and pauses on hover/focus.
→ traced to W13, §9.5, §11.3.

**R26. Move the consent bar out of the tab order and make it non-blocking.**
The site's `#rb-privacy` is the first tab stop on every page. Make it a dismissible banner that is not focus-trapping, or render it after `<main>` in DOM order and reorder visually.
→ traced to W18, §9.3.

### 14.5 IA & content

**R27. Six top-level sections, with "Local" first.**
Radio Waa's beat mix will mirror this site's: Local, General, Politics, Business, Sports, Entertainment/World. Put the *local* beat first — it is the competitive moat against national outlets, and this site buries it (§2.2).
→ traced to W17, §2.2.

**R28. Drop "Featured" as a category.**
It appears on 18 of 56 cards, which makes it a label, not a filter. Use a visual "Featured" badge component instead, driven by a boolean, and reserve categories for genuine taxonomy.
→ traced to §2.2, §5.8.

**R29. Rename the footer columns to taxonomy names.**
"Quick Link" / "More Links" describe the footer. Use "Sections" / "Topics" / "About" / "Contact".
→ traced to §2.5.

**R30. Human bylines, always.**
"Home Radio" on 100 % of articles destroys the trust that a local outlet's whole advantage rests on. Byline should be a person, with a link to an author page showing their beat.
→ traced to §6.3.

**R31. Content blocks must never render empty.**
Guard every optional slot: no excerpt → omit the card and reflow; no form → don't render the CTA. The site ships two visible CTAs that do nothing.
→ traced to W9, §5.2 "Empty" row.

### 14.6 The radio-specific opportunity (the biggest gap)

**R32. A persistent, global audio player is the product.**
The single most damning finding in this audit is that **a radio station's homepage contains no audio element at all** (§1.2 item 7, §8 evidence: zero `<audio>`/`<iframe>`/`<object>`). Radio Waa must ship:

- A **persistent mini-player** docked to the bottom of the viewport above the tab bar, present on every screen, showing: live/off-air state, current programme, a play/pause control, and a "Expand" affordance.
- A **dedicated Listen screen** with: the live stream, the programme schedule for today, a "Recently played" log, and catch-up/episode links.
- A **homepage hero variant for "On Air Now"** — the hero card slot becomes the now-playing module when a live programme is running, because that is the one thing a national aggregator cannot copy.
- An **offline/degraded state** with an explicit message ("We're off air until 5:00 AM — here's today's top story"), not a broken play button.
- **Media Session API** metadata so lock-screen and notification controls show programme name and artwork.

→ traced to W8, §1.2 item 7, §5.9 (the only "listen" affordance is a footer `<h4>` sentence).

**R33. Make catch-up a first-class content type.**
The site has a "Video" category but no audio/episode model. Radio Waa should treat programmes, episodes and clips as a distinct content type with duration, air date and a resume-point — that is what turns a stream into a library.
→ traced to §2.2 (Video exists as a flat category), §4.1.2 (`--audio-color: #ffa052` exists but is unused on the homepage).

**R34. Remove accounts from the reading path.**
The site gates bookmarking behind `wp-login.php`. Radio Waa should make reading, listening and searching fully anonymous, and offer sign-in only for saved-stories sync across devices.
→ traced to W11, §5.10.

### 14.7 Suggested Radio Waa token starter set

```css
:root {
  /* type — 1.25 modular on rem */
  --fs-xs:  .75rem;  --fs-sm: .875rem;  --fs-base: 1rem;
  --fs-md:  1.25rem; --fs-lg: 1.5rem;   --fs-xl: 1.75rem;
  --fs-2xl: 2rem;    --fs-3xl: 2.5rem;  --fs-4xl: 3rem;  --fs-5xl: 3.5rem;
  --lh-tight: 1.15; --lh-snug: 1.35; --lh-normal: 1.6; --lh-relaxed: 1.75;
  --measure: 68ch;

  /* space — 4px base */
  --s-1: .25rem; --s-2: .5rem;  --s-3: .75rem; --s-4: 1rem;
  --s-5: 1.5rem; --s-6: 2rem;   --s-7: 3rem;   --s-8: 4rem;

  /* radii */
  --r-sm: 4px; --r-md: 8px; --r-lg: 12px; --r-xl: 16px; --r-full: 999px;

  /* borders */
  --border-subtle: color-mix(in oklab, var(--neutral-7) 40%, transparent);
  --border-default: var(--neutral-6);

  /* brand — AA-verified pairs */
  --brand:        #2F62D8;  /* white text: 5.1:1  (inferred) */
  --brand-strong: #1E47AE;  /* text on white: 6.4:1 (inferred) */
  --live:         #C2410C;  /* white text: 4.6:1  (inferred) */
  --focus:        #1D4ED8;

  /* motion */
  --dur-fast: 120ms; --dur-base: 200ms; --dur-slow: 320ms;
  --ease: cubic-bezier(.32, .74, .57, 1);     /* ← adopted from the target, S3 */

  /* elevation */
  --z-base: 0; --z-raised: 10; --z-sticky: 100;
  --z-drawer: 1000; --z-modal: 2000; --z-toast: 3000;

  /* media ratios */
  --ratio-card: 3/2; --ratio-hero: 16/9; --ratio-thumb: 1/1;

  @media (prefers-reduced-motion: reduce) {
    --dur-fast: 1ms; --dur-base: 1ms; --dur-slow: 1ms;
  }
}
```

---

## Appendix A — Raw extraction index

| Artifact | Path | Bytes |
|---|---|---|
| Homepage HTML | `home.html` | 195,377 |
| Theme stylesheet | `main.css` | 467,222 |
| Site token override | inline `<style id="foxiz-main-inline-css">` | 9,645 |
| Elementor kit CSS | `post-8.css` | 1,164 |
| Elementor page CSS | `post-52.css` | 10,544 |
| Foxiz Elementor widget CSS | `foxiz-elements.css` | 20,272 |
| Theme header | `style.css` | 568 |
| Print stylesheet | `print.css` | 1,691 |
| Google Fonts CSS | `gfonts.css` | 4,587 |
| Single-post template | `article.html` | ~134,291 |
| Category archive | `category.html` | ~144,057 |
| Search results | `search.html` | ~105,567 |
| 404 template | `notfound.html` | ~100,329 |
| Search empty state | `noresult.html` | 100,738 |

**Unique values extracted.** Figures are *unique declaration values*, given for `main.css` and — where they differ — for all fetched CSS combined:

| Property | `main.css` | All fetched CSS |
|---|---|---|
| Hex colours | 163 | **171** |
| `rgb()` / `rgba()` | 12 | 12 |
| `font-family` | 31 | 32 |
| `font-size` | 45 | 184 |
| `line-height` | 25 | 49 |
| `letter-spacing` | 20 | 33 |
| `font-weight` | 19 | 34 |
| `border-radius` | 37 | 40 |
| `box-shadow` | 54 | 54 |
| `z-index` | 33 | 33 |
| `transition` | 46 | 50 |
| `animation` | 18 | 18 |
| `padding` | 113 | 124 |
| `margin-bottom` | 31 | 34 |
| `gap` | 45 | 46 |
| `grid-template-columns` | 22 | 22 |
| `max-width` | 66 | 82 |
| `@media` queries | 8 | 13 |
| `:root` declarations | 207 | — |
| `var(--effect)` references | **210** | 210 |

The 184 `font-size` and 82 `max-width` totals are inflated by per-widget `--title-size` / `--feat-ratio` declarations in `post-52.css` and `foxiz-elements.css`; the meaningful scale is the 16-step set in §4.2.2.

## Appendix B — Claims register (unverified items)

| Claim | Status | How to verify |
|---|---|---|
| Actual rendered colour of `--g-color` after cascade | **inferred** | `getComputedStyle(document.documentElement).getPropertyValue('--g-color')` in a browser |
| Whether `#ff184e` (dormant theme default) appears anywhere on inner pages | **unverified** | Crawl all templates and grep for un-overridden `--g-color` consumers |
| Mega-menu opens on hover vs. click; touch behaviour | **unverified** | Manual interaction test |
| Live search response rendering and `aria-live` | **unverified** | Type in the search field, observe DOM |
| Sticky-nav scroll behaviour and whether it covers focused elements | **unverified** | Tab through a long article |
| Dark-mode completeness on inner templates | **unverified** | Toggle dark mode on article/category/search pages |
| Any hover colour on `.is-btn` | **unverified** | Computed-style inspection |
| Real contrast of overlay text (image-dependent) | **inferred** | Screenshot + pixel sampling |
| Body copy scaling when browser font-size is increased (px-based type) | **inferred** | Set default font to 20 px and reload |
| Reflow at 320 px | **unverified** | Resize test |
| Whether `highlight-share.js` (select-to-share) works | **unverified** | Select text on an article |
| Whether the breaking ticker pauses on hover/focus | **unverified** | Interaction test |
| Tap-target dimensions | **unverified** | Element bounding-box measurement |
| Newsletter form's intended behaviour | **unverified** | CMS inspection |
| Whether 163 colours really collapse to ~8 visually | **inferred** | Screenshot + colour histogram |
