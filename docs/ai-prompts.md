# AI Prompts

The following prompts document the iterative scaffolding, debugging, and verification process used while developing Corkless.

---

## 1. Database Schema & State Transitions

### Prompt
> "Design a PostgreSQL schema for a restaurant order system with roles (manager, waiter), orders, order lines, order collaborators, immutable order history audit logs, and slow-order alert acknowledgements. Make sure order lines have price snapshots and that history cannot be rewritten."

### What you got
A clean SQL DDL with ENUM types and tables. However, the generated schema used foreign key references for order history records with `ON DELETE CASCADE`, and the status transitions were only partially modeled in comments without application-level state machine constraints.

### What you corrected
Added explicit PostgreSQL `CHECK` constraints on numerical values (`price >= 0`, `quantity > 0`, `table_number > 0`), added composite primary keys on `order_collaborators (order_id, user_id)`, and implemented strict state machine validation (`VALID_TRANSITIONS`) in `orderService.js` to return human-readable rejection explanations for illegal transitions.

---

## 2. Slow-Order Alert Acknowledgement & Re-Alerting

### Prompt
> "Write an Express service and SQL query for slow-order alerts: detect orders open > 15 minutes that haven't reached 'ready', allow a waiter or manager to acknowledge the alert, and make the alert reappear if the order is still not ready after 10 minutes."

### What you got
An implementation that attempted to set `orders.acknowledged_at = NOW()` and suggested running a `setInterval` or cron worker in Node.js to reset `acknowledged_at = NULL` after 10 minutes.

### What you corrected *(Prompt that produced an inferior / problematic pattern)*
The cron approach introduces background memory state that fails if the server restarts or scales across multiple instances. We corrected this by designing a separate `alert_acknowledgements` table with an `expires_at` column (`NOW() + 10 minutes`). The detection query uses `NOT EXISTS (SELECT 1 FROM alert_acknowledgements WHERE order_id = o.id AND expires_at > NOW())`. This is completely stateless, immune to server restarts, and requires zero background cron jobs.

---

## 3. Server-side Order Filtering & Role-Based Scope

### Prompt
> "Create an order search endpoint in Node.js with search by table number, status filter, waiter filter, date filter, sorting, and pagination. Waiters should only see orders they created or collaborate on; managers can see all."

### What you got
A functional dynamic query builder using `pg` parameterized queries (`$1, $2...`).

### What you corrected
Added validation around sorting columns (whitelisting `created_at`, `status`, `table_number` against SQL injection), and handled total page calculation and count aggregation cleanly.

---

## 4. Per-Item Bulk Action Reporting UI

### Prompt
> "Build a React modal and bulk action bar where a manager selects multiple menu items and applies a new price or availability change, displaying a per-item breakdown of which succeeded and which failed."

### What you got
A component that rendered a summary badge and a detailed results table showing the status and specific error message per item ID.

### What you corrected
Integrated auto-clearing of selection after closing the report modal, and added support for displaying the item's human-readable name alongside its ID.
