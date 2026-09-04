# AI Prompts

AI (Antigravity IDE with Claude) was used throughout the project for scaffolding, debugging, and iterating on both backend and frontend code. The prompts below are grouped by what I was trying to accomplish, in roughly the order the work happened.

---

## 1. Initial Full-Project Scaffolding

### Prompt
> "scaffold the full project from the README, nodejs express backend with es modules, react vite frontend, use supabase as a postgres database but build custom jwt auth instead of supabase auth, keep it modular with a proper service layer"

### What it produced
A complete project scaffold in one pass — Express server with ES Modules, Vite + React frontend, PostgreSQL schema with ENUMs, JWT auth service, all route files, service layer, seed data, and a full React component tree. This was the single largest prompt and it generated the majority of the codebase in one shot.

### What I directed and verified
- I reviewed every generated file to make sure the schema matched the 10 requirements in the README.
- Confirmed that `"type": "module"` was set correctly in `package.json` and all imports used `.js` extensions.
- Verified that the auth service used bcrypt with proper salt rounds rather than Supabase's built-in auth SDK — this was a deliberate choice I specified in the prompt to stay vendor-agnostic.

---

## 2. Fixing Module Resolution Errors on First Run

### Prompt (pasted terminal output)
> "server wont start, getting ERR_MODULE_NOT_FOUND for dotenv and all the other packages, whats going on"

### What happened
The scaffolding prompt generated all the source files but didn't actually run `npm install` — so every `import` of an external package (`dotenv`, `express`, `pg`, `bcrypt`, `jsonwebtoken`, `express-validator`) failed with `ERR_MODULE_NOT_FOUND`.

### What I corrected
Ran `npm install` in both `server/` and `client/` directories to install all dependencies from the generated `package.json` files. This was a straightforward omission — the AI generated the dependency list correctly but didn't execute the install step.

---

## 3. Order State Machine and Transition Rules

### Prompt
> "how should I model the order lifecycle transitions, the brief says Placed to Accepted to Preparing to Ready to Served, cancellation only allowed before Preparing starts, need to reject anything else with a reason"

### What it produced
A `VALID_TRANSITIONS` map in the order service that defines which states can move to which, with cancellation branching from Placed and Accepted only. The AI also generated a helper that returns human-readable rejection messages like "Cannot cancel an order that is already being prepared".

### What I corrected
The initial version allowed skipping states (e.g. Placed → Ready). I tightened the transition map so each state can only move to the immediate next state or to Cancelled where allowed. Also added a check that voiding a line requires a non-empty reason string, which the AI had validated on the frontend but not enforced server-side.

---

## 4. Price Snapshotting vs Live Joins

### Prompt
> "should order lines store the price at time of adding or should I just join against the menu items table when calculating totals"

### What it produced
The AI recommended snapshotting and generated the `unit_price` column on `order_lines`, populated from `menu_items.price` at insertion time. It also produced the total calculation query that sums `unit_price * quantity` excluding voided lines.

### What I verified
This was more of a design question than a code generation prompt. I agreed with the snapshotting approach because menu prices change over time and a customer's bill should reflect the price when they ordered, not the current price. The AI's reasoning matched mine here so I kept the implementation as generated.

---

## 5. Slow-Order Alert Acknowledgement Design

### Prompt
> "build the slow order alert system, orders open longer than 15 mins that havent hit ready should show up, user can acknowledge but it should come back after 10 mins if still not ready"

### What it produced
An initial implementation that set `orders.acknowledged_at = NOW()` directly on the orders table and suggested a `setInterval` cron worker in Node.js to reset the flag to `NULL` after 10 minutes.

### What I corrected
The cron approach is fragile — it holds state in memory, fails on server restart, and breaks when scaling to multiple instances. I directed the AI to redesign this using a separate `alert_acknowledgements` table with an `expires_at` column set to `NOW() + interval '10 minutes'`. The detection query simply checks `NOT EXISTS (SELECT 1 FROM alert_acknowledgements WHERE order_id = o.id AND expires_at > NOW())`, making the entire mechanism stateless and purely query-driven. No background jobs needed.

