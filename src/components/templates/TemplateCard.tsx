import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { TagChip } from '@/components/ui/TagChip';
import type { ClassTemplate, Style, Tag } from '@/types';

interface TemplateCardProps {
  template: ClassTemplate;
  style?: Style | null;
  tags?: Tag[];
  onPress?: () => void;
}

export function TemplateCard({ template, style, tags = [], onPress }: TemplateCardProps) {
  return (
    <Card onPress={onPress} className="gap-2">
      <Text className="text-neutral-100 text-base font-semibold">{template.name}</Text>

      <View className="flex-row flex-wrap gap-3">
        {style ? (
          <Text className="text-neutral-400 text-xs">
            {style.icon} {style.name}
          </Text>
        ) : null}
        {template.instructor ? (
          <Text className="text-neutral-400 text-xs">👤 {template.instructor}</Text>
        ) : null}
        {template.location ? (
          <Text className="text-neutral-400 text-xs">📍 {template.location}</Text>
        ) : null}
        {template.defaultDuration ? (
          <Text className="text-neutral-400 text-xs">⏱ {template.defaultDuration} min</Text>
        ) : null}
      </View>

      {tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1">
          {tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}
