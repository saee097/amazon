-- Demo catalog media from official retailer collection pages.
-- Replace these URLs with licensed, self-hosted assets before production launch.

UPDATE product_images
SET image_url = 'https://m.media-amazon.com/images/I/71si774Ei3L._AC_SR768,1024_.jpg',
    alt_text = 'NIC+ZOE Perfect Knit Rib Growover Tank from 6pm (demo source)'
WHERE product_id = (SELECT id FROM products WHERE slug = 'premium-cotton-tshirt')
  AND sort_order = 0;

UPDATE product_images
SET image_url = 'https://m.media-amazon.com/images/I/81Sfw6LuuQL._AC_SR768,1024_.jpg',
    alt_text = 'Converse Chuck Taylor All Star 70 Hi from 6pm (demo source)'
WHERE product_id = (SELECT id FROM products WHERE slug = 'running-sneakers')
  AND sort_order = 0;

INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT id,
  'https://m.media-amazon.com/images/I/71xEQd9JYgL._AC_SR768,1024_.jpg',
  'Reebok Princess from 6pm (demo source)',
  1
FROM products
WHERE slug = 'running-sneakers';

INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
SELECT id,
  'https://m.media-amazon.com/images/I/61RkAxZS5SL._AC_SR768,1024_.jpg',
  'Sofft Faro from 6pm (demo source)',
  2
FROM products
WHERE slug = 'running-sneakers';

UPDATE banners
SET heading = 'Ready To Wear',
    subheading = '6pm collection source',
    image = 'https://m.media-amazon.com/images/I/71akWfW9YcL._AC_SR768,1024_.jpg',
    link_url = '/products?category=dresses'
WHERE sort_order = 1;

UPDATE banners
SET heading = 'Classic Sneakers',
    subheading = '6pm collection source',
    image = 'https://m.media-amazon.com/images/I/81Sfw6LuuQL._AC_SR768,1024_.jpg',
    link_url = '/products?category=sneakers'
WHERE sort_order = 3;
