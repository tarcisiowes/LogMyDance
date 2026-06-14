import type { LucideIcon } from 'lucide-react-native';
import { Laugh, Smile, Meh, Frown } from 'lucide-react-native';
import type { Mood } from '@/types';

export const MOODS: Array<{ value: Mood; label: string; Icon: LucideIcon; color: string }> = [
  { value: 'great', label: 'Great', Icon: Laugh, color: '#22c55e' },
  { value: 'good', label: 'Good', Icon: Smile, color: '#3b82f6' },
  { value: 'ok', label: 'Ok', Icon: Meh, color: '#eab308' },
  { value: 'tough', label: 'Tough', Icon: Frown, color: '#f97316' },
];

/** Full mood descriptor (icon + color) for a value, or null. */
export function getMood(mood: Mood | null | undefined) {
  if (!mood) return null;
  return MOODS.find((m) => m.value === mood) ?? null;
}

export function getMoodColor(mood: Mood | null | undefined): string {
  if (!mood) return '#71717a';
  return MOODS.find((m) => m.value === mood)?.color ?? '#71717a';
}
