# src/stores/ — client state (MMKV)

- `preferences.ts` — single `MMKV` instance + a `preferences` object of typed getters/setters. Holds UI/app state that is NOT schema: `theme`, `language`, `onboarding_completed`, `app_opens_count`, `install_date`.

## Notes
- Schema/version lives in SQLite (`app_metadata`), never here — backup/migrations depend on it.
- `language` is read directly in `i18n/index.ts` (raw, undefined when unset → device detection). Don't add a defaulting getter that hides "unset".
- Add a key ⇒ add a typed getter/setter here; keep call sites off raw `storage.get/set`.
- `i18n.t` for attribute/date labels reads the global i18n instance (not the hook) in some utils — fine, screens re-render on focus.
