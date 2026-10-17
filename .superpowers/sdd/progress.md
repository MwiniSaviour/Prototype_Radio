# SDD Progress — audio backend

Spec: docs/superpowers/specs/2026-10-17-audio-backend-design.md (approved)
Plan: docs/superpowers/plans/2026-10-17-audio-backend.md
Branch: feat/audio-backend (base c03498c)

## Completed
- Backend round-2 groundwork committed: `9d73123` (collection hooks src/collections/hooks/{revalidate,slug}.ts, migration 20261017_204540.*, payload-types regen, seed/logo updates; 21 files)
- Plan-doc contract edits applied: per-lane commit contract, Lane C ungated, dispatch dependencies D←B / E←A

## In progress
- Wave 1 (parallel): Lane A resolveCurrentSlot + tests — Lane B rss.ts + tests — Lane C podcast audio fields + migration + types regen

## Pending
- Wave 1 reviewer passes → Wave 2: Lane D (/feeds/radio-waa.xml route + autodiscovery wiring), Lane E (hero resolver wiring + offline diagnostics)
- Coordinator final integration + whole-branch review

## Deferred / unchanged
- Admin-UI smoke (credentials unknown)
- Audio host selection (audioUrl may 404 until a real host exists)
- Go-live preconditions: written Zeno embed confirmation + Ghana NCA/MGCSD authorisation (spec §8.6–8.7)
