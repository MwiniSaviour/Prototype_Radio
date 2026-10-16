# CMS Wave 2 — Payload 3.91 admin/API integration (payload-admin lane)

Owner: payload-admin lane (this lane owns `next.config.mjs`, `tsconfig.json`,
new files under `src/app/(payload)/**` only).
Host: Termux / Android aarch64, Node v26.2.0, Next.js 16.4.0 (webpack only —
Turbopack hard-blocked), Payload `@payloadcms/next` 3.91.0, Postgres 18 native.
Date: 2026-10-16.

---

## 1. Files created / modified

| File | Role |
|---|---|
| `next.config.mjs` | **modified** — wrapped with `withPayload` (see §3) |
| `tsconfig.json` | **modified** — added `@payload-config` path alias (see §2.3) |
| `src/app/(payload)/layout.tsx` | Payload root layout + server function bridge |
| `src/app/(payload)/admin/[[...segments]]/page.tsx` | admin root page (`RootPage`) |
| `src/app/(payload)/admin/[[...segments]]/not-found.tsx` | admin 404 (`NotFoundPage`) |
| `src/app/(payload)/api/[...slug]/route.ts` | REST handlers |
| `src/app/(payload)/api/graphql/route.ts` | GraphQL POST + OPTIONS |
| `src/app/(payload)/api/graphql-playground/route.ts` | GraphQL playground GET |
| `src/app/(payload)/custom.scss` | 0-byte, as in the official template (layout imports it) |
| `src/app/(payload)/admin/importMap.js` | **generated** by `payload generate:importmap` |
| `.parallel/cms-wave2/tsc-blocker.md` | coordination note for the type blocker (§5.1) |

All `(payload)` files are byte-for-byte the official v3.91.0 blank template files,
fetched from `raw.githubusercontent.com/payloadcms/payload/v3.91.0/templates/blank/…`
and cross-checked against the installed package dist (below). Only
`custom.scss` differs in that the official one is also empty.

Not touched (other lanes): `src/collections/**`, `src/globals/**`, `src/content/**`,
`src/components/**`, `src/data/**`, `src/payload-types.ts`, `src/migrations/**`,
`.env`, `src/app/layout.tsx`. The user's reference server (pid 9962, port 3000)
was not restarted, killed, or affected; it answered 200 after all work.

## 2. Exact Payload import specifiers — provenance, not guesses

Everything was read from the installed package at
`node_modules/@payloadcms/next/` (v3.91.0), starting at its `package.json`
`exports` map, then the dist modules themselves:

| Specifier | Found at | Exports used (verified in dist) |
|---|---|---|
| `@payloadcms/next/withPayload` | `exports["./withPayload"]` → `dist/withPayload/withPayload.js` | `withPayload(nextConfig, options)`; on Next ≥16.1 takes the non-legacy path |
| `@payloadcms/next/views` | `exports["./views"]` → `dist/exports/views.js` | `RootPage`, `NotFoundPage`, `generatePageMetadata` (signatures in `dist/views/Root/index.js`, `dist/views/NotFound/index.d.ts`, `dist/views/Root/metadata.d.ts`) |
| `@payloadcms/next/layouts` | `exports["./layouts"]` → `dist/exports/layouts.js` | `RootLayout`, `metadata`; plus `handleServerFunctions` from `dist/utilities/handleServerFunctions.js` |
| `@payloadcms/next/routes` | `exports["./routes"]` → `dist/exports/routes.js` | REST: `REST_GET/POST/PATCH/DELETE/PUT/OPTIONS` (factory `handlerBuilder(config)` → `(request, args)`, `dist/routes/rest/index.js`); GraphQL: `GRAPHQL_POST` (`dist/routes/graphql/handler.js`), `GRAPHQL_PLAYGROUND_GET` (`dist/routes/graphql/playground.js`) |
| `@payloadcms/next/css` | `exports["./css"]` → `dist/prod/styles.css` | admin stylesheet |
| `payload` (types) | `dist/admin/functions/index.d.ts`, re-exported at top level (`payload/dist/index.bundled.d.ts` export list) | `ServerFunctionClient` |

