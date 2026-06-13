import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react-native';

export type SequenceClipSource = { movementId: string; name: string; videoPath: string };

interface SequencePlayerProps {
  clips: SequenceClipSource[];
}

/**
 * Plays a list of clips back-to-back as one continuous sequence. Advances on
 * the `playToEnd` event by swapping the player source (`replaceAsync`).
 */
export function SequencePlayer({ clips }: SequencePlayerProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const indexRef = useRef(0);

  const player = useVideoPlayer(clips[0]?.videoPath ?? null, (p) => {
    p.loop = false;
  });

  function goTo(i: number) {
    if (i < 0 || i >= clips.length) return;
    indexRef.current = i;
    setIndex(i);
    setFinished(false);
    player.replaceAsync(clips[i].videoPath).then(() => player.play()).catch(() => {});
  }

  useEffect(() => {
    const playing = player.addListener('playingChange', (e) => setIsPlaying(e.isPlaying));
    const ended = player.addListener('playToEnd', () => {
      const next = indexRef.current + 1;
      if (next < clips.length) {
        indexRef.current = next;
        setIndex(next);
        player.replaceAsync(clips[next].videoPath).then(() => player.play()).catch(() => {});
      } else {
        setFinished(true);
      }
    });
    // Autoplay from the first clip.
    player.play();
    return () => {
      playing.remove();
      ended.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, clips.length]);

  if (clips.length === 0) return null;

  function onPrimaryPress() {
    if (finished) {
      goTo(0);
      return;
    }
    if (isPlaying) player.pause();
    else player.play();
  }

  return (
    <View className="gap-2">
      <View className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: 16 / 9 }}>
        <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls={false} />
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
