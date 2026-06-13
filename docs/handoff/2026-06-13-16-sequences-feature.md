# 16 — Movement categorization (forró) + Sequence builder

**Date:** 2026-06-13
**Status:** ✅ Phase 1 done — `tsc --noEmit` clean. JS + SQL / expo-video only, **no new native dep**.
**Commits:** 1365a61 (taxonomy+categorize), d32b27d (builder+player+export), + this (backup).
**Plan:** `~/.claude/plans/composed-waddling-turing.md`

## What was done
A forró-specific way to **categorize movements** and **build choreography sequences** from them, playing the clips back-to-back as one continuous video.

### Data (`src/db/`)
- New tables: `attribute_dimensions`, `attribute_values`, `movement_attributes`, `sequences`, `sequence_items` (drizzle in `schema.ts`, `CREATE TABLE IF NOT EXISTS` in `setup.ts`).
- `SCHEMA_VERSION 1→2`; `seedAttributes()` seeds the default forró taxonomy **idempotently** (runs whenever `attribute_dimensions` is empty — covers fresh installs AND upgrades).
- Default taxonomy in `src/constants/forro-attributes.ts`: pé início/fim, mãos, nº pisadas (3/5/7/9), andamento, distância, estilo (universitário/roots), giro, dificuldade.

### Repos (`src/repositories/`)
- `attributes.ts` — dims+values CRUD, movement↔value set/get, `getMovementsByFilters(groups)` (OR within a dimension, AND across; only movements with a ready video).
- `sequences.ts` — list (with count+thumb), clips (ordered, with video/thumb paths), media-by-ids, create/rename/delete.

### UI
- **Categorize**: `AttributeSelector` (single/multi chips + inline add custom value) in `app/movement/[id].tsx`; manage screen `app/categories.tsx` (add/delete custom values + dimensions); Settings link.
- **Sequences tab** (5th) `app/(tabs)/sequences.tsx`; builder `app/sequence/new.tsx` (filter → tap to append → inline preview player → name+save); viewer `app/sequence/[id].tsx` (play/export/delete).
- **`SequencePlayer`** (`src/components/sequence/`): back-to-back playback via `replaceAsync` on the `playToEnd` event; autoplay, prev/next/replay, "clip i/N" overlay.

### Export / backup / i18n
- `src/services/sequence-export.ts` — **phase-1** export: `.zip` of the ordered clips (`01_*.mp4`, …) + `sequence.json`, via the share sheet (reuses `react-native-zip-archive` + `expo-sharing`).
- Backup: the 5 tables added to `RESTORE_TABLES_ORDER` (FK-safe) + `APP_SCHEMA_VERSION 1→2`. Export/import are table-generic, so they now round-trip automatically.
- i18n: `attributes.*` (UI + default dim/val labels EN+PT) and `sequences.*`; helpers `dimensionLabel`/`valueLabel` (default→i18n key, custom→stored label) in `src/i18n/labels.ts`.

## Decisions / gotchas
- Default taxonomy labels resolve via i18n key (`attributes.dim/val.*`); user-added values/dims use the stored label as-is.
- Typed-route casts (`as Href`) on the new `/sequence/*` and `/categories` routes until `expo start` regenerates `.expo/types`.
- **Replace-mode restore of an old v1 backup** wipes the seeded taxonomy; it re-seeds on the next app launch (init runs `seedAttributes` when empty). Harmless but worth knowing.

## Phase 2 (future, not built)
- **Single concatenated `.mp4`** export ("save as one video"). `expo-video` has no concat API; `ffmpeg-kit-react-native` was retired (Jan 2025). Options: revisit a maintained native lib, or server-side render. Until then, export = ordered-clips zip + in-app back-to-back playback.

## Manual actions
- None new. Still pending the native rebuild from handoffs 09/13 (expo-localization, @sentry/react-native) to run on device.

## Verify
1. Import videos on 2–3 movements; categorize them (add a custom value too).
2. Sequences tab → New → filter (e.g. andamento=rápido, estilo=universitário) → tap movements → Play (confirm clips play back-to-back) → name + Save.
3. Open the saved sequence → Play again → Export (share sheet opens with the zip).
4. Backup export → confirm `data.json` has the new tables → import into a clean app → sequences + categories intact.
