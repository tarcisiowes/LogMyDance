import { asc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';
import { now } from '@/utils/date';

type DB = ExpoSQLiteDatabase<typeof schema>;

export type NewTemplateInput = {
  name: string;
  styleId?: number | null;
  instructor?: string | null;
  location?: string | null;
  defaultDuration?: number | null;
  tagIds?: string[];
};

export function templatesRepo(db: DB) {
  return {
    async getAll() {
      return db
        .select()
        .from(schema.classTemplates)
        .orderBy(asc(schema.classTemplates.name));
    },

    async getById(id: string) {
      const rows = await db
        .select()
        .from(schema.classTemplates)
        .where(eq(schema.classTemplates.id, id));
      return rows[0] ?? null;
    },

    async create(input: NewTemplateInput): Promise<string> {
      const id = newUUID();
      await db.insert(schema.classTemplates).values({
        id,
        name: input.name,
        styleId: input.styleId ?? null,
        instructor: input.instructor ?? null,
        location: input.location ?? null,
        defaultDuration: input.defaultDuration ?? null,
        createdAt: now(),
      });

      if (input.tagIds?.length) {
        await db.insert(schema.templateTags).values(
          input.tagIds.map((tagId) => ({ templateId: id, tagId }))
        );
      }

      return id;
    },

    async update(id: string, input: Partial<NewTemplateInput>): Promise<void> {
      const { tagIds, ...fields } = input;
      await db
        .update(schema.classTemplates)
        .set(fields)
        .where(eq(schema.classTemplates.id, id));

      if (tagIds !== undefined) {
        await db
          .delete(schema.templateTags)
          .where(eq(schema.templateTags.templateId, id));
        if (tagIds.length > 0) {
          await db.insert(schema.templateTags).values(
            tagIds.map((tagId) => ({ templateId: id, tagId }))
          );
        }
      }
    },

    async delete(id: string): Promise<void> {
      await db
        .delete(schema.classTemplates)
        .where(eq(schema.classTemplates.id, id));
    },

    async getTagIds(templateId: string): Promise<string[]> {
      const rows = await db
        .select()
        .from(schema.templateTags)
        .where(eq(schema.templateTags.templateId, templateId));
      return rows.map((r) => r.tagId);
    },
  };
}
