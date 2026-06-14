import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

type IconType = ComponentType<{ color?: string; size?: number }>;

/** Inline metadata row: a small muted icon + label (instructor, location, time). */
export function MetaItem({ Icon, text }: { Icon: IconType; text: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon color="#737373" size={13} />
      <Text className="text-neutral-400 text-xs">{text}</Text>
    </View>
  );
}
