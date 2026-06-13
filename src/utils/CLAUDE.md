# src/utils/ — pure helpers

- `uuid.ts` — `newUUID()` (ids for all rows).
- `date.ts` — `now()` (ISO), `todayDate()` (YYYY-MM-DD), `formatDate`/`formatRelativeDate` (i18n-aware: uses the global `i18n` instance + `Intl.DateTimeFormat(i18n.language)`).
- `tempo.ts` — BPM/step-sync math: `naturalBpm(times)` = `60000 / min(interval between markers)` (base beat; the prolonged forró step ≈2× falls out), `medianBpm(bpms)` (default sequence target, 120 fallback), `clipRate(clipBpm, targetBpm)` = `clamp(target/clipBpm, 0.25..4)`, `clampBpm`, `BPM_MIN/MAX` (60/180).

Keep this dir framework-free and side-effect-free (except `date.ts`'s read of the shared i18n instance). The same `clipRate` is used for both live playback (`SequencePlayer`) and FFmpeg export (`sequence-concat`, branch) — keep them in sync via this module.
