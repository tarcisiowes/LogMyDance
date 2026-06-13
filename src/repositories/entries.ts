import { desc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';
import { now } from '@/utils/date';
import type { Mood } from '@/types';

type DB = ExpoSQLiteDatabase<typeof schema>;

export type NewEntryInput = {
  date: string;
  styleId?: number | null;
  instructor?: string | null;
  location?: string | null;
  durationMin?: number | null;
  mood?: Mood | null;
  notes?: string | null;
  templateId?: string | null;
  tagIds?: string[];
  movementIds?: string[];
};

export function entriesRepo(db: DB) {
  return {
    async getAll() {
      return db
        .select()
        .from(schema.danceEntries)
        .orderBy(desc(schema.danceEntries.date));
    },

    async getById(id: string) {
      const rows = await db
        .select()
        .from(schema.danceEntries)
        .where(eq(schema.danceEntries.id, id));
      return rows[0] ?? null;
    },

    async create(input: NewEntryInput): Promise<string> {
      const id = newUUID();
      const timestamp = now();
      await db.insert(schema.danceEntries).values({
        id,
        date: input.date,
        styleId: input.styleId ?? null,
        instructor: input.instructor ?? null,
        location: input.location ?? null,
        durationMin: input.durationMin ?? null,
        mood: input.mood ?? null,
        notes: input.notes ?? null,
        templateId: input.templateId ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      if (input.tagIds?.length) {
        await db.insert(schema.entryTags).values(
          input.tagIds.map((tagId) => ({ entryId: id, tagId }))
        );
      }

      if (input.movementIds?.length) {
        await db.insert(schema.entryMovements).values(
          input.movementIds.map((movementId) => ({ entryId: id, movementId }))
        );
      }

      return id;
    },

    async update(id: string, input: Partial<NewEntryInput>): Promise<void> {
      const { tagIds, movementIds, ...fields } = input;
      await db
        .update(schema.danceEntries)
        .set({ ...fields, updatedAt: now() })
        .where(eq(schema.danceEntries.id, id));

      if (tagIds !== undefined) {
        await db.delete(schema.entryTags).where(eq(schema.entryTags.entryId, id));
        if (tagIds.length > 0) {
          await db.insert(schema.entryTags).values(
            tagIds.map((tagId) => ({ entryId: id, tagId }))
          );
        }
      }

      if (movementIds !== undefined) {
        await db
          .delete(schema.entryMovements)
          .where(eq(schema.entryMovements.entryId, id));
        if (movementIds.length > 0) {
          await db.insert(schema.entryMovements).values(
            movementIds.map((movementId) => ({ entryId: id, movementId }))
          );
        }
      }
    },

    async delete(id: string): Promise<void> {
      await db.delete(schema.danceEntries).where(eq(schema.danceEntries.id, id));
    },

    async getTagIds(entryId: string): Promise<string[]> {
      const rows = await db
        .select()
        .from(schema.entryTags)
        .where(eq(schema.entryTags.entryId, entryId));
      return rows.map((r) => r.tagId);
    },

    async getMovementIds(entryId: string): Promise<string[]> {
      const rows = await db
        .select()
        .from(schema.entryMovements)
        .where(eq(schema.entryMovements.entryId, entryId));
      return rows.map((r) => r.movementId);
    },
  };
}
