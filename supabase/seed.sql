-- Seed catalog data (run after migration)
-- Admin users must be created via scripts/seed.ts (Supabase Auth API)

-- Brands
INSERT INTO brands (brand_name, slug, description) VALUES
  ('Urban Style', 'urban-style', 'Contemporary urban fashion'),
  ('Classic Wear', 'classic-wear', 'Timeless classics'),
  ('Active Life', 'active-life', 'Sportswear and activewear')
ON CONFLICT (slug) DO NOTHING;

-- Categories
INSERT INTO categories (category_name, slug, description) VALUES
  ('T-Shirts', 't-shirts', 'Casual t-shirts'),
  ('Jeans', 'jeans', 'Denim jeans'),
  ('Dresses', 'dresses', 'Elegant dresses'),
  ('Jackets', 'jackets', 'Outerwear jackets'),
  ('Sneakers', 'sneakers', 'Footwear'),
  ('Accessories', 'accessories', 'Watches and accessories')
ON CONFLICT (slug) DO NOTHING;

-- Products with variants and images
DO $$
DECLARE
  cat_tshirt UUID;
  cat_jeans UUID;
  cat_dress UUID;
  cat_jacket UUID;
  cat_sneaker UUID;
  brand_urban UUID;
  brand_classic UUID;
  p1 UUID; p2 UUID; p3 UUID; p4 UUID; p5 UUID; p6 UUID;
BEGIN
  SELECT id INTO cat_tshirt FROM categories WHERE slug = 't-shirts';
  SELECT id INTO cat_jeans FROM categories WHERE slug = 'jeans';
  SELECT id INTO cat_dress FROM categories WHERE slug = 'dresses';
  SELECT id INTO cat_jacket FROM categories WHERE slug = 'jackets';
  SELECT id INTO cat_sneaker FROM categories WHERE slug = 'sneakers';
  SELECT id INTO brand_urban FROM brands WHERE slug = 'urban-style';
  SELECT id INTO brand_classic FROM brands WHERE slug = 'classic-wear';

  INSERT INTO products (title, slug, description, price, compare_price, category_id, brand_id, sku, status)
  VALUES ('Premium Cotton T-Shirt', 'premium-cotton-tshirt', 'Soft premium cotton tee for everyday comfort.', 29.99, 39.99, cat_tshirt, brand_urban, 'TSH-001', 'active')
  RETURNING id INTO p1;

  INSERT INTO product_variants (product_id, size, color, price, compare_price, inventory_quantity, sku)
  VALUES
    (p1, 'S', 'White', 29.99, 39.99, 50, 'TSH-001-S-W'),
    (p1, 'M', 'White', 29.99, 39.99, 75, 'TSH-001-M-W'),
    (p1, 'L', 'Black', 29.99, 39.99, 60, 'TSH-001-L-B');

  INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
  VALUES
    (p1, 'https://www.junaidjamshed.com/cdn/shop/files/inner_banner_rtw1.webp?v=1787032088&width=1899', 'J. Pakistan ready-to-wear collection imagery (demo source)', 0),
    (p1, '/images/products/tshirt.svg', 'Premium Cotton T-Shirt fallback', 1);

  INSERT INTO products (title, slug, description, price, compare_price, category_id, brand_id, sku, status)
  VALUES ('Slim Fit Jeans', 'slim-fit-jeans', 'Modern slim fit denim jeans.', 59.99, 79.99, cat_jeans, brand_classic, 'JNS-001', 'active')
  RETURNING id INTO p2;

  INSERT INTO product_variants (product_id, size, color, price, compare_price, inventory_quantity, sku)
  VALUES
    (p2, '30', 'Blue', 59.99, 79.99, 40, 'JNS-001-30-B'),
    (p2, '32', 'Blue', 59.99, 79.99, 35, 'JNS-001-32-B'),
    (p2, '34', 'Dark Blue', 59.99, 79.99, 30, 'JNS-001-34-DB');

  INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
  VALUES (p2, '/images/products/jeans.svg', 'Slim Fit Jeans', 0);

  INSERT INTO products (title, slug, description, price, compare_price, category_id, brand_id, sku, status)
  VALUES ('Floral Summer Dress', 'floral-summer-dress', 'Light floral dress perfect for summer.', 89.99, 119.99, cat_dress, brand_urban, 'DRS-001', 'active')
  RETURNING id INTO p3;

  INSERT INTO product_variants (product_id, size, color, price, compare_price, inventory_quantity, sku)
  VALUES
    (p3, 'S', 'Floral', 89.99, 119.99, 25, 'DRS-001-S-F'),
    (p3, 'M', 'Floral', 89.99, 119.99, 30, 'DRS-001-M-F');

  INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
  VALUES (p3, '/images/products/dress.svg', 'Floral Summer Dress', 0);

  INSERT INTO products (title, slug, description, price, compare_price, category_id, brand_id, sku, status)
  VALUES ('Leather Jacket', 'leather-jacket', 'Premium faux leather jacket.', 149.99, 199.99, cat_jacket, brand_classic, 'JKT-001', 'active')
  RETURNING id INTO p4;

  INSERT INTO product_variants (product_id, size, color, price, compare_price, inventory_quantity, sku)
  VALUES
    (p4, 'M', 'Black', 149.99, 199.99, 20, 'JKT-001-M-B'),
    (p4, 'L', 'Brown', 149.99, 199.99, 15, 'JKT-001-L-BR');

  INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
  VALUES (p4, '/images/products/jacket.svg', 'Leather Jacket', 0);

  INSERT INTO products (title, slug, description, price, compare_price, category_id, brand_id, sku, status)
  VALUES ('Running Sneakers', 'running-sneakers', 'Lightweight running sneakers.', 79.99, 99.99, cat_sneaker, brand_urban, 'SNK-001', 'active')
  RETURNING id INTO p5;

  INSERT INTO product_variants (product_id, size, color, price, compare_price, inventory_quantity, sku)
  VALUES
    (p5, '8', 'White', 79.99, 99.99, 45, 'SNK-001-8-W'),
    (p5, '9', 'White', 79.99, 99.99, 50, 'SNK-001-9-W'),
    (p5, '10', 'Black', 79.99, 99.99, 40, 'SNK-001-10-B');

  INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
  VALUES
    (p5, 'https://m.media-amazon.com/images/I/61BbwWvJ4dL.jpg', 'Reebok Club C 85 pair view from 6pm (demo source)', 0),
    (p5, 'https://m.media-amazon.com/images/I/61FG-gNEzhL.jpg', 'Reebok Club C 85 top view from 6pm (demo source)', 1),
    (p5, 'https://m.media-amazon.com/images/I/61ZTC-6w7YL.jpg', 'Reebok Club C 85 bottom view from 6pm (demo source)', 2),
    (p5, '/images/products/sneaker.svg', 'Running Sneakers fallback', 3);

  INSERT INTO products (title, slug, description, price, compare_price, category_id, brand_id, sku, status)
  VALUES ('Classic Hoodie', 'classic-hoodie', 'Comfortable pullover hoodie.', 49.99, 64.99, cat_tshirt, brand_urban, 'HDI-001', 'active')
  RETURNING id INTO p6;

  INSERT INTO product_variants (product_id, size, color, price, compare_price, inventory_quantity, sku)
  VALUES
    (p6, 'M', 'Gray', 49.99, 64.99, 55, 'HDI-001-M-G'),
    (p6, 'L', 'Navy', 49.99, 64.99, 45, 'HDI-001-L-N');

  INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
  VALUES (p6, '/images/products/hoodie.svg', 'Classic Hoodie', 0);
