import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Clock } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { TagChip } from '@/components/ui/TagChip';
import { MetaItem } from '@/components/ui/MetaItem';
import { getMood } from '@/constants/moods';
import { formatRelativeDate } from '@/utils/date';
import type { DanceEntry, Style, Tag } from '@/types';

interface EntryCardProps {
  entry: DanceEntry;
  style?: Style | null;
  tags?: Tag[];
  onPress?: () => void;
}

export function EntryCard({ entry, style, tags = [], onPress }: EntryCardProps) {
  const { t } = useTranslation();
  const mood = getMood(entry.mood);
  return (
    <Card onPress={onPress} className="gap-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-0.5">
          <Text className="text-neutral-500 text-xs">
            {formatRelativeDate(entry.date)}
          </Text>
          <Text className="text-neutral-100 text-base font-semibold">
            {style ? style.name : t('entry.defaultTitle')}
          </Text>
        </View>
        {mood ? <mood.Icon color={mood.color} size={22} /> : null}
      </View>

      {(entry.instructor || entry.location) ? (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          {entry.instructor ? <MetaItem Icon={User} text={entry.instructor} /> : null}
          {entry.location ? <MetaItem Icon={MapPin} text={entry.location} /> : null}
        </View>
      ) : null}

      {entry.durationMin ? (
        <MetaItem Icon={Clock} text={`${entry.durationMin} ${t('common.minShort')}`} />
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
