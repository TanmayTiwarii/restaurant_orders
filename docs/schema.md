# Database Schema

## Table by table: columns and types

### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique user identifier |
| `email` | `VARCHAR(255)` | `UNIQUE NOT NULL` | Login email address |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt password hash (12 salt rounds) |
| `name` | `VARCHAR(255)` | `NOT NULL` | Full display name |
| `role` | `user_role` (ENUM) | `NOT NULL DEFAULT 'waiter'` | `'manager'` or `'waiter'` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Account creation timestamp |

### `menu_items`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Menu item ID |
| `name` | `VARCHAR(255)` | `NOT NULL` | Dish name |
| `description` | `TEXT` | `NULL` | Dish description & ingredients |
| `price` | `DECIMAL(10,2)`| `NOT NULL CHECK (price >= 0)` | Current catalog price |
| `available` | `BOOLEAN` | `NOT NULL DEFAULT true` | Availability switch for ordering |
| `archived` | `BOOLEAN` | `NOT NULL DEFAULT false` | Soft archive flag |
| `created_by` | `UUID` | `NOT NULL REFERENCES users(id)` | Manager who created the item |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### `orders`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Order identifier |
| `table_number` | `INTEGER` | `NOT NULL CHECK (table_number > 0)` | Table number assigned |
| `status` | `order_status` (ENUM)| `NOT NULL DEFAULT 'placed'` | `'placed'`, `'accepted'`, `'preparing'`, `'ready'`, `'served'`, `'cancelled'` |
| `primary_waiter_id`| `UUID` | `NOT NULL REFERENCES users(id)` | Creator / primary waiter |
| `archived` | `BOOLEAN` | `NOT NULL DEFAULT false` | Soft archive flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Order placement timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last status/item update timestamp |

### `order_lines`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Order line identifier |
| `order_id` | `UUID` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | Parent order |
| `menu_item_id`| `UUID` | `NOT NULL REFERENCES menu_items(id)` | Referenced menu item |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Number of items |
| `special_instructions` | `TEXT` | `NULL` | Customization notes |
| `unit_price` | `DECIMAL(10,2)`| `NOT NULL` | **Historical price snapshot** captured at addition |
| `voided` | `BOOLEAN` | `NOT NULL DEFAULT false` | Whether this line was voided |
| `void_reason`| `TEXT` | `NULL` | Reason required when voided |
| `voided_by` | `UUID` | `REFERENCES users(id)` | Staff member who voided the line |
| `voided_at` | `TIMESTAMPTZ` | `NULL` | Void timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp line was added |

### `order_collaborators`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `order_id` | `UUID` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | Order ID |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id)` | Waiter ID |
| `created_at`| `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Assignment timestamp |
| *Primary Key* | `(order_id, user_id)` | Composite Primary Key |

### `order_history` (Append-Only Audit Log)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | History event ID |
| `order_id` | `UUID` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | Order ID |
| `event_type`| `history_event_type` (ENUM) | `NOT NULL` | Event category |
| `old_value` | `TEXT` | `NULL` | Previous status or old reference |
| `new_value` | `TEXT` | `NULL` | New status, line id, or note |
| `details` | `JSONB` | `NULL` | Structured context payload |
| `performed_by` | `UUID` | `NOT NULL REFERENCES users(id)` | Actor who performed the action |
| `created_at`| `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Exact timestamp of the event |

### `alert_acknowledgements`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Acknowledgement ID |
| `order_id` | `UUID` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | Slow order ID |
| `acknowledged_by` | `UUID` | `NOT NULL REFERENCES users(id)` | Staff who acknowledged |
| `acknowledged_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Time acknowledged |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Expiry timestamp for re-alerting |

---

## Which relationships are one-to-many, and which are many-to-many?

- **One-to-Many**:
  - `users` → `orders` (one user can be the primary waiter for many orders)
  - `orders` → `order_lines` (one order has many lines)
  - `orders` → `order_history` (one order has many timeline events)
  - `menu_items` → `order_lines` (one menu item appears across many order lines)
  - `orders` → `alert_acknowledgements` (one order can have multiple sequential alert acks)
- **Many-to-Many**:
  - `orders` ↔ `users` (via `order_collaborators` junction table: an order can have multiple collaborating waiters, and a single waiter can collaborate on multiple orders).

---

## Constraints: Database vs. Application Code

- **Database Enforced**:
  - Column nullability, primary keys, foreign key referential integrity with cascading deletes for order children.
  - Value ranges: `price >= 0`, `quantity > 0`, `table_number > 0` (via SQL `CHECK` constraints).
  - Uniqueness: `users.email UNIQUE`, `order_collaborators (order_id, user_id) PRIMARY KEY`.
  - Type safety: Custom PostgreSQL `ENUM` types for `user_role`, `order_status`, `history_event_type`.
- **Application Enforced**:
  - **Order Lifecycle Transitions**: The finite state machine (`placed` → `accepted` → `preparing` → `ready` → `served`, and conditional cancellation only from `placed` or `accepted`) is enforced in `orderService.js` to provide descriptive error messages explaining why an illegal transition was rejected.
  - **Voiding Rules**: Disallowing voiding when an order is already `served` or `cancelled`, and enforcing mandatory non-empty reason strings.
  - **Collaborator Authorization Guard**: Verifying whether a waiter is the primary waiter or collaborator before permitting mutations.

---

## What did you deliberately denormalise?

1. **`order_lines.unit_price`**: We deliberately duplicate the dish price on each `order_line` row at the moment the item is added to the ticket. If a manager updates a menu item price from $15.00 to $18.00 later in the shift, active and historical orders added prior to the price change correctly retain the $15.00 rate they were ordered at.
2. **`order_history.details` (JSONB)**: Storing denormalized snapshots of menu item names and void reasons in history payload blocks ensures order audit timelines remain readable and immutable even if a menu item is archived or renamed.

---

## What would break first if this had 100x the data?

1. **Dashboard Daily Served aggregation (`generate_series` + LEFT JOIN)**: At 100x data, scanning full historical orders for date-range metrics without partitioned date tables will cause query latency. Adding composite index on `(status, updated_at)` and pre-aggregating daily summary metrics would resolve this.
2. **Slow-Order Alert Polling (`NOT EXISTS` subquery)**: The query checking orders open > 15 min with active `alert_acknowledgements` evaluates a correlated subquery. With millions of orders, an index on `orders (status, created_at) WHERE status NOT IN ('ready', 'served', 'cancelled')` ensures fast index-only scans.
