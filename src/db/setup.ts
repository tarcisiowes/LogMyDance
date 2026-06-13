import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_DANCE_STYLES } from '@/constants/dance-styles';

const SCHEMA_VERSION = '1';

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
  `);

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
      ['backup_version_supported', '1']
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
