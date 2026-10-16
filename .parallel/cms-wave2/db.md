# cms-wave2 — DB agent report (migrations, generated types, first admin user)

Status: all three deliverables complete and independently verified.
Owner scope touched: Postgres DB, `src/migrations/**` (new), `src/payload-types.ts` (generated), `.env`.
No other project files were modified.

---

## 1. Migrations

### Files created (default location `src/migrations` — the config sets no `migrationDir`,
### so nothing was added to `payload.config.ts`; Payload's default resolver picked `src/migrations`)

| File | Size | Notes |
|---|---|---|
| `src/migrations/20261016_003104_initial.ts` | 27,248 B | up/down DDL; **line 1 edited, see below** |
| `src/migrations/20261016_003104_initial.json` | 100,856 B | drizzle snapshot (unmodified) |
| `src/migrations/index.ts` | 253 B | generated registry (unmodified) |

Name passed to the generator: `initial` → file `20261016_003104_initial`.

### Host workaround required to run the Payload CLI (three parts)

1. **Payload's bin crashes under tsx on this host (Node 26 / undici 7.29.1 / installed tsx).**
   Any invocation (`--help`, `info`, ...) dies during `tsImport('./dist/bin/index.js')` with:

   ```
   TypeError: TypeError: Illegal constructor
       at webidl.errors.exception (undici/lib/web/webidl/index.js:35)
       at webidl.illegalConstructor (undici/lib/web/webidl/index.js:107)
       at new CacheStorage (undici/lib/web/cache/cachestorage.js:17)
       at Object.<anonymous> (undici/index.js:177)        ← module.exports.caches = new CacheStorage(kConstruct)
   ```

   Root cause: tsx's CJS require hook loads undici's internal `lib/core/symbols.js` twice,
   so `index.js` and `cachestorage.js` hold *different* `kConstruct` symbols and the
   illegal-constructor guard `arguments[0] !== kConstruct` fires. Plain `require('undici')`
   and even `tsImport('undici')` alone are fine — it is the deep graph through the bin.
   **Fix: bypass tsx with the bin's own `--disable-transpile` flag** (payload 3.91 supports it;
   Node 26 then loads the config with native TS type stripping).

2. **Native Node does not do extensionless TS resolution.** `--disable-transpile` hits
   `Cannot find module '/…/src/collections/Articles'` from `payload.config.ts`.
   Solution: a scratch resolve hook, outside the repo, at
   `/data/data/com.termux/files/usr/tmp/opencode/ts-ext-resolve.mjs` — it retries failed
   relative resolutions with `.ts` / `.tsx` / `/index.ts`. Nothing in the repo changed for this.

3. **Generated migration files import type-only names as value imports.**
   `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'`
   cannot be erased by native type stripping, so the ESM linker rejects it:
   `The requested module '@payloadcms/db-postgres' does not provide an export named 'MigrateDownArgs'`.
   `src/migrations/20261016_003104_initial.ts` line 1 was changed (only this line) to:

   ```ts
   import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
   import { sql } from '@payloadcms/db-postgres'
   ```

   **Every future migration generated on this host needs the same first-line fix** before
   `migrate` will run it, or must be run under a loader that erases types properly.

### Exact commands used

```bash
cd /data/data/com.termux/files/home/radio-waa
HOOK=/data/data/com.termux/files/usr/tmp/opencode/ts-ext-resolve.mjs

bash scripts/pg.sh ready
node --no-warnings --import file://$HOOK node_modules/payload/bin.js --disable-transpile migrate:create initial
# → created src/migrations/20261016_003104_initial.{ts,json} + index.ts
# (fix line 1 of the .ts as above)
node --no-warnings --import file://$HOOK node_modules/payload/bin.js --disable-transpile migrate
# → Migrating: 20261016_003104_initial / Migrated: (828ms) / Done.
```

`PAYLOAD_CONFIG_PATH` was not needed (`findConfig` discovered `src/payload.config.ts`), and
`.env` is loaded by the bin itself (`@next/env`); no explicit env loading was required.

### Proof — `\dt` (literal command from the brief)

