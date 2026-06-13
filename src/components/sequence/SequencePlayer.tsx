import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react-native';
import { naturalBpm, clipRate } from '@/utils/tempo';

export type SequenceClipSource = {
  movementId: string;
  name: string;
  videoPath: string;
  times?: number[];
};

interface SequencePlayerProps {
  clips: SequenceClipSource[];
  tempoSync?: { enabled: boolean; targetBpm: number };
}

/**
 * Plays clips back-to-back as one sequence (replaceAsync on playToEnd). When
 * tempoSync is enabled each clip's playbackRate is set so its steps land on the
 * target BPM. A pulse + step counter flashes as marked steps pass.
 */
export function SequencePlayer({ clips, tempoSync }: SequencePlayerProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const indexRef = useRef(0);
  const stepCursorRef = useRef(0);

  const player = useVideoPlayer(clips[0]?.videoPath ?? null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.05;
  });

  function rateFor(i: number): number {
    if (!tempoSync?.enabled) return 1;
    return clipRate(naturalBpm(clips[i]?.times ?? []), tempoSync.targetBpm);
  }

  function resetSteps() {
    stepCursorRef.current = 0;
    setStepCount(0);
  }

  function goTo(i: number) {
    if (i < 0 || i >= clips.length) return;
    indexRef.current = i;
    setIndex(i);
    setFinished(false);
    resetSteps();
    player
      .replaceAsync(clips[i].videoPath)
      .then(() => {
        player.playbackRate = rateFor(i);
        player.play();
      })
      .catch(() => {});
  }

  useEffect(() => {
    const playing = player.addListener('playingChange', (e) => setIsPlaying(e.isPlaying));
    const ended = player.addListener('playToEnd', () => {
      const next = indexRef.current + 1;
      if (next < clips.length) {
        indexRef.current = next;
        setIndex(next);
        resetSteps();
        player
          .replaceAsync(clips[next].videoPath)
          .then(() => {
            player.playbackRate = rateFor(next);
            player.play();
          })
          .catch(() => {});
      } else {
        setFinished(true);
      }
    });
    const tick = player.addListener('timeUpdate', (e) => {
      const times = clips[indexRef.current]?.times ?? [];
      const ct = e.currentTime * 1000;
      let advanced = false;
      while (stepCursorRef.current < times.length && ct >= times[stepCursorRef.current]) {
        stepCursorRef.current += 1;
        advanced = true;
      }
      if (advanced) {
        setStepCount(stepCursorRef.current);
        setPulse(true);
        setTimeout(() => setPulse(false), 120);
      }
    });
    player.playbackRate = rateFor(0);
    player.play();
    return () => {
      playing.remove();
      ended.remove();
      tick.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, clips.length]);

  // Re-apply the current clip's rate live when the sync toggle / target BPM changes.
  useEffect(() => {
    player.playbackRate = rateFor(indexRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoSync?.enabled, tempoSync?.targetBpm]);

  if (clips.length === 0) return null;

  function onPrimaryPress() {
    if (finished) {
      goTo(0);
      return;
    }
    if (isPlaying) player.pause();
    else player.play();
  }

  const totalSteps = clips[index]?.times?.length ?? 0;

  return (
    <View className="gap-2">
      <View className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: 16 / 9 }}>
        <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls={false} />

        {totalSteps > 0 ? (
          <View className="absolute top-2 left-2 flex-row items-center gap-2 bg-black/60 rounded-full px-2.5 py-1">
            <View
              style={{ transform: [{ scale: pulse ? 1.4 : 1 }] }}
              className={`w-2.5 h-2.5 rounded-full ${pulse ? 'bg-amber-300' : 'bg-amber-300/40'}`}
            />
            <Text className="text-white text-xs font-medium">
              {stepCount}/{totalSteps}
            </Text>
          </View>
        ) : null}

        <View className="absolute top-2 right-2 bg-black/60 rounded-full px-2.5 py-1">
          <Text className="text-white text-xs font-medium">
            {t('sequences.clip', { current: index + 1, total: clips.length })}
          </Text>
        </View>

        <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-4 py-3 bg-black/60">
          <Text className="text-white text-sm flex-1 mr-3" numberOfLines={1}>
            {clips[index]?.name ?? ''}
          </Text>
          <View className="flex-row items-center gap-4">
            <Pressable onPress={() => goTo(index - 1)} disabled={index === 0}>
              <SkipBack color={index === 0 ? '#525252' : '#fff'} size={20} />
            </Pressable>
            <Pressable
              onPress={onPrimaryPress}
              className="bg-white/20 rounded-full w-11 h-11 items-center justify-center"
            >
              {finished ? (
                <RotateCcw color="#fff" size={20} />
              ) : isPlaying ? (
                <Pause color="#fff" size={20} />
              ) : (
                <Play color="#fff" size={20} />
              )}
            </Pressable>
            <Pressable onPress={() => goTo(index + 1)} disabled={index >= clips.length - 1}>
              <SkipForward color={index >= clips.length - 1 ? '#525252' : '#fff'} size={20} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
