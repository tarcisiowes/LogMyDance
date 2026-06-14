import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Video, Trash2 } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { movementsRepo } from '@/repositories/movements';
import { stylesRepo } from '@/repositories/styles';
import {
  pickVideo,
  importVideoForMovement,
  type PickedVideo,
  type VideoSource,
} from '@/services/video-import';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VideoSourceButtons } from '@/components/movements/VideoSourceButtons';
import { MOVEMENT_STATUSES } from '@/constants/statuses';
import { statusKey } from '@/i18n/labels';
import type { Style } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewMovementScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('new');
  const [stagedVideo, setStagedVideo] = useState<PickedVideo | null>(null);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    stylesRepo(db).getAll().then((s) => setStyles(s as Style[]));
  }, [db]);

  const pick = async (source: VideoSource) => {
    const res = await pickVideo(source);
    if (!res.ok) {
      if (res.reason === 'permission-camera') {
        Alert.alert(t('video.permissionTitle'), t('video.cameraPermissionBody'));
      } else if (res.reason === 'permission-library') {
        Alert.alert(t('video.permissionTitle'), t('video.permissionBody'));
      }
      return;
    }
    setStagedVideo(res.video);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      const movementId = await movementsRepo(db).create({
        name: data.name,
        styleId: selectedStyleId,
        status: selectedStatus as any,
        notes: data.notes || null,
      });
      if (stagedVideo) {
        try {
          await importVideoForMovement(db, movementId, stagedVideo);
        } catch {
          // Movement is saved; only the video attach failed. Let the user
          // re-add it from the movement screen rather than losing the entry.
          Alert.alert(t('video.importFailedTitle'), t('video.importFailedBody'));
        }
      }
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('movement.errorSave'));
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
      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-400">{t('forms.video')}</Text>
        {stagedVideo ? (
          <View className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3 flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-xl bg-neutral-800 items-center justify-center">
              <Video color="#a855f7" size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-neutral-100 text-sm" numberOfLines={1}>
                {stagedVideo.fileName ?? t('video.selected')}
              </Text>
              {stagedVideo.durationMs ? (
                <Text className="text-neutral-500 text-xs">
                  {Math.round(stagedVideo.durationMs / 1000)}s
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => setStagedVideo(null)} className="p-2">
              <Trash2 color="#ef4444" size={18} />
            </Pressable>
          </View>
        ) : (
          <VideoSourceButtons onPick={pick} />
        )}
      </View>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('movement.nameLabel')}
            placeholder={t('movement.namePlaceholder')}
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
                <Text className="text-neutral-100 text-sm">{s.name}</Text>
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
                {t(statusKey(s.value))}
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

      <Button label={t('movement.save')} onPress={handleSubmit(onSubmit)} loading={saving} className="mt-4" />
    </ScrollView>
  );
}
