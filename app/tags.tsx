import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Tag as TagIcon, Check } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { tagsRepo } from '@/repositories/tags';
import { EmptyState } from '@/components/ui/EmptyState';
import { newUUID } from '@/utils/uuid';
import type { Tag } from '@/types';

const TAG_COLORS = [
  '#f43f5e', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
];

export default function TagsScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[5]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const t = await tagsRepo(db).getAll();
    setTags(t as Tag[]);
  }, [db]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setAdding(true);
      await tagsRepo(db).create({ name: newName.trim(), color: newColor });
      setNewName('');
      await load();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert(t('tags.deleteTitle'), t('tags.deleteBody', { name: tag.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await tagsRepo(db).delete(tag.id);
          await load();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <View className="p-4 border-b border-neutral-800 gap-3">
        <TextInput
          className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-100 text-base"
          placeholder={t('tags.newNamePlaceholder')}
          placeholderTextColor="#737373"
          value={newName}
          onChangeText={setNewName}
        />
        <View className="flex-row items-center gap-3">
          <View className="flex-row gap-2 flex-1">
            {TAG_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setNewColor(color)}
                style={{ backgroundColor: color }}
                className={`w-7 h-7 rounded-full items-center justify-center ${newColor === color ? 'ring-2' : ''}`}
              >
                {newColor === color ? <Check color="#fff" size={14} /> : null}
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={handleAdd}
            disabled={!newName.trim() || adding}
            className="bg-violet-600 px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 disabled:opacity-50"
          >
            <Plus color="#fff" size={16} />
            <Text className="text-white font-semibold text-sm">{t('common.add')}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
            <View
              style={{ backgroundColor: item.color ?? '#9333ea' }}
              className="w-3 h-3 rounded-full mr-3"
            />
            <Text className="text-neutral-100 flex-1">{item.name}</Text>
            <Pressable onPress={() => handleDelete(item)} className="p-1">
              <Trash2 color="#ef4444" size={18} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState Icon={TagIcon} title={t('tags.emptyTitle')} subtitle={t('tags.emptySubtitle')} />
        }
      />
    </View>
  );
}
