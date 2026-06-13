import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDb } from '@/db/context';
import { templatesRepo } from '@/repositories/templates';
import { stylesRepo } from '@/repositories/styles';
import { tagsRepo } from '@/repositories/tags';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagChip } from '@/components/ui/TagChip';
import type { Style, Tag } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  instructor: z.string().optional(),
  location: z.string().optional(),
  defaultDuration: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewTemplateScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [styles, setStyles] = useState<Style[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    Promise.all([stylesRepo(db).getAll(), tagsRepo(db).getAll()]).then(
      ([s, t]) => {
        setStyles(s as Style[]);
        setTags(t as Tag[]);
      }
    );
  }, [db]);

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await templatesRepo(db).create({
        name: data.name,
        styleId: selectedStyleId,
        instructor: data.instructor || null,
        location: data.location || null,
        defaultDuration: data.defaultDuration ? parseInt(data.defaultDuration, 10) : null,
        tagIds: selectedTagIds,
      });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('template.errorSave'));
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
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('template.nameLabel')}
            placeholder={t('template.namePlaceholder')}
            value={value}
            onChangeText={onChange}
            error={errors.name ? t('forms.nameRequired') : undefined}
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
                <Text className="text-neutral-100 text-sm">{s.icon} {s.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
        name="defaultDuration"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('template.defaultDuration')}
            placeholder={t('forms.durationPlaceholder')}
            value={value}
            onChangeText={onChange}
            keyboardType="number-pad"
          />
        )}
      />

      {tags.length > 0 ? (
        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-400">{t('forms.defaultTags')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                tag={tag}
                size="md"
                selected={selectedTagIds.includes(tag.id)}
                onPress={() =>
                  setSelectedTagIds((prev) =>
                    prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                  )
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      <Button label={t('template.save')} onPress={handleSubmit(onSubmit)} loading={saving} className="mt-4" />
    </ScrollView>
  );
}
