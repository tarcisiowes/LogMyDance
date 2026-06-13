import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Rewind, FastForward, Trash2 } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { mediaRepo } from '@/repositories/media';
import { movementsRepo } from '@/repositories/movements';
import { stepsRepo } from '@/repositories/steps';
import { Button } from '@/components/ui/Button';
import { naturalBpm } from '@/utils/tempo';

export default function MarkStepsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDb();
  const { t } = useTranslation();
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [times, setTimes] = useState<number[]>([]);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
  });

  useEffect(() => {
    (async () => {
      const [video, mv, saved] = await Promise.all([
        mediaRepo(db).getForMovement(id, 'video'),
        movementsRepo(db).getById(id),
        stepsRepo(db).getTimes(id),
      ]);
      if (!mv) {
        router.back();
        return;
      }
      setTimes(saved);
      if (video?.localPath) {
        setVideoPath(video.localPath);
        await player.replaceAsync(video.localPath);
      }
      setLoaded(true);
    })().catch(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, db]);

  useEffect(() => {
    const t1 = player.addListener('timeUpdate', (e) => {
      setCurrentMs(Math.round(e.currentTime * 1000));
      if (player.duration > 0) setDurationMs(Math.round(player.duration * 1000));
    });
    const t2 = player.addListener('playingChange', (e) => setIsPlaying(e.isPlaying));
    return () => {
      t1.remove();
      t2.remove();
    };
  }, [player]);

  const markStep = useCallback(() => {
    const ms = Math.round((player.currentTime ?? 0) * 1000);
    setTimes((prev) => [...prev, ms].sort((a, b) => a - b));
  }, [player]);

  const removeAt = useCallback((ms: number) => {
    setTimes((prev) => prev.filter((x) => x !== ms));
  }, []);

  const seekToRatio = useCallback(
    (ratio: number) => {
      if (durationMs <= 0) return;
      const clamped = Math.min(1, Math.max(0, ratio));
      player.currentTime = (clamped * durationMs) / 1000;
      setCurrentMs(Math.round(clamped * durationMs));
    },
    [player, durationMs]
  );

  const onBarPress = (e: GestureResponderEvent) => {
    if (barWidth <= 0) return;
    seekToRatio(e.nativeEvent.locationX / barWidth);
  };

  const onBarLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  const onSave = async () => {
    await stepsRepo(db).setTimes(id, times);
    router.back();
  };

  const bpm = naturalBpm(times);
  const pct = (ms: number) => (durationMs > 0 ? Math.min(1, ms / durationMs) : 0);

  if (loaded && !videoPath) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center p-8">
        <Text className="text-neutral-400 text-center">{t('steps.noVideo')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950 p-4 gap-4">
      <View className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: 16 / 9 }}>
        <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls={false} />
      </View>

      {/* Timeline with markers */}
      <View className="gap-1.5">
        <Pressable onPress={onBarPress} onLayout={onBarLayout} className="py-3">
          <View className="h-2 bg-neutral-800 rounded-full">
            <View
              style={{ width: `${pct(currentMs) * 100}%` }}
              className="h-2 bg-violet-600 rounded-full"
            />
            {/* playhead */}
            <View
              style={{ left: `${pct(currentMs) * 100}%` }}
              className="absolute -top-1 w-1 h-4 bg-white rounded-full"
            />
            {/* markers */}
            {times.map((ms) => (
              <Pressable
                key={ms}
                onPress={() => removeAt(ms)}
                style={{ left: `${pct(ms) * 100}%` }}
                className="absolute -top-1.5"
                hitSlop={8}
              >
                <View className="w-3 h-3 -ml-1.5 rounded-full bg-amber-400 border border-neutral-950" />
              </Pressable>
            ))}
          </View>
        </Pressable>
        <View className="flex-row justify-between">
          <Text className="text-neutral-500 text-xs">
            {(currentMs / 1000).toFixed(1)}s / {(durationMs / 1000).toFixed(1)}s
          </Text>
          <Text className="text-neutral-400 text-xs">
            {t('steps.count', { count: times.length })}
            {bpm ? `  ·  ${Math.round(bpm)} BPM` : ''}
          </Text>
        </View>
      </View>

      {/* Transport */}
      <View className="flex-row items-center justify-center gap-6">
        <Pressable onPress={() => player.seekBy(-0.1)} className="p-2">
          <Rewind color="#e5e5e5" size={22} />
        </Pressable>
        <Pressable
          onPress={() => (isPlaying ? player.pause() : player.play())}
          className="bg-neutral-800 rounded-full w-12 h-12 items-center justify-center"
        >
          {isPlaying ? <Pause color="#fff" size={22} /> : <Play color="#fff" size={22} />}
        </Pressable>
        <Pressable onPress={() => player.seekBy(0.1)} className="p-2">
          <FastForward color="#e5e5e5" size={22} />
        </Pressable>
      </View>

      <Button
        label={t('steps.markStep')}
        onPress={markStep}
        size="lg"
      />

      <Text className="text-neutral-600 text-xs text-center">{t('steps.emptyHint')}</Text>

      <View className="flex-row gap-3 mt-auto">
        <Pressable
          onPress={() => setTimes([])}
          className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-700 active:bg-neutral-800"
        >
          <Trash2 color="#a3a3a3" size={16} />
          <Text className="text-neutral-300">{t('steps.clear')}</Text>
        </Pressable>
        <View className="flex-1">
          <Button label={t('steps.save')} onPress={onSave} />
        </View>
      </View>
    </View>
  );
}
