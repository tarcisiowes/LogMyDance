import { differenceInCalendarDays, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';

type DB = ReturnType<typeof drizzle<typeof schema>>;

export type StyleCount = { styleId: number | null; name: string | null; icon: string | null; count: number };
export type MoodCount = { mood: string; count: number };
export type StatusCount = { status: string; count: number };

export type StatsData = {
  totalEntries: number;
  totalMovements: number;
  totalMinutes: number;
  weekEntries: number;
  monthEntries: number;
  currentStreak: number;
  longestStreak: number;
  byStyle: StyleCount[];
  byMood: MoodCount[];
  byStatus: StatusCount[];
};

const ISO_DAY = 'yyyy-MM-dd';

/** Current streak = consecutive days ending today or yesterday. Longest = max consecutive run. */
function computeStreaks(distinctDays: string[]): { current: number; longest: number } {
  if (distinctDays.length === 0) return { current: 0, longest: 0 };

  const set = new Set(distinctDays);
  const today = new Date();
  const todayStr = format(today, ISO_DAY);
  const yesterdayStr = format(new Date(today.getTime() - 86_400_000), ISO_DAY);

  let current = 0;
  let cursor: Date | null = null;
  if (set.has(todayStr)) cursor = today;
  else if (set.has(yesterdayStr)) cursor = new Date(today.getTime() - 86_400_000);
  while (cursor && set.has(format(cursor, ISO_DAY))) {
    current += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  const sorted = [...distinctDays].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const diff = differenceInCalendarDays(parseISO(sorted[i]), parseISO(sorted[i - 1]));
    if (diff === 1) run += 1;
    else if (diff > 1) run = 1;
    longest = Math.max(longest, run);
  }

  return { current, longest };
}

export function statsRepo(db: DB) {
  const client = db.$client;

  return {
    async getStats(): Promise<StatsData> {
      const today = new Date();
      const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), ISO_DAY);
      const monthStart = format(startOfMonth(today), ISO_DAY);

      const [totals, week, month, distinctDays, byStyle, byMood, byStatus] = await Promise.all([
        client.getFirstAsync<{ entries: number; minutes: number | null }>(
          'SELECT COUNT(*) as entries, SUM(duration_min) as minutes FROM dance_entries'
        ),
        client.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM dance_entries WHERE date >= ?',
          [weekStart]
        ),
        client.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM dance_entries WHERE date >= ?',
          [monthStart]
        ),
        client.getAllAsync<{ date: string }>(
          'SELECT DISTINCT date FROM dance_entries ORDER BY date'
        ),
        client.getAllAsync<StyleCount>(
          `SELECT e.style_id as styleId, s.name as name, s.icon as icon, COUNT(e.id) as count
           FROM dance_entries e LEFT JOIN styles s ON e.style_id = s.id
           GROUP BY e.style_id ORDER BY count DESC`
        ),
        client.getAllAsync<MoodCount>(
          `SELECT mood, COUNT(*) as count FROM dance_entries
           WHERE mood IS NOT NULL AND mood != '' GROUP BY mood`
        ),
        client.getAllAsync<StatusCount>(
          'SELECT status, COUNT(*) as count FROM movements GROUP BY status'
        ),
      ]);

      const totalMovements = await client.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM movements'
      );

      const { current, longest } = computeStreaks(distinctDays.map((d) => d.date));

      return {
        totalEntries: totals?.entries ?? 0,
        totalMovements: totalMovements?.count ?? 0,
        totalMinutes: totals?.minutes ?? 0,
        weekEntries: week?.count ?? 0,
        monthEntries: month?.count ?? 0,
        currentStreak: current,
        longestStreak: longest,
        byStyle,
        byMood,
        byStatus,
      };
    },
  };
}
