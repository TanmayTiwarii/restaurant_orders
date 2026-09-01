import { query } from '../config/db.js';

/**
 * Headline numbers: open orders, placed today, served today, revenue today.
 */
export async function getStats() {
  const [openResult, placedTodayResult, servedTodayResult, revenueResult] =
    await Promise.all([
      query(
        `SELECT COUNT(*) AS count FROM orders
         WHERE status NOT IN ('served', 'cancelled') AND archived = false`,
      ),
      query(
        `SELECT COUNT(*) AS count FROM orders
         WHERE created_at::date = CURRENT_DATE`,
      ),
      query(
        `SELECT COUNT(*) AS count FROM orders
         WHERE status = 'served' AND updated_at::date = CURRENT_DATE`,
      ),
      query(
        `SELECT COALESCE(SUM(ol.unit_price * ol.quantity), 0) AS revenue
         FROM order_lines ol
         JOIN orders o ON o.id = ol.order_id
         WHERE o.status = 'served'
           AND o.updated_at::date = CURRENT_DATE
           AND ol.voided = false`,
      ),
    ]);

  return {
    open_orders: parseInt(openResult.rows[0].count, 10),
    placed_today: parseInt(placedTodayResult.rows[0].count, 10),
    served_today: parseInt(servedTodayResult.rows[0].count, 10),
    revenue_today: parseFloat(revenueResult.rows[0].revenue),
  };
}

/**
 * Orders broken down by status.
 */
export async function getStatusBreakdown() {
  const result = await query(
    `SELECT status, COUNT(*) AS count
     FROM orders
     WHERE archived = false
     GROUP BY status
     ORDER BY status`,
  );
  return result.rows;
}

/**
 * Orders broken down by primary waiter.
 */
export async function getWaiterBreakdown() {
  const result = await query(
    `SELECT u.id, u.name, COUNT(o.id) AS count
     FROM orders o
     JOIN users u ON u.id = o.primary_waiter_id
     WHERE o.archived = false
     GROUP BY u.id, u.name
     ORDER BY count DESC`,
  );
  return result.rows;
}

/**
 * Orders served per day over the last N days.
 */
export async function getDailyServed(days = 14) {
  const result = await query(
    `SELECT d.day::date AS date, COALESCE(COUNT(o.id), 0) AS count
     FROM generate_series(
       CURRENT_DATE - ($1 - 1) * INTERVAL '1 day',
       CURRENT_DATE,
       INTERVAL '1 day'
     ) AS d(day)
     LEFT JOIN orders o
       ON o.updated_at::date = d.day::date
       AND o.status = 'served'
     GROUP BY d.day
     ORDER BY d.day`,
    [days],
  );
  return result.rows;
}
