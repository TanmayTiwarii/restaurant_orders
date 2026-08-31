-- ============================================================
-- Restaurant Orders — Initial Schema
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('manager', 'waiter');

CREATE TYPE order_status AS ENUM (
  'placed',
  'accepted',
  'preparing',
  'ready',
  'served',
  'cancelled'
);

CREATE TYPE history_event_type AS ENUM (
  'status_change',
  'line_added',
  'line_voided',
  'note_added',
  'collaborator_added',
  'collaborator_removed'
);

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  role        user_role NOT NULL DEFAULT 'waiter',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- ============================================================
-- Menu Items
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  available   BOOLEAN NOT NULL DEFAULT true,
  archived    BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_available ON menu_items (available) WHERE archived = false;

-- ============================================================
-- Orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number      INTEGER NOT NULL CHECK (table_number > 0),
  status            order_status NOT NULL DEFAULT 'placed',
  primary_waiter_id UUID NOT NULL REFERENCES users(id),
  archived          BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_primary_waiter ON orders (primary_waiter_id);
CREATE INDEX idx_orders_table_number ON orders (table_number);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_archived ON orders (archived);

-- ============================================================
-- Order Lines
-- ============================================================
CREATE TABLE IF NOT EXISTS order_lines (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id         UUID NOT NULL REFERENCES menu_items(id),
  quantity             INTEGER NOT NULL CHECK (quantity > 0),
  special_instructions TEXT,
  unit_price           DECIMAL(10, 2) NOT NULL,
  voided               BOOLEAN NOT NULL DEFAULT false,
  void_reason          TEXT,
  voided_by            UUID REFERENCES users(id),
  voided_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_lines_order ON order_lines (order_id);

-- ============================================================
-- Order Collaborators (many-to-many: orders <-> users)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_collaborators (
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, user_id)
);

CREATE INDEX idx_order_collaborators_user ON order_collaborators (user_id);

-- ============================================================
-- Order History (append-only audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type    history_event_type NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  details       JSONB,
  performed_by  UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_history_order ON order_history (order_id);
CREATE INDEX idx_order_history_created ON order_history (created_at);

-- ============================================================
-- Alert Acknowledgements
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_acknowledgements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  acknowledged_by UUID NOT NULL REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_alert_ack_order ON alert_acknowledgements (order_id);
CREATE INDEX idx_alert_ack_expires ON alert_acknowledgements (expires_at);
