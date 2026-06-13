import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDb } from '@/db/context';
import { movementsRepo } from '@/repositories/movements';
import { stylesRepo } from '@/repositories/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MOVEMENT_STATUSES } from '@/constants/statuses';
import type { Style } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewMovementScreen() {
  const db = useDb();
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('new');
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    stylesRepo(db).getAll().then((s) => setStyles(s as Style[]));
  }, [db]);

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await movementsRepo(db).create({
        name: data.name,
        styleId: selectedStyleId,
        status: selectedStatus as any,
        notes: data.notes || null,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save movement.');
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
            label="Movement name"
            placeholder="e.g. Body wave, Cambrés, Ocho"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
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
                <Text className="text-neutral-100 text-sm">
                  {s.icon} {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">Status</Text>
        <View className="gap-2">
          {MOVEMENT_STATUSES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => setSelectedStatus(s.value)}
              style={{
                backgroundColor:
                  selectedStatus === s.value ? s.bgColor : '#171717',
                borderColor:
                  selectedStatus === s.value ? s.color : '#404040',
              }}
              className="px-4 py-3 rounded-xl border flex-row items-center gap-3"
            >
              <View
                style={{ backgroundColor: s.color }}
                className="w-2.5 h-2.5 rounded-full"
              />
              <Text style={{ color: s.color }} className="text-sm font-medium">
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Notes"
            placeholder="Tips, corrections, reminders…"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            className="min-h-[100px]"
            textAlignVertical="top"
          />
        )}
      />

      <Button label="Save Movement" onPress={handleSubmit(onSubmit)} loading={saving} className="mt-4" />
    </ScrollView>
  );
}
