import { asc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';
import { now } from '@/utils/date';
import type { MovementStatus } from '@/types';

type DB = ExpoSQLiteDatabase<typeof schema>;

export type NewMovementInput = {
  name: string;
  styleId?: number | null;
  status?: MovementStatus;
  notes?: string | null;
};

export function movementsRepo(db: DB) {
  return {
    async getAll() {
      return db
        .select()
        .from(schema.movements)
        .orderBy(asc(schema.movements.name));
    },

    async getById(id: string) {
      const rows = await db
        .select()
        .from(schema.movements)
        .where(eq(schema.movements.id, id));
      return rows[0] ?? null;
    },

    async create(input: NewMovementInput): Promise<string> {
      const id = newUUID();
      const timestamp = now();
      await db.insert(schema.movements).values({
        id,
        name: input.name,
        styleId: input.styleId ?? null,
        status: input.status ?? 'new',
        notes: input.notes ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return id;
    },

    async update(id: string, input: Partial<NewMovementInput>): Promise<void> {
      await db
        .update(schema.movements)
        .set({ ...input, updatedAt: now() })
        .where(eq(schema.movements.id, id));
    },

    async updateStatus(
      id: string,
      newStatus: MovementStatus,
      entryId?: string,
      note?: string
    ): Promise<void> {
      const current = await this.getById(id);
      if (!current) return;

      const oldStatus = current.status as MovementStatus;
      if (oldStatus === newStatus) return;

      await db
        .update(schema.movements)
        .set({ status: newStatus, updatedAt: now() })
        .where(eq(schema.movements.id, id));

      await db.insert(schema.movementProgress).values({
        id: newUUID(),
        movementId: id,
        entryId: entryId ?? null,
        date: now().split('T')[0],
        oldStatus,
        newStatus,
        note: note ?? null,
      });
    },

    async delete(id: string): Promise<void> {
      await db.delete(schema.movements).where(eq(schema.movements.id, id));
    },
  };
}