```
$ psql -h 127.0.0.1 -U postgres -d radiowaa -c '\dt'
                         List of tables
 Schema |                Name                | Type  |  Owner
--------+------------------------------------+-------+----------
 public | articles                           | table | postgres
 public | articles_blocks_heading            | table | postgres
 public | articles_blocks_list               | table | postgres
 public | articles_blocks_paragraph          | table | postgres
 public | articles_blocks_quote              | table | postgres
 public | articles_texts                     | table | postgres
 public | authors                            | table | postgres
 public | authors_social                     | table | postgres
 public | authors_texts                      | table | postgres
 public | categories                         | table | postgres
 public | media                              | table | postgres
 public | payload_kv                         | table | postgres
 public | payload_locked_documents           | table | postgres
 public | payload_locked_documents_rels      | table | postgres
 public | payload_migrations                 | table | postgres
 public | payload_preferences                | table | postgres
 public | payload_preferences_rels           | table | postgres
 public | podcast_episodes                   | table | postgres
 public | podcast_episodes_texts             | table | postgres
 public | shows                              | table | postgres
 public | shows_rels                         | table | postgres
 public | shows_schedule                     | table | postgres
 public | site_settings                      | table | postgres
 public | site_settings_footer_columns       | table | postgres
 public | site_settings_footer_columns_links | table | postgres
 public | site_settings_primary_nav          | table | postgres
 public | site_settings_social_links         | table | postgres
 public | site_settings_texts                | table | postgres
 public | users                              | table | postgres
 public | users_roles                        | table | postgres
 public | users_sessions                     | table | postgres
(31 rows)
```

Enum types (`\dT`): `enum_users_roles`, `enum_categories_accent_token`, `enum_shows_schedule_day`.

Note on naming vs the brief: the block tables are `articles_blocks_{paragraph,heading,quote,list}`
(not `articles_body_*`), and hasMany text fields live in `*_texts` tables — that is Payload's
actual generated naming.

### Reproducibility proof (migrations alone == current schema)

`push` was never used to create the schema. During the Local API scripts (below) Payload's
dev-mode `pushDevSchema` ran its pull-and-diff (gate: `connect.js:110`, `NODE_ENV !== 'production'
&& PAYLOAD_MIGRATING !== 'true' && push !== false`) but made no changes. Proven independently:
created scratch DB `radiowaa_migrate_verify`, ran `migrate` against it with
`DATABASE_URL=postgres://postgres@127.0.0.1:5432/radiowaa_migrate_verify`, then compared
`pg_dump --schema-only` output of both databases — **byte-identical except pg_dump's random
per-invocation `\restrict`/`\unrestrict` tokens**. Scratch DB dropped afterwards.

---

## 2. Generated types

```bash
node --no-warnings --import file://$HOOK node_modules/payload/bin.js --disable-transpile generate:types
# → Types written to /…/src/payload-types.ts
```

Written to `src/payload-types.ts` (18,228 B, configured via `typescript.outputFile`).
Not hand-edited.

Exported domain type names for the next wave:

`User`, `Media`, `Category`, `Author`, `Article`, `Show`, `PodcastEpisode`, `SiteSetting`

Plus: `Config`, `UserAuthOperations`, `Auth`, `CollectionsWidget`, `SupportedTimezones`,
`PayloadKv`, `PayloadLockedDocument`, `PayloadPreference`, `PayloadMigration`, and the
`*Select` helpers (`UsersSelect`, `MediaSelect`, `CategoriesSelect`, `AuthorsSelect`,
`ArticlesSelect`, `ShowsSelect`, `PodcastEpisodesSelect`, `SiteSettingsSelect`,
`PayloadKvSelect`, `PayloadLockedDocumentsSelect`, `PayloadPreferencesSelect`,
`PayloadMigrationsSelect`).

---

## 3. First admin user

- Email: `admin@radiowaa.local` (id 1, name "Radio Waa Admin", `roles: ['admin']`)
- Password: strong random (`crypto.randomBytes(18).toString('base64url')`), written only to
  `.env` as `PAYLOAD_ADMIN_PASSWORD` (gitignored). **Not reproduced anywhere else, including
  this report.** `.env.example` was not touched.
- `.env` additions (at end of file):

  ```
  # Payload admin credentials — first admin user created by cms-wave2 DB agent. .env is gitignored; never copy to .env.example.
  PAYLOAD_ADMIN_EMAIL=admin@radiowaa.local
  PAYLOAD_ADMIN_PASSWORD=<value present, redacted here>
  ```

