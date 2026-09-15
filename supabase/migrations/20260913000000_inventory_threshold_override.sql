-- Per-variant low stock threshold override
--
-- Products already have a global `low_stock_threshold` (default 5). Variants
-- can now carry their own override; when NULL the product-level threshold is
-- used by the inventory status resolver.

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER;

-- Backfill from the parent product's threshold where possible so existing
-- data stays consistent (the value is still NULL in spirit until the
-- product row is updated, but this gives a sane starting point).
UPDATE product_variants AS pv
SET low_stock_threshold = p.low_stock_threshold
FROM products AS p
WHERE pv.product_id = p.id
  AND pv.low_stock_threshold IS NULL
  AND p.low_stock_threshold IS NOT NULL;

-- NULL means "inherit from product"; otherwise the variant wins.
CREATE INDEX IF NOT EXISTS idx_variants_low_stock_threshold
  ON product_variants(low_stock_threshold);