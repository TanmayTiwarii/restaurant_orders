import { query, getClient } from '../config/db.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';

/* ------------------------------------------------------------------ */
/*  Status machine                                                     */
/* ------------------------------------------------------------------ */

const VALID_TRANSITIONS = {
  placed:    ['accepted', 'cancelled'],
  accepted:  ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready:     ['served'],
  served:    [],
  cancelled: [],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Check whether a user may act on an order
 * (must be primary waiter, a collaborator, or a manager).
 */
async function assertCanActOnOrder(orderId, user) {
  if (user.role === 'manager') return;

  const result = await query(
    `SELECT 1 FROM orders WHERE id = $1 AND primary_waiter_id = $2
     UNION
     SELECT 1 FROM order_collaborators WHERE order_id = $1 AND user_id = $2`,
    [orderId, user.id],
  );

  if (result.rows.length === 0) {
    throw new ForbiddenError('You are not authorised to act on this order');
  }
}

/* ------------------------------------------------------------------ */
/*  CRUD                                                               */
/* ------------------------------------------------------------------ */

export async function createOrder({ table_number }, user) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO orders (table_number, primary_waiter_id)
       VALUES ($1, $2)
       RETURNING *`,
      [table_number, user.id],
    );

    const order = result.rows[0];

    // Record history
    await client.query(
      `INSERT INTO order_history (order_id, event_type, new_value, details, performed_by)
       VALUES ($1, 'status_change', 'placed', $2, $3)`,
      [order.id, JSON.stringify({ table_number }), user.id],
    );

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getOrder(id) {
  const result = await query(
    `SELECT o.*,
            u.name  AS primary_waiter_name,
            u.email AS primary_waiter_email
     FROM orders o
     JOIN users u ON u.id = o.primary_waiter_id
     WHERE o.id = $1`,
    [id],
  );

  if (result.rows.length === 0) throw new NotFoundError('Order not found');

  const order = result.rows[0];

  // Attach lines
  const lines = await query(
    `SELECT ol.*, mi.name AS menu_item_name
     FROM order_lines ol
     JOIN menu_items mi ON mi.id = ol.menu_item_id
     WHERE ol.order_id = $1
     ORDER BY ol.created_at`,
    [id],
  );
  order.lines = lines.rows;

  // Attach collaborators
  const collabs = await query(
    `SELECT u.id, u.name, u.email
     FROM order_collaborators oc
     JOIN users u ON u.id = oc.user_id
     WHERE oc.order_id = $1`,
    [id],
  );
  order.collaborators = collabs.rows;

  // Calculate total (non-voided lines)
  order.total = order.lines
    .filter((l) => !l.voided)
    .reduce((sum, l) => sum + Number(l.unit_price) * l.quantity, 0)
    .toFixed(2);

  return order;
}

/* ------------------------------------------------------------------ */
/*  Server-side search / filter / sort / paginate                      */
/* ------------------------------------------------------------------ */

export async function findOrders({
  search,
  status,
  waiter_id,
  date,
  sort = 'created_at',
  order = 'desc',
  page = 1,
  limit = 20,
  archived = false,
  user,
}) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  // Archived filter
  conditions.push(`o.archived = $${paramIdx++}`);
  params.push(archived);

  // For waiters, only show orders they are primary waiter or collaborator on
  if (user.role === 'waiter') {
    conditions.push(
      `(o.primary_waiter_id = $${paramIdx} OR EXISTS (
         SELECT 1 FROM order_collaborators oc WHERE oc.order_id = o.id AND oc.user_id = $${paramIdx}
       ))`,
    );
    params.push(user.id);
    paramIdx++;
  }

  // Text search (table number)
  if (search) {
    conditions.push(`o.table_number::text ILIKE $${paramIdx++}`);
    params.push(`%${search}%`);
  }

  // Status filter
  if (status) {
    conditions.push(`o.status = $${paramIdx++}`);
    params.push(status);
  }

  // Waiter filter
  if (waiter_id) {
    conditions.push(`o.primary_waiter_id = $${paramIdx++}`);
    params.push(waiter_id);
  }

  // Date filter (orders placed on a specific day)
  if (date) {
    conditions.push(`o.created_at::date = $${paramIdx++}`);
    params.push(date);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sorting (whitelist to prevent SQL injection)
  const sortColumns = {
    created_at: 'o.created_at',
    status: 'o.status',
    table_number: 'o.table_number',
  };
  const sortCol = sortColumns[sort] || 'o.created_at';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  // Count total matches
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM orders o ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Fetch page
  const offset = (page - 1) * limit;
  const dataResult = await query(
    `SELECT o.*, u.name AS primary_waiter_name
     FROM orders o
     JOIN users u ON u.id = o.primary_waiter_id
     ${whereClause}
     ORDER BY ${sortCol} ${sortDir}
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset],
  );

  return {
    orders: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* ------------------------------------------------------------------ */
/*  Lifecycle transitions                                              */
/* ------------------------------------------------------------------ */

export async function transitionStatus(orderId, newStatus, user) {
  const order = await getOrder(orderId);
  await assertCanActOnOrder(orderId, user);

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Cannot transition from "${order.status}" to "${newStatus}". Allowed transitions: ${(allowed || []).join(', ') || 'none'}`,
    );
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, orderId],
    );

    await client.query(
      `INSERT INTO order_history (order_id, event_type, old_value, new_value, performed_by)
       VALUES ($1, 'status_change', $2, $3, $4)`,
      [orderId, order.status, newStatus, user.id],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getOrder(orderId);
}

/* ------------------------------------------------------------------ */
/*  Archive / Restore                                                  */
/* ------------------------------------------------------------------ */

export async function archiveOrder(orderId, user) {
  await assertCanActOnOrder(orderId, user);
  await query(
    'UPDATE orders SET archived = true, updated_at = NOW() WHERE id = $1',
    [orderId],
  );
  return getOrder(orderId);
}

export async function restoreOrder(orderId, user) {
  await assertCanActOnOrder(orderId, user);
  await query(
    'UPDATE orders SET archived = false, updated_at = NOW() WHERE id = $1',
    [orderId],
  );
  return getOrder(orderId);
}

/* ------------------------------------------------------------------ */
/*  Notes                                                              */
/* ------------------------------------------------------------------ */

export async function addNote(orderId, note, user) {
  await assertCanActOnOrder(orderId, user);

  await query(
    `INSERT INTO order_history (order_id, event_type, new_value, details, performed_by)
     VALUES ($1, 'note_added', $2, $3, $4)`,
    [orderId, note, JSON.stringify({ note }), user.id],
  );

  return { success: true };
}
