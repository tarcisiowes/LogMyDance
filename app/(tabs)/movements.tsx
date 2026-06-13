import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { movementsRepo } from '@/repositories/movements';
import { stylesRepo } from '@/repositories/styles';
import { mediaRepo } from '@/repositories/media';
import { sequencesRepo } from '@/repositories/sequences';
import { MovementCard } from '@/components/movements/MovementCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MediaAsset, Movement, Style } from '@/types';

type MovementWithMeta = {
  movement: Movement;
  style: Style | null;
  thumbnail: MediaAsset | null;
  stepCount: number;
};

export default function MovementsScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [items, setItems] = useState<MovementWithMeta[]>([]);

  const load = useCallback(async () => {
    const mRepo = movementsRepo(db);
    const sRepo = stylesRepo(db);
    const mMediaRepo = mediaRepo(db);
    const movements = await mRepo.getAll();
    const styles = await sRepo.getAll();
    const styleMap = new Map(styles.map((s) => [s.id, s]));
    const stepsMap = await sequencesRepo(db).getStepsForMovements(movements.map((m) => m.id));

    const enriched = await Promise.all(
      movements.map(async (m) => ({
        movement: m as Movement,
        style: m.styleId ? (styleMap.get(m.styleId) as Style) ?? null : null,
        thumbnail: (await mMediaRepo.getForMovement(m.id, 'thumbnail')) as MediaAsset | null,
        stepCount: stepsMap.get(m.id)?.length ?? 0,
      }))
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
        onPress={() => router.push('/movement/new')}
        className="absolute bottom-6 right-6 z-10 bg-violet-600 w-14 h-14 rounded-full items-center justify-center active:bg-violet-700"
        style={{ elevation: 6 }}
      >
        <Plus color="#fff" size={24} />
      </Pressable>

      <FlashList
        data={items}
        contentContainerStyle={{ padding: 16, paddingBottom: 88 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyExtractor={(item) => item.movement.id}
        renderItem={({ item }) => (
          <MovementCard
            movement={item.movement}
            style={item.style}
            thumbnail={item.thumbnail}
            stepCount={item.stepCount}
            onPress={() => router.push(`/movement/${item.movement.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="💪"
            title={t('movement.emptyTitle')}
            subtitle={t('movement.emptySubtitle')}
          />
        }
      />
    </View>
  );
}
