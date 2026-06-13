import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Plus } from 'lucide-react-native';
import type { Movement } from '@/types';

interface MovementPickerProps {
  movements: Movement[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}

export function MovementPicker({
  movements,
  selectedIds,
  onToggle,
  onCreate,
}: MovementPickerProps) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName('');
  };

  return (
    <View className="gap-2">
      {movements.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {movements.map((m) => {
            const selected = selectedIds.includes(m.id);
            return (
              <Pressable
                key={m.id}
                onPress={() => onToggle(m.id)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  selected
                    ? 'bg-violet-600 border-violet-500'
                    : 'bg-neutral-800 border-neutral-700'
                }`}
              >
                {selected ? <Check color="#fff" size={14} /> : null}
                <Text className="text-neutral-100 text-sm">{m.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text className="text-neutral-500 text-xs">
          {t('picker.empty')}
        </Text>
      )}

      <View className="flex-row gap-2 items-center">
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder={t('picker.newNamePlaceholder')}
          placeholderTextColor="#737373"
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-neutral-100"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAdd}
          className="bg-violet-600 rounded-xl w-11 h-11 items-center justify-center active:bg-violet-700"
        >
          <Plus color="#fff" size={20} />
        </Pressable>
      </View>
    </View>
  );
}
