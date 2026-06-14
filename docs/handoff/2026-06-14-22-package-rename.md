# 22 — Package / bundle id → com.showasoul.logmydance

**Date:** 2026-06-14
**Status:** ✅ Config + native id rename done. ⚠️ Native rebuild required. On `master`.
**Commit:** _this_.

Renamed the app identifier from `com.logmydance.app` to **`com.showasoul.logmydance`**
across the JS config and both native projects, kept consistent so Android's
generated `BuildConfig`/`R` resolve (the mismatch that broke the build in
handoff 08).

## Changed (all → com.showasoul.logmydance)
- `app.json`: `android.package`, `ios.bundleIdentifier`.
- `android/app/build.gradle`: `namespace`, `applicationId`.
- Kotlin package decl + directory moved (git mv, history preserved):
  `android/app/src/main/java/com/logmydance/app/{MainActivity,MainApplication}.kt`
  → `.../com/showasoul/logmydance/`.
- `ios/.../project.pbxproj`: `PRODUCT_BUNDLE_IDENTIFIER` (Debug + Release) — was
  the stale placeholder `org.name.LogMyDance`, now aligned too.

## Not changed
- **Display name stays "LogMyDance"** (`app_name`, iOS `PRODUCT_NAME`, app.json
  `name`/`slug`). The request only gave a package string; no human-readable name
  was provided. Say the word to change the on-screen label too.
- `ios/LogMyDance/` folder + Xcode scheme keep the project name "LogMyDance"
  (tied to slug, independent of bundle id).

## Manual actions ⚠️
- **`npx expo run:android`** — gradle re-evaluates `applicationId`/`namespace`
  and regenerates `BuildConfig` under the new package. The app now installs as a
  **different package**, so it does NOT upgrade the old `com.logmydance.app`
  install in place — uninstall the old debug app first (or they coexist). Old
  on-device data won't carry over (use backup export/import; fine pre-release).
- iOS: bundle id is now `com.showasoul.logmydance` — set a signing team in Xcode
  for device builds.
- Store: no listing exists yet, so the new id is clean. If `com.logmydance.app`
  was ever reserved anywhere, this is a separate app.

## Verify
- `git grep com.logmydance` returns nothing outside the historical handoff 08.
- After rebuild: `adb shell pm list packages | grep showasoul` shows the new id;
  the launcher icon still reads "LogMyDance".
