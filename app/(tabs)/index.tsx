import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Plus, BookOpen } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { entriesRepo } from '@/repositories/entries';
import { tagsRepo } from '@/repositories/tags';
import { stylesRepo } from '@/repositories/styles';
import { EntryCard } from '@/components/entries/EntryCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DanceEntry, Style, Tag } from '@/types';

type EntryWithMeta = {
  entry: DanceEntry;
  style: Style | null;
  tags: Tag[];
};

export default function JournalScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [items, setItems] = useState<EntryWithMeta[]>([]);

  const load = useCallback(async () => {
    const repo = entriesRepo(db);
    const tRepo = tagsRepo(db);
    const sRepo = stylesRepo(db);

    const entries = await repo.getAll();
    const styles = await sRepo.getAll();
    const allTags = await tRepo.getAll();

    const styleMap = new Map(styles.map((s) => [s.id, s]));

    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const tagIds = await repo.getTagIds(entry.id);
        const tags = allTags.filter((t) => tagIds.includes(t.id));
        return {
          entry: entry as DanceEntry,
          style: entry.styleId ? (styleMap.get(entry.styleId) as Style) ?? null : null,
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
        onPress={() => router.push('/entry/new')}
        className="absolute bottom-6 right-6 z-10 bg-violet-600 w-14 h-14 rounded-full items-center justify-center shadow-lg active:bg-violet-700"
        style={{ elevation: 6 }}
      >
        <Plus color="#fff" size={24} />
      </Pressable>

      <FlashList
        data={items}
        contentContainerStyle={{ padding: 16, paddingBottom: 88 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(item) => item.entry.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item.entry}
            style={item.style}
            tags={item.tags}
            onPress={() => router.push(`/entry/${item.entry.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            Icon={BookOpen}
            title={t('entry.emptyTitle')}
            subtitle={t('entry.emptySubtitle')}
          />
        }
      />
    </View>
  );
}
