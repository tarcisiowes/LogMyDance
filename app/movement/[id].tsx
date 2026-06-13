import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { movementsRepo } from '@/repositories/movements';
import { stylesRepo } from '@/repositories/styles';
import { mediaRepo } from '@/repositories/media';
import { attributesRepo, type DimensionWithValues } from '@/repositories/attributes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VideoSection } from '@/components/movements/VideoSection';
import { AttributeSelector } from '@/components/attributes/AttributeSelector';
import { MOVEMENT_STATUSES } from '@/constants/statuses';
import { statusKey } from '@/i18n/labels';
import type { MediaAsset, Movement, MovementStatus, Style } from '@/types';

const schema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function MovementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const db = useDb();
  const { t } = useTranslation();
  const [movement, setMovement] = useState<Movement | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);
  const [videoAsset, setVideoAsset] = useState<MediaAsset | null>(null);
  const [thumbnailAsset, setThumbnailAsset] = useState<MediaAsset | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MovementStatus>('new');
  const [dimensions, setDimensions] = useState<DimensionWithValues[]>([]);
  const [selectedValueIds, setSelectedValueIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = useCallback(async () => {
    const mRepo = movementsRepo(db);
    const sRepo = stylesRepo(db);
    const mRepoInst = mediaRepo(db);
    const aRepo = attributesRepo(db);
    const [m, s, video, thumb, dims, valueIds] = await Promise.all([
      mRepo.getById(id),
      sRepo.getAll(),
      mRepoInst.getForMovement(id, 'video'),
      mRepoInst.getForMovement(id, 'thumbnail'),
      aRepo.getDimensionsWithValues(),
      aRepo.getMovementValueIds(id),
    ]);
    if (!m) { router.back(); return; }
    setMovement(m as Movement);
    setStyles(s as Style[]);
    setVideoAsset(video as MediaAsset | null);
    setThumbnailAsset(thumb as MediaAsset | null);
    setSelectedStyleId(m.styleId ?? null);
    setSelectedStatus(m.status as MovementStatus);
    setDimensions(dims);
    setSelectedValueIds(valueIds);
    reset({ name: m.name, notes: m.notes ?? '' });
  }, [id, db, reset]);

  const handleAddValue = useCallback(
    async (dimensionId: string, label: string) => {
      const newId = await attributesRepo(db).addValue(dimensionId, label);
      const dims = await attributesRepo(db).getDimensionsWithValues();
      setDimensions(dims);
      setSelectedValueIds((prev) => [...prev, newId]);
    },
    [db]
  );

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleDelete} className="mr-2 p-2">
          <Trash2 color="#ef4444" size={20} />
        </Pressable>
      ),
    });
  }, [navigation, movement]);

  const handleDelete = () => {
    Alert.alert(t('movement.deleteTitle'), t('movement.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await movementsRepo(db).delete(id);
          router.back();
        },
      },
    ]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      const repo = movementsRepo(db);
      await repo.update(id, {
        name: data.name,
        styleId: selectedStyleId,
        notes: data.notes || null,
      });
      if (movement && movement.status !== selectedStatus) {
        await repo.updateStatus(id, selectedStatus);
      }
      await attributesRepo(db).setMovementValues(id, selectedValueIds);
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('movement.errorSaveChanges'));
    } finally {
      setSaving(false);
    }
  };

  if (!movement) return null;

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input label={t('movement.nameLabel')} value={value} onChangeText={onChange} />
        )}
      />

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">{t('forms.style')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 py-1">
            {styles.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSelectedStyleId(selectedStyleId === s.id ? null : s.id)}
                className={`px-3 py-2 rounded-xl border ${
                  selectedStyleId === s.id
                    ? 'bg-violet-600 border-violet-500'
                    : 'bg-neutral-800 border-neutral-700'
                }`}
              >
                <Text className="text-neutral-100 text-sm">{s.icon} {s.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">{t('forms.status')}</Text>
        <View className="gap-2">
          {MOVEMENT_STATUSES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => setSelectedStatus(s.value)}
              style={{
                backgroundColor: selectedStatus === s.value ? s.bgColor : '#171717',
                borderColor: selectedStatus === s.value ? s.color : '#404040',
              }}
              className="px-4 py-3 rounded-xl border flex-row items-center gap-3"
            >
              <View style={{ backgroundColor: s.color }} className="w-2.5 h-2.5 rounded-full" />
              <Text style={{ color: s.color }} className="text-sm font-medium">{t(statusKey(s.value))}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-400">{t('attributes.title')}</Text>
        <AttributeSelector
          dimensions={dimensions}
          selectedIds={selectedValueIds}
          onChange={setSelectedValueIds}
          onAddValue={handleAddValue}
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">{t('forms.video')}</Text>
        <VideoSection
          movementId={id}
          videoAsset={videoAsset}
          thumbnailAsset={thumbnailAsset}
          onMediaChanged={load}
        />
      </View>

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('forms.notes')}
            placeholder={t('movement.notesPlaceholder')}
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            className="min-h-[100px]"
            textAlignVertical="top"
          />
        )}
      />

      <Button label={t('common.saveChanges')} onPress={handleSubmit(onSubmit)} loading={saving} className="mt-4" />
    </ScrollView>
  );
}
