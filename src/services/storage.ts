import type { SQLiteDatabase } from 'expo-sqlite';

export interface StorageStats {
  videoBytes: number;
  thumbBytes: number;
  totalBytes: number;
  videoCount: number;
  missingCount: number;
}

export async function getStorageStats(
  sqlite: SQLiteDatabase
): Promise<StorageStats> {
  const video = await sqlite.getFirstAsync<{ bytes: number; count: number }>(
    `SELECT COALESCE(SUM(size_bytes), 0) AS bytes, COUNT(*) AS count
     FROM media_assets WHERE kind = 'video' AND status = 'ready'`
  );
  const thumb = await sqlite.getFirstAsync<{ bytes: number }>(
    `SELECT COALESCE(SUM(size_bytes), 0) AS bytes
     FROM media_assets WHERE kind = 'thumbnail' AND status = 'ready'`
  );
  const missing = await sqlite.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM media_assets WHERE status = 'missing'`
  );

  const videoBytes = video?.bytes ?? 0;
  const thumbBytes = thumb?.bytes ?? 0;
  return {
    videoBytes,
    thumbBytes,
    totalBytes: videoBytes + thumbBytes,
    videoCount: video?.count ?? 0,
    missingCount: missing?.count ?? 0,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
