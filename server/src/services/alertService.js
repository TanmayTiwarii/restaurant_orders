import { query } from '../config/db.js';

const DEFAULT_THRESHOLD_MINUTES = parseInt(process.env.ALERT_THRESHOLD_MINUTES || '15', 10);
const DEFAULT_REALERT_MINUTES = parseInt(process.env.ALERT_REALERT_MINUTES || '10', 10);

/**
 * Get orders that have been open longer than the threshold and whose
 * alert has not been acknowledged (or the acknowledgement has expired).
 */
export async function getSlowOrders(thresholdMinutes = DEFAULT_THRESHOLD_MINUTES) {
  const result = await query(
    `SELECT o.*, u.name AS primary_waiter_name
     FROM orders o
     JOIN users u ON u.id = o.primary_waiter_id
     WHERE o.status NOT IN ('ready', 'served', 'cancelled')
       AND o.archived = false
       AND o.created_at < NOW() - ($1 || ' minutes')::INTERVAL
       AND NOT EXISTS (
         SELECT 1 FROM alert_acknowledgements aa
         WHERE aa.order_id = o.id
           AND aa.expires_at > NOW()
       )
     ORDER BY o.created_at ASC`,
    [thresholdMinutes.toString()],
  );

  return result.rows;
}

/**
 * Get the count of current slow-order alerts (for nav badge).
 */
export async function getAlertCount(thresholdMinutes = DEFAULT_THRESHOLD_MINUTES) {
  const result = await query(
    `SELECT COUNT(*) AS count
     FROM orders o
     WHERE o.status NOT IN ('ready', 'served', 'cancelled')
       AND o.archived = false
       AND o.created_at < NOW() - ($1 || ' minutes')::INTERVAL
       AND NOT EXISTS (
         SELECT 1 FROM alert_acknowledgements aa
         WHERE aa.order_id = o.id
           AND aa.expires_at > NOW()
       )`,
    [thresholdMinutes.toString()],
  );

  return parseInt(result.rows[0].count, 10);
}

/**
 * Acknowledge a slow-order alert. Sets an expiry so the alert can
 * resurface if the order still hasn't reached "ready".
 */
export async function acknowledgeAlert(
  orderId,
  userId,
  reAlertMinutes = DEFAULT_REALERT_MINUTES,
) {
  await query(
    `INSERT INTO alert_acknowledgements (order_id, acknowledged_by, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::INTERVAL)`,
    [orderId, userId, reAlertMinutes.toString()],
  );

  return { success: true };
}
