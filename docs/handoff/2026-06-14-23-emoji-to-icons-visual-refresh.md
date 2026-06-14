# 23 — Emoji → lucide icons + visual refresh

**Date:** 2026-06-14
**Status:** ✅ Done — `tsc --noEmit` clean. JS only (lucide already linked), **no
native rebuild** — runs via `expo start`. On `master`.
**Commit:** _this_.

Replaced every emoji in the UI with consistent [lucide] stroke icons and a
professional-pass on the high-traffic surfaces, to shed the "generic" feel.
Direction (user-chosen): **dance styles = name only** (no icon/monogram);
**icons + deep visual refresh**, **keep the violet brand accent** (no palette
change).

## Icon system
- **Moods** (`src/constants/moods.ts`): `emoji` field → a lucide `Icon` per mood
  (great `Laugh`, good `Smile`, ok `Meh`, tough `Frown`), colored with the
  existing mood color. `getMoodEmoji()` → **`getMood()`** (returns the full
  descriptor incl. `Icon`/`color`). Used in EntryCard, the entry mood pickers
  (new + [id]), and the stats mood breakdown.
- **Dance styles = name only**: dropped `{style.icon}` everywhere it rendered
  (cards, list chips, stats). The emoji still sit unused in the `styles.icon`
  DB column + `dance-styles.ts` seed (data, never rendered) — left as-is for
  backup compatibility; not worth a migration.
- **Inline meta** (`src/components/ui/MetaItem.tsx`, new): one muted icon+label
  row — 👤→`User`, 📍→`MapPin`, ⏱→`Clock`. Reused by EntryCard + TemplateCard.
- **Empty states** (`EmptyState.tsx`): `emoji` prop → **`Icon`** (lucide) shown
  in a rounded surface tile (more designed). Call sites pass the matching tab
  icon: journal `BookOpen`, movements `Dumbbell`, sequences `Film`, templates
  `LayoutTemplate`, tags `Tag`.
- **Stat cards** (`stats.tsx`): `emoji` → `Icon` (`BookOpen`/`Dumbbell`/`Clock`,
  violet). `BarRow` gained an optional leading `Icon` (used for the mood faces).
- **Onboarding**: the 3 big emoji → lucide (`BookOpen`/`Dumbbell`/`ShieldCheck`)
  inside a violet-tinted rounded tile.
- **Movement card** placeholder 💃 → `Music`; **tags** selected-swatch ✓ →
  `Check`; **storage** import-warning `⚠️` text marker dropped.

## Standards applied (Material 3 / HIG / lucide)
- One icon family (lucide), consistent stroke (default 2). Size scale: **24**
  primary, **20–22** stat/section, **13–14** inline meta, **28** empty-state.
- Icons are themeable (color-driven) — unlike emoji, which render differently
  per OS and read as playful/generic.
- Empty states + onboarding use an icon-in-tile treatment for a more crafted
  feel; mood faces carry the mood color.

## Files
- **New:** `src/components/ui/MetaItem.tsx`.
- **Changed:** `src/constants/moods.ts`; `src/components/ui/EmptyState.tsx`;
  `src/components/{entries/EntryCard,templates/TemplateCard,movements/MovementCard}.tsx`;
  `app/(tabs)/{index,movements,sequences,templates,stats}.tsx`; `app/tags.tsx`;
  `app/onboarding.tsx`; `app/{entry,movement,template}/{new,[id]}.tsx`;
  `app/storage.tsx`.

## Decisions / scope notes
- **Primitives left intact**: `Button`, `Card`, `StatusBadge` are already a
  coherent dark/violet system — churning them risks regressions for little gain,
  so the "refresh" focused on the emoji removal + the empty-state / stat-card /
  card-meta / onboarding treatments (shared components → propagate app-wide).
  Per-screen layout/spacing was largely left as-is; a deeper screen-by-screen
  pass can follow if wanted.
- Mood/status breakdown labels in Stats remain the English `label` (pre-existing;
  the bars now lead with the mood icon). Not in scope here.

## Verify (JS — `expo start`, no rebuild)
1. Every list/empty state shows lucide icons, no emoji anywhere in the UI.
2. Entry/movement/template/style chips show the **style name only**.
3. Mood pickers + entry cards + stats show **face icons** in the mood color.
4. Onboarding shows the three tinted icon tiles.
5. Movement with no thumbnail shows the `Music` placeholder.
