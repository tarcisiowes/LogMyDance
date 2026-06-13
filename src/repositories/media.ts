import { eq, and } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';
import { now } from '@/utils/date';
import type { MediaKind, MediaStatus } from '@/types';

type DB = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

const VIDEOS_DIR = `${FileSystem.documentDirectory}videos/`;
const THUMBS_DIR = `${FileSystem.documentDirectory}thumbnails/`;

export async function ensureMediaDirs(): Promise<void> {
  await FileSystem.makeDirectoryAsync(VIDEOS_DIR, { intermediates: true });
  await FileSystem.makeDirectoryAsync(THUMBS_DIR, { intermediates: true });
}

export function videosDirUri(): string {
  return VIDEOS_DIR;
}

export function thumbsDirUri(): string {
  return THUMBS_DIR;
}

export function videoPath(id: string): string {
  return `${VIDEOS_DIR}vid_${id}.mp4`;
}

export function thumbPath(id: string): string {
  return `${THUMBS_DIR}thumb_${id}.jpg`;
}

export function mediaRepo(db: DB) {
  return {
    async getForMovement(movementId: string, kind: MediaKind) {
      const rows = await db
        .select()
        .from(schema.mediaAssets)
        .where(
          and(
            eq(schema.mediaAssets.ownerType, 'movement'),
            eq(schema.mediaAssets.ownerId, movementId),
            eq(schema.mediaAssets.kind, kind)
          )
        );
      return rows[0] ?? null;
    },

    async createVideoAsset(params: {
      movementId: string;
      localPath: string;
      originalFilename?: string;
      sizeBytes?: number;
      durationMs?: number;
      width?: number;
      height?: number;
    }) {
      const id = newUUID();
      await db.insert(schema.mediaAssets).values({
        id,
        ownerType: 'movement',
        ownerId: params.movementId,
        kind: 'video',
        localPath: params.localPath,
        originalFilename: params.originalFilename ?? null,
        sizeBytes: params.sizeBytes ?? null,
        mimeType: 'video/mp4',
        durationMs: params.durationMs ?? null,
        width: params.width ?? null,
        height: params.height ?? null,
        status: 'ready',
        createdAt: now(),
      });
      return id;
    },

    async createThumbnailAsset(params: {
      movementId: string;
      localPath: string;
      width?: number;
      height?: number;
    }) {
      const id = newUUID();
      await db.insert(schema.mediaAssets).values({
        id,
        ownerType: 'movement',
        ownerId: params.movementId,
        kind: 'thumbnail',
        localPath: params.localPath,
        originalFilename: null,
        sizeBytes: null,
        mimeType: 'image/jpeg',
        durationMs: null,
        width: params.width ?? null,
        height: params.height ?? null,
        status: 'ready',
        createdAt: now(),
      });
      return id;
    },

    async updateStatus(id: string, status: MediaStatus) {
      await db
        .update(schema.mediaAssets)
        .set({ status })
        .where(eq(schema.mediaAssets.id, id));
    },

    async deleteForMovement(movementId: string) {
      const assets = await db
        .select()
        .from(schema.mediaAssets)
        .where(
          and(
            eq(schema.mediaAssets.ownerType, 'movement'),
            eq(schema.mediaAssets.ownerId, movementId)
          )
        );

      for (const asset of assets) {
        const info = await FileSystem.getInfoAsync(asset.localPath);
        if (info.exists) {
          await FileSystem.deleteAsync(asset.localPath, { idempotent: true });
        }
      }

      await db
        .delete(schema.mediaAssets)
        .where(
          and(
            eq(schema.mediaAssets.ownerType, 'movement'),
            eq(schema.mediaAssets.ownerId, movementId)
          )
        );
    },

    async findOrphans(): Promise<Array<{ id: string; localPath: string }>> {
      return db.$client.getAllAsync<{ id: string; localPath: string }>(
        `SELECT ma.id, ma.local_path AS localPath
         FROM media_assets ma
         LEFT JOIN movements m ON ma.owner_id = m.id AND ma.owner_type = 'movement'
         WHERE m.id IS NULL`
      );
    },

    async cleanupOrphans() {
      const orphans = await this.findOrphans();
      for (const orphan of orphans) {
        const info = await FileSystem.getInfoAsync(orphan.localPath);
        if (info.exists) {
          await FileSystem.deleteAsync(orphan.localPath, { idempotent: true });
        }
        await db
          .delete(schema.mediaAssets)
          .where(eq(schema.mediaAssets.id, orphan.id));
      }
      return orphans.length;
    },
  };
}
