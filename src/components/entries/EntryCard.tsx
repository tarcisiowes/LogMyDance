import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { TagChip } from '@/components/ui/TagChip';
import { getMoodEmoji } from '@/constants/moods';
import { formatRelativeDate } from '@/utils/date';
import type { DanceEntry, Style, Tag } from '@/types';

interface EntryCardProps {
  entry: DanceEntry;
  style?: Style | null;
  tags?: Tag[];
  onPress?: () => void;
}

export function EntryCard({ entry, style, tags = [], onPress }: EntryCardProps) {
  return (
    <Card onPress={onPress} className="gap-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-0.5">
          <Text className="text-neutral-400 text-xs">
            {formatRelativeDate(entry.date)}
          </Text>
          {style ? (
            <Text className="text-neutral-100 text-base font-semibold">
              {style.icon} {style.name}
            </Text>
          ) : (
            <Text className="text-neutral-100 text-base font-semibold">Dance Class</Text>
          )}
        </View>
        {entry.mood ? (
          <Text className="text-2xl">{getMoodEmoji(entry.mood)}</Text>
        ) : null}
      </View>

      {(entry.instructor || entry.location) ? (
        <View className="flex-row gap-3">
          {entry.instructor ? (
            <Text className="text-neutral-400 text-xs">👤 {entry.instructor}</Text>
          ) : null}
          {entry.location ? (
            <Text className="text-neutral-400 text-xs">📍 {entry.location}</Text>
          ) : null}
        </View>
      ) : null}

      {entry.durationMin ? (
        <Text className="text-neutral-500 text-xs">⏱ {entry.durationMin} min</Text>
      ) : null}

      {tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}
