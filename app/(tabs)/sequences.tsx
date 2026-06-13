import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Plus, Film, ChevronRight } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { sequencesRepo, type SequenceListItem } from '@/repositories/sequences';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SequencesScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [items, setItems] = useState<SequenceListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      sequencesRepo(db)
        .getAll()
        .then((rows) => {
          if (active) setItems(rows);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [db])
  );

  return (
    <View className="flex-1 bg-neutral-950">
      <Pressable
        onPress={() => router.push('/sequence/new' as Href)}
        className="absolute bottom-6 right-6 z-10 bg-violet-600 w-14 h-14 rounded-full items-center justify-center active:bg-violet-700"
        style={{ elevation: 6 }}
      >
        <Plus color="#fff" size={24} />
      </Pressable>

      <FlashList
        data={items}
        contentContainerStyle={{ padding: 16, paddingBottom: 88 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            onPress={() => router.push(`/sequence/${item.id}` as Href)}
            className="flex-row items-center gap-3 p-0 overflow-hidden"
          >
            {item.thumbnailPath ? (
              <Image
                source={{ uri: item.thumbnailPath }}
                style={{ width: 64, height: 64 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-16 h-16 bg-neutral-800 items-center justify-center">
                <Film color="#737373" size={22} />
              </View>
            )}
            <View className="flex-1 py-3">
              <Text className="text-neutral-100 text-base font-semibold" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-neutral-500 text-xs">
                {t('sequences.movementsCount', { count: item.itemCount })}
              </Text>
            </View>
            <View className="mr-3">
              <ChevronRight color="#525252" size={18} />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🎬"
            title={t('sequences.emptyTitle')}
            subtitle={t('sequences.emptySubtitle')}
          />
        }
      />
    </View>
  );
}
