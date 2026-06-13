# 06 — Backup import / restore service

**Date:** 2026-06-13
**Status:** ✅ Code done (typecheck passes) — not yet run on device

## What was done
Implements the roadmap restore rules: validate → integrity-check → conflict choice →
transactional insert → media restore.

Three-step API so the UI can prompt between validation and writing:
- `pickBackupFile()` — `expo-document-picker`, returns picked uri or null.
- `prepareBackup(uri)` — copies picked file locally (handles `content://` SAF uris),
  unzips to cache, locates `manifest.json` (root or single nested folder), validates
  `backup_version`/`schema_version` ≤ app (throws `BackupError` with a user-safe
  message otherwise), runs integrity pass (existence + SHA-256 when present), returns
  `{ manifest, integrity: { missing, corrupted }, … }`. **No DB writes.**
- `commitImport(sqlite, prepared, mode)` — `'replace'` wipes all tables first
  (reverse FK order), `'merge'` uses `INSERT OR IGNORE` by PK. All inserts run inside
  one `withTransactionAsync` → rollback-on-failure. Media files are then copied into
  this device's `videos/` `thumbnails/` dirs and `media_assets.local_path` is
  rewritten; unresolved files are marked `status='missing'`. Returns a summary.
- `cancelImport(prepared)` — deletes the cache staging dir.

Insert/restore order is FK-safe (`RESTORE_TABLES_ORDER`). `app_metadata` is excluded
so the app keeps its own `schema_version`.

## Files touched
- `src/services/backup/import.ts` — **new**
- `src/repositories/media.ts` — exported `videosDirUri()` / `thumbsDirUri()` for the
  import media-restore step.

## Dependencies
- `react-native-zip-archive` (unzip), `expo-document-picker`, `expo-crypto`,
  `expo-file-system/legacy`. See handoff 04.

## Blockers
- Native rebuild required (zip lib) — see handoff 04.

## Manual actions required
- After native rebuild, run the **roundtrip** quality gate from the roadmap:
  export → reinstall (or wipe) → import (Replace) → confirm data + videos intact.
- Also test: import with a missing media file (warns, marks missing); import a backup
  with `schema_version` bumped past the app (clear error).

## Notes / follow-ups
- `local_path` is rewritten on import, so backups are portable across installs/devices.
- Merge mode dedups by primary key (UUIDs), matching the roadmap "add without
  duplicating by UUID" rule. It does not reconcile edited rows — last-writer wins is
  not attempted (out of scope for v1).
