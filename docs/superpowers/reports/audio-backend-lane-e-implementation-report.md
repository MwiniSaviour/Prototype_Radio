# Lane E — LivePlayerHero resolver wiring + offline diagnostics

Facts-only implementation report for Lane E of `docs/superpowers/plans/2026-10-17-audio-backend.md`.

## Facts

- Commit: `874abc4` — `fix(hero): wire schedule resolver + offline diagnostics`
- Branch: `feat/audio-backend`
- Files changed: `src/components/radio/LivePlayerHero.tsx` (+112 / −12); no other file touched
- Tests: none — no lane test per plan §5 (Lane E is UI-only; resolver unit tests shipped in Lane A, commit `61e6569`, 17/17 passing)

## What changed

`LivePlayerHero` now resolves its own live/next slot client-side and reports network diagnostics for the live stream:

- Imports `resolveCurrentSlot` from `@/lib/resolveCurrentSlot` (Lane A) plus `ShowSlot`/`Weekday` types from `@/lib/types`.
- Adds a mount-time `now` snapshot (`useState<Date | null>(null)`, set once via `useEffect`). It stays `null` until after mount so server markup and the first client render agree; no interval.
- Buckets `show.schedule` into a `Record<Weekday, ShowSlot[]>` via `useMemo` and resolves it with `resolveCurrentSlot(scheduleByDay, now)` via `useMemo`.
- `displaySlot` / `displayIsLive` prefer the resolver's result and fall back to the caller's `slot` / `isLive` props while the browser clock is unavailable (SSR and first paint keep the build-time values).
- Adds stream-network diagnostics: message constants (`NOT_CONFIGURED_MESSAGE`, `START_FAILED_MESSAGE`, `UNREACHABLE_MESSAGE`, `OFFLINE_MESSAGE`), `logStreamDiagnostics()` (`console.warn` with MediaError code/message, `networkState`, `readyState`, stream URL, `navigator.onLine`, and a checklist pointing at `docs/live-audio-backend-research.md` §4.6/§8.6), an offline gate in `togglePlayback`, a diagnostic-only `HEAD` preflight that never gates playback, a time-to-first-audio measurement (`onPlaying`), and richer `onError` handling.
- JSX substitutions only for the badge text, the schedule line, and the `NowPlayingChip` label; every other line of the original component is byte-preserved.

## Decisions and deviations (with reasons)

1. **Hero wires the resolver internally.** The brief says "replace internal now/next computation"; the hero originally had no internal computation — `page.tsx` computed the slot and passed `slot`/`isLive`. Interpreted as: the hero gains internal resolution, falling back to caller props when the browser clock is unavailable (SSR / pre-mount).
2. **`page.tsx` tension.** The do-not-edit caller still passes `slot`/`isLive`. After mount the hero's resolution wins; the props remain the SSR and last-resort fallback. This keeps `page.tsx` compiling unchanged.
3. **Boot-time `Date` snapshot.** `setNow(new Date())` runs once on mount, no interval — the smallest change satisfying the §8.6 observability brief. Consequence: resolution can go stale in a long-lived session (badge and schedule line freeze at boot-time state) until reload.
4. **Preflight failure copy.** A non-OK preflight or a preflight fetch failure reuses `START_FAILED_MESSAGE` (no separate sentence), guarded by `audioRef.current?.paused` so a late preflight rejection cannot overwrite a success message after playback has begun.
5. **Dropped the explicit `SlotOccurrence` type annotation** on `displaySlot`; TypeScript infers the union (`resolution.live ?? resolution.next` result or the `slot` prop). No extra import needed.

## Residual risks

- `resolveCurrentSlot` uses the client's local `Date`; timezone-agnostic "GMT" schedules are not handled (out of Lane E scope, documented in Lane A).
- `"H:MM"` schedule strings are assumed well-formed; `toMinutes` throws `RangeError` on malformed values, which would surface as a post-mount render error if fixtures drift.
- Badge and now-playing state can go stale mid-session until reload (boot-time snapshot, see decision 3).
- `page.tsx`'s `getCurrentSlot` remains an independent slot source; a future refactor could share one resolution path.
- `console.warn`/`console.info` usage is unverified against repo eslint (plan §0 forbids running repo-wide lint) — a follow-up lint run may flag `no-console`.
