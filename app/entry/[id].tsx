import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { entriesRepo } from '@/repositories/entries';
import { stylesRepo } from '@/repositories/styles';
import { tagsRepo } from '@/repositories/tags';
import { movementsRepo } from '@/repositories/movements';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagChip } from '@/components/ui/TagChip';
import { MovementPicker } from '@/components/movements/MovementPicker';
import { MOODS } from '@/constants/moods';
import { moodKey } from '@/i18n/labels';
import type { DanceEntry, Mood, Movement, Style, Tag } from '@/types';

const schema = z.object({
  date: z.string().min(1),
  instructor: z.string().optional(),
  location: z.string().optional(),
  durationMin: z.string().optional(),
  mood: z.enum(['great', 'good', 'ok', 'tough']).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const db = useDb();
  const { t } = useTranslation();
  const [entry, setEntry] = useState<DanceEntry | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const refreshMovements = useCallback(async () => {
    const m = await movementsRepo(db).getAll();
    setMovements(m as Movement[]);
  }, [db]);

  const load = useCallback(async () => {
    const repo = entriesRepo(db);

    const [e, s, t, tagIds, movementIds, m] = await Promise.all([
      repo.getById(id),
      stylesRepo(db).getAll(),
      tagsRepo(db).getAll(),
      repo.getTagIds(id),
      repo.getMovementIds(id),
      movementsRepo(db).getAll(),
    ]);

    if (!e) {
      router.back();
      return;
    }

    setEntry(e as DanceEntry);
    setStyles(s as Style[]);
    setTags(t as Tag[]);
    setMovements(m as Movement[]);
    setSelectedStyleId(e.styleId ?? null);
    setSelectedTagIds(tagIds);
    setSelectedMovementIds(movementIds);

    reset({
      date: e.date,
      instructor: e.instructor ?? '',
      location: e.location ?? '',
      durationMin: e.durationMin?.toString() ?? '',
      mood: (e.mood as Mood) ?? undefined,
      notes: e.notes ?? '',
    });
  }, [id, db, reset]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleDelete} className="mr-2 p-2">
          <Trash2 color="#ef4444" size={20} />
        </Pressable>
      ),
    });
  }, [navigation, entry]);

  const toggleMovement = useCallback((mid: string) => {
    setSelectedMovementIds((prev) =>
      prev.includes(mid) ? prev.filter((m) => m !== mid) : [...prev, mid]
    );
  }, []);

  const handleCreateMovement = useCallback(
    async (name: string) => {
      const newId = await movementsRepo(db).create({
        name,
        styleId: selectedStyleId,
      });
      await refreshMovements();
      setSelectedMovementIds((prev) => [...prev, newId]);
    },
    [db, selectedStyleId, refreshMovements]
  );

  const handleDelete = () => {
    Alert.alert(t('entry.deleteTitle'), t('entry.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await entriesRepo(db).delete(id);
          router.back();
        },
      },
    ]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await entriesRepo(db).update(id, {
        date: data.date,
        styleId: selectedStyleId,
        instructor: data.instructor || null,
        location: data.location || null,
        durationMin: data.durationMin ? parseInt(data.durationMin, 10) : null,
        mood: (data.mood as Mood) ?? null,
        notes: data.notes || null,
        tagIds: selectedTagIds,
        movementIds: selectedMovementIds,
      });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('entry.errorSaveChanges'));
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <Input label={t('forms.date')} placeholder={t('forms.datePlaceholder')} value={value} onChangeText={onChange} />
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
                <Text className="text-neutral-100 text-sm">
                  {s.icon} {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">{t('forms.mood')}</Text>
        <Controller
          control={control}
          name="mood"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              {MOODS.map((m) => (
                <Pressable
                  key={m.value}
                  onPress={() => onChange(value === m.value ? undefined : m.value)}
                  className={`flex-1 items-center py-2.5 rounded-xl border ${
                    value === m.value
                      ? 'border-violet-500 bg-violet-600/20'
                      : 'border-neutral-700 bg-neutral-800'
                  }`}
                >
                  <Text className="text-xl">{m.emoji}</Text>
                  <Text className="text-neutral-400 text-xs mt-0.5">{t(moodKey(m.value))}</Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>

      <Controller
        control={control}
        name="instructor"
        render={({ field: { onChange, value } }) => (
          <Input label={t('forms.instructor')} placeholder={t('forms.namePlaceholder')} value={value} onChangeText={onChange} />
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field: { onChange, value } }) => (
          <Input label={t('forms.location')} placeholder={t('forms.locationPlaceholder')} value={value} onChangeText={onChange} />
        )}
      />

      <Controller
        control={control}
        name="durationMin"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('forms.durationMin')}
            placeholder={t('forms.durationPlaceholder')}
            value={value}
            onChangeText={onChange}
            keyboardType="number-pad"
          />
        )}
      />

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">{t('forms.movements')}</Text>
        <MovementPicker
          movements={movements}
          selectedIds={selectedMovementIds}
          onToggle={toggleMovement}
          onCreate={handleCreateMovement}
        />
      </View>

      {tags.length > 0 ? (
        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-400">{t('forms.tags')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                tag={tag}
                size="md"
                selected={selectedTagIds.includes(tag.id)}
                onPress={() =>
                  setSelectedTagIds((prev) =>
                    prev.includes(tag.id)
                      ? prev.filter((t) => t !== tag.id)
                      : [...prev, tag.id]
                  )
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('forms.notes')}
            placeholder={t('entry.notesPlaceholderShort')}
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
