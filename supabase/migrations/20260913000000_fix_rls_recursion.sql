-- Fix infinite recursion in RLS policies for profiles table.
-- The "Admins read/update all profiles" policies use EXISTS (SELECT ... FROM profiles ...)
-- which recursively triggers the same RLS policy on the subquery, causing:
--   "infinite recursion detected in policy for relation 'profiles'"
--
-- Fix strategy:
-- 1. Create a SECURITY DEFINER helper function that checks admin status
--    without re-triggering RLS on the profiles table.
-- 2. Rewrite the recursive policies to use the helper.
-- 3. Make inventory functions SECURITY DEFINER so they bypass RLS regardless
--    of the caller's role (PostgREST RPC context may not honor BYPASSRLS).
-- 4. Also grant BYPASS ROW LEVEL SECURITY to the supabase service_role.

-- ─── 1. Helper function: is_admin ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' THEN TRUE
    WHEN uid IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uid AND p.role IN ('admin', 'superadmin')
    )
  END;
$$;

-- ─── 2. Rewrite profiles policies to use is_admin() ────────────────────────────

DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON profiles;

CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins update all profiles" ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin(auth.uid())
  );

-- ─── 3. Rewrite all other admin policies that subquery profiles ────────────────
-- These affect tables other than profiles, so they don't recurse into profiles
-- policies directly, but the subquery on profiles still triggers the profiles
-- policies. Using is_admin() avoids that.

DROP POLICY IF EXISTS "Admins manage warehouses" ON warehouses;
CREATE POLICY "Admins manage warehouses" ON warehouses FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage stock" ON stock;
CREATE POLICY "Admins manage stock" ON stock FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage shipments" ON shipments;
CREATE POLICY "Admins manage shipments" ON shipments FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage collections" ON collections;
CREATE POLICY "Admins manage collections" ON collections FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage vendors" ON vendors;
CREATE POLICY "Admins manage vendors" ON vendors FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage support tickets" ON support_tickets;
CREATE POLICY "Admins manage support tickets" ON support_tickets FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage coupons" ON coupons;
CREATE POLICY "Admins manage coupons" ON coupons FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage roles" ON roles;
CREATE POLICY "Admins manage roles" ON roles FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage permissions" ON permissions;
CREATE POLICY "Admins manage permissions" ON permissions FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage role permissions" ON role_permissions;
CREATE POLICY "Admins manage role permissions" ON role_permissions FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage settings" ON app_settings;
CREATE POLICY "Admins manage settings" ON app_settings FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage security settings" ON security_settings;
CREATE POLICY "Admins manage security settings" ON security_settings FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage payments" ON payments;
CREATE POLICY "Admins manage payments" ON payments FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage payment transactions" ON payment_transactions;
CREATE POLICY "Admins manage payment transactions" ON payment_transactions FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage inventory movements" ON inventory_movements;
CREATE POLICY "Admins manage inventory movements" ON inventory_movements FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage shipment events" ON shipment_events;
CREATE POLICY "Admins manage shipment events" ON shipment_events FOR ALL
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage return items" ON return_items;
CREATE POLICY "Admins manage return items" ON return_items FOR ALL
  USING (public.is_admin(auth.uid()));

-- ─── 4. Make inventory RPC functions SECURITY DEFINER ───────────────────────────
-- PostgREST RPC calls may not honor service_role BYPASSRLS, so make these
-- functions SECURITY DEFINER to ensure they bypass RLS regardless of caller.

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. Grant BYPASS ROW LEVEL SECURITY to service_role ────────────────────────

DO $$
BEGIN
  ALTER ROLE service_role WITH BYPASSRLS;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END $$;

-- ─── 6. Add missing INSERT/UPDATE/DELETE policies for service_role ──────────────
-- Some tables only had SELECT policies. The service_role with BYPASSRLS should
-- bypass all RLS, but PostgREST RPC/INSERT contexts may not honor it. These
-- policies ensure the service_role can perform all operations on all tables.

-- Helper: check if current session is service_role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT current_user = 'service_role'
  OR pg_has_role(session_user, 'service_role', 'member');
$$;

-- Orders table: add INSERT/UPDATE/DELETE for service_role
DROP POLICY IF EXISTS "Service role full access orders" ON orders;
CREATE POLICY "Service role full access orders" ON orders FOR ALL
  USING (public.is_service_role() OR auth.uid() = user_id)
  WITH CHECK (public.is_service_role() OR auth.uid() = user_id);

-- Order items: add full access for service_role
DROP POLICY IF EXISTS "Users read own order items" ON order_items;
CREATE POLICY "Users read own order_items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access order_items" ON order_items;
CREATE POLICY "Service role full access order_items" ON order_items FOR INSERT
  WITH CHECK (public.is_service_role());

DROP POLICY IF EXISTS "Service role update order_items" ON order_items;
CREATE POLICY "Service role update order_items" ON order_items FOR UPDATE
  USING (public.is_service_role() OR EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role delete order_items" ON order_items;
CREATE POLICY "Service role delete order_items" ON order_items FOR DELETE
  USING (public.is_service_role() OR EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Addresses: add full access for service_role (FOR ALL already exists, but add explicit INSERT CHECK)
DROP POLICY IF EXISTS "Service role manage addresses" ON addresses;
CREATE POLICY "Service role manage addresses" ON addresses FOR INSERT
  WITH CHECK (public.is_service_role() OR auth.uid() = user_id);

-- Cart items: add explicit INSERT CHECK for service_role
DROP POLICY IF EXISTS "Service role manage cart_items" ON cart_items;
CREATE POLICY "Service role manage cart_items" ON cart_items FOR INSERT
  WITH CHECK (public.is_service_role() OR EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR public.is_service_role())));
