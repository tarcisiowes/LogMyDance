import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { X, Film } from 'lucide-react-native';
import { useDb } from '@/db/context';
import {
  attributesRepo,
  type DimensionWithValues,
  type FilteredMovement,
} from '@/repositories/attributes';
import { sequencesRepo, type MovementMedia } from '@/repositories/sequences';
import { AttributeSelector } from '@/components/attributes/AttributeSelector';
import { SequencePlayer, type SequenceClipSource } from '@/components/sequence/SequencePlayer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewSequenceScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [dimensions, setDimensions] = useState<DimensionWithValues[]>([]);
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [results, setResults] = useState<FilteredMovement[]>([]);
  const [media, setMedia] = useState<Map<string, MovementMedia>>(new Map());
  const [built, setBuilt] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    attributesRepo(db).getDimensionsWithValues().then(setDimensions).catch(() => {});
  }, [db]);

  const groups = useMemo(() => {
    const set = new Set(filterIds);
    return dimensions
      .map((d) => d.values.filter((v) => set.has(v.id)).map((v) => v.id))
      .filter((g) => g.length > 0);
  }, [dimensions, filterIds]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await attributesRepo(db).getMovementsByFilters(groups);
      const mediaMap = await sequencesRepo(db).getMovementsMedia(res.map((r) => r.id));
      if (!active) return;
      setResults(res);
      setMedia((prev) => new Map([...prev, ...mediaMap]));
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [db, groups]);

  const append = useCallback((id: string) => {
    setBuilt((prev) => [...prev, id]);
    setPlaying(false);
  }, []);

  const removeAt = useCallback((i: number) => {
    setBuilt((prev) => prev.filter((_, idx) => idx !== i));
    setPlaying(false);
  }, []);

  const clips: SequenceClipSource[] = built
    .map((id) => media.get(id))
    .filter((m): m is MovementMedia => !!m && !!m.videoPath)
    .map((m) => ({ movementId: m.id, name: m.name, videoPath: m.videoPath as string }));

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || built.length === 0) return;
    try {
      setSaving(true);
      const seqId = await sequencesRepo(db).create(trimmed, built);
      router.replace(`/sequence/${seqId}` as Href);
    } catch {
      Alert.alert(t('common.error'), t('sequences.errorSave'));
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
      {built.length > 0 ? (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
              {t('sequences.inSequence')} ({built.length})
            </Text>
            <Button
              label={playing ? t('common.done') : t('sequences.play')}
              variant="secondary"
              size="sm"
              onPress={() => setPlaying((p) => !p)}
              disabled={clips.length === 0}
            />
          </View>

          {playing && clips.length > 0 ? (
            <SequencePlayer key={built.join('-')} clips={clips} />
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {built.map((id, i) => {
                const m = media.get(id);
                return (
                  <View key={`${id}-${i}`} className="w-16">
                    <View className="rounded-xl overflow-hidden bg-neutral-800 w-16 h-16">
                      {m?.thumbnailPath ? (
                        <Image source={{ uri: m.thumbnailPath }} style={{ flex: 1 }} contentFit="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Film color="#737373" size={18} />
                        </View>
                      )}
                      <Pressable
                        onPress={() => removeAt(i)}
                        className="absolute top-0.5 right-0.5 bg-black/70 rounded-full w-5 h-5 items-center justify-center"
                      >
                        <X color="#fff" size={12} />
                      </Pressable>
                      <View className="absolute bottom-0 left-0 bg-violet-600 rounded-tr-md px-1">
                        <Text className="text-white text-[10px] font-bold">{i + 1}</Text>
                      </View>
                    </View>
                    <Text className="text-neutral-400 text-[10px] mt-0.5" numberOfLines={1}>
                      {m?.name ?? ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
            {t('sequences.filters')}
          </Text>
          {filterIds.length > 0 ? (
            <Pressable onPress={() => setFilterIds([])} className="px-2 py-1">
              <Text className="text-violet-400 text-sm">{t('sequences.clearFilters')}</Text>
            </Pressable>
          ) : null}
        </View>
        <AttributeSelector
          dimensions={dimensions}
          selectedIds={filterIds}
          onChange={setFilterIds}
          forceMulti
        />
      </View>

      <View className="gap-2">
        <Text className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
          {t('sequences.results')} ({results.length})
        </Text>
        {results.length === 0 ? (
          <Text className="text-neutral-500 text-sm">{t('sequences.noMatches')}</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {results.map((mv) => {
              const m = media.get(mv.id);
              return (
                <Pressable key={mv.id} onPress={() => append(mv.id)} className="w-[31%]">
                  <View className="rounded-xl overflow-hidden bg-neutral-800 aspect-square">
                    {m?.thumbnailPath ? (
                      <Image source={{ uri: m.thumbnailPath }} style={{ flex: 1 }} contentFit="cover" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Film color="#737373" size={20} />
                      </View>
                    )}
                  </View>
                  <Text className="text-neutral-300 text-xs mt-1" numberOfLines={1}>
                    {mv.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <Text className="text-neutral-600 text-xs">{t('sequences.addHint')}</Text>
      </View>

      {built.length > 0 ? (
        <View className="gap-2 border-t border-neutral-800 pt-4">
          <Input
            label={t('sequences.saveTitle')}
            placeholder={t('sequences.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <Button
            label={t('sequences.save')}
            onPress={onSave}
            loading={saving}
            disabled={!name.trim()}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
