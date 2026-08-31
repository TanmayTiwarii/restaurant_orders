# Plan

## How did you break the work into sessions?

The 12-hour budget was structured into five distinct work sessions:

1. **Session 1 (Data Modeling & Core Backend Foundation — ~2.5 hrs)**:
   - Database schema design (`001_initial.sql`), constraints, enums, indexes.
   - Node.js + Express project scaffolding with ES Modules (`"type": "module"`).
   - Custom JWT authentication and bcrypt password hashing service.
   - Database migrations runner and realistic seed script.

2. **Session 2 (Domain Services & Business Logic — ~2.5 hrs)**:
   - Order lifecycle finite state machine and immutable history audit logger.
   - Order lines with unit price snapshotting and void reason validations.
   - Collaborators service with authorization matrix.
   - Server-side multi-parameter filtering, search, sorting, and pagination.

3. **Session 3 (Dashboard Analytics, Alerts & Bulk Operations — ~2.5 hrs)**:
   - Dashboard stats, breakdown aggregations, and 14-day daily served chart query.
   - Slow-order alert detection with acknowledge & re-alert expiration logic.
   - Bulk menu item update with per-item success/failure reporting.
   - Day order CSV export generator.

4. **Session 4 (Frontend UI/UX & Component System — ~3 hrs)**:
   - Modern dark design system (`index.css`) with responsive glassmorphic cards.
   - Layout navigation with real-time slow-order badge polling.
   - Order list, order detail workbench, menu catalog, and dashboard pages.
   - Interactive modals for adding lines, voiding with reason, notes, collaborators.

5. **Session 5 (Verification, Edge Cases & Documentation — ~1.5 hrs)**:
   - End-to-end testing across waiter and manager roles.
   - Validating state transition rejection messages and unauthorized action blocks.
   - Filling out all documentation files (`architecture.md`, `schema.md`, `decisions.md`, `ai-prompts.md`, `SUBMISSION.md`).

---

## What order did you build in, and why that order?

1. **Database Schema & Enums First**: Orders, lines, collaborators, and history have strict relational constraints. Getting the schema right up front prevented downstream refactoring of data contracts.
2. **Custom Auth & Role Guards Second**: Every order operation depends on knowing the actor's ID and role (`manager` vs. `waiter`).
3. **Core Order Service & State Machine Third**: The order lifecycle is the primary business requirement; building and testing state transitions on the server guaranteed that invalid moves are always rejected at the API boundary.
4. **Specialized Features Fourth (Bulk Actions, CSV, Alerts, Dashboard)**: Built once the core order and menu entities were established.
5. **Frontend Pages Fifth**: Allowed the UI to bind directly against working, predictable API contracts.
6. **Documentation & Polish Last**: Capturing real architectural trade-offs and decisions as implemented.

---

## What did you estimate versus what it actually took?

| Phase | Estimated | Actual | Notes |
|---|---|---|---|
| Schema & Custom Auth | 2 hrs | 2.5 hrs | Building custom JWT auth without relying on Supabase auth took extra care for role verification |
| Core Order Lifecycle & Rules | 2.5 hrs | 2.5 hrs | State machine validation and history logging aligned well with the plan |
| Server-side Search & Filtering | 1.5 hrs | 1.5 hrs | Dynamic SQL query generation for text search + waiter + status + pagination |
| Bulk Menu Updates & CSV Export | 1.5 hrs | 1.5 hrs | Per-item batch reporting required careful iteration over each item |
| Slow Orders & Alerts | 1.5 hrs | 1 hr | The `expires_at` acknowledgement strategy was clean to implement |
| React UI & Visual Polish | 3 hrs | 3 hrs | Rich dark theme, modals, timeline, and Recharts integration |

---

## What did you cut when you ran short?

- **Real-time WebSockets**: Replaced with clean, predictable 15-second polling for alert badges and dashboard statistics.
- **Complex UI Component Library**: Instead of bloating bundle size with bulky UI packages, built lightweight, targeted components (`Button`, `Modal`, `Input`, `Badge`, `Pagination`) using modern CSS custom properties and glassmorphism.
