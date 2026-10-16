# Payload CMS 3.91 schema — radio-waa (wave 1, `cms-wave1`)

Scope: schema only. Nine files, all under `src/payload.config.ts`,
`src/collections/*`, `src/globals/*`. No app, env, or script files touched.

## Files written

| File | Contents |
|---|---|
| `src/payload.config.ts` | default export via `buildConfig` + `postgresAdapter` |
| `src/collections/Users.ts` | auth collection + shared role predicates (`isAdmin`, `isAdminOrEditor`) |
| `src/collections/Media.ts` | upload collection |
| `src/collections/Categories.ts` | |
| `src/collections/Authors.ts` | |
| `src/collections/Articles.ts` | + the four `ArticleBlock` blocks |
| `src/collections/Shows.ts` | |
| `src/collections/PodcastEpisodes.ts` | |
| `src/globals/SiteSettings.ts` | nav.ts/constants.ts mirror |

Positions were previously empty; nothing left behind to overwrite.

## Stable text ids

Every collection carries a `legacyId` text field: `unique: true, index: true`,
sidebar position, admin description "Stable pre-CMS fixture id … set by the seed".
Payload's numeric `id` stays the primary key (per instructions, not fought);
`legacyId` carries `art-water-emergency`, `show-good-morning-wa`, `ep-wa-files-12`,
`cat-*`, `author-*`, etc. It is **optional** (unique index tolerates NULLs in
Postgres) so editors can create new documents from the admin panel without
inventing a fixture id; the seed always provides one. Users and Media have the
field too, for consistency with "every collection", even though no fixtures
target them.

## Fields per collection

### Users (`users`, auth: email/password)
- `name` text required
- `roles` select **hasMany**, options `admin`/`editor`, `defaultValue: ["editor"]`, required
- `legacyId` (see above)

### Media (`media`)
- `upload`: `staticDir: "public/media"`, `mimeTypes: ["image/*"]`,
  `imageSizes` thumbnail/400, card/640, hero/1280, `adminThumbnail: "thumbnail"`,
  `crop: false`, `focalPoint: false` (explicitly off, both default-enabled when
  omitted — this drops the focalX/focalY columns).
- `alt` text required (a11y), `credit` text, `legacyId`.
- Sharp is left on its default auto-load; nothing is disabled.

### Categories (`categories`)
- `slug` text required unique index (URL contract for `/category/[slug]`)
- `name` text required, `description` textarea required
- `icon` text required — stem of `public/assets/icons/icon-<icon>.svg`
- `accentToken` select required, options `brand|accent|ink|muted`
- `legacyId`
- `articleCount` **omitted on purpose** — derived from the articles table
  (`/api/articles?where[category][equals]…`), never stored.

### Authors (`authors`)
- `slug` unique index, `name`, `role`
- `avatarUrl` text optional (served path; `/assets/images/avatar-*.svg` or `/media/<file>`)
- `bio` textarea required, `location` text required
- `specialisms` text hasMany required
- `social` array of `{ label required, href required }`
- `legacyId`

### Articles (`articles`)
- `slug` unique index, `title` text required, `excerpt` textarea required
- `category` relationship → `categories`, required, indexed
- `author` relationship → `authors`, required, indexed
- `publishedAt` date required, indexed
- `readingMinutes` number required, min 1
- `image` group required `{ src required, alt required, credit }` — mirrors
  `ImageAsset` 1:1
- `tags` text hasMany required
- `featured`, `breaking` checkboxes (optional in the domain type)
- `body` blocks required, minRows 1 — the four blocks below
- `legacyId`
- `updatedAt`: **not declared** as a field. Payload's automatic `updatedAt`
  timestamp is the same name and ISO date type; `timestamps: false` would have
  been needed for a manual field, which would lose automatic maintenance.

### Article body blocks (mirror of `ArticleBlock`, no converter)
| block slug | fields |
|---|---|
| `paragraph` | `text` textarea required |
| `heading` | `level` **number** required validated to exactly `2 \| 3`; `text` text required |
| `quote` | `text` textarea required; `attribution` text optional |
| `list` | `ordered` checkbox; `items` text hasMany required |

`level` is a number, not a select: Payload select values are strings only, so a
select would store `"2"`/`"3"` and force `Number()` at render. The number field
+ validator yields the literal `2 | 3` union. (The one Payload-inherent rename
everywhere is the discriminator: Payload stores `blockType`, the app union calls
it `type`.)

### Shows (`shows`)
- `slug` unique index, `name`, `tagline`, `description` textarea — all required
- `hosts` relationship → `authors`, hasMany, required, minRows 1
- `schedule` array required, minRows 1, of:
  - `day` select required (`monday…sunday`)
  - `start` text required, validated to 24h `HH:MM` `00:00–23:59`
  - `end` text required, same plus `24:00` (overnight shows in the fixtures end at 24:00)
- `image` group required (same as Articles)
- `category` relationship → `categories`, optional (domain `category?`)
- `legacyId`

