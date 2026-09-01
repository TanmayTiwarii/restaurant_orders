import { query, getClient } from '../config/db.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';

/**
 * Add a collaborator (waiter) to an order.
 */
export async function addCollaborator(orderId, userId, performedBy) {
  // Verify order exists
  const orderResult = await query('SELECT id, primary_waiter_id FROM orders WHERE id = $1', [orderId]);
  if (orderResult.rows.length === 0) throw new NotFoundError('Order not found');

  const order = orderResult.rows[0];

  // Cannot add primary waiter as collaborator
  if (order.primary_waiter_id === userId) {
    throw new BadRequestError('This user is already the primary waiter for this order');
  }

  // Verify user exists and is a waiter
  const userResult = await query('SELECT id, name FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) throw new NotFoundError('User not found');

  // Check if already a collaborator
  const existing = await query(
    'SELECT 1 FROM order_collaborators WHERE order_id = $1 AND user_id = $2',
    [orderId, userId],
  );
  if (existing.rows.length > 0) {
    throw new ConflictError('User is already a collaborator on this order');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO order_collaborators (order_id, user_id) VALUES ($1, $2)',
      [orderId, userId],
    );

    await client.query(
      `INSERT INTO order_history (order_id, event_type, new_value, details, performed_by)
       VALUES ($1, 'collaborator_added', $2, $3, $4)`,
      [orderId, userId, JSON.stringify({ user_name: userResult.rows[0].name }), performedBy],
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
 * Remove a collaborator from an order.
 */
export async function removeCollaborator(orderId, userId, performedBy) {
  const result = await query(
    'DELETE FROM order_collaborators WHERE order_id = $1 AND user_id = $2 RETURNING *',
    [orderId, userId],
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Collaborator not found on this order');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT name FROM users WHERE id = $1', [userId]);

    await client.query(
      `INSERT INTO order_history (order_id, event_type, old_value, details, performed_by)
       VALUES ($1, 'collaborator_removed', $2, $3, $4)`,
      [orderId, userId, JSON.stringify({ user_name: userResult.rows[0]?.name }), performedBy],
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
 * List all collaborators for an order.
 */
export async function getCollaborators(orderId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.role
     FROM order_collaborators oc
     JOIN users u ON u.id = oc.user_id
     WHERE oc.order_id = $1
     ORDER BY u.name`,
    [orderId],
  );
  return result.rows;
}