Notes:
- **There is no config-path argument to `withPayload` in 3.91** — its signature is
  `(nextConfig, options)`. "Pointing it at `src/payload.config.ts`" is done through
  the `@payload-config` alias (§2.3), which is also what payload's own CLI
  `findConfig()` consumes (`node_modules/payload/dist/config/find.js` reads
  `tsconfig.compilerOptions.paths['@payload-config']`).
- `dist/views/Root/index.js:102-112` renders its own `<html>/<head>/<body>` — the
  basis of the conflict documented in §5.2.
- Template files mirrored from the official repo at tag `v3.91.0`; the generated
  `importMap.js` (`@payloadcms/next/rsc#CollectionCards` → `CollectionCards_…`)
  is identical in shape to that template's committed importMap.

### 2.3 tsconfig.json change (only this)

```json
"paths": {
  "@/*": ["./src/*"],
  "@payload-config": ["./src/payload.config.ts"]
}
```

Everything else in `tsconfig.json` preserved (`strict`, `moduleResolution:
bundler`, includes, plugins). The file was briefly modified for the §4.2
verification run and then **restored byte-for-byte** from a snapshot
(`/usr/tmp/opencode/tsconfig.final.json`); final content verified by diff.

## 3. Final `next.config.mjs`

```js
/**
 * Radio Waa — Next.js configuration.
 *
 * Platform note (Termux / Android / bionic libc): see AGENTS.md. The native SWC
 * binding cannot dlopen glibc's libdl.so.2, so builds run on the WASM SWC binding
 * (@next/swc-wasm-nodejs). Turbopack has no WASM fallback and is blocked on
 * android/arm64 — every next dev / next build must pass --webpack.
 */
import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // bionic libc has no glibc sharp prebuild, so the /_next/image optimizer
    // cannot run on this platform. Re-enable optimization (drop `unoptimized`)
    // when deploying to glibc/musl infrastructure.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Lint/typecheck run as separate scripts (eslint.config.mjs / tsc); Next 16
  // no longer accepts eslint config here.
  typescript: { ignoreBuildErrors: false },

  // Payload's TypeScript sources import sibling modules by their compiled
  // extension (".js" referring to a ".ts" file); extensionAlias teaches the
  // webpack resolver that mapping. Required by the official Payload/Next
  // integration template.
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    return webpackConfig;
  },
};

// devBundleServerPackages: false keeps `payload` / `@payloadcms/db-postgres`
// external in dev — fewer modules to compile and much less RAM on this host
// (same option the official Payload template sets).
export default withPayload(nextConfig, { devBundleServerPackages: false });
```

No existing option was removed or altered. No Turbopack switches anywhere.

## 4. Verification

### 4.1 The importMap generation problem and the working CLI recipe (host caveat)

`node node_modules/payload/bin.js generate:importmap` **crashes on this host**
under payload's bundled tsx loader:

```
TypeError: TypeError: Illegal constructor
    at new CacheStorage (node_modules/undici/lib/web/cache/cachestorage.js:17:14)
    at Object.<anonymous> (node_modules/undici/index.js:177:25)
    at Object.transformer [as .js] (node_modules/tsx/dist/require-CBjy4Foe.mjs)
```

Root cause: tsx's module registry and Node's native CJS registry produce two
`undici/lib/core/symbols.js` instances, so undici's `kConstruct` private-token
check fails at module load. (Node 26 loads undici fine natively; a preloaded
undici in `require.cache` does not help tsx.)

**Working recipe — bypass tsx entirely; use Node 26 native type-stripping plus a
tiny resolve hook for extensionless relative TS imports:**

```
node --import file:///data/data/com.termux/files/usr/tmp/opencode/ts-ext-resolve.mjs \
     node_modules/payload/bin.js <command> --disable-transpile
```

Hook content (`/data/data/com.termux/files/usr/tmp/opencode/ts-ext-resolve.mjs`,
shared scratch; recreate if the scratch dir is wiped):

