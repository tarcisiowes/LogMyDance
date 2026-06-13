import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDb } from '@/db/context';
import { entriesRepo } from '@/repositories/entries';
import { stylesRepo } from '@/repositories/styles';
import { tagsRepo } from '@/repositories/tags';
import { movementsRepo } from '@/repositories/movements';
import { templatesRepo } from '@/repositories/templates';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagChip } from '@/components/ui/TagChip';
import { MovementPicker } from '@/components/movements/MovementPicker';
import { MOODS } from '@/constants/moods';
import { moodKey } from '@/i18n/labels';
import { todayDate } from '@/utils/date';
import type { ClassTemplate, Mood, Movement, Style, Tag } from '@/types';

const schema = z.object({
  date: z.string().min(1, 'Date required'),
  instructor: z.string().optional(),
  location: z.string().optional(),
  durationMin: z.string().optional(),
  mood: z.enum(['great', 'good', 'ok', 'tough']).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewEntryScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [styles, setStyles] = useState<Style[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, getValues, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { date: todayDate() },
    });

  const refreshMovements = useCallback(async () => {
    const m = await movementsRepo(db).getAll();
    setMovements(m as Movement[]);
  }, [db]);

  useEffect(() => {
    async function load() {
      const [s, t, tpl] = await Promise.all([
        stylesRepo(db).getAll(),
        tagsRepo(db).getAll(),
        templatesRepo(db).getAll(),
      ]);
      setStyles(s as Style[]);
      setTags(t as Tag[]);
      setTemplates(tpl as ClassTemplate[]);
      await refreshMovements();
    }
    load();
  }, [db, refreshMovements]);

  const toggleTag = useCallback((id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  const toggleMovement = useCallback((id: string) => {
    setSelectedMovementIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
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

  const applyTemplate = useCallback(
    async (template: ClassTemplate) => {
      // Toggle off if re-tapping the active template.
      if (templateId === template.id) {
        setTemplateId(null);
        return;
      }
      setTemplateId(template.id);
      setSelectedStyleId(template.styleId ?? null);
      const tagIds = await templatesRepo(db).getTagIds(template.id);
      setSelectedTagIds(tagIds);
      reset({
        date: getValues('date'),
        instructor: template.instructor ?? '',
        location: template.location ?? '',
        durationMin: template.defaultDuration?.toString() ?? '',
        mood: undefined,
        notes: '',
      });
    },
    [db, templateId, reset, getValues]
  );

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await entriesRepo(db).create({
        date: data.date,
        styleId: selectedStyleId,
        instructor: data.instructor || null,
        location: data.location || null,
        durationMin: data.durationMin ? parseInt(data.durationMin, 10) : null,
        mood: (data.mood as Mood) ?? null,
        notes: data.notes || null,
        templateId,
        tagIds: selectedTagIds,
        movementIds: selectedMovementIds,
      });
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), t('entry.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {templates.length > 0 ? (
        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-400">
            {t('entry.startFromTemplate')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 py-1">
              {templates.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => applyTemplate(t)}
                  className={`px-3 py-2 rounded-xl border ${
                    templateId === t.id
                      ? 'bg-violet-600 border-violet-500'
                      : 'bg-neutral-800 border-neutral-700'
                  }`}
                >
                  <Text className="text-neutral-100 text-sm">{t.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('forms.date')}
            placeholder={t('forms.datePlaceholder')}
            value={value}
            onChangeText={onChange}
            error={errors.date ? t('forms.dateRequired') : undefined}
          />
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
          <Input
            label={t('forms.instructor')}
            placeholder={t('forms.namePlaceholder')}
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('forms.location')}
            placeholder={t('forms.locationPlaceholder')}
            value={value}
            onChangeText={onChange}
          />
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
                onPress={() => toggleTag(tag.id)}
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
            placeholder={t('entry.notesPlaceholder')}
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            className="min-h-[100px]"
            textAlignVertical="top"
          />
        )}
      />

      <Button
        label={t('entry.save')}
        onPress={handleSubmit(onSubmit)}
        loading={saving}
        className="mt-4"
      />
    </ScrollView>
  );
}
