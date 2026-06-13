# src/db/ — database (expo-sqlite + drizzle)

- `schema.ts` — drizzle table definitions (the typed source for repos).
- `setup.ts` — `initDatabase(db)` runs in `SQLiteProvider onInit`: `CREATE TABLE IF NOT EXISTS` for every table (idempotent), seeds, sets `app_metadata.schema_version`.
- `context.tsx` — `DbProvider` + `useDb()` (returns the drizzle instance; `db.$client` is the raw `SQLiteDatabase`).

## How migrations work (important)
There is **no migration runner**. Schema changes are applied by:
1. Adding the column/table to BOTH `schema.ts` (drizzle) AND `setup.ts` (`CREATE TABLE IF NOT EXISTS`). New **tables** auto-create on existing installs (the statement runs every launch). New **columns** on an existing table do NOT (IF NOT EXISTS won't alter) — you'd need an explicit `ALTER TABLE`. So far we only add tables; prefer that.
2. Bumping `SCHEMA_VERSION` in `setup.ts` and `APP_SCHEMA_VERSION` in `src/services/backup/types.ts` together (currently **3**).
3. Adding the table to `RESTORE_TABLES_ORDER` in backup types (FK-safe: parents first) so it round-trips.

## Seeding
- `seedDatabase` (styles) runs only on a fresh install (`if (!meta)`).
- `seedAttributes` (forró taxonomy) is **idempotent** — runs whenever `attribute_dimensions` is empty, so it covers fresh installs AND upgrades. Follow this pattern for any default-data seed that must reach existing users.

IDs are UUID text (`newUUID()`), timestamps ISO via `now()` (`src/utils/`).