### PodcastEpisodes (`podcast-episodes`)
- `slug` unique index, `title`, `description` textarea required
- `show` relationship → `shows`, required, indexed — this is the home of the
  domain `showId`; the seed resolves `show-the-long-listen` → shows document
- `season`, `episodeNumber` numbers required min 1
- `publishedAt` date required indexed, `durationSeconds` number required min 1
- `image` group required, `tags` text hasMany required
- `legacyId`

### SiteSettings (`site-settings` global)
Mirrors `src/data/nav.ts` + `constants.ts` exactly:
- `siteName` text required, `siteDescription` textarea required
- `primaryNav` array `{ label, href, external? }`
- `footerColumns` array `{ heading, links: [{ label, href, external? }] }`
- `socialLinks` array `{ label, href }`
- `breakingTicker` text hasMany required — `nav.ts` keeps ticker lines as plain
  strings, so `text[]` round-trips without a `.map(x => x.text)` step.

## Access control (implementation)

All enforcement is real `read`/`create`/`update`/`delete` functions; `admin.hidden`
is only an extra UI nicety, never the mechanism.

Role predicates are defined once in `src/collections/Users.ts`:

```ts
type RoleUser = (User & { roles?: null | string[] }) | null | undefined;
export const isAdmin = ({ req }) => hasRole(req.user, "admin");
export const isAdminOrEditor = ({ req }) => hasRole(req.user, "admin") || hasRole(req.user, "editor");
```

They accept the narrow `{ req: { user } }` shape so the same function typechecks
in both `Access` slots and the Users `access.admin` slot. Payload's JWT strategy
re-fetches the full user with `overrideAccess: true`, so `roles` is present on
`req.user` without `saveToJWT`.

| Collection | read | create | update | delete |
|---|---|---|---|---|
| Articles, Shows, PodcastEpisodes, Media, Categories, Authors | `() => true` (public site) | `isAdminOrEditor` | `isAdminOrEditor` | `isAdmin` |
| Users | `isAdmin` | `isAdmin` | `isAdmin` | `isAdmin` |
| SiteSettings (global) | `() => true` (public site) | — | `isAdmin` | — |

- Users also sets `access.admin: isAdminOrEditor` so both roles can log in; the
  first-user endpoint bypasses create access (`overrideAccess: true` upstream),
  so initial setup is not locked out.
- Editors cannot delete **anywhere** (delete is `isAdmin` on all collections);
  admins can delete, matching "admin: everything".
- Editors have no read/create/update/delete on Users and no update on
  SiteSettings. `admin.hidden` additionally hides both from an editor's nav so
  they never see a page that only answers 403.
- Public (no user) reads succeed on all six content collections, Media, and the
  SiteSettings global.

## Deliberately omitted / decisions

- **No `editor` / Lexical.** Article bodies are blocks; `@payloadcms/richtext-lexical`
  is neither imported nor referenced in config, per instructions.
- **Article/Show/Episode images are a `group { src, alt, credit }`, not an upload
  relation.** The fixtures carry local `src` strings (`/assets/images/…`) and the
  group keeps `ImageAsset` 1:1 so the seed round-trips without a conversion step.
  Media is still the upload library for future content; `image.src` happily points
  at `/media/<filename>` there. Trade-off documented rather than adding a dual
  source of truth.
- **`articleCount` omitted** — derived, never stored.
- **`crop`/`focalPoint` disabled** in Media upload config (would otherwise be on
  by default alongside image sizes).
- **No versions/drafts, no localization, no trash** — not requested; keeps the
  Postgres schema minimal.
- **`secret` and `DATABASE_URL` read from env** (`.env` already defines both);
  `DATABASE_URL` has a fallback to the documented local URL so Payload CLI
  tooling works without a loaded environment. No secret fallback is committed —
  Payload's own "missing secret key" error fires if `PAYLOAD_SECRET` is absent.
- **`typescript.outputFile` → `src/payload-types.ts`** and
  `admin.importMap.baseDir` → `src/` (the `(payload)` route group lives under
  `src/app`, not the repo root).

## Verification

```
$ node node_modules/typescript/bin/tsc --noEmit
EXIT:0   (no output, 0 bytes)
```

Run twice (after the two initial fixes below). No errors in any file of this
dataset; the concurrent agents' files were also clean at the time of the run.

Two first-pass errors were fixed in my files before the clean run:
1. `UntypedUser` is a weak type (index-signature only) — the role predicate
   parameter became `(User & { roles?: null | string[] })`.
2. The inline `heading.level` validator needed an explicit `value` annotation
   (contextual typing does not flow through the `Block[]` union).

## Handoff notes

- The `(payload)` app layer (owned elsewhere) must import the config through the
  `@payload-config` alias; that path mapping (`"@payload-config": ["./src/payload.config.ts"]`
  in `tsconfig.json` paths, and `next.config.mjs` for bundling) is not in my file set.
- First registered user gets `roles: ["editor"]` by explicit requirement; the
  seed must create/set an admin explicitly or nobody can reach Users/SiteSettings.
- Seed idempotency hook: all six fixture collections expose `legacyId` — match on
  it before create to re-run safely.
