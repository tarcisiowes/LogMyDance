# 03 — Entry detail loads & edits linked movements

**Date:** 2026-06-13
**Status:** ✅ Done (typecheck passes)

## What was done
Made the entry↔movement link round-trip: the edit screen now loads existing links
and lets the user change them.

- Entry detail loads existing links via `entriesRepo.getMovementIds(id)` (already in
  the repo, previously unused).
- Same `MovementPicker` as the new-entry screen, pre-seeded with linked movements.
- Create-on-fly available here too (inherits the entry's style).
- `onSubmit` passes `movementIds` to `entriesRepo.update`, which diff-replaces the
  `entry_movements` rows.

## Files touched
- `app/entry/[id].tsx` — rewritten (movements state, picker, create handler,
  `getMovementIds` load, submit passes `movementIds`).

## Dependencies
- None new.

## Blockers
- None.

## Manual actions required
- None. Verify round-trip: save an entry with movements → reopen → toggles reflect
  saved state → change selection → save → reopen confirms the change.

## Verification done
- `npx tsc --noEmit -p tsconfig.json` → EXIT=0 across all three tasks.
- Not yet run on device/emulator — no native changes, but a manual smoke test on the
  Movements + Journal flows is recommended before the next sprint.
