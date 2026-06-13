import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { VideoView, createVideoPlayer, useVideoPlayer } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Play, Pause, Video, Trash2 } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { mediaRepo, ensureMediaDirs, videoPath, thumbPath } from '@/repositories/media';
import { newUUID } from '@/utils/uuid';
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

  const player = useVideoPlayer(
    videoAsset?.localPath ?? null,
    (p) => {
      p.loop = false;
    }
  );

  useEffect(() => {
    const sub = player.addListener('playingChange', (e) => {
      setIsPlaying(e.isPlaying);
    });
    return () => sub.remove();
  }, [player]);

  const handleImport = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('video.permissionTitle'), t('video.permissionBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];

    try {
      setImporting(true);
      await ensureMediaDirs();

      const videoId = newUUID();
      const destVideoPath = videoPath(videoId);

      await FileSystem.copyAsync({ from: asset.uri, to: destVideoPath });

      const info = await FileSystem.getInfoAsync(destVideoPath);
      const sizeBytes = info.exists ? info.size : undefined;

      const repo = mediaRepo(db);

      if (videoAsset) {
        await repo.deleteForMovement(movementId);
      }

      await repo.createVideoAsset({
        movementId,
        localPath: destVideoPath,
        originalFilename: asset.fileName ?? undefined,
        sizeBytes,
        durationMs: asset.duration ? Math.round(asset.duration) : undefined,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
      });

      await generateAndSaveThumbnail(destVideoPath, videoId, movementId, db);

      onMediaChanged();
    } catch (e) {
      Alert.alert(t('video.importFailedTitle'), t('video.importFailedBody'));
    } finally {
      setImporting(false);
    }
  }, [movementId, videoAsset, db, onMediaChanged, t]);

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
    return (
      <Pressable
        onPress={handleImport}
        className="border-2 border-dashed border-neutral-700 rounded-2xl p-6 items-center gap-3 active:border-violet-500"
      >
        <Video color="#737373" size={32} />
        <Text className="text-neutral-400 text-sm">{t('video.tapToImport')}</Text>
      </Pressable>
    );
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
        <Pressable onPress={handleImport} className="p-1">
          <Text className="text-violet-400 text-xs">{t('video.replace')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function generateAndSaveThumbnail(
  videoUri: string,
  videoId: string,
  movementId: string,
  db: ReturnType<typeof useDb>
): Promise<void> {
  let tempPlayer: ReturnType<typeof createVideoPlayer> | null = null;
  try {
    tempPlayer = createVideoPlayer(videoUri);
    const thumbnails = await tempPlayer.generateThumbnailsAsync([0]);
    if (!thumbnails.length) return;

    const thumbnail = thumbnails[0];
    const destThumbPath = thumbPath(videoId);

    const saved = await ImageManipulator.manipulateAsync(
      thumbnail as any,
      [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: false }
    );

    await FileSystem.copyAsync({ from: saved.uri, to: destThumbPath });

    await mediaRepo(db).createThumbnailAsset({
      movementId,
      localPath: destThumbPath,
      width: thumbnail.width,
      height: thumbnail.height,
    });
  } catch {
    // Thumbnail generation failed silently — video still works
  } finally {
    tempPlayer?.release?.();
  }
}
