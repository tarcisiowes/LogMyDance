# 17 — Phase 2: single-MP4 concatenation (FFmpeg) — on a branch

**Date:** 2026-06-13
**Branch:** `feat/sequence-concat` (NOT merged to master)
**Status:** ⚠️ Code complete + `tsc` clean, but **native build unverified**. The FFmpeg module must be installed + the app rebuilt + tested on device before merge.

## Why a branch
The integration depends on a native FFmpeg binary that this environment cannot compile/run. `master` stays known-good; merge this branch only after a successful device build + smoke test.

## Research (June 2026) — concat options
- `expo-video`: playback only, **no** concat.
- `react-native-video-processing`: trim/compress/watermark, **no** concat.
- `@louiscapelle/react-native-video-editing`: Expo module but only `mixVideoWithAudio` (good reference pattern, not concat).
- **FFmpegKit (official)**: retired Apr 2025, binaries pulled from Maven/CocoaPods/npm.
- **FFmpegKit community forks**: `ffmpeg-kit-react-native-community` (6.0.2-fork.1, LGPL default, Sep 2025), `@spreen/ffmpeg-kit-react-native`, RebootMotion. Community-maintained, re-hosted binaries.
- Custom Expo native module (AVMutableComposition + MediaCodec/MediaMuxer): cleanest but heavy; Android transcode is hard.
- Server-side render: rejected — violates "private by design" (videos would leave the device).

**Chosen:** FFmpegKit community fork (fastest path to a working single .mp4). User-approved direction.

## What's implemented
- `src/services/sequence-concat.ts`:
  - `concatSequenceToMp4(name, clips)` → builds one FFmpeg concat-filter command (scale+pad each clip to 720×1280, `fps=30`, `aresample`, `concat=n=N:v=1:a=1`), re-encodes with **built-in `mpeg4` + `aac`** (so the **LGPL** build suffices — no GPL x264). Returns the `.mp4` uri.
  - The module is loaded via a `string`-typed `require(FFMPEG_PKG)` so the app **builds without the package**; `isConcatAvailable()` reflects presence.
- `app/sequence/[id].tsx`: "Save as one video" button (shown when ≥2 playable clips) → concat → share sheet. Shows a "merging…" note; if the module is absent, an alert tells the user to rebuild.
- i18n: `sequences.exportVideo/merging/exportVideoFailed/exportVideoUnavailable` (EN/PT).

## To activate (manual — supply-chain decision is yours)
```bash
npm install ffmpeg-kit-react-native-community
npx expo run:android      # and run:ios — links + builds the native FFmpeg
```
If autolinking doesn't fetch the binaries, use the Expo config plugin `@config-plugins/ffmpeg-kit-react-native` (set the `package` variant) or the fork's documented Maven/Pods repo. Min Android SDK may bump to 24.

## Licensing
Default **LGPL** build is enough because we encode with `mpeg4`/`aac` (built-in). If you want **H.264** quality you need a `-gpl` variant (libx264) → then the app must comply with **GPL** (a real constraint for a closed store app). Recommend staying LGPL/mpeg4 unless quality forces otherwise.

## Known limitations / risks
1. **Native build untested here** — verify it compiles on device.
2. **Clips without an audio stream** break the command (`[i:a]` maps a missing stream). Dance clips usually have audio; robust handling needs an ffprobe pass per clip (TODO).
3. **App size** +~20–40 MB/arch from the FFmpeg binary.
4. **Fork maintenance**: community fork, not guaranteed long-term. Pin the version.
5. Output is letterboxed to 720×1280 portrait; tune `TARGET_W/H` if needed.
6. mpeg4 (MPEG-4 Part 2) quality < H.264; acceptable for review/sharing.

## Verify (on device, after install + rebuild)
1. Build a sequence with 2–3 clips that have audio.
2. Open it → "Save as one video" → wait for merge → share sheet opens with the `.mp4`.
3. Play the result — clips should be concatenated, letterboxed uniformly, with audio.
4. If it fails, check the FFmpeg session logs; most issues are missing-audio clips or a binary/repo resolution problem.

## Merge when green
`git checkout master && git merge feat/sequence-concat && git push`
