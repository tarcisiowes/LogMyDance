import { ScrollView, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import { Database, ChevronRight } from 'lucide-react-native';
import { useDb } from '@/db/context';
import { Card } from '@/components/ui/Card';
import { preferences } from '@/stores/preferences';

type Stats = {
  entriesCount: number;
  movementsCount: number;
  templatesCount: number;
  appOpens: number;
};

export default function StatsScreen() {
  const db = useDb();
  const [stats, setStats] = useState<Stats>({
    entriesCount: 0,
    movementsCount: 0,
    templatesCount: 0,
    appOpens: 0,
  });

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [entries, movements, templates] = await Promise.all([
          db.$client.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM dance_entries'
          ),
          db.$client.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM movements'
          ),
          db.$client.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM class_templates'
          ),
        ]);

        setStats({
          entriesCount: entries?.count ?? 0,
          movementsCount: movements?.count ?? 0,
          templatesCount: templates?.count ?? 0,
          appOpens: preferences.getAppOpens(),
        });
      }
      load();
    }, [db])
  );

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2">
        Beta Diagnostics
      </Text>

      <View className="flex-row gap-3">
        <StatCard emoji="📖" value={stats.entriesCount} label="Entries" />
        <StatCard emoji="💪" value={stats.movementsCount} label="Movements" />
      </View>
      <View className="flex-row gap-3">
        <StatCard emoji="📋" value={stats.templatesCount} label="Templates" />
        <StatCard emoji="🚀" value={stats.appOpens} label="App opens" />
      </View>

      <Card
        className="mt-4 flex-row items-center gap-3"
        onPress={() => router.push('/storage' as Href)}
      >
        <Database color="#a855f7" size={20} />
        <View className="flex-1">
          <Text className="text-neutral-100 font-semibold">Storage & Backup</Text>
          <Text className="text-neutral-500 text-xs">
            Export, import, and manage media
          </Text>
        </View>
        <ChevronRight color="#525252" size={18} />
      </Card>

      <Card className="mt-2">
        <Text className="text-neutral-400 text-xs text-center">
          More stats coming in Sprint 4 ✨
        </Text>
      </Card>
    </ScrollView>
  );
}

function StatCard({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <Card className="flex-1 items-center gap-1">
      <Text className="text-3xl">{emoji}</Text>
      <Text className="text-neutral-100 text-2xl font-bold">{value}</Text>
      <Text className="text-neutral-500 text-xs">{label}</Text>
    </Card>
  );
}
