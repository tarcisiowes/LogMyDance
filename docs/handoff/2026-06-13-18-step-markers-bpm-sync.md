# 18 — Step markers (pisadas) + BPM tempo sync

**Date:** 2026-06-13
**Status:** ✅ Done — `tsc --noEmit` clean. JS / expo-video only, **no native dep**. On `master`.
**Commits:** 1ee589c (markers data + screen), + this (sync + pulse).

## What was done
Mark the steps ("pisadas") of each movement's video, store them per movement, and use them to **sync clips of different speeds to a common BPM** during sequence playback.

### Data + math
- `movement_steps` table (`SCHEMA_VERSION 3`, in backup, `APP_SCHEMA_VERSION 3`). `stepsRepo` (`getTimes`/`setTimes`), `sequencesRepo.getStepsForMovements`.
- `src/utils/tempo.ts`: `naturalBpm(times)` = `60000 / min(interval)` (base beat = smallest gap; the prolonged forró step ≈2× falls out naturally), `medianBpm`, `clipRate(clipBpm, target) = clamp(target/clipBpm, 0.25..4)`.

### Marking — `app/steps/[id].tsx`
Video + timeline scrubber. Play/pause, ±0.1s nudge (`seekBy`), **"Mark step"** records `currentTime`; markers shown as dots, tap to remove; tap the bar to seek (uses `timeUpdate` @ 0.1s for the playhead). Shows count + derived BPM. Saved per movement → reused everywhere. Entry: "Mark steps" button in `movement/[id]` video section.

### Sync + pulse — `SequencePlayer` + `BpmControl`
- `SequencePlayer` takes `tempoSync={ enabled, targetBpm }`; sets `player.playbackRate = clipRate(...)` per clip on load/advance, and live when the slider/toggle changes. Clips without markers play at 1×.
- A **pulse dot + step counter** (e.g. `2/5`) flashes as each marker time is crossed (`timeUpdate` @ 0.05s; compares clip-time to markers — independent of rate). Resets per clip.
- `BpmControl`: sync toggle + BPM control (JS slider via tap-to-set + −/＋, range 60–180 — **no native Slider dep**, built with plain `Pressable`/layout). Default target = **median** of clips' natural BPMs; **sync auto-on** when any clip has markers; disabled (with hint) when none do.
- Wired in `sequence/new` (auto-default until the user touches it) and `sequence/[id]`.

## Decisions / notes
- Sync is **playback-transient** (not persisted on the sequence) — avoids a `sequences` column migration. The per-movement markers are what persist.
- Prolonged step is auto-derived (no explicit "hold" tagging) — matches "just mark each pisada".
- BPM target source = auto median + manual slider; sync defaults on when markers exist (both user-chosen).

## Out of scope (future)
- **Export `.mp4` with sync**: apply the same per-clip rate in FFmpeg (`setpts=PTS/rate`, `atempo`) on the `feat/sequence-concat` branch (phase 3). The merge of that branch will conflict in `SequencePlayer.tsx` + `sequence/[id].tsx` + locale `sequences` block (both touched) — resolve at merge.
- Audio of muted clips (still deferred, per earlier decision).

## Verify (device, JS — no rebuild needed for this feature)
1. Movement with video → "Mark steps" → pause, mark 3–5 pisadas, save; reopen → markers persist.
2. Mark a 2nd movement (different step count / recording speed).
3. Sequence with both → BPM control shows, Sync on → drag BPM → clips play at the same tempo (steps aligned), pulse flashes on each step.
4. Backup export→import on a clean app → markers intact.
