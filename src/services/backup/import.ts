import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { unzip } from 'react-native-zip-archive';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ensureMediaDirs, videosDirUri, thumbsDirUri } from '@/repositories/media';
import {
  APP_SCHEMA_VERSION,
  BACKUP_VERSION,
  BackupError,
  RESTORE_TABLES_ORDER,
  stripScheme,
  type BackupManifest,
  type ConflictMode,
  type ImportResult,
} from './types';

export interface PreparedBackup {
  stagingDir: string;
  base: string;
  mediaBase: string;
  dataPath: string;
  manifest: BackupManifest;
  integrity: { missing: number; corrupted: number };
}

/** Opens the system file picker. Returns the picked uri or null if cancelled. */
export async function pickBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

/**
 * Copies + unzips the picked file, validates the manifest, and runs an
 * integrity pass. Does NOT touch the database — caller picks a conflict mode
 * then calls commitImport (or cancelImport to abort).
 */
export async function prepareBackup(pickedUri: string): Promise<PreparedBackup> {
  const stagingDir = `${FileSystem.cacheDirectory}restore_tmp/`;
  await FileSystem.deleteAsync(stagingDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(stagingDir, { intermediates: true });

  // Copy first — handles content:// SAF uris that unzip can't read directly.
  const localZip = `${stagingDir}backup.zip`;
  await FileSystem.copyAsync({ from: pickedUri, to: localZip });

  const outDir = `${stagingDir}out/`;
  await FileSystem.makeDirectoryAsync(outDir, { intermediates: true });
  await unzip(stripScheme(localZip), stripScheme(outDir));

  // Manifest is normally at root; tolerate a single nested folder.
  let base = outDir;
  if (!(await FileSystem.getInfoAsync(`${base}manifest.json`)).exists) {
    const entries = await FileSystem.readDirectoryAsync(outDir);
    if (entries.length === 1) base = `${outDir}${entries[0]}/`;
  }

  const manifestPath = `${base}manifest.json`;
  if (!(await FileSystem.getInfoAsync(manifestPath)).exists) {
    throw new BackupError('Invalid backup: manifest.json not found.');
  }

  const manifest: BackupManifest = JSON.parse(
    await FileSystem.readAsStringAsync(manifestPath)
  );

  if (manifest.backup_version > BACKUP_VERSION) {
    throw new BackupError(
      'This backup was created by a newer version of the app. Please update to import it.'
    );
  }
  if (manifest.schema_version > APP_SCHEMA_VERSION) {
    throw new BackupError(
      'This backup uses a newer data format than this app supports.'
    );
  }

  const dataPath = `${base}data.json`;
  if (!(await FileSystem.getInfoAsync(dataPath)).exists) {
    throw new BackupError('Invalid backup: data.json not found.');
  }

  const mediaBase = `${base}media/`;
  let missing = 0;
  let corrupted = 0;
  for (const f of manifest.media_files ?? []) {
    const fp = `${mediaBase}${f.filename}`;
    const info = await FileSystem.getInfoAsync(fp);
    if (!info.exists) {
      missing++;
      continue;
    }
    if (f.sha256) {
      const b64 = await FileSystem.readAsStringAsync(fp, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        b64
      );
      if (hash !== f.sha256) corrupted++;
    }
  }

  return {
    stagingDir,
    base,
    mediaBase,
    dataPath,
    manifest,
    integrity: { missing, corrupted },
  };
}

export async function cancelImport(prepared: PreparedBackup): Promise<void> {
  await FileSystem.deleteAsync(prepared.stagingDir, { idempotent: true });
}

/**
 * Writes the prepared backup into the database (single transaction) and
 * restores media files. 'replace' wipes existing data first; 'merge' keeps
 * existing rows (INSERT OR IGNORE by primary key).
 */
export async function commitImport(
  sqlite: SQLiteDatabase,
  prepared: PreparedBackup,
  mode: ConflictMode
): Promise<ImportResult> {
  await ensureMediaDirs();

  const data: Record<string, Array<Record<string, unknown>>> = JSON.parse(
    await FileSystem.readAsStringAsync(prepared.dataPath)
  );

  let tablesImported = 0;
  let rowsImported = 0;

  await sqlite.withTransactionAsync(async () => {
    if (mode === 'replace') {
      for (const table of [...RESTORE_TABLES_ORDER].reverse()) {
        await sqlite.runAsync(`DELETE FROM ${table}`);
      }
    }

    for (const table of RESTORE_TABLES_ORDER) {
      const rows = data[table] ?? [];
      if (!rows.length) continue;
      tablesImported++;
      for (const row of rows) {
        const cols = Object.keys(row);
        if (!cols.length) continue;
        const placeholders = cols.map(() => '?').join(', ');
        const verb = mode === 'merge' ? 'INSERT OR IGNORE' : 'INSERT';
        await sqlite.runAsync(
          `${verb} INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
          cols.map((c) => row[c] as never)
        );
        rowsImported++;
      }
    }
  });

  // Media restore runs after the txn (file IO). local_path is rewritten to
  // this device's media dirs; unresolved files are marked missing.
  let mediaRestored = 0;
  let mediaMissing = 0;
  for (const f of prepared.manifest.media_files ?? []) {
    const src = `${prepared.mediaBase}${f.filename}`;
    const info = await FileSystem.getInfoAsync(src);
    if (!info.exists) {
      mediaMissing++;
      await sqlite.runAsync(
        `UPDATE media_assets SET status = 'missing' WHERE id = ?`,
        [f.id]
      );
      continue;
    }
    const destDir = f.kind === 'video' ? videosDirUri() : thumbsDirUri();
    const dest = `${destDir}${f.filename}`;
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: src, to: dest });
    await sqlite.runAsync(
      `UPDATE media_assets SET local_path = ?, status = 'ready' WHERE id = ?`,
      [dest, f.id]
    );
    mediaRestored++;
  }

  await cancelImport(prepared);

  return { mode, tablesImported, rowsImported, mediaRestored, mediaMissing };
}
