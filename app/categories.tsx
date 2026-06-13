import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, X, Trash2, Check } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { attributesRepo, type DimensionWithValues } from '@/repositories/attributes';
import { dimensionLabel, valueLabel } from '@/i18n/labels';
import type { AttributeSelection } from '@/constants/forro-attributes';

export default function CategoriesScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [dimensions, setDimensions] = useState<DimensionWithValues[]>([]);
  const [addingDim, setAddingDim] = useState<string | null>(null);
  const [valueDraft, setValueDraft] = useState('');
  const [newDimName, setNewDimName] = useState('');
  const [newDimSelection, setNewDimSelection] = useState<AttributeSelection>('single');

  const load = useCallback(async () => {
    setDimensions(await attributesRepo(db).getDimensionsWithValues());
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const addValue = async (dimId: string) => {
    const label = valueDraft.trim();
    if (!label) return;
    await attributesRepo(db).addValue(dimId, label);
    setValueDraft('');
    setAddingDim(null);
    await load();
  };

  const deleteValue = (id: string) =>
    Alert.alert(t('attributes.deleteValueTitle'), t('attributes.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await attributesRepo(db).deleteValue(id);
          await load();
        },
      },
    ]);

  const deleteDimension = (id: string) =>
    Alert.alert(t('attributes.deleteCategoryTitle'), t('attributes.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await attributesRepo(db).deleteDimension(id);
          await load();
        },
      },
    ]);

  const addDimension = async () => {
    const label = newDimName.trim();
    if (!label) return;
    await attributesRepo(db).addDimension(label, newDimSelection);
    setNewDimName('');
    setNewDimSelection('single');
    await load();
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {dimensions.map((dim) => (
        <View key={dim.id} className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-neutral-200 text-sm font-semibold">
              {dimensionLabel(t, dim)}
            </Text>
            {dim.isCustom ? (
              <Pressable onPress={() => deleteDimension(dim.id)} className="p-1">
                <Trash2 color="#ef4444" size={16} />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-2">
            {dim.values.map((val) => (
              <View
                key={val.id}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700"
              >
                <Text className="text-neutral-200 text-sm">{valueLabel(t, dim.key, val)}</Text>
                {val.isCustom ? (
                  <Pressable onPress={() => deleteValue(val.id)} hitSlop={6}>
                    <X color="#a3a3a3" size={13} />
                  </Pressable>
                ) : null}
              </View>
            ))}

            {addingDim === dim.id ? (
              <View className="flex-row items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-full pl-3 pr-1 py-0.5">
                <TextInput
                  value={valueDraft}
                  onChangeText={setValueDraft}
                  autoFocus
                  placeholder={t('attributes.newValuePlaceholder')}
                  placeholderTextColor="#737373"
                  className="text-neutral-100 text-sm min-w-[90px] py-1"
                  onSubmitEditing={() => addValue(dim.id)}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={() => addValue(dim.id)}
                  className="bg-violet-600 rounded-full w-7 h-7 items-center justify-center"
                >
                  <Check color="#fff" size={14} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setAddingDim(dim.id);
                  setValueDraft('');
                }}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-neutral-600"
              >
                <Plus color="#a3a3a3" size={13} />
                <Text className="text-neutral-400 text-sm">{t('attributes.addValue')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}

      <View className="gap-2 border-t border-neutral-800 pt-5">
        <Text className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
          {t('attributes.addCategory')}
        </Text>
        <TextInput
          value={newDimName}
          onChangeText={setNewDimName}
          placeholder={t('attributes.newCategoryPlaceholder')}
          placeholderTextColor="#737373"
          className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-100 text-base"
        />
        <View className="flex-row gap-2">
          {(['single', 'multi'] as const).map((sel) => (
            <Pressable
              key={sel}
              onPress={() => setNewDimSelection(sel)}
              className={`flex-1 items-center py-2.5 rounded-xl border ${
                newDimSelection === sel
                  ? 'border-violet-500 bg-violet-600/20'
                  : 'border-neutral-700 bg-neutral-800'
              }`}
            >
              <Text className="text-neutral-200 text-sm">
                {sel === 'single' ? t('attributes.selectionSingle') : t('attributes.selectionMulti')}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={addDimension}
          disabled={!newDimName.trim()}
          className="bg-violet-600 px-4 py-3 rounded-xl items-center active:bg-violet-700 disabled:opacity-50"
        >
          <Text className="text-white font-semibold">{t('attributes.addCategory')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
