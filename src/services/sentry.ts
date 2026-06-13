import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

/**
 * Crash/error reporting only — NEVER behavioral analytics or PII.
 * See roadmap correction #2: "Private by design" forbids tracking what the
 * user logs (notes, teacher/location names, filenames, etc.). We only report
 * unhandled crashes and a small set of operational failures, tagged by a
 * logical event name with no user content attached.
 */

const DSN =
  (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn ||
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  '';

let enabled = false;

export function initSentry(): void {
  // No-op without a DSN (local dev, or before the user configures one).
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    // Crash/error only: no performance, sessions, or breadcrumbs (which could
    // carry user input).
    tracesSampleRate: 0,
    enableAutoSessionTracking: false,
    enableAutoPerformanceTracing: false,
    maxBreadcrumbs: 0,
    sendDefaultPii: false,
  });
  enabled = true;
}

export type ErrorEvent =
  | 'file_import_failed'
  | 'video_thumbnail_failed'
  | 'export_failed'
  | 'restore_failed'
  | 'db_migration_error';

/** Report an operational failure. Attach only a logical tag — no user data. */
export function captureError(error: unknown, event: ErrorEvent): void {
  if (!enabled) return;
  Sentry.captureException(error, { tags: { event } });
}