END $$;

-- Banners
INSERT INTO banners (heading, subheading, image, link_url, sort_order) VALUES
  ('Ready To Wear', 'J. Pakistan collection source', 'https://www.junaidjamshed.com/cdn/shop/files/inner_banner_rtw1.webp?v=1787032088&width=1899', '/products?category=dresses', 1),
  ('Premium Denim', 'Shop Jeans', '/images/products/jeans.svg', '/products?category=jeans', 2),
  ('Classic Sneakers', '6pm collection source', 'https://m.media-amazon.com/images/I/61BbwWvJ4dL.jpg', '/products?category=sneakers', 3);

-- Menu items
INSERT INTO menu_items (title, url, sort_order) VALUES
  ('New Arrivals', '/products', 1),
  ('T-Shirts', '/products?category=t-shirts', 2),
  ('Jeans', '/products?category=jeans', 3),
  ('Dresses', '/products?category=dresses', 4),
  ('Sale', '/products', 5);

-- Warehouses
INSERT INTO warehouses (name, location) VALUES
  ('Main Warehouse', 'New York, NY'),
  ('West Coast Hub', 'Los Angeles, CA');

-- Coupons
INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, status) VALUES
  ('WELCOME10', 'percentage', 10, 50, 1000, 'active'),
  ('SAVE20', 'percentage', 20, 100, 500, 'active');

-- Sample vendors
INSERT INTO vendors (name, email, phone, status) VALUES
  ('Fashion Forward Inc', 'contact@fashionforward.com', '+1-555-0100', 'active'),
  ('Denim Co', 'orders@denimco.com', '+1-555-0101', 'active');
