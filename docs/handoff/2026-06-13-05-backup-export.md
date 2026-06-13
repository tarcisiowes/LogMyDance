# 05 — Backup export service (zip + manifest)

**Date:** 2026-06-13
**Status:** ✅ Code done (typecheck passes) — not yet run on device

## What was done
Implements the roadmap export spec (`logmydance-roadmap.md` "CORREÇÃO 3"): a
self-contained `.zip` with `manifest.json`, `data.json`, and a `media/` folder.

- `exportBackup(sqlite)`:
  - Dumps all 10 data tables via `SELECT *` into `data.json` (snake_case rows).
  - Copies every existing media file into `media/` (basename filenames).
  - Builds `manifest.json` (app, backup_version=1, schema_version=1, platform,
    app_version from `expo-constants`, counts, and a `media_files[]` list with
    `id` = `media_assets.id`, kind, filename, size, sha256).
  - Zips a staging dir → `DocumentDirectory/logmydance-backup-<YYYY-MM-DD>.zip`.
  - Always cleans the staging dir (`finally`).
- `shareBackup(zipUri)` → `expo-sharing` share sheet (gated on `isAvailableAsync`).
- SHA-256 computed from base64 file contents, **skipped for files > 50 MB**
  (`SHA256_MAX_BYTES`) to avoid OOM — those verify by existence+size on import.

## Files touched
- `src/services/backup/types.ts` — **new** (format constants, table order, types,
  `BackupError`, `stripScheme`/`basename` helpers)
- `src/services/backup/export.ts` — **new**

## Dependencies
- `react-native-zip-archive` (zip), `expo-sharing`, `expo-crypto`, `expo-constants`,
  `expo-file-system/legacy`. See handoff 04.

## Blockers
- Native rebuild required (zip lib) — see handoff 04. Cannot smoke-test export from a
  JS reload alone.

## Manual actions required
- After native rebuild: Stats → Storage & Backup → Export → confirm a `.zip` opens in
  the share sheet and contains `manifest.json` + `data.json` + `media/`.

## Notes / follow-ups
- `react-native-zip-archive` paths are passed without the `file://` scheme
  (`stripScheme`); `expo-sharing` receives the `file://` uri.
- Roadmap ZIP fallback (JSON-only export if native zip fails on a platform during
  beta) is **not** implemented — add if a platform misbehaves.
