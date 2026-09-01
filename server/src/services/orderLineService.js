import { query, getClient } from '../config/db.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

/**
 * Add a line to an order. Snapshots the menu item's current price.
 */
export async function addLine(orderId, { menu_item_id, quantity, special_instructions }, user) {
  // Verify order exists and is in an addable state
  const orderResult = await query('SELECT status FROM orders WHERE id = $1', [orderId]);
  if (orderResult.rows.length === 0) throw new NotFoundError('Order not found');

  const { status } = orderResult.rows[0];
  if (status === 'served' || status === 'cancelled') {
    throw new BadRequestError(`Cannot add lines to an order that is "${status}"`);
  }

  // Get current menu item price
  const menuResult = await query(
    'SELECT id, name, price, available FROM menu_items WHERE id = $1 AND archived = false',
    [menu_item_id],
  );
  if (menuResult.rows.length === 0) {
    throw new NotFoundError('Menu item not found or has been archived');
  }

  const menuItem = menuResult.rows[0];
  if (!menuItem.available) {
    throw new BadRequestError(`Menu item "${menuItem.name}" is currently unavailable`);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const lineResult = await client.query(
      `INSERT INTO order_lines (order_id, menu_item_id, quantity, special_instructions, unit_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, menu_item_id, quantity, special_instructions || null, menuItem.price],
    );

    const line = lineResult.rows[0];

    // Record history
    await client.query(
      `INSERT INTO order_history (order_id, event_type, new_value, details, performed_by)
       VALUES ($1, 'line_added', $2, $3, $4)`,
      [
        orderId,
        line.id,
        JSON.stringify({
          menu_item: menuItem.name,
          quantity,
          unit_price: menuItem.price,
          special_instructions: special_instructions || null,
        }),
        user.id,
      ],
    );

    await client.query('COMMIT');
    return { ...line, menu_item_name: menuItem.name };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Void a line (mark, not delete). Requires a reason.
 */
export async function voidLine(lineId, reason, user) {
  // Get the line and its order status
  const lineResult = await query(
    `SELECT ol.*, o.status AS order_status
     FROM order_lines ol
     JOIN orders o ON o.id = ol.order_id
     WHERE ol.id = $1`,
    [lineId],
  );

  if (lineResult.rows.length === 0) throw new NotFoundError('Order line not found');

  const line = lineResult.rows[0];

  if (line.voided) {
    throw new BadRequestError('This line has already been voided');
  }

  if (line.order_status === 'served' || line.order_status === 'cancelled') {
    throw new BadRequestError(
      `Cannot void lines on an order that is "${line.order_status}"`,
    );
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE order_lines
       SET voided = true, void_reason = $1, voided_by = $2, voided_at = NOW()
       WHERE id = $3`,
      [reason, user.id, lineId],
    );

    // Record history
    await client.query(
      `INSERT INTO order_history (order_id, event_type, old_value, new_value, details, performed_by)
       VALUES ($1, 'line_voided', $2, 'voided', $3, $4)`,
      [
        line.order_id,
        lineId,
        JSON.stringify({ reason, menu_item_id: line.menu_item_id, quantity: line.quantity }),
        user.id,
      ],
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all lines for an order.
 */
export async function getLines(orderId) {
  const result = await query(
    `SELECT ol.*, mi.name AS menu_item_name
     FROM order_lines ol
     JOIN menu_items mi ON mi.id = ol.menu_item_id
     WHERE ol.order_id = $1
     ORDER BY ol.created_at`,
    [orderId],
  );
  return result.rows;
}
