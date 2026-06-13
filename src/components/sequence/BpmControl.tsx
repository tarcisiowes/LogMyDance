import { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react-native';
import { BPM_MIN, BPM_MAX, clampBpm } from '@/utils/tempo';

interface BpmControlProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  bpm: number;
  onBpm: (v: number) => void;
  /** No clip has step markers — sync is unavailable. */
  disabled?: boolean;
}

export function BpmControl({ enabled, onToggle, bpm, onBpm, disabled }: BpmControlProps) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const pct = (clampBpm(bpm) - BPM_MIN) / (BPM_MAX - BPM_MIN);

  const setFromX = (x: number) => {
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / width));
    onBpm(clampBpm(BPM_MIN + ratio * (BPM_MAX - BPM_MIN)));
  };

  return (
    <View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 gap-3">
      <Pressable
        onPress={() => !disabled && onToggle(!enabled)}
        className="flex-row items-center justify-between"
      >
        <Text className="text-neutral-100 font-semibold">{t('sequences.sync')}</Text>
        <View
          className={`w-11 h-6 rounded-full p-0.5 ${
            enabled && !disabled ? 'bg-violet-600' : 'bg-neutral-700'
          }`}
        >
          <View className={`w-5 h-5 rounded-full bg-white ${enabled && !disabled ? 'ml-auto' : ''}`} />
        </View>
      </Pressable>

      {disabled ? (
        <Text className="text-neutral-500 text-xs">{t('sequences.noMarkers')}</Text>
      ) : enabled ? (
        <View className="gap-2">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => onBpm(clampBpm(bpm - 1))}
              className="w-9 h-9 rounded-lg bg-neutral-800 items-center justify-center active:bg-neutral-700"
            >
              <Minus color="#e5e5e5" size={16} />
            </Pressable>
            <Text className="text-neutral-100 text-base font-bold flex-1 text-center">
              {clampBpm(bpm)} {t('sequences.bpm')}
            </Text>
            <Pressable
              onPress={() => onBpm(clampBpm(bpm + 1))}
              className="w-9 h-9 rounded-lg bg-neutral-800 items-center justify-center active:bg-neutral-700"
            >
              <Plus color="#e5e5e5" size={16} />
            </Pressable>
          </View>
          <Pressable
            onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
            onPress={(e: GestureResponderEvent) => setFromX(e.nativeEvent.locationX)}
            className="py-3"
          >
            <View className="h-2 bg-neutral-800 rounded-full">
              <View style={{ width: `${pct * 100}%` }} className="h-2 bg-violet-600 rounded-full" />
              <View
                style={{ left: `${pct * 100}%` }}
                className="absolute -top-1 w-4 h-4 -ml-2 rounded-full bg-white"
              />
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
