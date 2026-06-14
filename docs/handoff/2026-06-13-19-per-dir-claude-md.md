# 19 — Per-directory CLAUDE.md context files

**Date:** 2026-06-13
**Status:** ✅ Done — docs only, no code. On `master`.
**Commit:** f69a916.

## What was done
Added nested `CLAUDE.md` context files that Claude Code auto-loads when working
inside each subtree, so the agent gets directory-local conventions without
re-reading the root `AGENTS.md` every time.

Files (10):
- `app/CLAUDE.md` — expo-router screens: typed-routes casts (`as Href` for new
  routes until `expo start` regenerates `.expo/types`), dark-theme classes.
- `src/db/CLAUDE.md` — drizzle schema, migration-by-`CREATE TABLE IF NOT EXISTS`,
  `SCHEMA_VERSION`, `seedAttributes()` idempotency.
- `src/repositories/CLAUDE.md` — repo pattern, `DB = ReturnType<typeof drizzle<…>>`
  for repos needing `$client`.
- `src/components/CLAUDE.md` — component conventions, no-native-Slider rule.
- `src/services/CLAUDE.md` — backup/sentry/concat services; crash-only Sentry.
- `src/i18n/CLAUDE.md` — typed `t()` rules (literal keys only, `en.ts` not
  `as const`), label maps.
- `src/constants/CLAUDE.md` — forró taxonomy source.
- `src/stores/CLAUDE.md` — MMKV preferences store.
- `src/utils/CLAUDE.md` — date/tempo helpers (BPM math).
- `docs/handoff/CLAUDE.md` — the handoff-per-task convention itself.

## Decisions / notes
- These are reference/convention captures — they duplicate substance already in
  the root instructions + memory, scoped to where it's relevant. Keep them in
  sync when the underlying pattern changes.

## Manual actions
None.

## Heads-up — branch staleness
`feat/sequence-concat` predates this commit and does **not** contain these
files (its diff vs master shows them as deletions). Merge/rebase `master` into
that branch before merging it back, or the merge will drop the CLAUDE.md files.

## Verify
Open any subdirectory file in Claude Code → the directory's `CLAUDE.md` loads as
context. No build impact.
