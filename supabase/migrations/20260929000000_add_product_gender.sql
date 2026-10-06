-- Add gender column to products table

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS gender TEXT;

CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
