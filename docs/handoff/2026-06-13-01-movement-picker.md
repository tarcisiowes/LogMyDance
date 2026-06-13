# 01 — Entry ↔ movement linking (picker + create-on-fly)

**Date:** 2026-06-13
**Status:** ✅ Done (typecheck passes)

## What was done
Closed the biggest UX gap: the `entry_movements` table + `entriesRepo.movementIds`
support existed but no UI ever attached movements to an entry.

- New reusable `MovementPicker` component:
  - Lists existing movements as toggleable chips (check mark when selected).
  - Inline text field + `+` button to create a movement on the fly during entry
    logging — new movement inherits the entry's selected style.
- Wired into the **new entry** screen (movements section between Duration and Tags).
- Create-on-fly inserts via `movementsRepo.create`, refreshes the list, auto-selects
  the new movement.
- `onSubmit` now passes `movementIds: selectedMovementIds` to `entriesRepo.create`.

Covers roadmap key flows "Log a new movement" and "attach movements to a class".

## Files touched
- `src/components/movements/MovementPicker.tsx` — **new**
- `app/entry/new.tsx` — rewritten (movement state, picker, create handler, submit)

## Dependencies
- None new. Uses existing `movementsRepo`, `lucide-react-native` (Check, Plus),
  `react-native` TextInput. No package installs.

## Blockers
- None.

## Manual actions required
- None. Rebuild not needed (no native deps). Run the app and verify:
  - New entry → toggle existing movements, type a name + tap `+` to create one,
    save → reopen entry shows the links (see handoff 03).
