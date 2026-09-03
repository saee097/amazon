-- Demo catalog media from official retailer collection pages.
-- Replace these URLs with licensed, self-hosted assets before production launch.

UPDATE product_images
SET image_url = 'https://www.junaidjamshed.com/cdn/shop/files/inner_banner_rtw1.webp?v=1787032088&width=1899',
    alt_text = 'J. Pakistan ready-to-wear collection imagery (demo source)'
WHERE product_id = (SELECT id FROM products WHERE slug = 'premium-cotton-tshirt')
  AND sort_order = 0;

UPDATE product_images
SET image_url = 'https://m.media-amazon.com/images/I/61BbwWvJ4dL.jpg',
    alt_text = 'Reebok Club C 85 pair view from 6pm (demo source)'
WHERE product_id = (SELECT id FROM products WHERE slug = 'running-sneakers')
  AND sort_order = 0;

INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT id,
  'https://m.media-amazon.com/images/I/61FG-gNEzhL.jpg',
  'Reebok Club C 85 top view from 6pm (demo source)',
  1
FROM products
WHERE slug = 'running-sneakers';

INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT id,
  'https://m.media-amazon.com/images/I/61ZTC-6w7YL.jpg',
  'Reebok Club C 85 bottom view from 6pm (demo source)',
  2
FROM products
WHERE slug = 'running-sneakers';

UPDATE banners
SET heading = 'Ready To Wear',
    subheading = 'J. Pakistan collection source',
    image = 'https://www.junaidjamshed.com/cdn/shop/files/inner_banner_rtw1.webp?v=1787032088&width=1899',
    link_url = '/products?category=dresses'
WHERE sort_order = 1;

UPDATE banners
SET heading = 'Classic Sneakers',
    subheading = '6pm collection source',
    image = 'https://m.media-amazon.com/images/I/61BbwWvJ4dL.jpg',
    link_url = '/products?category=sneakers'
WHERE sort_order = 3;
