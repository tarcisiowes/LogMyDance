import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Play, Pause, Video, Trash2 } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { mediaRepo } from '@/repositories/media';
import { pickVideo, importVideoForMovement, type VideoSource } from '@/services/video-import';
import { captureError } from '@/services/sentry';
import { VideoSourceButtons } from './VideoSourceButtons';
import type { MediaAsset } from '@/types';

interface VideoSectionProps {
  movementId: string;
  videoAsset: MediaAsset | null;
  thumbnailAsset: MediaAsset | null;
  onMediaChanged: () => void;
}

export function VideoSection({
  movementId,
  videoAsset,
  thumbnailAsset,
  onMediaChanged,
}: VideoSectionProps) {
  const db = useDb();
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  const player = useVideoPlayer(videoAsset?.localPath ?? null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    const sub = player.addListener('playingChange', (e) => {
      setIsPlaying(e.isPlaying);
    });
    return () => sub.remove();
  }, [player]);

  const pick = useCallback(
    async (source: VideoSource) => {
      const res = await pickVideo(source);
      if (!res.ok) {
        if (res.reason === 'permission-camera') {
          Alert.alert(t('video.permissionTitle'), t('video.cameraPermissionBody'));
        } else if (res.reason === 'permission-library') {
          Alert.alert(t('video.permissionTitle'), t('video.permissionBody'));
        }
        return;
      }
      try {
        setImporting(true);
        setShowReplace(false);
        await importVideoForMovement(db, movementId, res.video);
        onMediaChanged();
      } catch (e) {
        captureError(e, 'file_import_failed');
        Alert.alert(t('video.importFailedTitle'), t('video.importFailedBody'));
      } finally {
        setImporting(false);
      }
    },
    [db, movementId, onMediaChanged, t]
  );

  const handleDelete = useCallback(() => {
    Alert.alert(t('video.removeTitle'), t('video.removeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await mediaRepo(db).deleteForMovement(movementId);
          setShowPlayer(false);
          onMediaChanged();
        },
      },
    ]);
  }, [movementId, db, onMediaChanged, t]);

  if (importing) {
    return (
      <View className="items-center py-8 gap-2">
        <ActivityIndicator color="#a855f7" size="large" />
        <Text className="text-neutral-400 text-sm">{t('video.importing')}</Text>
      </View>
    );
  }

  if (!videoAsset) {
    return <VideoSourceButtons onPick={pick} />;
  }

  return (
    <View className="gap-3">
      {showPlayer ? (
        <View className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: 16 / 9 }}>
          <VideoView
            player={player}
            style={{ flex: 1 }}
            contentFit="contain"
            nativeControls={false}
          />
          <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-4 py-3 bg-black/60">
            <Pressable
              onPress={() => (isPlaying ? player.pause() : player.play())}
              className="bg-white/20 rounded-full w-10 h-10 items-center justify-center"
            >
              {isPlaying ? (
                <Pause color="#fff" size={18} />
              ) : (
                <Play color="#fff" size={18} />
              )}
            </Pressable>
            <Pressable onPress={handleDelete} className="p-2">
              <Trash2 color="#ef4444" size={18} />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowPlayer(true)}
          className="rounded-2xl overflow-hidden bg-neutral-900"
          style={{ aspectRatio: 16 / 9 }}
        >
          {thumbnailAsset ? (
            <Image
              source={{ uri: thumbnailAsset.localPath }}
              style={{ flex: 1 }}
              contentFit="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Video color="#737373" size={32} />
            </View>
          )}
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/50 rounded-full w-14 h-14 items-center justify-center">
              <Play color="#fff" size={24} />
            </View>
          </View>
        </Pressable>
      )}

      <View className="flex-row items-center justify-between">
        <Text className="text-neutral-500 text-xs">
          {videoAsset.originalFilename ?? t('video.importedVideo')}
          {videoAsset.durationMs
            ? ` · ${Math.round(videoAsset.durationMs / 1000)}s`
            : ''}
        </Text>
        <Pressable onPress={() => setShowReplace((v) => !v)} className="p-1">
          <Text className="text-violet-400 text-xs">{t('video.replace')}</Text>
        </Pressable>
      </View>

      {showReplace ? <VideoSourceButtons onPick={pick} /> : null}
    </View>
  );
}
