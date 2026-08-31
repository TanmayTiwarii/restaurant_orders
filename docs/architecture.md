# Architecture

## What are the moving pieces, and how do they talk to each other?

The system is composed of three primary layers structured with a strict separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│               React SPA (Vite + Router)                │
│    Pages: Dashboard, Orders, OrderDetail, Menu, Alerts │
│   Context: AuthContext (JWT in localStorage / Memory)  │
└─────────────────────────┬──────────────────────────────┘
                          │ HTTPS / JSON REST API
                          │ Bearer <JWT>
┌─────────────────────────▼──────────────────────────────┐
│             Node.js + Express (ES Modules)             │
│  Middleware: Auth, RoleGuard (Manager/Waiter), Valids  │
│  Routes: /api/auth, /api/orders, /api/menu, etc.       │
│  Services: OrderService (State Machine), AlertService  │
└─────────────────────────┬──────────────────────────────┘
                          │ PostgreSQL Connection Pool (pg)
                          │ Parameterized SQL Queries
┌─────────────────────────▼──────────────────────────────┐
│           Supabase PostgreSQL Database                │
│   Tables: users, menu_items, orders, order_lines,      │
│     order_collaborators, order_history, alert_acks     │
└────────────────────────────────────────────────────────┘
```

1. **Frontend (Client)**: A React Single Page Application (SPA) bundled via Vite. It communicates exclusively with the backend via a standardized Axios client with an HTTP Bearer token authorization interceptor.
2. **Backend (Server)**: An Express REST API running on Node.js using native ES Modules (`import`/`export`). Incoming requests pass through JWT verification middleware (`authenticate`) and role-based guards (`roleGuard`) before invoking domain services (`orderService`, `menuService`, `alertService`, etc.).
3. **Database (Data Storage)**: Managed PostgreSQL (Supabase). The application uses connection pooling (`pg.Pool`) with parameterized SQL queries to prevent SQL injection and guarantee strict transactional integrity (`BEGIN ... COMMIT / ROLLBACK`).

---

## Where does each piece run?

- **Database**: Runs in a managed PostgreSQL instance on Supabase.
- **Server API**: Designed to run as a Node.js process on Render / Railway / containerized cloud host, listening on port `3001` (configurable via `PORT` environment variable).
- **Client SPA**: Static assets built with `vite build` and served from Vercel / Netlify / Cloudflare Pages or proxied locally during development via Vite on `http://localhost:5173`.

---

## What is the request path for one representative user action, end to end?

**Action: Waiter transitions an order status from "Accepted" to "Preparing"**

1. **User Action**: The waiter clicks "Mark as Preparing" on the Order Details page in the React UI (`/orders/:id`).
2. **Client Dispatch**: `OrderDetailPage.jsx` invokes `api.patch('/orders/:id/status', { status: 'preparing' })`.
3. **Authorization Header**: Axios request interceptor attaches `Authorization: Bearer <jwt_token>` from `localStorage`.
4. **Server Middleware**:
   - `express.json()` parses payload.
   - `authenticate` middleware verifies the JWT secret and attaches the decoded user claims `{ id, email, role, name }` to `req.user`.
   - `transitionRules` runs `express-validator` to ensure the status is an allowed enum value.
5. **Service Layer Execution (`orderService.js`)**:
   - `getOrder(orderId)` retrieves the current order state.
   - `assertCanActOnOrder(orderId, user)` queries `orders` and `order_collaborators` to verify the user is either the primary waiter, an assigned collaborator, or a manager.
   - State Machine Validation: checks `VALID_TRANSITIONS['accepted']` (which allows `['preparing', 'cancelled']`).
6. **Database Transaction**:
   - Acquires client from pool and issues `BEGIN`.
   - Updates `orders.status = 'preparing'` and `orders.updated_at = NOW()`.
   - Inserts an append-only audit record into `order_history` with `event_type = 'status_change'`, `old_value = 'accepted'`, `new_value = 'preparing'`, and `performed_by = user.id`.
   - Issues `COMMIT` and releases pool connection.
7. **Response & Client Update**: Server returns the refreshed order object (HTTP 200). The React component updates the local state, immediately updating the status badge, legal action buttons, and appending the new event to the timeline.

---

## What did you decide *not* to build, and why?

1. **Supabase Realtime / WebSockets**:
   - *Why rejected*: WebSockets add significant operational complexity, connection recovery logic, and deployment statefulness. Instead, low-frequency polling (15-second intervals for slow-order alerts and dashboards) meets all functional latency requirements without connection management overhead.
2. **Supabase Auth UI / Client SDK**:
   - *Why rejected*: Per the requirement, we built custom JWT auth with bcrypt password hashing in our own `users` table. This keeps backend authorization logic fully self-contained and database-agnostic.
3. **Soft-deletes on audit history**:
   - *Why rejected*: History records in `order_history` must be genuinely immutable. No update or delete endpoints exist in the entire codebase for history rows.