- Creation method: throwaway Local API script (`.parallel/cms-wave2/create-admin.mjs`,
  deleted afterwards) run with the same `--disable-transpile` + hook + `--env-file=.env`
  recipe; it used `payload.create({ collection: 'users', data: { email, password, name, roles: ['admin'] } })`.
  The user did **not** exist beforehand (0 rows), so it was created; the script checks by
  email first, so re-runs are a no-op (`EXISTS: … left untouched`).
  Note: `create:first-user` does not exist in payload 3.91's bin (available scripts are
  `generate:db-schema`, `generate:importmap`, `generate:types`, `info`, `jobs:run`,
  `jobs:handle-schedules`, `run`, `migrate*`).
- Credentials verified working end-to-end: a second throwaway script (also deleted) logged in
  via the Local API and printed `LOGIN OK: admin@radiowaa.local | roles=["admin"] | token issued`.
  (The first script also wrote a `users_sessions` row — total sessions: 1.)

### Exact proof query and output

```
$ psql -h 127.0.0.1 -U postgres -d radiowaa \
    -c "select u.id, u.email, u.name, r.value as role from users u left join users_roles r on r.parent_id = u.id order by u.id;"
 id |        email         |      name       | role
----+----------------------+-----------------+-------
  1 | admin@radiowaa.local | Radio Waa Admin | admin
(1 row)
```

(`roles` is a select-hasMany, stored in the join table `users_roles.value`, not a column on
`users` — hence the join. `select count(*) from users` = 1, so exactly one user exists.)

---

## 4. Verification run (lint / typecheck)

- `npm run lint` — **0 errors**, 4 warnings (all on the generated migration's unused
  `payload`/`req` destructured args; standard for Payload-generated migrations).
- `npm run typecheck` — **24 errors**, all outside this wave's ownership, all one pattern
  caused by the now-present generated types (see next section). **Proven causation**: moving
  `src/payload-types.ts` aside makes `tsc --noEmit` exit 0 (0 errors); restoring it brings the
  24 back.

### Cross-wave issue to route (NOT fixed here — `src/collections/**` and `src/globals/**` are out of scope)

`src/collections/Users.ts` types its access predicates with
`import type { User } from "payload"` (Payload's base `User`), while `AccessArgs.req.user`
now resolves to the generated `User` from `payload-types.ts`, whose
`sessions?: {...}[] | null` is not assignable to base `UserSession[]`:

```
src/collections/Users.ts → RoleUser → used by Articles.ts(57,58,60), Authors.ts(11),
Categories.ts, Media.ts, PodcastEpisodes.ts, Shows.ts, SiteSettings.ts(15)
error TS2322: … Type 'User | null' is not assignable to type 'RoleUser' …
  'sessions' … Type 'null' is not assignable to type 'UserSession[] | undefined'
```

Suggested fix for whichever wave owns `src/collections`: import the user type from the
generated file instead of the package (`import type { User } from "../payload-types"`), or
type the predicates as `Access` and narrow `req.user` inside — per Payload's own docs on
generated types. One-line-per-file change; no runtime effect.

### `payload_migrations` state note (dev marker)

```
 select name, batch from payload_migrations;
          name           | batch
-------------------------+-------
 dev                     |    -1
 20261016_003104_initial |     1
```

The `dev|-1` row was inserted by Payload's dev-mode schema push during the Local API scripts
(standard behavior; any dev-mode Payload usage re-inserts it). Consequence: running
`payload migrate` against `radiowaa` later will show an interactive confirmation
("run Payload in dev mode … proceed?") — in non-interactive shell contexts pipe `printf 'y\n'`
into it. Fresh databases (e.g. production) do not have this row; schema reproduction there is
exactly what the scratch-DB test verified.

---

## 5. Artifacts and hygiene

- Deleted after use: `.parallel/cms-wave2/create-admin.mjs`, `.parallel/cms-wave2/verify-admin.mjs`.
- Kept outside the repo: `/data/data/com.termux/files/usr/tmp/opencode/ts-ext-resolve.mjs`
  (CLI resolve hook — harmless, not part of the project).
- Scratch DB `radiowaa_migrate_verify`: created and dropped.
- No `npm install`, no `next build`, no Next server, no `pgrep`/`pkill -f` were used.
- `.env.example`, `next.config.mjs`, `tsconfig.json`, `src/app/(payload)/**`, `src/collections/**`,
  `src/globals/**`, `src/payload.config.ts`, `src/content/**`, `src/components/**`, `src/data/**`
  untouched.
