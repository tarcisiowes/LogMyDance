import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const styles = sqliteTable('styles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon'),
  isCustom: integer('is_custom').notNull().default(0),
});

export const danceEntries = sqliteTable('dance_entries', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  styleId: integer('style_id').references(() => styles.id),
  instructor: text('instructor'),
  location: text('location'),
  durationMin: integer('duration_min'),
  mood: text('mood'),
  notes: text('notes'),
  templateId: text('template_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const movements = sqliteTable('movements', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  styleId: integer('style_id').references(() => styles.id),
  status: text('status').notNull().default('new'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const entryMovements = sqliteTable('entry_movements', {
  entryId: text('entry_id')
    .notNull()
    .references(() => danceEntries.id, { onDelete: 'cascade' }),
  movementId: text('movement_id')
    .notNull()
    .references(() => movements.id, { onDelete: 'cascade' }),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
});

export const entryTags = sqliteTable('entry_tags', {
  entryId: text('entry_id')
    .notNull()
    .references(() => danceEntries.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const classTemplates = sqliteTable('class_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  styleId: integer('style_id').references(() => styles.id),
  instructor: text('instructor'),
  location: text('location'),
  defaultDuration: integer('default_duration'),
  createdAt: text('created_at').notNull(),
});

export const templateTags = sqliteTable('template_tags', {
  templateId: text('template_id')
    .notNull()
    .references(() => classTemplates.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const movementProgress = sqliteTable('movement_progress', {
  id: text('id').primaryKey(),
  movementId: text('movement_id')
    .notNull()
    .references(() => movements.id, { onDelete: 'cascade' }),
  entryId: text('entry_id').references(() => danceEntries.id, { onDelete: 'set null' }),
  date: text('date').notNull(),
  oldStatus: text('old_status').notNull(),
  newStatus: text('new_status').notNull(),
  note: text('note'),
});

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  ownerType: text('owner_type').notNull(),
  ownerId: text('owner_id').notNull(),
  kind: text('kind').notNull(),
  localPath: text('local_path').notNull(),
  originalFilename: text('original_filename'),
  sizeBytes: integer('size_bytes'),
  mimeType: text('mime_type'),
  durationMs: integer('duration_ms'),
  width: integer('width'),
  height: integer('height'),
  status: text('status').notNull().default('ready'),
  createdAt: text('created_at').notNull(),
});

export const appMetadata = sqliteTable('app_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const attributeDimensions = sqliteTable('attribute_dimensions', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label'),
  selection: text('selection').notNull().default('single'),
  position: integer('position').notNull().default(0),
  isCustom: integer('is_custom').notNull().default(0),
});

export const attributeValues = sqliteTable('attribute_values', {
  id: text('id').primaryKey(),
  dimensionId: text('dimension_id')
    .notNull()
    .references(() => attributeDimensions.id, { onDelete: 'cascade' }),
  key: text('key'),
  label: text('label'),
  position: integer('position').notNull().default(0),
  isCustom: integer('is_custom').notNull().default(0),
});

export const movementAttributes = sqliteTable('movement_attributes', {
  movementId: text('movement_id')
    .notNull()
    .references(() => movements.id, { onDelete: 'cascade' }),
  valueId: text('value_id')
    .notNull()
    .references(() => attributeValues.id, { onDelete: 'cascade' }),
});

export const sequences = sqliteTable('sequences', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sequenceItems = sqliteTable('sequence_items', {
  id: text('id').primaryKey(),
  sequenceId: text('sequence_id')
    .notNull()
    .references(() => sequences.id, { onDelete: 'cascade' }),
  movementId: text('movement_id')
    .notNull()
    .references(() => movements.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
});
