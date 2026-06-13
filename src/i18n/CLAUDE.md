# src/i18n/ — internationalization (i18next + react-i18next)

App is fully bilingual **EN + PT-BR**. Every user-facing string is a key.

- `index.ts` — init; `detectLanguage()` = saved pref (MMKV) → device locale (`expo-localization`) → EN. `changeLanguage(lng)` persists + switches.
- `locales/en.ts` — **source of truth**. `TranslationSchema = typeof en`.
- `locales/pt-BR.ts` — typed `: TranslationSchema`, so a missing/renamed key fails `tsc`. Keep the two files structurally identical.
- `i18next.d.ts` — typed-keys augmentation.
- `labels.ts` — `moodKey`/`statusKey` (enum→literal key) and `dimensionLabel`/`valueLabel` (default attr rows→i18n key, custom rows→stored label).

## Gotchas
- `en.ts` must NOT be `as const` — that makes value types literal and PT-BR assignment fails.
- Typed `t()` rejects `string` variables and template-literal keys. Pass **literal** keys, or map a value→literal key (see `labels.ts`), or cast `t(key as never, { defaultValue })` for dynamic data labels.
- Plurals/counts: keys use plain `{{count}}` interpolation + literal "(s)", not i18next `_one/_other` suffixes (keeps typed keys simple).
- Adding UI ⇒ add the key to BOTH locale files (same path) in the same edit.
- Dance-style names + `BackupError` messages are intentionally English (data / edge errors).
