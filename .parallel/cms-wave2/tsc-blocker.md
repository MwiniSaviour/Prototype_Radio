# cms-wave2 — cross-lane typecheck blocker (from the payload-admin lane)

**Symptom**: `node node_modules/typescript/bin/tsc --noEmit` exits 1 with 24 errors,
all rooted in `src/collections/Users.ts:14` (`RoleUser` predicate type). Every
collection/global errors as `Type 'AccessArgs<any>' is not assignable to type
'{ req: { user: RoleUser } }'`; the chain ends in
`Types of property 'sessions' are incompatible: ... | null | undefined` is not
assignable to `UserSession[] | undefined`.

**Cause**: `src/payload-types.ts` (generated) augments payload with
`declare module 'payload' { interface GeneratedTypes extends Config {} }`.
With that augmentation, `AccessArgs.req.user` becomes the generated `TypedUser`
(`sessions?: {...}[] | null`). `Users.ts` types the predicate parameter as
`(User & { roles?: null | string[] })` where `User` is payload's *untyped*
`User` (non-null `sessions`), so contravariance fails.

**Proof it is the augmentation**: with `tsconfig` excluding `src/payload-types.ts`
the same command exits 0. Without the generated types everything is clean.

**Suggested fix** (in `src/collections/Users.ts`, one line; not made by this lane
because `src/collections/**` is outside both lane scopes):
- prefer importing the generated user type: `import type { User } from "@/payload-types"`
  (replace the `User` in `RoleUser` with it), or
- make `RoleUser` purely structural: `type RoleUser = { roles?: null | string[] } | null | undefined`.

Verify with `node node_modules/typescript/bin/tsc --noEmit`.