---

## 6. Deployment Debugging — 405 Errors

### Prompts (multiple rounds)
> "getting 405 method not allowed when trying to login from the frontend, backend is on render and frontend on vercel"

> "still 405 after fixing cors, the post to /api/auth/login isnt even reaching the handler"

### What happened *(Prompt that produced something wrong)*
After deploying the backend to Render and the frontend to Vercel, login requests were returning HTTP 405 (Method Not Allowed). The AI initially suggested checking for CORS misconfigurations in the Express middleware, which was partially correct but didn't identify the root cause.

Through several rounds of debugging, the actual issue turned out to be the Supabase connection string. The AI had initially pointed to a transaction pooler connection URL, but my app uses session-based connections (prepared statements in `pg`), not a stateless transaction pooler. Switching to the correct session-mode connection string in the Render environment variables fixed the database connectivity, which was causing the 405s to cascade from failed auth queries.

### What I learned and corrected
> "why would I use a transaction pooler, my app keeps a pg pool alive its not stateless"

I questioned the AI's suggestion to use the transaction pooler URL, which led to the correction. The direct (session) connection string was the right choice since the Express server maintains a persistent `pg.Pool`. This was a case where I caught an incorrect infrastructure recommendation by understanding how my own app's connection pooling works.

---

## 7. Immutable History and Audit Trail

### Prompt
> "how do I make sure the order history cant be edited or deleted after the fact, even by managers, the brief specifically says nothing in the timeline can be rewritten"

### What it produced
An append-only `order_history` table with no UPDATE or DELETE routes exposed in the API. Every status change, line addition, line void, collaborator change, and note gets inserted as a new row with a timestamp and the acting user's ID.

### What I verified
- Confirmed there are no PATCH or DELETE endpoints for history records anywhere in the routes.
- The history insert happens inside the same service function as the action itself, so you can't perform an action without the audit log being written.
- Checked that the frontend timeline component only reads from history and has no edit or delete UI controls.

---

## 8. Loading States and Request Logging

### Prompts
> "add loading skeletons to the pages that fetch data, dashboard and orders list and menu"

> "I want a request logger middleware that logs method path status and response time for every api call"

### What it produced
For skeletons: Shimmer-animated placeholder components for the dashboard cards, order list, and menu table that show during API loading states.

For logging: A `requestLogger` Express middleware that logs method, URL path, status code, and response time for every inbound API request.

### What I verified
Both features were generated cleanly and didn't require significant corrections. I checked that the skeleton components matched the layout dimensions of the real content to avoid layout shift, and confirmed the logger didn't accidentally log sensitive data like passwords or JWT tokens in request bodies.

---

## 9. Frontend Component Generation

### What I used AI for
The React frontend pages — Dashboard, Orders list, Order detail, Menu management, Login, Register, and Alerts — were all generated by AI based on the working backend API contracts. I directed the overall structure ("build the dashboard with stat cards and a chart", "orders page with filters and a detail view") and the AI produced the component code.

### What I reviewed and adjusted
- Verified that all API calls used the correct endpoints and HTTP methods matching the Express routes.
- Checked that role-based UI logic (hiding manager-only buttons for waiters) matched the server-side `roleGuard` enforcement.
- Confirmed the order lifecycle state transitions in the UI matched the server's `VALID_TRANSITIONS` map — the AI initially allowed some transitions in the dropdown that the server would reject.

---

## Summary

AI was used throughout this project — it generated the initial scaffold, all React pages, and helped debug deployment issues. The areas where I exercised the most independent judgement were:

1. **Stack and auth decisions** — choosing custom JWT over Supabase Auth, ES Modules over CommonJS.
2. **Data modeling corrections** — rejecting the cron-based alert approach in favour of `expires_at` timestamps.
3. **Infrastructure debugging** — identifying the transaction pooler vs session connection issue from my understanding of `pg.Pool` behaviour.
4. **State machine design** — tightening the order lifecycle transitions to prevent state skipping.
5. **Audit trail guarantees** — verifying the history table is truly append-only with no mutation paths exposed.
