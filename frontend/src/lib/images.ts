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
  "new": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
  "ready-to-wear": "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80",
  "unstitched": "https://images.unsplash.com/photo-1536315036965-4cb3fd2e9f49?auto=format&fit=crop&w=900&q=80",
  "formals": "https://images.unsplash.com/photo-1542062688-4b38d8e0f0b5?auto=format&fit=crop&w=900&q=80",
  "footwear": "https://images.unsplash.com/photo-1519741496943-0e135f8d0f3c?auto=format&fit=crop&w=900&q=80",
  "accessories": "https://images.unsplash.com/photo-1471115853179-bb1d604434e0?auto=format&fit=crop&w=900&q=80",
  "women": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
  "men": "https://images.unsplash.com/photo-1512436991641-6817eab5b527?auto=format&fit=crop&w=900&q=80",
  "jeans": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
  "trousers": "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80",
  "bottoms": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
  "skirts": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
  "skirt": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
  "sale": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
  "default": "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80",
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