```js
import { registerHooks } from 'node:module'
const EXTS = ['.ts', '.tsx', '/index.ts']
registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context) }
    catch (err) {
      if (specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')) {
        for (const ext of EXTS) {
          try { return nextResolve(specifier + ext, context) } catch {}
        }
      }
      throw err
    }
  },
})
```

`PAYLOAD_CONFIG_PATH=src/payload.config.ts` is optional — `findConfig()` now
finds the config through the `@payload-config` alias. This recipe ran
`generate:importmap` successfully and wrote:

```
Generating import map
Writing import map to /data/data/com.termux/files/home/radio-waa/src/app/(payload)/admin/importMap.js
```

The generated file lands exactly where `page.tsx`/`layout.tsx` import it.
(Useful for future waves: regenerate after adding any custom admin components.)

### 4.2 Builds

**Run 1 — repository as it stands (final tsconfig state):** `npm run build`
→ **exit 1**. Webpack compilation itself **succeeded** (`⚠ Compiled with
warnings in 3.2min`); the failure is the type-check gate: 24 errors rooted in
`src/collections/Users.ts` (cross-lane — §5.1). So the only thing standing
between this integration and a green build is the one-line collections fix.

**Run 2 — with the augmentation conflict temporarily neutralized** (a snapshot
of `tsconfig.json` was taken; `"src/payload-types.ts"` added to `exclude` for the
duration of the run; nothing imports `@/payload-types` yet, so this only removes
the type augmentation from the program — emitted JS is type-agnostic):
`npm run build` → **exit 0**. Route table excerpt:

```
├ ƒ /admin/[[...segments]]
├ ƒ /api/[...slug]
├ ƒ /api/graphql
├ ƒ /api/graphql-playground
...
├ ○ /            ├ ○ /about      ├ ● /article/[slug] (24 paths)
├ ○ /category    ├ ● /category/[slug] (8 paths)  ├ ○ /podcasts
├ ○ /robots.txt  ├ ƒ /search     ├ ○ /shows      └ ○ /sitemap.xml
```

`tsconfig.json` was restored byte-for-byte afterwards (diff-verified). Build log:
`/usr/tmp/opencode/build-attempt2-tempstate.log`.

### 4.3 Boot probes

**Production (`next start -p 3600`, build from run 2)** — raw output:

```
admin: 200
admin/login: 200
api/users: 403
api/graphql-playground: 404
```

`curl http://localhost:3600/admin | grep -oiE "payload|login|email|password" | sort -u`:

```
Email
Login
Password
Payload
email
login
password
payload
```

Extra probes:
- `POST /api/graphql {"query":"{ __typename }"}` → **200**
  `{"data":{"__typename":"Query"}}` — GraphQL executes against Postgres.
- `/api/users` 403 body: `{"errors":[{"message":"You are not allowed to perform this action."}]}`
  — REST wired, auth/access control active (read = admin-only).
- `/api/graphql-playground` 404 in production is **Payload's default policy**,
  not a wiring bug: `graphQL.disablePlaygroundInProduction` defaults to `true`
  (`node_modules/payload/dist/config/defaults.js:52`); the handler answers a
  graceful `Route Not Found`. In dev it returns 200.

Server log excerpt (`/usr/tmp/opencode/payload-admin-verify.log`):

```
▲ Next.js 16.4.0
✓ Ready in 1544ms
[00:57:49] WARN: No email adapter provided. Email will be written to console.
[00:57:49] WARN: Image resizing is enabled for one or more collections, but sharp not installed.
[00:57:52] ERROR: You are not allowed to perform this action.   <- the expected /api/users 403
```

**Dev-mode cross-check (earlier, `next dev --webpack -p 3600`)** — same routes:
`/admin 200` (full login page), `/admin/login 200`, `/api/users 403` JSON,
`/api/graphql-playground 200`, and the boot log shows
`Pulling schema from database... ✓` — Payload initialized against the live
Postgres the DB lane provisioned.

