import type { MovementStatus } from '@/types';

export const MOVEMENT_STATUSES: Array<{
  value: MovementStatus;
  label: string;
  color: string;
  bgColor: string;
}> = [
  { value: 'new', label: 'New', color: '#a1a1aa', bgColor: '#27272a' },
  { value: 'learning', label: 'Learning', color: '#60a5fa', bgColor: '#1e3a5f' },
  { value: 'needs_practice', label: 'Needs Practice', color: '#fb923c', bgColor: '#431407' },
  { value: 'comfortable', label: 'Comfortable', color: '#4ade80', bgColor: '#14532d' },
  { value: 'mastered', label: 'Mastered', color: '#c084fc', bgColor: '#3b0764' },
];

export function getStatusInfo(status: MovementStatus) {
  return MOVEMENT_STATUSES.find((s) => s.value === status) ?? MOVEMENT_STATUSES[0];
}
