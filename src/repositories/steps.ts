import { asc, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';

type DB = ExpoSQLiteDatabase<typeof schema>;

export function stepsRepo(db: DB) {
  return {
    async getTimes(movementId: string): Promise<number[]> {
      const rows = await db
        .select()
        .from(schema.movementSteps)
        .where(eq(schema.movementSteps.movementId, movementId))
        .orderBy(asc(schema.movementSteps.idx));
      return rows.map((r) => r.timeMs);
    },

    async setTimes(movementId: string, times: number[]): Promise<void> {
      await db
        .delete(schema.movementSteps)
        .where(eq(schema.movementSteps.movementId, movementId));
      if (times.length > 0) {
        const sorted = [...times].sort((a, b) => a - b);
        await db.insert(schema.movementSteps).values(
          sorted.map((timeMs, idx) => ({
            id: newUUID(),
            movementId,
            idx,
            timeMs: Math.round(timeMs),
          }))
        );
      }
    },
  };
}
