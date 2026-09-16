import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["customer", "admin", "superadmin"]).optional(),
  inviteCode: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

export const resetByCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

export const productSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.coerce.number().nonnegative("Price must be non-negative"),
  compare_price: z.coerce.number().nonnegative().optional(),
  cost_price: z.coerce.number().nonnegative().optional(),
  category: z.string().uuid().optional().nullable(),
  brand: z.string().uuid().optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  status: z.enum(["draft", "active", "archived", "out_of_stock", "discontinued"]).optional(),
  weight: z.coerce.number().nonnegative().optional(),
  weight_unit: z.string().max(20).optional(),
  dimensions: z.record(z.string(), z.unknown()).optional(),
  taxable: z.boolean().optional(),
  requires_shipping: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  low_stock_threshold: z.coerce.number().int().nonnegative().optional(),
  inventory_quantity: z.coerce.number().int().nonnegative().optional(),
  variants: z.array(z.object({
    size: z.string().optional(),
    color: z.string().optional(),
    material: z.string().optional(),
    price: z.coerce.number().nonnegative(),
    compare_price: z.coerce.number().nonnegative().optional(),
    inventory_quantity: z.coerce.number().int().nonnegative(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    weight: z.coerce.number().nonnegative().optional(),
  })).optional(),
  images: z.array(z.object({
    image_url: z.string().url("Invalid image URL"),
    alt_text: z.string().optional(),
    sort_order: z.coerce.number().int().optional(),
    is_primary: z.boolean().optional(),
  })).optional(),
});

export const categorySchema = z.object({
  category_name: z.string().min(1, "Category name is required").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  image_url: z.string().url().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
});

export const brandSchema = z.object({
  brand_name: z.string().min(1, "Brand name is required").max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").max(50),
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.coerce.number().nonnegative("Discount value must be non-negative"),
  min_order: z.coerce.number().nonnegative().optional(),
  max_uses: z.coerce.number().int().positive().optional(),
  per_user_usage_limit: z.coerce.number().int().positive().optional(),
  start_date: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
  product_ids: z.array(z.string().uuid()).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  brand_ids: z.array(z.string().uuid()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const addressSchema = z.object({
  type: z.enum(["shipping", "billing"]).optional(),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  zip: z.string().min(1, "ZIP code is required"),
  is_default: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  variantId: z.string().uuid().optional().nullable(),
});

export const checkoutSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
  paymentMethod: z.enum(["cash_on_delivery"]).optional(),
  couponCode: z.string().max(50).optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

export const returnSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  reason: z.string().min(1, "Reason is required"),
});

export const reviewSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const warehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const inventoryAdjustSchema = z.object({
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  product_id: z.string().uuid("Invalid product ID"),
  variant_id: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().gt(0, "Quantity is required"),
  movement_type: z.string().min(1, "Movement type is required"),
  notes: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  username: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type ResetByCodeInput = z.infer<typeof resetByCodeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
