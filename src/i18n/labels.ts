import type { Mood, MovementStatus } from '@/types';

/** Maps enum values to literal translation keys so typed `t()` accepts them. */
export function moodKey(mood: Mood) {
  return (
    {
      great: 'moods.great',
      good: 'moods.good',
      ok: 'moods.ok',
      tough: 'moods.tough',
    } as const
  )[mood];
}

export function statusKey(status: MovementStatus) {
  return (
    {
      new: 'statuses.new',
      learning: 'statuses.learning',
      needs_practice: 'statuses.needs_practice',
      comfortable: 'statuses.comfortable',
      mastered: 'statuses.mastered',
    } as const
  )[status];
}
