import { asc, eq, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as schema from '@/db/schema';
import { newUUID } from '@/utils/uuid';
import type { AttributeSelection } from '@/constants/forro-attributes';

type DB = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

export type AttributeValueRow = {
  id: string;
  dimensionId: string;
  key: string | null;
  label: string | null;
  position: number;
  isCustom: number;
};

export type DimensionWithValues = {
  id: string;
  key: string;
  label: string | null;
  selection: AttributeSelection;
  position: number;
  isCustom: number;
  values: AttributeValueRow[];
};

export type FilteredMovement = {
  id: string;
  name: string;
  styleId: number | null;
  status: string;
};

export function attributesRepo(db: DB) {
  const client = db.$client;

  return {
    async getDimensionsWithValues(): Promise<DimensionWithValues[]> {
      const [dims, vals] = await Promise.all([
        db.select().from(schema.attributeDimensions).orderBy(asc(schema.attributeDimensions.position)),
        db.select().from(schema.attributeValues).orderBy(asc(schema.attributeValues.position)),
      ]);
      const byDim = new Map<string, AttributeValueRow[]>();
      for (const v of vals) {
        const list = byDim.get(v.dimensionId) ?? [];
        list.push(v as AttributeValueRow);
        byDim.set(v.dimensionId, list);
      }
      return dims.map((d) => ({
        id: d.id,
        key: d.key,
        label: d.label,
        selection: d.selection as AttributeSelection,
        position: d.position,
        isCustom: d.isCustom,
        values: byDim.get(d.id) ?? [],
      }));
    },

    async getMovementValueIds(movementId: string): Promise<string[]> {
      const rows = await db
        .select()
        .from(schema.movementAttributes)
        .where(eq(schema.movementAttributes.movementId, movementId));
      return rows.map((r) => r.valueId);
    },

    async setMovementValues(movementId: string, valueIds: string[]): Promise<void> {
      await db
        .delete(schema.movementAttributes)
        .where(eq(schema.movementAttributes.movementId, movementId));
      if (valueIds.length > 0) {
        await db
          .insert(schema.movementAttributes)
          .values(valueIds.map((valueId) => ({ movementId, valueId })));
      }
    },

    async addValue(dimensionId: string, label: string): Promise<string> {
      const id = newUUID();
      const last = await client.getFirstAsync<{ max: number | null }>(
        'SELECT MAX(position) as max FROM attribute_values WHERE dimension_id = ?',
        [dimensionId]
      );
      await db.insert(schema.attributeValues).values({
        id,
        dimensionId,
        key: null,
        label,
        position: (last?.max ?? -1) + 1,
        isCustom: 1,
      });
      return id;
    },

    async addDimension(label: string, selection: AttributeSelection): Promise<string> {
      const id = newUUID();
      const last = await client.getFirstAsync<{ max: number | null }>(
        'SELECT MAX(position) as max FROM attribute_dimensions'
      );
      await db.insert(schema.attributeDimensions).values({
        id,
        key: `custom_${id.slice(0, 8)}`,
        label,
        selection,
        position: (last?.max ?? -1) + 1,
        isCustom: 1,
      });
      return id;
    },

    async renameValue(id: string, label: string): Promise<void> {
      await db
        .update(schema.attributeValues)
        .set({ label })
        .where(eq(schema.attributeValues.id, id));
    },

    async deleteValue(id: string): Promise<void> {
      await db.delete(schema.attributeValues).where(eq(schema.attributeValues.id, id));
    },

    async deleteDimension(id: string): Promise<void> {
      await db.delete(schema.attributeDimensions).where(eq(schema.attributeDimensions.id, id));
    },

    /**
     * Movements that have a ready video AND match the filters: OR within a
     * dimension's value group, AND across dimensions. Empty groups are ignored;
     * no filters → all movements with a ready video.
     */
    async getMovementsByFilters(groups: string[][]): Promise<FilteredMovement[]> {
      const nonEmpty = groups.filter((g) => g.length > 0);
      const params: string[] = [];
      const conditions = [
        `EXISTS (SELECT 1 FROM media_assets ma WHERE ma.owner_type = 'movement' AND ma.owner_id = m.id AND ma.kind = 'video' AND ma.status = 'ready')`,
      ];
      for (const group of nonEmpty) {
        const placeholders = group.map(() => '?').join(',');
        conditions.push(
          `m.id IN (SELECT movement_id FROM movement_attributes WHERE value_id IN (${placeholders}))`
        );
        params.push(...group);
      }
      const sql = `SELECT m.id, m.name, m.style_id as styleId, m.status
                   FROM movements m WHERE ${conditions.join(' AND ')} ORDER BY m.name`;
      return client.getAllAsync<FilteredMovement>(sql, params);
    },

    async getValueIdsForMovements(movementIds: string[]): Promise<Map<string, string[]>> {
      const result = new Map<string, string[]>();
      if (movementIds.length === 0) return result;
      const rows = await db
        .select()
        .from(schema.movementAttributes)
        .where(inArray(schema.movementAttributes.movementId, movementIds));
      for (const r of rows) {
        const list = result.get(r.movementId) ?? [];
        list.push(r.valueId);
        result.set(r.movementId, list);
      }
      return result;
    },
  };
}
