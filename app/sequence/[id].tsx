import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Trash2, Film } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { useDb } from '@/db/context';
import { sequencesRepo, type SequenceClip, type SequenceRow } from '@/repositories/sequences';
import { SequencePlayer, type SequenceClipSource } from '@/components/sequence/SequencePlayer';
import { Button } from '@/components/ui/Button';
import { exportSequence } from '@/services/sequence-export';
import { concatSequenceToMp4, isConcatAvailable } from '@/services/sequence-concat';

export default function SequenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const db = useDb();
  const { t } = useTranslation();
  const [sequence, setSequence] = useState<SequenceRow | null>(null);
  const [clips, setClips] = useState<SequenceClip[]>([]);
  const [exporting, setExporting] = useState(false);
  const [merging, setMerging] = useState(false);

  const load = useCallback(async () => {
    const repo = sequencesRepo(db);
    const [seq, items] = await Promise.all([repo.getById(id), repo.getClips(id)]);
    if (!seq) {
      router.back();
      return;
    }
    setSequence(seq);
    setClips(items);
  }, [id, db]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(() => {
    Alert.alert(t('sequences.deleteTitle'), t('sequences.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await sequencesRepo(db).delete(id);
          router.back();
        },
      },
    ]);
  }, [db, id, t]);

  useEffect(() => {
    navigation.setOptions({
      title: sequence?.name ?? '',
      headerRight: () => (
        <Pressable onPress={handleDelete} className="mr-2 p-2">
          <Trash2 color="#ef4444" size={20} />
        </Pressable>
      ),
    });
  }, [navigation, sequence, handleDelete]);

  const playable: SequenceClipSource[] = clips
    .filter((c) => !!c.videoPath)
    .map((c) => ({ movementId: c.movementId, name: c.name, videoPath: c.videoPath as string }));

  const onExport = async () => {
    if (!sequence) return;
    try {
      setExporting(true);
      await exportSequence(sequence.name, playable);
    } catch {
      Alert.alert(t('common.error'), t('sequences.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const onSaveVideo = async () => {
    if (!sequence) return;
    if (!isConcatAvailable()) {
      Alert.alert(t('sequences.exportVideo'), t('sequences.exportVideoUnavailable'));
      return;
    }
    try {
      setMerging(true);
      const out = await concatSequenceToMp4(sequence.name, playable);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(out, {
          mimeType: 'video/mp4',
          dialogTitle: t('sequences.exportVideo'),
          UTI: 'public.mpeg-4',
        });
      }
    } catch {
      Alert.alert(t('common.error'), t('sequences.exportVideoFailed'));
    } finally {
      setMerging(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
    >
      {playable.length > 0 ? <SequencePlayer clips={playable} /> : null}

      <View className="gap-2">
        {clips.map((clip, i) => (
          <View
            key={`${clip.movementId}-${i}`}
            className="flex-row items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-2"
          >
            <View className="w-7 h-7 rounded-full bg-violet-600/20 items-center justify-center">
              <Text className="text-violet-300 text-xs font-bold">{i + 1}</Text>
            </View>
            <View className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800">
              {clip.thumbnailPath ? (
                <Image source={{ uri: clip.thumbnailPath }} style={{ flex: 1 }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Film color="#737373" size={16} />
                </View>
              )}
            </View>
            <Text className="text-neutral-100 text-sm flex-1" numberOfLines={1}>
              {clip.name}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-2">
        {playable.length >= 2 ? (
          <Button
            label={t('sequences.exportVideo')}
            onPress={onSaveVideo}
            loading={merging}
          />
        ) : null}
        <Button
          label={t('sequences.export')}
          variant="secondary"
          onPress={onExport}
          loading={exporting}
        />
        {merging ? (
          <Text className="text-neutral-500 text-xs text-center">
            {t('sequences.merging')}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
