-- Production gaps: add missing tables, columns, enums, RLS, indexes, and constraints.
-- Run after 20260906000000_add_product_columns.sql

-- ─── ENUM EXTENSIONS ──────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'authorized';
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partially_refunded';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'confirmed';
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'packed';
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'failed';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE return_status ADD VALUE IF NOT EXISTS 'in_transit';
  ALTER TYPE return_status ADD VALUE IF NOT EXISTS 'received';
  ALTER TYPE return_status ADD VALUE IF NOT EXISTS 'inspected';
  ALTER TYPE return_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TYPE shipment_status AS ENUM ('pending', 'picked', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned');

-- ─── MISSING COLUMNS ──────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS tax_class TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT[] DEFAULT '{}';

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS barcode TEXT;

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS per_user_usage_limit INTEGER,
  ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_ids UUID[] DEFAULT '{}';

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'info';

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS helpful_votes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS before JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS after JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS result TEXT DEFAULT 'success';

-- ─── MISSING TABLES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  status payment_status NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_transaction_id TEXT,
  raw_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  reason TEXT,
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  free_threshold NUMERIC(12,2),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_id UUID NOT NULL REFERENCES shipping_methods(id) ON DELETE CASCADE,
  country TEXT NOT NULL DEFAULT 'US',
  state TEXT,
  city TEXT,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  free_threshold NUMERIC(12,2),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, product_id)
);

-- ─── INVENTORY ENHANCEMENTS ───────────────────────────────────────────────────

ALTER TABLE stock
  ADD COLUMN IF NOT EXISTS available_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damaged_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incoming_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_threshold INTEGER DEFAULT 5;

-- Backfill available/reserved from quantity
UPDATE stock
SET available_quantity = quantity, reserved_quantity = 0
WHERE available_quantity IS NULL;

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse_product ON stock(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ─── CONSTRAINTS ─────────────────────────────────────────────────────────────

ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_products_price_nonnegative CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS chk_products_compare_price CHECK (compare_price IS NULL OR compare_price >= 0);
ALTER TABLE stock ADD CONSTRAINT IF NOT EXISTS chk_stock_quantity_nonnegative CHECK (quantity >= 0 AND available_quantity >= 0 AND reserved_quantity >= 0 AND damaged_quantity >= 0 AND incoming_quantity >= 0);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

-- Public read for catalog
CREATE POLICY "Public read warehouses" ON warehouses FOR SELECT USING (status = 'active');
CREATE POLICY "Public read stock" ON stock FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (status = 'active');
CREATE POLICY "Public read collection products" ON collection_products FOR SELECT USING (true);
CREATE POLICY "Public read shipping methods" ON shipping_methods FOR SELECT USING (status = 'active');
CREATE POLICY "Public read shipping rates" ON shipping_rates FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admins manage warehouses" ON warehouses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage stock" ON stock FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage shipments" ON shipments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage collections" ON collections FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage vendors" ON vendors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage support tickets" ON support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage coupons" ON coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage roles" ON roles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage permissions" ON permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage role permissions" ON role_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage settings" ON app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage security settings" ON security_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage payment transactions" ON payment_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage inventory movements" ON inventory_movements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage shipment events" ON shipment_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage return items" ON return_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage security events" ON security_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage shipping" ON shipping_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage shipping rates" ON shipping_rates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "Admins manage collection products" ON collection_products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);

-- Users read own orders (expanded to all order statuses)
DROP POLICY IF EXISTS "Users read own orders" ON orders;
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own order items" ON order_items;
CREATE POLICY "Users read own order items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Users read own returns/refunds
DROP POLICY IF EXISTS "Users manage own returns" ON returns;
CREATE POLICY "Users manage own returns" ON returns FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users read own refunds" ON refunds;
CREATE POLICY "Users read own refunds" ON refunds FOR SELECT USING (auth.uid() = user_id);

-- Users read own notifications
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Users read own payments
CREATE POLICY "Users read own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- Users create support tickets
CREATE POLICY "Users create support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Append-only audit logs
CREATE POLICY "Admins read audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
);
CREATE POLICY "System insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own idempotency keys" ON idempotency_keys FOR ALL USING (auth.uid() = user_id);

-- ─── ATOMIC INVENTORY FUNCTIONS ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_available INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  SELECT available_quantity INTO v_available
  FROM stock
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Stock record not found';
  END IF;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory: requested %, available %', p_quantity, v_available;
  END IF;

  UPDATE stock
  SET available_quantity = available_quantity - p_quantity,
      reserved_quantity = reserved_quantity + p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commit_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  UPDATE stock
  SET reserved_quantity = reserved_quantity - p_quantity,
      quantity = quantity - p_quantity,
      available_quantity = available_quantity - p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock record not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  UPDATE stock
  SET reserved_quantity = reserved_quantity - p_quantity,
      available_quantity = available_quantity + p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock record not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION adjust_inventory(
  p_warehouse_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER,
  p_movement_type TEXT,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF p_quantity = 0 THEN
    RETURN;
  END IF;

  UPDATE stock
  SET quantity = quantity + p_quantity,
      available_quantity = available_quantity + p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND warehouse_id = p_warehouse_id;

  IF NOT FOUND THEN
    INSERT INTO stock (warehouse_id, product_id, variant_id, quantity, available_quantity)
    VALUES (p_warehouse_id, p_product_id, p_variant_id, p_quantity, p_quantity);
  END IF;

  INSERT INTO inventory_movements (warehouse_id, product_id, variant_id, movement_type, quantity, notes, created_by)
  VALUES (p_warehouse_id, p_product_id, p_variant_id, p_movement_type, p_quantity, p_notes, p_created_by);
END;
$$ LANGUAGE plpgsql;

-- ─── UPDATED_AT TRIGGERS FOR NEW TABLES ───────────────────────────────────────

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
