import type { TFunction } from 'i18next';
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

/**
 * Attribute labels: default (seeded) rows resolve via i18n key with the stored
 * PT-BR label as fallback; user-created rows use the stored label as-is.
 */
export function dimensionLabel(
  t: TFunction,
  dim: { key: string; label: string | null; isCustom: number }
): string {
  if (dim.isCustom) return dim.label ?? '';
  return t(`attributes.dim.${dim.key}` as never, {
    defaultValue: dim.label ?? dim.key,
  }) as string;
}

export function valueLabel(
  t: TFunction,
  dimKey: string,
  val: { key: string | null; label: string | null; isCustom: number }
): string {
  if (val.isCustom || !val.key) return val.label ?? '';
  return t(`attributes.val.${dimKey}.${val.key}` as never, {
    defaultValue: val.label ?? val.key,
  }) as string;
}
