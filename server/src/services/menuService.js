import { query } from '../config/db.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

/**
 * Create a new menu item (manager only — enforced at route level).
 */
export async function createMenuItem({ name, description, price, available = true }, createdBy) {
  const result = await query(
    `INSERT INTO menu_items (name, description, price, available, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description || null, price, available, createdBy],
  );
  return result.rows[0];
}

/**
 * List menu items. By default returns only non-archived items.
 */
export async function listMenuItems({ includeArchived = false } = {}) {
  const where = includeArchived ? '' : 'WHERE archived = false';
  const result = await query(
    `SELECT * FROM menu_items ${where} ORDER BY name`,
  );
  return result.rows;
}

/**
 * Get a single menu item by ID.
 */
export async function getMenuItem(id) {
  const result = await query('SELECT * FROM menu_items WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new NotFoundError('Menu item not found');
  return result.rows[0];
}

/**
 * Update a menu item.
 */
export async function updateMenuItem(id, updates) {
  const item = await getMenuItem(id);

  const name = updates.name ?? item.name;
  const description = updates.description ?? item.description;
  const price = updates.price ?? item.price;
  const available = updates.available ?? item.available;

  if (price < 0) throw new BadRequestError('Price must be non-negative');

  const result = await query(
    `UPDATE menu_items
     SET name = $1, description = $2, price = $3, available = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [name, description, price, available, id],
  );
  return result.rows[0];
}

/**
 * Archive / restore a menu item.
 */
export async function archiveMenuItem(id, archived = true) {
  await getMenuItem(id); // ensure exists
  const result = await query(
    `UPDATE menu_items SET archived = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [archived, id],
  );
  return result.rows[0];
}

/**
 * Bulk update menu items. Processes each item individually so partial
 * failures can be reported per-item.
 *
 * @param {string[]} itemIds  — IDs to update
 * @param {{ price?: number, available?: boolean }} changes
 * @returns {{ results: Array<{ id: string, success: boolean, item?: object, error?: string }> }}
 */
export async function bulkUpdateMenuItems(itemIds, changes) {
  const results = [];

  for (const id of itemIds) {
    try {
      const item = await updateMenuItem(id, changes);
      results.push({ id, success: true, item });
    } catch (err) {
      results.push({ id, success: false, error: err.message });
    }
  }

  return { results };
}
