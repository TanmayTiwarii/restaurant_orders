import { query } from '../config/db.js';
import { stringify } from 'csv-stringify/sync';

/**
 * Export all orders placed on a given date as CSV, with their lines,
 * totals, and statuses.
 */
export async function exportDayOrders(date) {
  const ordersResult = await query(
    `SELECT o.id, o.table_number, o.status, o.created_at, o.updated_at,
            u.name AS primary_waiter
     FROM orders o
     JOIN users u ON u.id = o.primary_waiter_id
     WHERE o.created_at::date = $1
     ORDER BY o.created_at`,
    [date],
  );

  const rows = [];

  for (const order of ordersResult.rows) {
    const linesResult = await query(
      `SELECT ol.*, mi.name AS menu_item_name
       FROM order_lines ol
       JOIN menu_items mi ON mi.id = ol.menu_item_id
       WHERE ol.order_id = $1
       ORDER BY ol.created_at`,
      [order.id],
    );

    const total = linesResult.rows
      .filter((l) => !l.voided)
      .reduce((sum, l) => sum + Number(l.unit_price) * l.quantity, 0)
      .toFixed(2);

    if (linesResult.rows.length === 0) {
      rows.push({
        order_id: order.id,
        table_number: order.table_number,
        status: order.status,
        primary_waiter: order.primary_waiter,
        order_placed_at: order.created_at,
        menu_item: '',
        quantity: '',
        unit_price: '',
        special_instructions: '',
        voided: '',
        order_total: total,
      });
    } else {
      for (const line of linesResult.rows) {
        rows.push({
          order_id: order.id,
          table_number: order.table_number,
          status: order.status,
          primary_waiter: order.primary_waiter,
          order_placed_at: order.created_at,
          menu_item: line.menu_item_name,
          quantity: line.quantity,
          unit_price: line.unit_price,
          special_instructions: line.special_instructions || '',
          voided: line.voided ? 'Yes' : 'No',
          order_total: total,
        });
      }
    }
  }

  return stringify(rows, { header: true });
}
