# Submission

## Links

- **GitHub repository:** <public repo URL>
- **Live application:** <deployed URL>

## Notes for the reviewer

- The server uses pure custom JWT authentication with bcrypt password hashing (12 salt rounds) stored in PostgreSQL (`users` table). Supabase is utilized strictly as a managed PostgreSQL database.
- Free tier hosts (e.g., Render / Supabase) may spin down when idle; the very first request might take 30-50 seconds to wake up the database pool.
- Demo data is seeded with 3 staff accounts, 10 menu items, and 8 active and historical table orders across various lifecycle stages.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Manager | `manager@restaurant.com` | `manager123` |
| Waiter 1 (Primary) | `waiter1@restaurant.com` | `waiter123` |
| Waiter 2 (Collaborator) | `waiter2@restaurant.com` | `waiter123` |

## Stack

| Layer | What you used | Why |
|---|---|---|
| Frontend | React 18 (Vite), React Router v7, Recharts, Lucide Icons | Fast SPA bundling, modular component architecture, reactive data viz |
| Backend | Node.js + Express with ES Modules (`"type": "module"`) | Lightweight REST API, native modular imports, robust ecosystem |
| Database | PostgreSQL (Supabase) via `pg` Connection Pool | ACID relational integrity, transactional guarantees, custom ENUMs |
| Auth | Custom JWT + Bcrypt (12 rounds) | Self-contained, database-level role enforcement, vendor-agnostic |

## Goal checklist

| # | Goal | Status | Notes |
|---|---|---|---|
| 1 | Accounts and roles | Done | Role-based server guards (`roleGuard`), custom JWT auth, manager vs waiter permissions strictly enforced on API endpoints |
| 2 | Orders | Done | Orders created with table number and primary waiter; soft archive and restore endpoints preserve history |
| 3 | Order lines | Done | Order lines snapshot menu item price at insertion time; running totals computed dynamically by server excluding voided lines |
| 4 | Order lifecycle with rules | Done | State machine (*Placed → Accepted → Preparing → Ready → Served*); cancellation allowed only while Placed/Accepted; voiding requires mandatory reason |
| 5 | Collaborators | Done | Primary waiter or manager can assign/remove collaborator waiters; waiters see orders where they are lead or collaborator |
| 6 | Finding orders | Done | Server-side text search (table #), filters (status, waiter, date), sorting, and pagination with total count reporting |
| 7 | Acting on many menu items at once | Done | Bulk updates (availability or price) process each item with per-item success/failure reporting in modal; Day order CSV export |
| 8 | Dashboard | Done | Headline numbers (open, placed today, served today, revenue today), status and waiter breakdowns, 14-day served Recharts area chart |
| 9 | History you cannot rewrite | Done | Append-only `order_history` audit trail capturing every status transition (with old/new), line additions, voids (with reason), notes, and collaborators |
| 10 | Slow-order alerts | Done | Alerts for orders open > 15 min without reaching Ready; badge count in sidebar; acknowledgement with 10-minute automatic re-alert expiry |

## Stretch goals implemented

### Emailed Dining Receipts (Powered by Resend)
- **What it does:** Allows staff (waiters and managers) to dispatch official, beautifully styled HTML receipts directly to a customer's email address for any order.
- **How it works:**
  1. Retrieves order details using `orderService.getOrder(orderId)` including item snapshots, unit prices in ₹, voided item statuses, server name, and calculated totals.
  2. Compiles a responsive, branded HTML receipt with table information, item breakdown, and bill totals.
  3. Dispatches the email via the official **Resend** SDK (`resend.emails.send`). In local development where `RESEND_API_KEY` is not configured, it warns and simulates delivery so workflows do not break.
  4. Automatically records an audit log entry in `order_history` via `orderService.addNote(orderId, 'Receipt emailed to <email>', user)` so the dispatch is permanently preserved in the order's immutable timeline.
- **How to trigger it:**
  - **Via UI**: Open any order detail view (`/orders/:id`), click **"Email Receipt"** (available in the top actions bar or next to the Running Total), enter the customer's email in the modal, and click **"Send Receipt"**.
  - **Via API**: Send an authenticated request `POST /orders/:id/receipt` with body `{ "email": "customer@example.com" }`.
- **Configuration**:
  Add `RESEND_API_KEY=re_...` and `RESEND_FROM_EMAIL=receipts@yourdomain.com` (or `onboarding@resend.dev`) in `server/.env`.

## How much time did you actually spend?

~11.5 hours across 5 structured sessions (Schema & Auth -> Core Services -> Analytics & Alerts -> Frontend UI -> Testing & Documentation).

## What would you do next, with another 12 hours?

1. **Kitchen Display Screen (KDS)**: A dedicated high-contrast full-screen kitchen monitor view grouped by cook station (grill, fryer, pantry) with sound chimes for new incoming tickets.
2. **Split Checks & Bill Splitting**: Allow tables to split total check amounts evenly or by individual seat line items.
3. **Table Layout Floor Map**: Interactive 2D drag-and-drop floor plan visualizing table status (open, seated, waiting, ready) directly on the floor layout.

## What are you least happy with in this codebase, and why?

While 15-second polling on the alert badge and dashboard is simple, robust, and zero-maintenance, an active busy kitchen with 20 concurrent waiters would benefit from WebSocket-driven server-sent events (SSE) for instant sub-second visual ticket updates across handhelds and counter screens.
