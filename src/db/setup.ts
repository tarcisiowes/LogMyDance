import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_DANCE_STYLES } from '@/constants/dance-styles';
import { FORRO_ATTRIBUTES } from '@/constants/forro-attributes';
import { newUUID } from '@/utils/uuid';

const SCHEMA_VERSION = '2';

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      is_custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS dance_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      style_id INTEGER REFERENCES styles(id),
      instructor TEXT,
      location TEXT,
      duration_min INTEGER,
      mood TEXT,
      notes TEXT,
      template_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      style_id INTEGER REFERENCES styles(id),
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entry_movements (
      entry_id TEXT NOT NULL REFERENCES dance_entries(id) ON DELETE CASCADE,
      movement_id TEXT NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
      PRIMARY KEY (entry_id, movement_id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS entry_tags (
      entry_id TEXT NOT NULL REFERENCES dance_entries(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (entry_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS class_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      style_id INTEGER REFERENCES styles(id),
      instructor TEXT,
      location TEXT,
      default_duration INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_tags (
      template_id TEXT NOT NULL REFERENCES class_templates(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (template_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS movement_progress (
      id TEXT PRIMARY KEY,
      movement_id TEXT NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
      entry_id TEXT REFERENCES dance_entries(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      local_path TEXT NOT NULL,
      original_filename TEXT,
      size_bytes INTEGER,
      mime_type TEXT,
      duration_ms INTEGER,
      width INTEGER,
      height INTEGER,
      status TEXT NOT NULL DEFAULT 'ready',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attribute_dimensions (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT,
      selection TEXT NOT NULL DEFAULT 'single',
      position INTEGER NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attribute_values (
      id TEXT PRIMARY KEY,
      dimension_id TEXT NOT NULL REFERENCES attribute_dimensions(id) ON DELETE CASCADE,
      key TEXT,
      label TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS movement_attributes (
      movement_id TEXT NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
      value_id TEXT NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
      PRIMARY KEY (movement_id, value_id)
    );

    CREATE TABLE IF NOT EXISTS sequences (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sequence_items (
      id TEXT PRIMARY KEY,
      sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
      movement_id TEXT NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
      position INTEGER NOT NULL
    );
  `);

  // Idempotent: seeds the default forró taxonomy once. Covers both fresh
  // installs and upgrades (runs whenever the dimensions table is empty).
  await seedAttributes(db);

  const meta = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    ['schema_version']
  );

  if (!meta) {
    await seedDatabase(db);
    await db.runAsync(
      'INSERT INTO app_metadata (key, value) VALUES (?, ?)',
      ['schema_version', SCHEMA_VERSION]
    );
    await db.runAsync(
      'INSERT INTO app_metadata (key, value) VALUES (?, ?)',
      ['backup_version_supported', '2']
    );
  }
}

async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  for (const style of DEFAULT_DANCE_STYLES) {
    await db.runAsync(
      'INSERT OR IGNORE INTO styles (name, icon, is_custom) VALUES (?, ?, 0)',
      [style.name, style.icon]
    );
  }
}

async function seedAttributes(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM attribute_dimensions'
  );
  if (existing && existing.count > 0) return;

  let dimPos = 0;
  for (const dim of FORRO_ATTRIBUTES) {
    const dimId = newUUID();
    await db.runAsync(
      'INSERT INTO attribute_dimensions (id, key, label, selection, position, is_custom) VALUES (?, ?, ?, ?, ?, 0)',
      [dimId, dim.key, dim.label, dim.selection, dimPos++]
    );
    let valPos = 0;
    for (const val of dim.values) {
      await db.runAsync(
        'INSERT INTO attribute_values (id, dimension_id, key, label, position, is_custom) VALUES (?, ?, ?, ?, ?, 0)',
        [newUUID(), dimId, val.key, val.label, valPos++]
      );
    }
  }
}
