# src/repositories/ — data access

One factory per aggregate: `export function xRepo(db) { return { ...methods }; }`. Screens call `xRepo(useDb())`.

Files: `entries`, `movements`, `templates`, `tags`, `styles`, `media`, `stats`, `attributes`, `sequences`, `steps`.

## DB type
- Simple CRUD: `type DB = ExpoSQLiteDatabase<typeof schema>` and use drizzle (`db.select()/insert()/update()/delete()` with `eq`, `and`, `asc`…).
- Need raw SQL (aggregates, dynamic IN-lists, joins): `type DB = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase }` and use `db.$client.getAllAsync/getFirstAsync(sql, params)`. NOTE the bare `ExpoSQLiteDatabase<>` alias does **not** expose `$client` — either intersect it (as above) or use `ReturnType<typeof drizzle<typeof schema>>` (see `stats.ts`).

## Conventions
- `newUUID()` ids, `now()` timestamps (`@/utils`).
- Set-style relations (tags, attributes, sequence items, steps) = delete-then-insert in the method.
- Filtered/aggregate queries that join media should require a **ready** video where relevant (see `attributes.getMovementsByFilters`, `sequences` clip queries).
- Return plain rows/maps; keep React out of repos.
