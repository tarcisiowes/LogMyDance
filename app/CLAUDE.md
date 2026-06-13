# app/ — screens (expo-router)

File-based routing (expo-router, **typed routes** on). Files here = routes.

- `_layout.tsx` — root `Stack`. Registers every non-tab screen + titles (i18n via `t('nav.*')`), runs `AppStartup` (app-opens, install date, orphan cleanup, onboarding redirect), `import '@/i18n'`, `initSentry()`.
- `(tabs)/` — 5 tabs: `index` (journal), `movements`, `sequences`, `templates`, `stats`. `(tabs)/_layout.tsx` defines them.
- `entry|movement|template/{new,[id]}.tsx` — CRUD forms (react-hook-form + zod). `sequence/{new,[id]}.tsx`, `steps/[id].tsx`, `categories.tsx`, `storage.tsx`, `settings.tsx`, `privacy.tsx`, `onboarding.tsx`.

## Conventions
- Dark theme always: `bg-neutral-950`, violet-600 accent (NativeWind classes). No light theme yet.
- All user-facing text via `useTranslation()` → `t('...')`. Never hardcode strings (see `src/i18n/CLAUDE.md`).
- DB access through `useDb()` + a repo factory (`xRepo(db)` from `src/repositories/`). Never raw SQL in screens except trivial counts.
- Reload-on-focus lists with `useFocusEffect`. Detail screens load in `useEffect`.
- Header delete buttons via `navigation.setOptions({ headerRight })`.
- **Typed-routes gotcha**: a newly added route isn't in `.expo/types` until `expo start` regenerates it → cast `router.push('/new-route' as Href)`.
- New screen ⇒ also register it in `app/_layout.tsx` (title) unless it's a tab.
