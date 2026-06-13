import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2 } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { templatesRepo } from '@/repositories/templates';
import { stylesRepo } from '@/repositories/styles';
import { tagsRepo } from '@/repositories/tags';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagChip } from '@/components/ui/TagChip';
import type { ClassTemplate, Style, Tag } from '@/types';

const schema = z.object({
  name: z.string().min(1),
  instructor: z.string().optional(),
  location: z.string().optional(),
  defaultDuration: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const db = useDb();
  const [template, setTemplate] = useState<ClassTemplate | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const load = useCallback(async () => {
    const tRepo = templatesRepo(db);
    const sRepo = stylesRepo(db);
    const tagRepo = tagsRepo(db);
    const [t, s, allTags, tagIds] = await Promise.all([
      tRepo.getById(id),
      sRepo.getAll(),
      tagRepo.getAll(),
      tRepo.getTagIds(id),
    ]);
    if (!t) { router.back(); return; }
    setTemplate(t as ClassTemplate);
    setStyles(s as Style[]);
    setTags(allTags as Tag[]);
    setSelectedStyleId(t.styleId ?? null);
    setSelectedTagIds(tagIds);
    reset({
      name: t.name,
      instructor: t.instructor ?? '',
      location: t.location ?? '',
      defaultDuration: t.defaultDuration?.toString() ?? '',
    });
  }, [id, db, reset]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleDelete} className="mr-2 p-2">
          <Trash2 color="#ef4444" size={20} />
        </Pressable>
      ),
    });
  }, [navigation, template]);

  const handleDelete = () => {
    Alert.alert('Delete Template', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await templatesRepo(db).delete(id);
          router.back();
        },
      },
    ]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await templatesRepo(db).update(id, {
        name: data.name,
        styleId: selectedStyleId,
        instructor: data.instructor || null,
        location: data.location || null,
        defaultDuration: data.defaultDuration ? parseInt(data.defaultDuration, 10) : null,
        tagIds: selectedTagIds,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!template) return null;

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
          <Input label="Template name" value={value} onChangeText={onChange} />
        )}
      />

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">Style</Text>
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
          <Input label="Instructor" placeholder="Name" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="location"
        render={({ field: { onChange, value } }) => (
          <Input label="Location" placeholder="Studio, city…" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="defaultDuration"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Default duration (minutes)"
            placeholder="60"
            value={value}
            onChangeText={onChange}
            keyboardType="number-pad"
          />
        )}
      />

      {tags.length > 0 ? (
        <View className="gap-1">
          <Text className="text-sm font-medium text-neutral-400">Default tags</Text>
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

      <Button label="Save Changes" onPress={handleSubmit(onSubmit)} loading={saving} className="mt-4" />
    </ScrollView>
  );
}
