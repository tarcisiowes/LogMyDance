import type { Mood } from '@/types';

export const MOODS: Array<{ value: Mood; label: string; emoji: string; color: string }> = [
  { value: 'great', label: 'Great', emoji: '✨', color: '#22c55e' },
  { value: 'good', label: 'Good', emoji: '😊', color: '#3b82f6' },
  { value: 'ok', label: 'Ok', emoji: '😐', color: '#eab308' },
  { value: 'tough', label: 'Tough', emoji: '😤', color: '#f97316' },
];

export function getMoodEmoji(mood: Mood | null | undefined): string {
  if (!mood) return '';
  return MOODS.find((m) => m.value === mood)?.emoji ?? '';
}

export function getMoodColor(mood: Mood | null | undefined): string {
  if (!mood) return '#71717a';
  return MOODS.find((m) => m.value === mood)?.color ?? '#71717a';
}
