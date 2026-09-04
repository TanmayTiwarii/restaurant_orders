import bcrypt from 'bcrypt';
import { query, getClient } from '../config/db.js';

const SALT_ROUNDS = 12;

/**
 * Seed the database with demo data: users, menu items, orders, lines, and history.
 */
async function seed() {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Clean up existing data to allow clean re-seeding with updated prices
    await client.query('DELETE FROM order_history');
    await client.query('DELETE FROM order_collaborators');
    await client.query('DELETE FROM order_lines');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM menu_items');

    // ── Users ──────────────────────────────────────────────────
    const managerHash = await bcrypt.hash('manager123', SALT_ROUNDS);
    const waiter1Hash = await bcrypt.hash('waiter123', SALT_ROUNDS);
    const waiter2Hash = await bcrypt.hash('waiter123', SALT_ROUNDS);

    const managerResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ('manager@restaurant.com', $1, 'Alice Manager', 'manager')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [managerHash],
    );

    const waiter1Result = await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ('waiter1@restaurant.com', $1, 'Bob Waiter', 'waiter')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [waiter1Hash],
    );

    const waiter2Result = await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ('waiter2@restaurant.com', $1, 'Carol Waiter', 'waiter')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [waiter2Hash],
    );

    const managerId = managerResult.rows[0].id;
    const waiter1Id = waiter1Result.rows[0].id;
    const waiter2Id = waiter2Result.rows[0].id;

    console.log('✓ Users seeded');

    // ── Menu Items ─────────────────────────────────────────────
    const menuItems = [
      { name: 'Classic Burger', description: 'Angus beef patty with lettuce, tomato, and special sauce', price: 299.00 },
      { name: 'Margherita Pizza', description: 'Wood-fired with fresh mozzarella, basil, and San Marzano tomatoes', price: 399.00 },
      { name: 'Caesar Salad', description: 'Romaine, croutons, parmesan, and house-made Caesar dressing', price: 249.00 },
      { name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter, asparagus, and wild rice', price: 699.00 },
      { name: 'Pasta Carbonara', description: 'Spaghetti with pancetta, egg yolk, pecorino, and black pepper', price: 449.00 },
      { name: 'Fish & Chips', description: 'Beer-battered cod with thick-cut fries and tartar sauce', price: 399.00 },
      { name: 'Mushroom Risotto', description: 'Arborio rice with wild mushrooms, truffle oil, and parmesan', price: 429.00 },
      { name: 'Chicken Wings', description: 'Crispy wings with choice of buffalo, BBQ, or garlic parmesan', price: 329.00 },
      { name: 'Tiramisu', description: 'Classic Italian dessert with espresso-soaked ladyfingers', price: 249.00 },
      { name: 'House Lemonade', description: 'Fresh-squeezed lemonade with mint', price: 129.00 },
    ];

    const menuIds = [];
    for (const item of menuItems) {
      const result = await client.query(
        `INSERT INTO menu_items (name, description, price, available, created_by)
         VALUES ($1, $2, $3, true, $4)
         RETURNING id`,
        [item.name, item.description, item.price, managerId],
      );
      menuIds.push(result.rows[0].id);
    }

    console.log('✓ Menu items seeded');

    // ── Orders with lines ──────────────────────────────────────
    const orderConfigs = [
      { table: 1, waiter: waiter1Id, status: 'served', items: [0, 2, 9], minutesAgo: 120 },
      { table: 2, waiter: waiter1Id, status: 'preparing', items: [1, 4, 8], minutesAgo: 25 },
      { table: 3, waiter: waiter2Id, status: 'placed', items: [3, 6], minutesAgo: 5 },
      { table: 4, waiter: waiter2Id, status: 'accepted', items: [5, 7, 9], minutesAgo: 18 },
      { table: 5, waiter: waiter1Id, status: 'ready', items: [0, 1, 8, 9], minutesAgo: 40 },
      { table: 6, waiter: waiter2Id, status: 'placed', items: [2, 3], minutesAgo: 3 },
      { table: 7, waiter: waiter1Id, status: 'cancelled', items: [4], minutesAgo: 60 },
      { table: 8, waiter: waiter2Id, status: 'preparing', items: [6, 7, 0], minutesAgo: 30 },
    ];

    const statusFlow = {
      placed: ['placed'],
      accepted: ['placed', 'accepted'],
      preparing: ['placed', 'accepted', 'preparing'],
      ready: ['placed', 'accepted', 'preparing', 'ready'],
      served: ['placed', 'accepted', 'preparing', 'ready', 'served'],
      cancelled: ['placed', 'cancelled'],
    };

    for (const config of orderConfigs) {
      const createdAt = new Date(Date.now() - config.minutesAgo * 60 * 1000).toISOString();

      const orderResult = await client.query(
        `INSERT INTO orders (table_number, status, primary_waiter_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $4)
         RETURNING id`,
        [config.table, config.status, config.waiter, createdAt],
      );
      const orderId = orderResult.rows[0].id;

      // Add lines
      for (const itemIdx of config.items) {
        const menuId = menuIds[itemIdx];
        const menuItem = menuItems[itemIdx];

        await client.query(
          `INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, menuId, 1, menuItem.price, createdAt],
        );
      }

      // Add history for each status in the flow
      const flow = statusFlow[config.status];
      for (let i = 0; i < flow.length; i++) {
        const eventTime = new Date(
          new Date(createdAt).getTime() + i * 2 * 60 * 1000,
        ).toISOString();

        await client.query(
          `INSERT INTO order_history (order_id, event_type, old_value, new_value, performed_by, created_at)
           VALUES ($1, 'status_change', $2, $3, $4, $5)`,
          [
            orderId,
            i === 0 ? null : flow[i - 1],
            flow[i],
            config.waiter,
            eventTime,
          ],
        );
      }
    }

    // Add a collaborator: waiter2 on table 2 order (waiter1's order)
    const table2Order = await client.query(
      `SELECT id FROM orders WHERE table_number = 2 LIMIT 1`,
    );
    if (table2Order.rows.length > 0) {
      await client.query(
        `INSERT INTO order_collaborators (order_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [table2Order.rows[0].id, waiter2Id],
      );
    }

    console.log('✓ Orders and history seeded');

    await client.query('COMMIT');
    console.log('\n🎉 All seed data inserted successfully!');
    console.log('\nDemo credentials:');
    console.log('  Manager: manager@restaurant.com / manager123');
    console.log('  Waiter1: waiter1@restaurant.com / waiter123');
    console.log('  Waiter2: waiter2@restaurant.com / waiter123');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
