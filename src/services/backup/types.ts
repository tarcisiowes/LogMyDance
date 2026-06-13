// Backup format — see docs/logmydance-roadmap.md "CORREÇÃO 3".

export const BACKUP_VERSION = 1;
export const APP_SCHEMA_VERSION = 2;

// Files larger than this are not hashed during export (perf/memory guard).
// Integrity for these falls back to existence + size on import.
export const SHA256_MAX_BYTES = 50 * 1024 * 1024;

// FK-safe order: parents before children. Reverse it for wipe (replace mode).
// app_metadata is intentionally excluded — the app keeps its own schema_version.
export const RESTORE_TABLES_ORDER = [
  'styles',
  'tags',
  'dance_entries',
  'movements',
  'class_templates',
  'entry_movements',
  'entry_tags',
  'template_tags',
  'movement_progress',
  'media_assets',
  // Forró categorization + sequences (parents before children).
  'attribute_dimensions',
  'attribute_values',
  'sequences',
  'movement_attributes',
  'sequence_items',
] as const;

export interface MediaFileEntry {
  id: string; // media_assets.id (unambiguous)
  owner_id: string;
  kind: string; // "video" | "thumbnail"
  filename: string; // basename inside media/
  size_bytes: number | null;
  sha256: string | null;
}

export interface BackupManifest {
  app: string;
  backup_version: number;
  schema_version: number;
  created_at: string;
  platform: string;
  app_version: string;
  entries_count: number;
  movements_count: number;
  media_files: MediaFileEntry[];
}

export type ConflictMode = 'replace' | 'merge';

export interface ImportResult {
  mode: ConflictMode;
  tablesImported: number;
  rowsImported: number;
  mediaRestored: number;
  mediaMissing: number;
}

// User-facing error — message is safe to show in an Alert.
export class BackupError extends Error {}

export function stripScheme(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

export function basename(p: string): string {
  return p.split('/').pop() ?? p;
}
