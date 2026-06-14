# 21 — Video capture/sources rework + foot attribute fix

**Date:** 2026-06-14
**Status:** ✅ Code done — `tsc --noEmit` clean, `expo install --check` green. ⚠️
**Native rebuild required** (new native dep + permissions). On `master`.
**Commit:** _this_.

Four user-requested changes:

## 1. Video is the first option when creating a movement
Before, video could only be added on the movement **detail/edit** screen (the
`VideoSection`, near the bottom) — `movement/new.tsx` had no video field at all.
Now the **new movement** form opens with a video section at the **top**.
- The pick is **staged** in component state (`stagedVideo: PickedVideo`) and only
  copied/attached on **Save**, after the movement row exists (`create()` returns
  the new id → `importVideoForMovement(db, id, staged)`).
- If the movement saves but the video attach throws, the movement is still kept
  and the user is told to re-add the video (no lost entry).

## 2. Browse device files (Downloads, etc.), not just the camera roll
The old picker used only `ImagePicker.launchImageLibraryAsync`, which lists the
**media library** (camera roll) — videos in Downloads didn't show, forcing the
user to move files into the camera folder. Added a **Files** source via
`expo-document-picker` `getDocumentAsync({ type: 'video/*' })`, which opens the
system file browser (SAF on Android) and reaches Downloads and any folder.

## 3. Record a video in-app with the camera (saved to the device too)
New **Record** source: `ImagePicker.launchCameraAsync({ mediaTypes: ['videos'] })`.
The recording is **also saved to the device gallery** (`expo-media-library`
`saveToLibraryAsync`, write-only permission, best-effort) so it persists like a
normal camera capture, then imported into the app.

→ Sources 1–3 are surfaced by one new component, `VideoSourceButtons`
(Record / Gallery / Files), reused in: new-movement, movement-detail empty
state, and the detail-screen "Replace" toggle. All pick/copy/thumbnail logic
moved into a shared service `src/services/video-import.ts`
(`pickVideo(source)` → discriminated result; `importVideoForMovement(db, id,
picked)`), so both screens share one implementation.

## 4. Removed the neutral "indiferente" foot option
Starting/ending foot is right **or** left — never both. Removed `indiferente`
from `FOOT_VALUES` (`forro-attributes.ts`) so `pe_inicio`/`pe_fim` now offer only
Right/Left, plus its `attributes.val.*` keys in both locales. For **existing
installs** (taxonomy already seeded, so `seedAttributes` won't re-run), an
idempotent cleanup in `initDatabase` deletes the seeded `indiferente` rows
(`retireRemovedAttributeValues`); the FK cascade drops any movement tags that
used it. `maos.ambas` ("Both" hands) is unaffected — that one is valid.

## Files
- **New:** `src/services/video-import.ts`, `src/components/movements/VideoSourceButtons.tsx`,
  `docs/qa/...` (prior), this handoff.
- **Changed:** `app/movement/new.tsx` (video-first + staged attach),
  `src/components/movements/VideoSection.tsx` (uses service + chooser),
  `src/constants/forro-attributes.ts`, `src/db/setup.ts` (cleanup),
  `src/services/sentry.ts` (`gallery_save_failed` tag),
  `src/i18n/locales/{en,pt-BR}.ts` (video chooser keys + foot value removal),
  `app.json` (plugins + permissions), `package.json` (`expo-media-library`).

## Dependencies
- **Added:** `expo-media-library ~56.0.7` (first-party Expo, SDK-56-pinned).
- Already present + now used for picking: `expo-image-picker`, `expo-document-picker`.

## Manual actions ⚠️
- **`npx expo run:android`** (and `run:ios`) — native rebuild links
  `expo-media-library` and applies the new `app.json` permission config
  (camera + microphone + photo-library add). **Camera recording and gallery
  save do nothing until this is done.** The Files source + foot fix are JS-only
  but ship in the same build.
- Android permissions added via the `expo-image-picker` + `expo-media-library`
  config plugins (CAMERA, RECORD_AUDIO, media access). iOS `infoPlist` gained
  `NSMicrophoneUsageDescription` + `NSPhotoLibraryAddUsageDescription`.

## Decisions / notes
- Movement **detail** screen keeps its video section in place (lower down); the
  "first option" requirement was about the **create** flow. Reorder later if
  wanted.
- `saveToLibraryAsync` is marked deprecated in the SDK-56 docs but still
  functions; chosen as the simplest write-only save. Revisit if a future SDK
  removes it (the page points to a class-based `Asset` API).

## Verify (device, after rebuild)
1. **Create movement** → video chooser is the first thing; Record / Gallery /
   Files all work; Save attaches the video (thumbnail appears on the card).
2. **Record** → after saving, the clip is also in the phone's gallery/camera roll.
3. **Files** → can browse to Downloads and pick a video there.
4. **Foot attribute** (movement detail) → "Starting/Ending foot" shows only
   Right/Left. On an upgraded install, any previously-set "Either" tag is gone.
5. Replace flow on an existing movement still works (chooser under "Replace").
