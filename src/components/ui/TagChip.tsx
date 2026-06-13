import { Pressable, Text } from 'react-native';
import type { Tag } from '@/types';

interface TagChipProps {
  tag: Tag;
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function TagChip({ tag, selected = false, onPress, size = 'sm' }: TagChipProps) {
  const color = tag.color ?? '#9333ea';
  const bgOpacity = selected ? '33' : '1a';
  const bg = color + bgOpacity;

  const padClass = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: bg, borderColor: color, borderWidth: selected ? 1 : 0 }}
      className={`${padClass} rounded-full`}
    >
      <Text style={{ color }} className={`${textClass} font-medium`}>
        {tag.name}
      </Text>
    </Pressable>
  );
}
