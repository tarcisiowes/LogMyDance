# src/services/ — app services (side-effectful)

- `backup/` — `export.ts` / `import.ts` / `types.ts`. ZIP (`react-native-zip-archive`) with `manifest.json` + `data.json` + `media/`. Table-generic: export/import iterate `RESTORE_TABLES_ORDER` (FK-safe), so adding a table to that list is all it takes to round-trip it. Import validates versions, verifies sha256, supports replace/merge in one transaction. Bump `APP_SCHEMA_VERSION` here with any schema change.
- `storage.ts` — storage stats + `formatBytes`.
- `sentry.ts` — crash-only (`initSentry`, `captureError(err, event)`). **No-op without a DSN** (`extra.sentryDsn` / `EXPO_PUBLIC_SENTRY_DSN`). Never attach user content/PII (roadmap correction #2); only a logical `event` tag.
- `sequence-export.ts` — phase-1 sequence export: ZIP of ordered clips + manifest (share sheet). No re-encode.
- `sequence-concat.ts` — **on branch `feat/sequence-concat`** (not master). Single-`.mp4` via FFmpeg (`ffmpeg-kit-react-native-community`, loaded through a `string`-typed `require` so the app builds without it; `isConcatAvailable()` gates UI). Phase-3 supports BPM sync (`setpts`/`atempo`). Native build unverified.

## Conventions
- File IO with `expo-file-system/legacy`; strip `file://` for native libs via `stripScheme` (`backup/types`).
- Privacy by design: nothing leaves the device except user-initiated share/export. No analytics, no servers.
- Wrap optional/native-heavy deps so the JS bundle builds without them.
