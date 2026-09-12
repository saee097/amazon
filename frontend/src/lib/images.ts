export type Product = {
  _id: string;
  title: string;
  price?: number;
  compare_price?: number;
  slug: string;
  category?: { _id: string; category_name: string; slug?: string };
  brand?: { _id: string; brand_name: string };
  variants?: {
    _id: string;
    size: string;
    color: string;
    price: number;
    compare_price?: number;
    inventory_quantity: number;
  }[];
  image?: { image_url: string; alt_text?: string };
  images?: { image_url: string; alt_text?: string }[];
  created_at?: string;
};

export const CLOTHING_IMAGES: Record<string, string> = {
  "new": "/images/products/hoodie.jpg",
  "ready-to-wear": "/images/products/dress.jpg",
  "unstitched": "/images/products/fabric.jpg",
  "formals": "/images/products/jacket.jpg",
  "footwear": "/images/products/sneaker.jpg",
  "accessories": "/images/products/watch.jpg",
  "women": "/images/products/dress.jpg",
  "men": "/images/products/jacket.jpg",
  "jeans": "https://m.media-amazon.com/images/I/71fR6mA+eL._AC_SR736,920_.jpg",
  "dresses": "https://m.media-amazon.com/images/I/71mY74PDBUL._AC_SR736,920_.jpg",
  "trousers": "/images/products/jeans.jpg",
  "bottoms": "/images/products/skirt.jpg",
  "skirts": "/images/products/skirt.jpg",
  "skirt": "/images/products/skirt.jpg",
  "t-shirts": "/images/products/tshirt.jpg",
  "jackets": "/images/products/jacket.jpg",
  "sneakers": "/images/products/sneaker.jpg",
  "sale": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
  "default": "/images/products/placeholder.jpg",
};

export const getProductImage = (product: Product | Partial<Product> | undefined | null): string => {
  if (!product) return CLOTHING_IMAGES["default"];
  if (product.images && product.images.length > 0) return product.images[0].image_url;
  if (product.image?.image_url) return product.image.image_url;
  const slug = product.category?.slug?.toLowerCase() || "";
  const name = product.category?.category_name?.toLowerCase() || "";
  if (CLOTHING_IMAGES[slug]) return CLOTHING_IMAGES[slug];
  if (CLOTHING_IMAGES[name]) return CLOTHING_IMAGES[name];
  return CLOTHING_IMAGES["default"];
};
