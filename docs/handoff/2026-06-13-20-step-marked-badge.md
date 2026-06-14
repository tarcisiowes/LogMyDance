# 20 — Step-marked badge on movement cards

**Date:** 2026-06-13
**Status:** ✅ Done — `tsc` clean. JS only, no native dep. On `master`.
**Commit:** c711025.

## What was done
Surface which movements have marked pisadas (and are therefore BPM-sync-ready)
directly in the movement library list, so users can tell at a glance without
opening each one.

- `app/(tabs)/movements.tsx`: `MovementWithMeta` gains `stepCount`. The list
  loader does one batched `sequencesRepo(db).getStepsForMovements(ids)` and maps
  `stepCount = stepsMap.get(m.id)?.length ?? 0` per card (no N+1 — single query
  for all movements).
- `src/components/movements/MovementCard.tsx`: new optional `stepCount` prop
  (default 0). When `> 0`, renders a **lucide `Footprints` icon (amber-400,
  `#fbbf24`, size 12) + the count** next to the style label, wrapped in a new
  `flex-row` row so style + badge sit on one line.

## Decisions / notes
- Badge uses the lucide `Footprints` icon (not the literal 👣 emoji the commit
  message mentions) for crisp rendering + theme color control.
- Amber chosen to read as a "marked/ready" accent against the violet primary.
- Count comes from the same `getStepsForMovements` used by the sequence player,
  so the badge and sync logic share one source of truth.

## Manual actions
None.

## Heads-up — branch staleness
`feat/sequence-concat` predates this commit; its diff vs master reverts these
`MovementCard.tsx` / `movements.tsx` edits. Merge `master` into that branch
before merging it back so the badge isn't lost.

## Verify (device, JS — no rebuild)
1. Mark steps on a movement (see handoff 18) → return to the Movements tab.
2. That card shows the footprints badge with the step count; unmarked movements
   show no badge.
3. Count matches the number of pisadas marked in `app/steps/[id]`.
