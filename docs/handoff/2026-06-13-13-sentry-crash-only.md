# 13 — Sentry (crash-only)

**Date:** 2026-06-13
**Status:** ✅ Wired — `tsc --noEmit` clean. No-op until a DSN is set. Native rebuild required.
**Sprint:** 4 (Stats + Polish) — final theme

## What was done
Crash/error reporting via `@sentry/react-native`, strictly crash-only per roadmap correction #2 (no behavioral analytics, no PII).

- `src/services/sentry.ts` — `initSentry()` + `captureError(error, event)`.
  - Reads DSN from `Constants.expoConfig.extra.sentryDsn` or `EXPO_PUBLIC_SENTRY_DSN`. **No DSN ⇒ no-op** (init skipped, captures ignored).
  - Init disables everything behavioral: `tracesSampleRate: 0`, `enableAutoSessionTracking: false`, `enableAutoPerformanceTracing: false`, `maxBreadcrumbs: 0`, `sendDefaultPii: false`.
  - `captureError` attaches only a logical `event` tag — never notes/names/filenames.
- `initSentry()` called at module load in `app/_layout.tsx` (before render, to catch startup crashes).
- `captureError` wired at the roadmap-allowed failure sites only:
  - `VideoSection` import catch → `file_import_failed`
  - `VideoSection` thumbnail catch → `video_thumbnail_failed`
  - `storage` export catch → `export_failed`
  - `storage` import catch → `restore_failed`

## Files touched
- `src/services/sentry.ts` — **new**.
- `app/_layout.tsx` — `initSentry()` at module top.
- `src/components/movements/VideoSection.tsx`, `app/storage.tsx` — `captureError` at catch sites.
- `app.json` — `@sentry/react-native` plugin (auto-added by `expo install`) + `extra.sentryDsn: ""`.

## Dependencies
- `@sentry/react-native ~7.11.0` (**native module** — needs rebuild).

## Manual actions required
1. Create a Sentry project, set `extra.sentryDsn` in `app.json` (or `EXPO_PUBLIC_SENTRY_DSN`). Until then Sentry is inert.
2. `npx expo run:android` to link the native module.
3. (Optional, for source maps) add `organization`/`project` to the Sentry config plugin and a `SENTRY_AUTH_TOKEN` in EAS.

## Notes / follow-ups
- `db_migration_error` event type is defined but not yet wired (migrations run in `SQLiteProvider.onInit`, before `initSentry`). Wire if/when migrations land.
- Verify no PII leaks before public launch (review what error messages contain).
