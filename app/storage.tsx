import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import { captureError } from '@/services/sentry';

export default function StorageScreen() {
  const db = useDb();
  const { t } = useTranslation();
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
      t('storage.cleanupCompleteTitle'),
      removed > 0
        ? t('storage.cleanupRemoved', { count: removed })
        : t('storage.cleanupNone')
    );
  }, [db, refresh, t]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const zipUri = await exportBackup(sqlite);
      await shareBackup(zipUri);
    } catch (e) {
      captureError(e, 'export_failed');
      Alert.alert(t('storage.exportFailedTitle'), t('storage.exportFailedBody'));
    } finally {
      setExporting(false);
    }
  }, [sqlite, t]);

  const runImport = useCallback(
    async (prepared: PreparedBackup, mode: ConflictMode) => {
      try {
        setImporting(true);
        const result = await commitImport(sqlite, prepared, mode);
        await refresh();
        const lines = [
          t('storage.recordsImported', { count: result.rowsImported }),
          t('storage.mediaRestored', { count: result.mediaRestored }),
        ];
        if (result.mediaMissing > 0) {
          lines.push(t('storage.mediaMissingLine', { count: result.mediaMissing }));
        }
        Alert.alert(t('storage.importCompleteTitle'), lines.join('\n'));
      } catch (e) {
        captureError(e, 'restore_failed');
        await cancelImport(prepared).catch(() => {});
        Alert.alert(t('storage.importFailedTitle'), t('storage.importFailedNoChanges'));
      } finally {
        setImporting(false);
      }
    },
    [sqlite, refresh, t]
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
        warnings.push(t('storage.mediaMissingWarn', { count: prepared.integrity.missing }));
      }
      if (prepared.integrity.corrupted > 0) {
        warnings.push(t('storage.mediaCorruptWarn', { count: prepared.integrity.corrupted }));
      }

      const m = prepared.manifest;
      const summary = t('storage.backupSummary', {
        date: m.created_at.split('T')[0],
        entries: m.entries_count,
        movements: m.movements_count,
      });
      const message = warnings.length
        ? `${summary}\n\n${warnings.join(' ')}\n\n${t('storage.howImport')}`
        : `${summary}\n\n${t('storage.howImport')}`;

      Alert.alert(t('storage.importBackupTitle'), message, [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => cancelImport(prepared).catch(() => {}),
        },
        { text: t('storage.merge'), onPress: () => runImport(prepared, 'merge') },
        {
          text: t('storage.replaceAll'),
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              t('storage.replaceConfirmTitle'),
              t('storage.replaceConfirmBody'),
              [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                  onPress: () => cancelImport(prepared).catch(() => {}),
                },
                {
                  text: t('storage.replace'),
                  style: 'destructive',
                  onPress: () => runImport(prepared, 'replace'),
                },
              ]
            ),
        },
      ]);
    } catch (e) {
      setImporting(false);
      const msg = e instanceof BackupError ? e.message : t('storage.readFailed');
      Alert.alert(t('storage.importFailedTitle'), msg);
    }
  }, [runImport, t]);

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider">
        {t('storage.storage')}
      </Text>

      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <Database color="#a855f7" size={22} />
          <View>
            <Text className="text-neutral-100 text-2xl font-bold">
              {stats ? formatBytes(stats.totalBytes) : '—'}
            </Text>
            <Text className="text-neutral-500 text-xs">
              {stats
                ? `${stats.videoCount} ${t(stats.videoCount === 1 ? 'storage.video' : 'storage.videos')}`
                : t('storage.calculating')}
            </Text>
          </View>
        </View>

        {stats && stats.missingCount > 0 ? (
          <View className="flex-row items-center gap-2">
            <AlertTriangle color="#f59e0b" size={14} />
            <Text className="text-amber-500 text-xs">
              {t('storage.missingMarked', { count: stats.missingCount })}
            </Text>
          </View>
        ) : null}

        <Button
          label={t('storage.cleanup')}
          variant="secondary"
          size="sm"
          onPress={handleCleanup}
        />
      </Card>

      <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mt-2">
        {t('storage.backup')}
      </Text>

      <Card className="gap-3">
        <View className="flex-row items-start gap-3">
          <Download color="#a855f7" size={20} />
          <View className="flex-1">
            <Text className="text-neutral-100 font-semibold">{t('storage.exportTitle')}</Text>
            <Text className="text-neutral-500 text-xs mt-0.5">
              {t('storage.exportBody')}
            </Text>
          </View>
        </View>
        <Button label={t('storage.exportBtn')} onPress={handleExport} loading={exporting} />
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-start gap-3">
          <Upload color="#a855f7" size={20} />
          <View className="flex-1">
            <Text className="text-neutral-100 font-semibold">{t('storage.importTitle')}</Text>
            <Text className="text-neutral-500 text-xs mt-0.5">
              {t('storage.importBody')}
            </Text>
          </View>
        </View>
        <Button
          label={t('storage.importBtn')}
          variant="secondary"
          onPress={handleImport}
          loading={importing}
        />
      </Card>

      <View className="flex-row items-center gap-2 mt-2 px-1">
        <Trash2 color="#525252" size={12} />
        <Text className="text-neutral-600 text-xs flex-1">
          {t('storage.privacyNote')}
        </Text>
      </View>
    </ScrollView>
  );
}
