import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { zip } from 'react-native-zip-archive';
import type { SQLiteDatabase } from 'expo-sqlite';
import { now, todayDate } from '@/utils/date';
import {
  APP_SCHEMA_VERSION,
  BACKUP_VERSION,
  RESTORE_TABLES_ORDER,
  SHA256_MAX_BYTES,
  basename,
  stripScheme,
  type BackupManifest,
  type MediaFileEntry,
} from './types';

async function sha256OfFile(
  uri: string,
  size: number | null
): Promise<string | null> {
  try {
    if (size != null && size > SHA256_MAX_BYTES) return null;
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      b64
    );
  } catch {
    return null;
  }
}

/**
 * Serializes all tables + media into a .zip in DocumentDirectory.
 * Returns the file:// uri of the created zip.
 */
export async function exportBackup(sqlite: SQLiteDatabase): Promise<string> {
  const stagingDir = `${FileSystem.documentDirectory}backup_tmp/`;
  const mediaDir = `${stagingDir}media/`;

  await FileSystem.deleteAsync(stagingDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });

  try {
    const data: Record<string, unknown> = {
      schema_version: APP_SCHEMA_VERSION,
      exported_at: now(),
    };
    for (const table of RESTORE_TABLES_ORDER) {
      data[table] = await sqlite.getAllAsync(`SELECT * FROM ${table}`);
    }

    const mediaRows = await sqlite.getAllAsync<{
      id: string;
      owner_id: string;
      kind: string;
      local_path: string;
      size_bytes: number | null;
    }>(`SELECT id, owner_id, kind, local_path, size_bytes FROM media_assets`);

    const mediaFiles: MediaFileEntry[] = [];
    for (const m of mediaRows) {
      const info = await FileSystem.getInfoAsync(m.local_path);
      if (!info.exists) continue; // skip missing source files

      const filename = basename(m.local_path);
      await FileSystem.copyAsync({
        from: m.local_path,
        to: `${mediaDir}${filename}`,
      });

      mediaFiles.push({
        id: m.id,
        owner_id: m.owner_id,
        kind: m.kind,
        filename,
        size_bytes: m.size_bytes ?? (info.exists ? info.size : null),
        sha256: await sha256OfFile(m.local_path, m.size_bytes),
      });
    }

    const manifest: BackupManifest = {
      app: 'Log My Dance',
      backup_version: BACKUP_VERSION,
      schema_version: APP_SCHEMA_VERSION,
      created_at: now(),
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? '1.0.0',
      entries_count: (data['dance_entries'] as unknown[]).length,
      movements_count: (data['movements'] as unknown[]).length,
      media_files: mediaFiles,
    };

    await FileSystem.writeAsStringAsync(
      `${stagingDir}manifest.json`,
      JSON.stringify(manifest, null, 2)
    );
    await FileSystem.writeAsStringAsync(
      `${stagingDir}data.json`,
      JSON.stringify(data)
    );

    const zipTarget = `${FileSystem.documentDirectory}logmydance-backup-${todayDate()}.zip`;
    await FileSystem.deleteAsync(zipTarget, { idempotent: true });
    await zip(stripScheme(stagingDir), stripScheme(zipTarget));

    return zipTarget;
  } finally {
    await FileSystem.deleteAsync(stagingDir, { idempotent: true });
  }
}

export async function shareBackup(zipUri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(zipUri, {
      mimeType: 'application/zip',
      dialogTitle: 'Export Log My Dance backup',
      UTI: 'public.zip-archive',
    });
  }
}
