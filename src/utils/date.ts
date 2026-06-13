import i18n from '@/i18n';

export function now(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(i18n.language || 'en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate + 'T12:00:00'));
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate + 'T12:00:00');
  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return i18n.t('date.today');
  if (diffDays === 1) return i18n.t('date.yesterday');
  if (diffDays < 7) return i18n.t('date.daysAgo', { count: diffDays });
  return formatDate(isoDate);
}
