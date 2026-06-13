import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Database, Download, Trash2, Upload, AlertTriangle } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { mediaRepo } from '@/repositories/media';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getStorageStats, formatBytes, type StorageStats } from '@/services/storage';
import { exportBackup, shareBackup } from '@/services/backup/export';
import {
  pickBackupFile,
  prepareBackup,
  commitImport,
  cancelImport,
  type PreparedBackup,
} from '@/services/backup/import';
import { BackupError, type ConflictMode } from '@/services/backup/types';

export default function StorageScreen() {
  const db = useDb();
  const sqlite = db.$client;
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => {
    setStats(await getStorageStats(sqlite));
  }, [sqlite]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleCleanup = useCallback(async () => {
    const removed = await mediaRepo(db).cleanupOrphans();
    await refresh();
    Alert.alert(
      'Cleanup complete',
      removed > 0
        ? `Removed ${removed} orphaned file${removed === 1 ? '' : 's'}.`
        : 'No orphaned files found.'
    );
  }, [db, refresh]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const zipUri = await exportBackup(sqlite);
      await shareBackup(zipUri);
    } catch (e) {
      Alert.alert('Export failed', 'Could not create the backup. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [sqlite]);

  const runImport = useCallback(
    async (prepared: PreparedBackup, mode: ConflictMode) => {
      try {
        setImporting(true);
        const result = await commitImport(sqlite, prepared, mode);
        await refresh();
        const lines = [
          `${result.rowsImported} records imported.`,
          `${result.mediaRestored} media file${result.mediaRestored === 1 ? '' : 's'} restored.`,
        ];
        if (result.mediaMissing > 0) {
          lines.push(`${result.mediaMissing} media file(s) missing from the backup.`);
        }
        Alert.alert('Import complete', lines.join('\n'));
      } catch (e) {
        await cancelImport(prepared).catch(() => {});
        Alert.alert('Import failed', 'Could not restore the backup. No changes were made.');
      } finally {
        setImporting(false);
      }
    },
    [sqlite, refresh]
  );

  const handleImport = useCallback(async () => {
    try {
      const picked = await pickBackupFile();
      if (!picked) return;

      setImporting(true);
      const prepared = await prepareBackup(picked);
      setImporting(false);

      const warnings: string[] = [];
      if (prepared.integrity.missing > 0) {
        warnings.push(`${prepared.integrity.missing} media file(s) missing.`);
      }
      if (prepared.integrity.corrupted > 0) {
        warnings.push(`${prepared.integrity.corrupted} media file(s) failed integrity check.`);
      }

      const m = prepared.manifest;
      const summary = `Backup from ${m.created_at.split('T')[0]}\n${m.entries_count} entries · ${m.movements_count} movements`;
      const message = warnings.length
        ? `${summary}\n\n⚠️ ${warnings.join(' ')}\n\nHow do you want to import?`
        : `${summary}\n\nHow do you want to import?`;

      Alert.alert('Import backup', message, [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => cancelImport(prepared).catch(() => {}),
        },
        { text: 'Merge', onPress: () => runImport(prepared, 'merge') },
        {
          text: 'Replace all',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Replace all data?',
              'This erases everything currently in the app and replaces it with the backup. This cannot be undone.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => cancelImport(prepared).catch(() => {}),
                },
                {
                  text: 'Replace',
                  style: 'destructive',
                  onPress: () => runImport(prepared, 'replace'),
                },
              ]
            ),
        },
      ]);
    } catch (e) {
      setImporting(false);
      const msg =
        e instanceof BackupError
          ? e.message
          : 'Could not read the backup file. Make sure it is a Log My Dance backup.';
      Alert.alert('Import failed', msg);
    }
  }, [runImport]);

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider">
        Storage
      </Text>

      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <Database color="#a855f7" size={22} />
          <View>
            <Text className="text-neutral-100 text-2xl font-bold">
              {stats ? formatBytes(stats.totalBytes) : '—'}
            </Text>
            <Text className="text-neutral-500 text-xs">
              {stats ? `${stats.videoCount} video${stats.videoCount === 1 ? '' : 's'}` : 'Calculating…'}
            </Text>
          </View>
        </View>

        {stats && stats.missingCount > 0 ? (
          <View className="flex-row items-center gap-2">
            <AlertTriangle color="#f59e0b" size={14} />
            <Text className="text-amber-500 text-xs">
              {stats.missingCount} media file(s) marked missing
            </Text>
          </View>
        ) : null}

        <Button
          label="Clean up orphaned files"
          variant="secondary"
          size="sm"
          onPress={handleCleanup}
        />
      </Card>

      <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mt-2">
        Backup
      </Text>

      <Card className="gap-3">
        <View className="flex-row items-start gap-3">
          <Download color="#a855f7" size={20} />
          <View className="flex-1">
            <Text className="text-neutral-100 font-semibold">Export backup</Text>
            <Text className="text-neutral-500 text-xs mt-0.5">
              Save a .zip with all entries, movements, and videos.
            </Text>
          </View>
        </View>
        <Button label="Export…" onPress={handleExport} loading={exporting} />
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-start gap-3">
          <Upload color="#a855f7" size={20} />
          <View className="flex-1">
            <Text className="text-neutral-100 font-semibold">Import backup</Text>
            <Text className="text-neutral-500 text-xs mt-0.5">
              Restore from a .zip. Choose to merge or replace.
            </Text>
          </View>
        </View>
        <Button
          label="Import…"
          variant="secondary"
          onPress={handleImport}
          loading={importing}
        />
      </Card>

      <View className="flex-row items-center gap-2 mt-2 px-1">
        <Trash2 color="#525252" size={12} />
        <Text className="text-neutral-600 text-xs flex-1">
          All data stays on this device. Backups are not uploaded anywhere.
        </Text>
      </View>
    </ScrollView>
  );
}
