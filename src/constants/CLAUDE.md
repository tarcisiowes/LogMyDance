# src/constants/ — fixed app data

- `moods.ts` — `MOODS` (value/emoji/color) + `getMoodEmoji/Color`. Labels translated via `i18n/labels.moodKey`, not the `label` field.
- `statuses.ts` — `MOVEMENT_STATUSES` (value/color/bgColor). Labels via `labels.statusKey`.
- `dance-styles.ts` — `DEFAULT_DANCE_STYLES` seeded into `styles` on fresh install. Proper nouns, not translated.
- `forro-attributes.ts` — `FORRO_ATTRIBUTES`: default forró taxonomy (dimensions + values, single/multi) seeded into `attribute_dimensions`/`attribute_values` (idempotent, see `db/setup.ts`). Stored `label` is the PT fallback; UI prefers i18n keys `attributes.dim.<k>` / `attributes.val.<dim>.<k>`. Users can add custom values/dimensions on top.

When you add a default value/dimension here, also add its i18n key to both locales (`attributes.*`). Existing installs re-seed only when the table is empty — changing the constant won't retro-add to a populated DB.
