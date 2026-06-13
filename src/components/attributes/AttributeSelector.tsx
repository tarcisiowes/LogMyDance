import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, Check } from 'lucide-react-native';
import { dimensionLabel, valueLabel } from '@/i18n/labels';
import type { DimensionWithValues, AttributeValueRow } from '@/repositories/attributes';

interface AttributeSelectorProps {
  dimensions: DimensionWithValues[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** When provided, each dimension shows an inline "add value" affordance. */
  onAddValue?: (dimensionId: string, label: string) => void;
  /** Filter mode: allow multiple values per dimension even if single-choice. */
  forceMulti?: boolean;
}

export function AttributeSelector({
  dimensions,
  selectedIds,
  onChange,
  onAddValue,
  forceMulti = false,
}: AttributeSelectorProps) {
  const { t } = useTranslation();
  const [addingDim, setAddingDim] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const selected = new Set(selectedIds);

  function toggle(dim: DimensionWithValues, val: AttributeValueRow) {
    if (selected.has(val.id)) {
      onChange(selectedIds.filter((id) => id !== val.id));
      return;
    }
    if (dim.selection === 'single' && !forceMulti) {
      const dimIds = new Set(dim.values.map((v) => v.id));
      onChange([...selectedIds.filter((id) => !dimIds.has(id)), val.id]);
    } else {
      onChange([...selectedIds, val.id]);
    }
  }

  function confirmAdd(dimId: string) {
    const label = draft.trim();
    if (label && onAddValue) onAddValue(dimId, label);
    setDraft('');
    setAddingDim(null);
  }

  return (
    <View className="gap-4">
      {dimensions.map((dim) => (
        <View key={dim.id} className="gap-1.5">
          <Text className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
            {dimensionLabel(t, dim)}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {dim.values.map((val) => {
              const isSel = selected.has(val.id);
              return (
                <Pressable
                  key={val.id}
                  onPress={() => toggle(dim, val)}
                  className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
                    isSel
                      ? 'bg-violet-600 border-violet-500'
                      : 'bg-neutral-800 border-neutral-700'
                  }`}
                >
                  {isSel ? <Check color="#fff" size={13} /> : null}
                  <Text className={`text-sm ${isSel ? 'text-white' : 'text-neutral-200'}`}>
                    {valueLabel(t, dim.key, val)}
                  </Text>
                </Pressable>
              );
            })}

            {onAddValue ? (
              addingDim === dim.id ? (
                <View className="flex-row items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-full pl-3 pr-1 py-0.5">
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    autoFocus
                    placeholder={t('attributes.newValuePlaceholder')}
                    placeholderTextColor="#737373"
                    className="text-neutral-100 text-sm min-w-[80px] py-1"
                    onSubmitEditing={() => confirmAdd(dim.id)}
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={() => confirmAdd(dim.id)}
                    className="bg-violet-600 rounded-full w-7 h-7 items-center justify-center"
                  >
                    <Check color="#fff" size={14} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setAddingDim(dim.id);
                    setDraft('');
                  }}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-neutral-600"
                >
                  <Plus color="#a3a3a3" size={13} />
                  <Text className="text-neutral-400 text-sm">{t('attributes.addValue')}</Text>
                </Pressable>
              )
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
