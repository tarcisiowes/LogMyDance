import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';
import { now } from '@/utils/date';

type DB = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

export type SequenceRow = { id: string; name: string; createdAt: string; updatedAt: string };

export type SequenceListItem = {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  thumbnailPath: string | null;
};

export type SequenceClip = {
  movementId: string;
  name: string;
  position: number;
  videoPath: string | null;
  thumbnailPath: string | null;
};

export type MovementMedia = {
  id: string;
  name: string;
  videoPath: string | null;
  thumbnailPath: string | null;
};

const CLIP_SELECT = `
  si.movement_id as movementId, si.position as position, m.name as name,
  (SELECT local_path FROM media_assets WHERE owner_type='movement' AND owner_id=m.id AND kind='video' AND status='ready' LIMIT 1) as videoPath,
  (SELECT local_path FROM media_assets WHERE owner_type='movement' AND owner_id=m.id AND kind='thumbnail' LIMIT 1) as thumbnailPath`;

export function sequencesRepo(db: DB) {
  const client = db.$client;

  return {
    async getAll(): Promise<SequenceListItem[]> {
      return client.getAllAsync<SequenceListItem>(
        `SELECT s.id, s.name, s.created_at as createdAt,
           (SELECT COUNT(*) FROM sequence_items si WHERE si.sequence_id = s.id) as itemCount,
           (SELECT ma.local_path FROM media_assets ma
              JOIN sequence_items si2 ON si2.movement_id = ma.owner_id
              WHERE si2.sequence_id = s.id AND ma.owner_type = 'movement' AND ma.kind = 'thumbnail'
              ORDER BY si2.position LIMIT 1) as thumbnailPath
         FROM sequences s ORDER BY s.updated_at DESC`
      );
    },

    async getById(id: string): Promise<SequenceRow | null> {
      const rows = await db.select().from(schema.sequences).where(eq(schema.sequences.id, id));
      return (rows[0] as SequenceRow) ?? null;
    },

    async getClips(sequenceId: string): Promise<SequenceClip[]> {
      return client.getAllAsync<SequenceClip>(
        `SELECT ${CLIP_SELECT}
         FROM sequence_items si JOIN movements m ON m.id = si.movement_id
         WHERE si.sequence_id = ? ORDER BY si.position`,
        [sequenceId]
      );
    },

    /** Media for an arbitrary set of movements (used by the builder preview). */
    async getMovementsMedia(ids: string[]): Promise<Map<string, MovementMedia>> {
      const result = new Map<string, MovementMedia>();
      if (ids.length === 0) return result;
      const placeholders = ids.map(() => '?').join(',');
      const rows = await client.getAllAsync<MovementMedia>(
        `SELECT m.id, m.name,
           (SELECT local_path FROM media_assets WHERE owner_type='movement' AND owner_id=m.id AND kind='video' AND status='ready' LIMIT 1) as videoPath,
           (SELECT local_path FROM media_assets WHERE owner_type='movement' AND owner_id=m.id AND kind='thumbnail' LIMIT 1) as thumbnailPath
         FROM movements m WHERE m.id IN (${placeholders})`,
        ids
      );
      for (const row of rows) result.set(row.id, row);
      return result;
    },

    async create(name: string, movementIds: string[]): Promise<string> {
      const id = newUUID();
      const timestamp = now();
      await db.insert(schema.sequences).values({
        id,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      if (movementIds.length > 0) {
        await db.insert(schema.sequenceItems).values(
          movementIds.map((movementId, position) => ({
            id: newUUID(),
            sequenceId: id,
            movementId,
            position,
          }))
        );
      }
      return id;
    },

    async rename(id: string, name: string): Promise<void> {
      await db
        .update(schema.sequences)
        .set({ name, updatedAt: now() })
        .where(eq(schema.sequences.id, id));
    },

    async delete(id: string): Promise<void> {
      await db.delete(schema.sequences).where(eq(schema.sequences.id, id));
    },
  };
}
