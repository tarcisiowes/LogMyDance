import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Clock } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { TagChip } from '@/components/ui/TagChip';
import { MetaItem } from '@/components/ui/MetaItem';
import type { ClassTemplate, Style, Tag } from '@/types';

interface TemplateCardProps {
  template: ClassTemplate;
  style?: Style | null;
  tags?: Tag[];
  onPress?: () => void;
}

export function TemplateCard({ template, style, tags = [], onPress }: TemplateCardProps) {
  const { t } = useTranslation();
  return (
    <Card onPress={onPress} className="gap-2">
      <Text className="text-neutral-100 text-base font-semibold">{template.name}</Text>

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
        {style ? (
          <Text className="text-neutral-400 text-xs">{style.name}</Text>
        ) : null}
        {template.instructor ? <MetaItem Icon={User} text={template.instructor} /> : null}
        {template.location ? <MetaItem Icon={MapPin} text={template.location} /> : null}
        {template.defaultDuration ? (
          <MetaItem Icon={Clock} text={`${template.defaultDuration} ${t('common.minShort')}`} />
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
