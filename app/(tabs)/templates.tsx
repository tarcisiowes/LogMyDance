import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Plus, LayoutTemplate } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { templatesRepo } from '@/repositories/templates';
import { tagsRepo } from '@/repositories/tags';
import { stylesRepo } from '@/repositories/styles';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ClassTemplate, Style, Tag } from '@/types';

type TemplateWithMeta = {
  template: ClassTemplate;
  style: Style | null;
  tags: Tag[];
};

export default function TemplatesScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [items, setItems] = useState<TemplateWithMeta[]>([]);

  const load = useCallback(async () => {
    const tRepo = templatesRepo(db);
    const tagRepo = tagsRepo(db);
    const sRepo = stylesRepo(db);

    const templates = await tRepo.getAll();
    const styles = await sRepo.getAll();
    const allTags = await tagRepo.getAll();
    const styleMap = new Map(styles.map((s) => [s.id, s]));

    const enriched = await Promise.all(
      templates.map(async (t) => {
        const tagIds = await tRepo.getTagIds(t.id);
        const tags = allTags.filter((tag) => tagIds.includes(tag.id));
        return {
          template: t as ClassTemplate,
          style: t.styleId ? (styleMap.get(t.styleId) as Style) ?? null : null,
          tags: tags as Tag[],
        };
      })
    );

    setItems(enriched);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-neutral-950">
      <Pressable
        onPress={() => router.push('/template/new')}
        className="absolute bottom-6 right-6 z-10 bg-violet-600 w-14 h-14 rounded-full items-center justify-center active:bg-violet-700"
        style={{ elevation: 6 }}
      >
        <Plus color="#fff" size={24} />
      </Pressable>

      <FlashList
        data={items}
        contentContainerStyle={{ padding: 16, paddingBottom: 88 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(item) => item.template.id}
        renderItem={({ item }) => (
          <TemplateCard
            template={item.template}
            style={item.style}
            tags={item.tags}
            onPress={() => router.push(`/template/${item.template.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            Icon={LayoutTemplate}
            title={t('template.emptyTitle')}
            subtitle={t('template.emptySubtitle')}
          />
        }
      />
    </View>
  );
}
