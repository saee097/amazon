type Row = Record<string, unknown>;

export function toMongoId<T extends Row>(row: T | null): (T & { _id: string }) | null {
  if (!row) return null;
  const { id, ...rest } = row as T & { id: string };
  return { _id: id, ...rest } as unknown as T & { _id: string };
}

export function toMongoIds<T extends Row>(rows: T[]): (T & { _id: string })[] {
  return rows.map((r) => toMongoId(r)!);
}

export function mapCategory(cat: Row | null) {
  if (!cat) return null;
  return {
    _id: cat.id as string,
    category_name: cat.category_name,
    slug: cat.slug,
    description: cat.description,
    image_url: cat.image_url,
    parent_id: cat.parent_id as string | null,
    status: cat.status,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
  };
}

export function mapBrand(brand: Row | null) {
  if (!brand) return null;
  return {
    _id: brand.id as string,
    brand_name: brand.brand_name,
    slug: brand.slug,
    description: brand.description,
    logo_url: brand.logo_url,
    status: brand.status,
  };
}

export function mapVariant(v: Row) {
  return {
    _id: v.id as string,
    size: v.size,
    color: v.color,
    circle: v.circle || "1",
    price: Number(v.price),
    compare_price: v.compare_price ? Number(v.compare_price) : undefined,
    inventory_quantity: v.inventory_quantity,
    sku: v.sku,
  };
}

function normalizeImageUrl(url: unknown): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  return url.replace(/\.svg$/i, ".jpg");
}

export function mapProduct(
  product: Row,
  extras?: {
    category?: Row | null;
    brand?: Row | null;
    variants?: Row[];
    images?: Row[];
    reviews?: Row[];
  }
) {
  const images = extras?.images || [];
  const firstImage = images[0];

  return {
    _id: product.id as string,
    title: product.title,
    slug: product.slug,
    description: product.description,
    shortDescription: product.short_description,
    price: Number(product.price),
    compare_price: product.compare_price ? Number(product.compare_price) : undefined,
    cost_price: product.cost_price ? Number(product.cost_price) : undefined,
    sku: product.sku,
    barcode: product.barcode,
    status: product.status,
    weight: product.weight,
    weight_unit: product.weight_unit,
    dimensions: product.dimensions,
    taxable: product.taxable,
    requires_shipping: product.requires_shipping,
    is_featured: product.is_featured,
    meta_title: product.meta_title,
    meta_description: product.meta_description,
    tags: product.tags,
    low_stock_threshold: product.low_stock_threshold,
    category: mapCategory(extras?.category || null),
    brand: mapBrand(extras?.brand || null),
    variants: (extras?.variants || []).map(mapVariant),
    images: images.map((img) => ({
      _id: img.id as string,
      image_url: normalizeImageUrl(img.image_url),
      alt_text: img.alt_text,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })),
    image: firstImage
      ? { image_url: normalizeImageUrl(firstImage.image_url), alt_text: firstImage.alt_text }
      : { image_url: "/images/products/placeholder.jpg", alt_text: product.title },
    reviews: (extras?.reviews || []).map((r) => ({
      _id: r.id as string,
      rating: r.rating,
      comment: r.comment,
      customer: r.profiles
        ? { name: `${(r.profiles as Row).first_name || ""} ${(r.profiles as Row).last_name || ""}`.trim() }
        : undefined,
      created_at: r.created_at,
    })),
    created_at: product.created_at,
  };
}

export function mapProfile(profile: Row) {
  const role = profile.role as string;
  const permissions =
    Array.isArray(profile.permissions) && (profile.permissions as string[]).length > 0
      ? (profile.permissions as string[])
      : getDefaultPermissions(role);

  return {
    _id: profile.id as string,
    email: profile.email,
    name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || null,
    firstName: profile.first_name,
    lastName: profile.last_name,
    first_name: profile.first_name,
    last_name: profile.last_name,
    username: profile.username,
    phone: profile.phone,
    role,
    status: profile.status,
    permissions,
    avatar_url: profile.avatar_url,
    email_verified: profile.email_verified,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    last_login_at: profile.last_login_at,
    display_name: profile.display_name,
    notification_prefs: profile.notification_prefs,
    privacy_prefs: profile.privacy_prefs,
  };
}

import { getPermissionsForRole } from "./permissions";

function getDefaultPermissions(role: string): string[] {
  return getPermissionsForRole(role);
}

export function mapOrder(order: Row, items: Row[] = []) {
  return {
    _id: order.id as string,
    order_number: order.order_number,
    order_status: order.order_status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    total: Number(order.total),
    shipping_address: order.shipping_address,
    items: items.map((item) => ({
      _id: item.id as string,
      quantity: item.quantity,
      price: Number(item.price),
      line_total: Number(item.line_total),
      product: item.products ? mapProduct(item.products as Row) : undefined,
    })),
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}
