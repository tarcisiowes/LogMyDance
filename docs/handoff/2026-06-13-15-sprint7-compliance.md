# 15 — Sprint 7 compliance code (privacy, R8, dep gate)

**Date:** 2026-06-13
**Status:** ✅ Done — `tsc --noEmit` clean.
**Sprint:** 7 (Launch) — codeable, non-account parts only

## What was done
The launch-prep items that are pure code (no store consoles / accounts).

1. **In-app Privacy Policy** (private-by-design):
   - `src/content/privacy.ts` — full EN + PT-BR policy text (structured sections). Not run through i18next (long-form prose); the screen picks the doc by `i18n.language`.
   - `app/privacy.tsx` — renders it. Registered route + header title (`nav.privacy`).
   - Linked from **Settings → About → Privacy policy**.
2. **R8 / ProGuard + resource shrinking for release** — `android/gradle.properties`:
   `android.enableMinifyInReleaseBuilds=true`, `android.enableShrinkResourcesInReleaseBuilds=true`. The committed `android/app/build.gradle` already reads these props; `proguard-rules.pro` exists.
3. **Dependency quality gate** — ran `expo install --check` (10 packages were behind), then `expo install --fix`. All Expo packages now match SDK 56 expected versions (expo 56.0.4→56.0.11, expo-router→56.2.10, etc.). `tsc` still clean.

## Files touched
- `src/content/privacy.ts` — **new**.
- `app/privacy.tsx` — **new**.
- `app/_layout.tsx` — `privacy` route.
- `app/settings.tsx` — Privacy row in About.
- `src/i18n/locales/en.ts` + `pt-BR.ts` — `nav.privacy`, `settings.privacy`.
- `android/gradle.properties` — R8 + shrinkResources flags.
- `package.json` / `package-lock.json` — dep version bumps from `expo install --fix`.

## Manual actions required (store submission — not code)
1. **Host the privacy policy** at a public URL and put it in both store consoles (Apple requires a Privacy Policy URL; Google requires it in the Data Safety form). The in-app screen satisfies the in-app requirement but stores still need a URL.
2. **Release signing**: `android/app/build.gradle` still signs `release` with the **debug** keystore (line ~115). Generate a real upload keystore before any store build.
3. **Verify the minified release build**: `cd android && ./gradlew assembleRelease` — R8 can strip reflection-used classes; RN/Expo ship keep-rules but smoke-test the .aab/.apk and add rules to `proguard-rules.pro` if anything breaks.
4. Build an **.aab** (not .apk) for Google Play; fill Data Safety + Privacy Nutrition labels; set category Health & Fitness, age 4+.

## Caveats / follow-ups
- **Prebuild durability**: the R8 flags live in `android/gradle.properties`. A future `expo prebuild --clean` regenerates `android/` and drops them. For durability, move them to an `expo-build-properties` plugin block in `app.json` (`enableProguardInReleaseBuilds` / `enableShrinkResourcesInReleaseBuilds`). Kept in gradle.properties for now since `android/` is committed and built directly (handoff 08).
- Still pending native rebuild from handoffs 09/13 (expo-localization, @sentry/react-native).
