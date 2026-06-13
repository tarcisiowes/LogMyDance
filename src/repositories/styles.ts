import { asc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';

type DB = ExpoSQLiteDatabase<typeof schema>;

export function stylesRepo(db: DB) {
  return {
    async getAll() {
      return db.select().from(schema.styles).orderBy(asc(schema.styles.name));
    },

    async getById(id: number) {
      const rows = await db
        .select()
        .from(schema.styles)
        .where(eq(schema.styles.id, id));
      return rows[0] ?? null;
    },

    async create(name: string, icon?: string): Promise<number> {
      const result = await db
        .insert(schema.styles)
        .values({ name, icon: icon ?? null, isCustom: 1 })
        .returning({ id: schema.styles.id });
      return result[0].id;
    },

    async delete(id: number): Promise<void> {
      await db.delete(schema.styles).where(eq(schema.styles.id, id));
    },
  };
}