My 3600 server was killed after probing (pid-diffed against the user's pid 9962
on port 3000, which stayed up and returned 200). Logs:
`/usr/tmp/opencode/payload-admin-{dev,verify}.log`.

## 5. Cross-lane issues (report-only, per lane rules)

### 5.1 BLOCKER — `tsc --noEmit` fails once `src/payload-types.ts` exists

- `src/collections/Users.ts:14` types role predicates as
  `(User & { roles?: null | string[] }) | null | undefined` using payload's
  **untyped** `User` (whose `sessions` is non-nullable).
- The generated `src/payload-types.ts` augments payload
  (`declare module 'payload' { interface GeneratedTypes extends Config {} }`),
  making `AccessArgs.req.user` the generated `TypedUser`
  (`sessions?: {...}[] | null`). Contravariance then rejects every predicate:
  24 errors across all 9 collections/globals.
- **Proof:** with `src/payload-types.ts` excluded from the program,
  `tsc --noEmit -p` exits **0** (everything — including every file this lane
  wrote — is clean). With it included, exit 1.
- **Suggested one-line fix** (collections are outside this lane's scope):
  in `src/collections/Users.ts`, import the generated user type
  (`import type { User } from "@/payload-types"`) or make `RoleUser` purely
  structural (`{ roles?: null | string[] } | null | undefined`).
- Details also in `.parallel/cms-wave2/tsc-blocker.md`; a coordination copy was
  left in the shared scratch dir while the DB lane was still active.

### 5.2 CONFLICT — the site root layout wraps the Payload admin (not fixed here)

`src/app/layout.tsx` renders `<html>`, `<head>`, `<body>`, site header and
footer. Next.js route groups **do not bypass a top-level `app/layout.tsx`**
(multiple root layouts require removing it), so the served `/admin` HTML
contains, nested: **two `<html>` elements and two `<body>` elements**, with the
site chrome (skip link, masthead, footer) around Payload's login UI. Evidence
from the production HTML (`/usr/tmp/opencode/admin-prod.html`):

```
<html lang="en" class="__variable_d8ebd1 __variable_63c8e8">   <- site layout
<html data-theme="light" dir="LTR" lang="en">                    <- payload RootLayout
<body class="flex min-h-screen flex-col">                        <- site body
<body>                                                           <- payload body
…mentions: Skip to, radio-waa, SiteHeader … in the same document
```

The page still renders (200, login form present) because browsers reparent the
invalid nesting, but this is structurally wrong and risks hydration mismatches.
Per the brief this was **not** worked around destructively and `src/app/layout.tsx`
was **not** edited. Recommended follow-up (multi-file move, needs a lane that
owns `src/app/**`): move the public routes + the current root layout into a
`src/app/(frontend)/` route group and delete the top-level `src/app/layout.tsx`,
giving each group its own root layout.

### 5.3 Payload boot warnings (informational)

- `No email adapter provided` — expected; no email adapter configured yet.
- `Image resizing is enabled for one or more collections, but sharp not
  installed` — `sharp` is in `package.json` but cannot satisfy its native/WASM
  load path on this host (bionic libc); uploads still serve, resizing is
  unavailable. Config/adapter choice belongs to the schema lane.

## 6. Verified commands cheat-sheet (this lane's scope)

```bash
# typecheck (currently gated by §5.1)
node node_modules/typescript/bin/tsc --noEmit

# build (webpack only; ~2-3.5 min)
npm run build

# boot a spare-port copy and probe
setsid nohup node node_modules/next/dist/bin/next start -p 3600 \
  > /data/data/com.termux/files/usr/tmp/opencode/payload-admin-verify.log 2>&1 < /dev/null & disown

# regenerate the admin import map (host workaround, §4.1)
PAYLOAD_CONFIG_PATH=src/payload.config.ts \
node --import file:///data/data/com.termux/files/usr/tmp/opencode/ts-ext-resolve.mjs \
  node_modules/payload/bin.js generate:importmap --disable-transpile
```

Never `pkill -f` / `pgrep -f` on this host; find pids with
`ps -A -o pid,args | grep next-server` and diff by elapsed time.
