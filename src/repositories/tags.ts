import { asc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';

type DB = ExpoSQLiteDatabase<typeof schema>;

export type NewTagInput = {
  name: string;
  color?: string | null;
};

export function tagsRepo(db: DB) {
  return {
    async getAll() {
      return db.select().from(schema.tags).orderBy(asc(schema.tags.name));
    },

    async getById(id: string) {
      const rows = await db
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.id, id));
      return rows[0] ?? null;
    },

    async getByIds(ids: string[]) {
      if (ids.length === 0) return [];
      const all = await this.getAll();
      return all.filter((t) => ids.includes(t.id));
    },

    async create(input: NewTagInput): Promise<string> {
      const id = newUUID();
      await db.insert(schema.tags).values({
        id,
        name: input.name,
        color: input.color ?? null,
      });
      return id;
    },

    async update(id: string, input: Partial<NewTagInput>): Promise<void> {
      await db
        .update(schema.tags)
        .set(input)
        .where(eq(schema.tags.id, id));
    },

    async delete(id: string): Promise<void> {
      await db.delete(schema.tags).where(eq(schema.tags.id, id));
    },
  };
}
