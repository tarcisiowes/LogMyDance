import { Share, ScrollView, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import Constants from 'expo-constants';
import {
  Database,
  ChevronRight,
  Settings,
  Flame,
  Share2,
  BookOpen,
  Dumbbell,
  Clock,
  type LucideIcon,
} from 'lucide-react-native';
import { useDb } from '@/db/context';
import { Card } from '@/components/ui/Card';
import { statsRepo, type StatsData } from '@/repositories/stats';
import { preferences } from '@/stores/preferences';
import { MOODS } from '@/constants/moods';
import { MOVEMENT_STATUSES } from '@/constants/statuses';

const EMPTY: StatsData = {
  totalEntries: 0,
  totalMovements: 0,
  totalMinutes: 0,
  weekEntries: 0,
  monthEntries: 0,
  currentStreak: 0,
  longestStreak: 0,
  byStyle: [],
  byMood: [],
  byStatus: [],
};

function formatPracticeTime(min: number): string {
  if (min <= 0) return '0';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function StatsScreen() {
  const db = useDb();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<StatsData>(EMPTY);
  const [appOpens, setAppOpens] = useState(0);

  const shareDiagnostics = useCallback(() => {
    const installDate = preferences.getInstallDate();
    const daysSinceInstall = installDate
      ? differenceInCalendarDays(new Date(), parseISO(installDate))
      : 0;
    const lines = [
      'Log My Dance — beta diagnostics',
      `version: ${Constants.expoConfig?.version ?? '1.0.0'}`,
      `language: ${i18n.language}`,
      `entries: ${stats.totalEntries}`,
      `movements: ${stats.totalMovements}`,
      `practice_min: ${stats.totalMinutes}`,
      `current_streak: ${stats.currentStreak}`,
      `longest_streak: ${stats.longestStreak}`,
      `app_opens: ${appOpens}`,
      `days_since_install: ${daysSinceInstall}`,
    ];
    Share.share({ message: lines.join('\n') });
  }, [stats, appOpens, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      statsRepo(db)
        .getStats()
        .then((data) => {
          if (active) setStats(data);
        })
        .catch(() => {});
      setAppOpens(preferences.getAppOpens());
      return () => {
        active = false;
      };
    }, [db])
  );

  const hasData = stats.totalEntries > 0 || stats.totalMovements > 0;
  const moodTotal = stats.byMood.reduce((sum, m) => sum + m.count, 0);
  const statusTotal = stats.byStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <SectionLabel>{t('stats.overview')}</SectionLabel>

      <View className="flex-row gap-3">
        <StatCard Icon={BookOpen} value={stats.totalEntries} label={t('stats.totalEntries')} />
        <StatCard Icon={Dumbbell} value={stats.totalMovements} label={t('stats.totalMovements')} />
      </View>
      <View className="flex-row gap-3">
        <StatCard
          Icon={Clock}
          value={formatPracticeTime(stats.totalMinutes)}
          label={t('stats.practiceTime')}
        />
        <Card className="flex-1 items-center gap-1">
          <Flame color={stats.currentStreak > 0 ? '#f97316' : '#3f3f46'} size={28} />
          <Text className="text-neutral-100 text-2xl font-bold">
            {stats.currentStreak} {t(stats.currentStreak === 1 ? 'stats.day' : 'stats.days')}
          </Text>
          <Text className="text-neutral-500 text-xs">{t('stats.currentStreak')}</Text>
        </Card>
      </View>

      <View className="flex-row gap-3">
        <MiniStat value={stats.weekEntries} label={t('stats.thisWeek')} suffix={t('stats.entriesLabel')} />
        <MiniStat value={stats.monthEntries} label={t('stats.thisMonth')} suffix={t('stats.entriesLabel')} />
      </View>

      {!hasData && (
        <Card>
          <Text className="text-neutral-400 text-sm text-center">{t('stats.noData')}</Text>
        </Card>
      )}

      {stats.byStyle.length > 0 && (
        <Card className="gap-3 mt-2">
          <Text className="text-neutral-200 font-semibold">{t('stats.byStyle')}</Text>
          {stats.byStyle.map((s) => (
            <BarRow
              key={String(s.styleId)}
              label={s.name ?? t('common.none')}
              count={s.count}
              max={stats.byStyle[0].count}
              color="#a855f7"
            />
          ))}
        </Card>
      )}

      {moodTotal > 0 && (
        <Card className="gap-3">
          <Text className="text-neutral-200 font-semibold">{t('stats.moodBreakdown')}</Text>
          {MOODS.map((mood) => {
            const count = stats.byMood.find((m) => m.mood === mood.value)?.count ?? 0;
            if (count === 0) return null;
            return (
              <BarRow
                key={mood.value}
                Icon={mood.Icon}
                label={mood.label}
                count={count}
                max={moodTotal}
                color={mood.color}
              />
            );
          })}
        </Card>
      )}

      {statusTotal > 0 && (
        <Card className="gap-3">
          <Text className="text-neutral-200 font-semibold">{t('stats.movementProgress')}</Text>
          {MOVEMENT_STATUSES.map((status) => {
            const count = stats.byStatus.find((s) => s.status === status.value)?.count ?? 0;
            if (count === 0) return null;
            return (
              <BarRow
                key={status.value}
                label={status.label}
                count={count}
                max={statusTotal}
                color={status.color}
              />
            );
          })}
        </Card>
      )}

      <SectionLabel className="mt-4">{t('stats.betaDiagnostics')}</SectionLabel>
      <View className="flex-row gap-3">
        <MiniStat value={appOpens} label={t('stats.appOpens')} />
        <MiniStat value={stats.longestStreak} label={t('stats.longestStreak')} />
      </View>

      <Card className="flex-row items-center gap-3" onPress={shareDiagnostics}>
        <Share2 color="#a855f7" size={20} />
        <Text className="text-neutral-100 font-semibold flex-1">
          {t('stats.shareDiagnostics')}
        </Text>
        <ChevronRight color="#525252" size={18} />
      </Card>

      <Card
        className="mt-2 flex-row items-center gap-3"
        onPress={() => router.push('/storage' as Href)}
      >
        <Database color="#a855f7" size={20} />
        <View className="flex-1">
          <Text className="text-neutral-100 font-semibold">{t('stats.storageBackup')}</Text>
          <Text className="text-neutral-500 text-xs">{t('stats.storageBackupDesc')}</Text>
        </View>
        <ChevronRight color="#525252" size={18} />
      </Card>

      <Card
        className="flex-row items-center gap-3"
        onPress={() => router.push('/settings' as Href)}
      >
        <Settings color="#a855f7" size={20} />
        <View className="flex-1">
          <Text className="text-neutral-100 font-semibold">{t('stats.settings')}</Text>
          <Text className="text-neutral-500 text-xs">{t('stats.settingsDesc')}</Text>
        </View>
        <ChevronRight color="#525252" size={18} />
      </Card>
    </ScrollView>
  );
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-neutral-400 text-sm font-medium uppercase tracking-wider ${className}`}>
      {children}
    </Text>
  );
}

function StatCard({ Icon, value, label }: { Icon: LucideIcon; value: number | string; label: string }) {
  return (
    <Card className="flex-1 items-center gap-1.5">
      <Icon color="#a855f7" size={22} />
      <Text className="text-neutral-100 text-2xl font-bold">{value}</Text>
      <Text className="text-neutral-500 text-xs text-center">{label}</Text>
    </Card>
  );
}

function MiniStat({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <Card className="flex-1 gap-0.5">
      <Text className="text-neutral-100 text-xl font-bold">
        {value}
        {suffix ? <Text className="text-neutral-500 text-sm font-normal"> {suffix}</Text> : null}
      </Text>
      <Text className="text-neutral-500 text-xs">{label}</Text>
    </Card>
  );
}

function BarRow({
  label,
  count,
  max,
  color,
  Icon,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
  Icon?: LucideIcon;
}) {
  const pct = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0;
  return (
    <View className="gap-1.5">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-1.5">
          {Icon ? <Icon color={color} size={14} /> : null}
          <Text className="text-neutral-300 text-sm">{label}</Text>
        </View>
        <Text className="text-neutral-400 text-sm font-medium">{count}</Text>
      </View>
      <View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <View style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full" />
      </View>
    </View>
  );
}
