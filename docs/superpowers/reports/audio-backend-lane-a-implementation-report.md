# Lane A — Implementation Report: Current-Slot Resolver

Task: extract the radio schedule's today/tomorrow resolution (live, next, rolling window)
from `ShowScheduleRail` into a pure module, per
`docs/superpowers/plans/2026-10-17-audio-backend.md` (Lane A, lines 17–45).

## Files created

- `src/lib/resolveCurrentSlot.ts` — pure resolver; zero imports (no `@/` alias).
- `tests/resolveCurrentSlot.test.ts` — 17 unit tests, `node:test` + `assert/strict`.

## Test summary

`node --import ./scripts/ts-ext-resolve.mjs --test --test-reporter=spec tests/resolveCurrentSlot.test.ts`

- tests 17
- pass 17
- fail 0
- cancelled 0 · skipped 0 · duration_ms ≈ 463

Command exited 0.

## Output tail

```
✔ rolling window continues across tomorrow rows in order (0.687ms)
ℹ tests 17
ℹ suites 0
ℹ pass 17
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 462.9095
```

## Commit

- Hash: `61e6569`
- Message: `feat(resolver): extract current-slot resolver for radio schedule with unit tests`
- Scope: exactly the two files above (403 insertions, no other paths touched).

```
src/lib/resolveCurrentSlot.ts    | 158 +++++++++++++++++++++++++
tests/resolveCurrentSlot.test.ts | 245 +++++++++++++++++++++++++++++++++++++++
```

## Decisions and deviations

- **`extractSchedule(schedule, now = new Date())`** — the plan's API list shows
  `extractSchedule<T>(schedule)` without a `now` argument, but "today rows + tomorrow
  rows" is undefined without one. The optional parameter keeps the plan's call shape
  valid for callers and made fixed-date tests possible. Called with one argument, the
  behavior matches the plan exactly.
- **`toMinutes` validation** — the plan's verification section requires invalid input to
  throw `RangeError`; the resolver adds the specific messages
  (`Expected "H:MM" or "HH:MM", received "…"` / hour-24 rules) where the rail's
  `buildRows` silently coerced with `Number()`. Predictable failures instead of NaN rows.
- **`next` = first row in listing order with `startMinutes > now`** — the plan brief said
  "nearest upcoming"; for same-start slots the plan wins over "smallest absolute minute"
  (listing order decides). `tests` case 14 documents this and matches the rail.
- **`isToday` is not consulted in the live check** — with the offset model
  (`startMinutes ≥ 1440` for tomorrow rows), `nowMinutes ≥ start && nowMinutes < end` is
  the same test; the field stays for the consumer UI (badge vs. tomorrow-heading).
- **Rail-parity fallback kept** — `rollingWindow` uses
  `startIndex = liveIndex >= 0 ? liveIndex : Math.max(nextIndex, 0)`, so when nothing is
  live or upcoming it still returns rows starting at the first (rail behavior, plan).
- **No `Math.max`-fallback inside `resolveCurrentSlot`** — its `live`/`next` are null
  when absent, per the plan's "next = null" contract; the fallback is window-only.

## Residual risks

- `rollingWindow(schedule, now, count)` with `count <= 0` returns `[]`
  (`Array.prototype.slice` semantics); the plan is silent on `count ≤ 0`.
- A `"24:00"`-hour start value (`start: "24:00"`) would produce `startMinutes: 1440`
  (a live matter only if callers author it); the plan targets rail-style `HH:MM` data
  where starts are `0:00–23:59`.
- Local-time DST transitions inside a session can shift wall-clock minutes; plan scope
  accepts the local-DST caveat (transition-hour roofs never hit the noon window).
- Consumer wiring (`ShowScheduleRail`, `TodaysShows`, `PromoCard`) is Wave-2 lanes; this
  module is not referenced by the app yet.
- Tests directory warning at runtime: `MODULE_TYPELESS_PACKAGE_JSON ... Reparsing as ES
  module` (informational; `package.json` has no `type` field, Node still resolves the
  `.ts` test via the resolve hook and all tests pass).
