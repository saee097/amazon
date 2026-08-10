const mongoose = require("mongoose");

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const schemaOptions = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
};

const money = {
  type: Number,
  min: 0,
  default: 0,
};

const requiredString = {
  type: String,
  trim: true,
  required: true,
};

const optionalString = {
  type: String,
  trim: true,
};

const ref = (model, required = false) => ({
  type: objectId,
  ref: model,
  required,
});

const model = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

const Customer = model(
  "Customer",
  new Schema(
    {
      first_name: { ...requiredString, alias: "firstName" },
      last_name: { ...requiredString, alias: "lastName" },
      username: {
        ...optionalString,
        lowercase: true,
        unique: true,
        sparse: true,
        index: true,
      },
      email: {
        ...requiredString,
        lowercase: true,
        unique: true,
        index: true,
      },
      phone: optionalString,
      password_hash: {
        type: String,
        required: true,
        select: false,
        alias: "passwordHash",
      },
      password_reset_token: {
        type: String,
        select: false,
        alias: "passwordResetToken",
      },
      password_reset_expires: {
        type: Date,
        select: false,
        alias: "passwordResetExpires",
      },
      role: {
        type: String,
        enum: ["customer", "admin", "superadmin"],
        default: "customer",
      },
      role_ref: ref("Role"),
      status: {
        type: String,
        enum: ["active", "blocked", "suspended"],
        default: "active",
      },
      email_verified: { type: Boolean, default: false, alias: "emailVerified" },
      email_verified_at: { type: Date, alias: "emailVerifiedAt" },
      email_verification_token: {
        type: String,
        select: false,
        alias: "emailVerificationToken",
      },
      failed_login_attempts: {
        type: Number,
        default: 0,
        alias: "failedLoginAttempts",
      },
      locked_until: { type: Date, alias: "lockedUntil" },
      two_factor_enabled: {
        type: Boolean,
        default: false,
        alias: "twoFactorEnabled",
      },
      two_factor_secret: {
        type: String,
        select: false,
        alias: "twoFactorSecret",
      },
      two_factor_recovery_codes: {
        type: [String],
        select: false,
        alias: "twoFactorRecoveryCodes",
      },
      avatar: optionalString,
      cover_image: { ...optionalString, alias: "coverImage" },
      bio: optionalString,
      last_login: { type: Date, alias: "lastLogin" },
      last_activity: { type: Date, alias: "lastActivity" },
      is_deleted: { type: Boolean, default: false, alias: "isDeleted" },
      deleted_at: { type: Date, alias: "deletedAt" },
      deleted_by: ref("Customer"),
      tags: { type: [String], default: [] },
      trusted_devices: { type: [Schema.Types.Mixed], default: [], alias: "trustedDevices" },
    },
    schemaOptions
  ),
  "customers"
);

const Category = model(
  "Category",
  new Schema(
    {
      category_name: { ...requiredString, alias: "categoryName" },
      slug: { ...requiredString, unique: true, lowercase: true },
      description: optionalString,
      parent_category: ref("Category"),
    },
    schemaOptions
  ),
  "categories"
);

const Brand = model(
  "Brand",
  new Schema(
    {
      brand_name: { ...requiredString, alias: "brandName" },
      slug: { ...requiredString, unique: true, lowercase: true },
      logo: optionalString,
    },
    schemaOptions
  ),
  "brands"
);

const Product = model(
  "Product",
  new Schema(
    {
      title: requiredString,
      slug: { ...requiredString, unique: true, lowercase: true },
      description: optionalString,
      price: money,
      compare_price: { ...money, alias: "comparePrice" },
      sku: { ...optionalString, unique: true, sparse: true },
      status: {
        type: String,
        enum: ["draft", "active", "archived"],
        default: "draft",
      },
      category: ref("Category"),
      brand: ref("Brand"),
      average_rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
        alias: "averageRating",
      },
    },
    schemaOptions
  ),
  "products"
);

const ProductVariant = model(
  "ProductVariant",
  new Schema(
    {
      product: ref("Product", true),
      size: optionalString,
      color: optionalString,
      price: money,
      inventory_quantity: {
        type: Number,
        min: 0,
        default: 0,
        alias: "inventoryQuantity",
      },
      sku: { ...optionalString, unique: true, sparse: true },
    },
    schemaOptions
  ),
  "variants"
);

const ProductImage = model(
  "ProductImage",
  new Schema(
    {
      product: ref("Product", true),
      image_url: { ...requiredString, alias: "imageUrl" },
      alt_text: { ...optionalString, alias: "altText" },
      sort_order: { type: Number, default: 0, alias: "sortOrder" },
    },
    schemaOptions
  ),
  "productimages"
);

const Warehouse = model(
  "Warehouse",
  new Schema(
    {
      warehouse_name: { ...requiredString, alias: "warehouseName" },
      location: optionalString,
    },
    schemaOptions
  ),
  "warehouses"
);

const Inventory = model(
  "Inventory",
  new Schema(
    {
      variant: ref("ProductVariant", true),
      warehouse: ref("Warehouse", true),
      quantity: { type: Number, min: 0, default: 0 },
    },
    schemaOptions
  ),
  "inventories"
);

const Stock = model(
  "Stock",
  new Schema(
    {
      product: ref("Product", true),
      variant: ref("ProductVariant"),
      warehouse: ref("Warehouse", true),
      type: {
        type: String,
        enum: ["purchase", "sale", "adjustment", "return", "transfer"],
        default: "adjustment",
      },
      quantity: { type: Number, required: true },
      reason: optionalString,
      reference: optionalString,
    },
    schemaOptions
  ),
  "stocks"
);

const StockMovement = model(
  "StockMovement",
  new Schema(
    {
      product: ref("Product", true),
      variant: ref("ProductVariant"),
      warehouse: ref("Warehouse", true),
      type: {
        type: String,
        enum: ["in", "out", "adjustment"],
        default: "adjustment",
      },
      quantity: { type: Number, required: true },
      reason: optionalString,
      note: optionalString,
    },
    schemaOptions
  ),
  "stockmovements"
);

const Address = model(
  "Address",
  new Schema(
    {
      customer: ref("Customer", true),
      country: requiredString,
      state: optionalString,
      city: requiredString,
      zip_code: { ...optionalString, alias: "zipCode" },
      street: requiredString,
      is_default: { type: Boolean, default: false, alias: "isDefault" },
    },
    schemaOptions
  ),
  "addresses"
);

const Cart = model(
  "Cart",
  new Schema(
    {
      customer: ref("Customer", true),
      status: {
        type: String,
        enum: ["active", "converted", "abandoned"],
        default: "active",
      },
    },
    schemaOptions
  ),
  "carts"
);

const CartItem = model(
  "CartItem",
  new Schema(
    {
      cart: ref("Cart", true),
      variant: ref("ProductVariant", true),
      quantity: { type: Number, min: 1, default: 1 },
    },
    schemaOptions
  ),
  "cart_items"
);

const Wishlist = model(
  "Wishlist",
  new Schema(
    {
      customer: ref("Customer", true),
    },
    schemaOptions
  ),
  "wishlists"
);

const WishlistItem = model(
  "WishlistItem",
  new Schema(
    {
      wishlist: ref("Wishlist", true),
      product: ref("Product", true),
    },
    schemaOptions
  ),
  "wishlist_items"
);

const Coupon = model(
  "Coupon",
  new Schema(
    {
      code: { ...requiredString, unique: true, uppercase: true },
      discount_type: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
        alias: "discountType",
      },
      discount_value: {
        type: Number,
        min: 0,
        required: true,
        alias: "discountValue",
      },
      expires_at: { type: Date, alias: "expiresAt" },
      is_active: { type: Boolean, default: true, alias: "isActive" },
    },
    schemaOptions
  ),
  "coupons"
);

const Order = model(
  "Order",
  new Schema(
    {
      customer: ref("Customer", true),
      address: ref("Address"),
      coupon: ref("Coupon"),
      total_amount: { ...money, alias: "totalAmount" },
      payment_status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        alias: "paymentStatus",
      },
      order_status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending",
        alias: "orderStatus",
      },
    },
    schemaOptions
  ),
  "orders"
);

const OrderItem = model(
  "OrderItem",
  new Schema(
    {
      order: ref("Order", true),
      variant: ref("ProductVariant", true),
      quantity: { type: Number, min: 1, default: 1 },
      price: money,
    },
    schemaOptions
  ),
  "order_items"
);

const Payment = model(
  "Payment",
  new Schema(
    {
      order: ref("Order", true),
      payment_method: { ...requiredString, alias: "paymentMethod" },
      amount: money,
      payment_status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        alias: "paymentStatus",
      },
      transaction_id: { ...optionalString, alias: "transactionId" },
    },
    schemaOptions
  ),
  "payments"
);

const ShippingMethod = model(
  "ShippingMethod",
  new Schema(
    {
      method_name: { ...requiredString, alias: "methodName" },
      cost: money,
    },
    schemaOptions
  ),
  "shipping_methods"
);

const Shipment = model(
  "Shipment",
  new Schema(
    {
      order: ref("Order", true),
      shipping_method: {
        ...ref("ShippingMethod"),
        alias: "shippingMethod",
      },
      carrier: optionalString,
      tracking_number: { ...optionalString, alias: "trackingNumber" },
      delivery_status: {
        type: String,
        enum: ["pending", "shipped", "in_transit", "delivered", "failed"],
        default: "pending",
        alias: "deliveryStatus",
      },
    },
    schemaOptions
  ),
  "shipments"
);

const ReturnRequest = model(
  "ReturnRequest",
  new Schema(
    {
      order: ref("Order", true),
      reason: requiredString,
      status: {
        type: String,
        enum: ["requested", "approved", "rejected", "received"],
        default: "requested",
      },
    },
    schemaOptions
  ),
  "returns"
);

const Refund = model(
  "Refund",
  new Schema(
    {
      order: ref("Order", true),
      amount: money,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "paid"],
        default: "pending",
      },
    },
    schemaOptions
  ),
  "refunds"
);

const Review = model(
  "Review",
  new Schema(
    {
      customer: ref("Customer", true),
      product: ref("Product", true),
      rating: { type: Number, min: 1, max: 5, required: true },
      review_text: { ...optionalString, alias: "reviewText" },
    },
    schemaOptions
  ),
  "reviews"
);

const RecentlyViewed = model(
  "RecentlyViewed",
  new Schema(
    {
      customer: ref("Customer", true),
      product: ref("Product", true),
    },
    schemaOptions
  ),
  "recentlyviewed"
);

const SearchHistory = model(
  "SearchHistory",
  new Schema(
    {
      customer: ref("Customer", true),
      keyword: requiredString,
    },
    schemaOptions
  ),
  "searchhistories"
);

const Collection = model(
  "Collection",
  new Schema(
    {
      collection_name: { ...requiredString, alias: "collectionName" },
      description: optionalString,
    },
    schemaOptions
  ),
  "collections"
);

const CollectionProduct = model(
  "CollectionProduct",
  new Schema(
    {
      collection_ref: { ...ref("Collection", true), alias: "collection" },
      product: ref("Product", true),
    },
    schemaOptions
  ),
  "collection_products"
);

const Blog = model(
  "Blog",
  new Schema(
    {
      title: requiredString,
      slug: { ...requiredString, unique: true, lowercase: true },
      content: requiredString,
      author: optionalString,
      published_at: { type: Date, alias: "publishedAt" },
    },
    schemaOptions
  ),
  "blogs"
);

const ProductTag = model(
  "ProductTag",
  new Schema(
    {
      tag_name: { ...requiredString, unique: true, alias: "tagName" },
    },
    schemaOptions
  ),
  "product_tags"
);

const ProductTagMapping = model(
  "ProductTagMapping",
  new Schema(
    {
      product: ref("Product", true),
      tag: ref("ProductTag", true),
    },
    schemaOptions
  ),
  "product_tag_mappings"
);

const FAQ = model(
  "FAQ",
  new Schema(
    {
      question: requiredString,
      answer: requiredString,
    },
    schemaOptions
  ),
  "faqs"
);

const Banner = model(
  "Banner",
  new Schema(
    {
      heading: requiredString,
      subheading: optionalString,
      image: optionalString,
      link_url: { ...optionalString, alias: "linkUrl" },
    },
    schemaOptions
  ),
  "banners"
);

const Testimonial = model(
  "Testimonial",
  new Schema(
    {
      customer_name: { ...requiredString, alias: "customerName" },
      rating: { type: Number, min: 1, max: 5, required: true },
      message: requiredString,
    },
    schemaOptions
  ),
  "testimonials"
);

const TrustBadge = model(
  "TrustBadge",
  new Schema(
    {
      title: requiredString,
      icon: optionalString,
      description: optionalString,
    },
    schemaOptions
  ),
  "trust_badges"
);

const Notification = model(
  "Notification",
  new Schema(
    {
      title: requiredString,
      message: optionalString,
      type: {
        type: String,
        enum: ["info", "success", "warning", "error"],
        default: "info",
      },
      recipient: optionalString,
      read: { type: Boolean, default: false },
    },
    schemaOptions
  ),
  "notifications"
);

const SupportTicket = model(
  "SupportTicket",
  new Schema(
    {
      subject: requiredString,
      customer_email: { ...optionalString, alias: "customerEmail" },
      message: requiredString,
      status: {
        type: String,
        enum: ["open", "pending", "resolved", "closed"],
        default: "open",
      },
      priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
    },
    schemaOptions
  ),
  "support_tickets"
);

const Vendor = model(
  "Vendor",
  new Schema(
    {
      vendor_name: { ...requiredString, alias: "vendorName" },
      contact_email: { ...optionalString, alias: "contactEmail" },
      phone: optionalString,
      status: {
        type: String,
        enum: ["pending", "active", "suspended"],
        default: "pending",
      },
      commission_rate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        alias: "commissionRate",
      },
    },
    schemaOptions
  ),
  "vendors"
);

const SecuritySetting = model(
  "SecuritySetting",
  new Schema(
    {
      key: { ...requiredString, unique: true },
      value: optionalString,
      description: optionalString,
    },
    schemaOptions
  ),
  "security_settings"
);

const Settings = model(
  "Settings",
  new Schema(
    {
      store_name: { ...optionalString, alias: "storeName" },
      support_email: { ...optionalString, alias: "supportEmail" },
      currency: optionalString,
      maintenance_mode: {
        type: Boolean,
        default: false,
        alias: "maintenanceMode",
      },
    },
    schemaOptions
  ),
  "settings"
);

const Menu = model(
  "Menu",
  new Schema(
    {
      name: requiredString,
    },
    schemaOptions
  ),
  "menus"
);

const MenuItem = model(
  "MenuItem",
  new Schema(
    {
      menu: ref("Menu", true),
      title: requiredString,
      url: requiredString,
      parent_item: { ...ref("MenuItem"), alias: "parentItem" },
      sort_order: { type: Number, default: 0, alias: "sortOrder" },
    },
    schemaOptions
  ),
  "menu_items"
);

const NewsletterSubscriber = model(
  "NewsletterSubscriber",
  new Schema(
    {
      email: {
        ...requiredString,
        lowercase: true,
        unique: true,
      },
      subscribed_at: {
        type: Date,
        default: Date.now,
        alias: "subscribedAt",
      },
    },
    schemaOptions
  ),
  "newsletters"
);

const EmailTemplate = model(
  "EmailTemplate",
  new Schema(
    {
      template_name: { ...requiredString, unique: true, alias: "templateName" },
      subject: requiredString,
      body: requiredString,
    },
    schemaOptions
  ),
  "email_templates"
);

const ActivityLog = model(
  "ActivityLog",
  new Schema(
    {
      user: ref("Customer"),
      entity_name: { ...requiredString, alias: "entityName" },
      action: requiredString,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      metadata: Schema.Types.Mixed,
    },
    {
      ...schemaOptions,
      timestamps: false,
    }
  ),
  "activitylogs"
);

const Permission = model(
  "Permission",
  new Schema(
    {
      name: { ...requiredString, unique: true, lowercase: true },
      module: { ...requiredString, lowercase: true },
      action: { ...requiredString, lowercase: true },
      description: optionalString,
    },
    schemaOptions
  ),
  "permissions"
);

const Role = model(
  "Role",
  new Schema(
    {
      name: { ...requiredString, unique: true, lowercase: true },
      description: optionalString,
      is_system: { type: Boolean, default: false, alias: "isSystem" },
      permissions: { type: [ref("Permission")], default: [] },
    },
    schemaOptions
  ),
  "roles"
);

const RolePermission = model(
  "RolePermission",
  new Schema(
    {
      role: ref("Role", true),
      permission: ref("Permission", true),
    },
    {
      ...schemaOptions,
      timestamps: false,
    }
  ),
  "role_permissions"
);

RolePermission.schema.index({ role: 1, permission: 1 }, { unique: true });

const Profile = model(
  "Profile",
  new Schema(
    {
      user: { ...ref("Customer", true), unique: true, alias: "userId" },
      gender: optionalString,
      dob: { type: Date, alias: "dateOfBirth" },
      address: optionalString,
      city: optionalString,
      state: optionalString,
      country: optionalString,
      zip: optionalString,
      website: optionalString,
      linkedin: optionalString,
      github: optionalString,
      twitter: optionalString,
      facebook: optionalString,
      company: optionalString,
      department: optionalString,
      position: optionalString,
      skills: { type: [String], default: [] },
      experience: optionalString,
      language: optionalString,
      timezone: optionalString,
      theme: optionalString,
      notification_preferences: { type: Schema.Types.Mixed, alias: "notificationPreferences" },
      privacy_settings: { type: Schema.Types.Mixed, alias: "privacySettings" },
    },
    schemaOptions
  ),
  "profiles"
);

const LoginHistory = model(
  "LoginHistory",
  new Schema(
    {
      user: ref("Customer", true),
      ip: optionalString,
      device: optionalString,
      browser: optionalString,
      os: optionalString,
      login_time: { type: Date, default: Date.now, alias: "loginTime" },
      logout_time: { type: Date, alias: "logoutTime" },
      user_agent: { type: String, alias: "userAgent" },
      is_successful: { type: Boolean, default: true, alias: "isSuccessful" },
    },
    {
      ...schemaOptions,
      timestamps: false,
    }
  ),
  "loginhistories"
);

const AuditLog = model(
  "AuditLog",
  new Schema(
    {
      user: ref("Customer"),
      action: requiredString,
      module: requiredString,
      entity_id: { type: String, alias: "entityId" },
      entity_type: { type: String, alias: "entityType" },
      old_data: { type: Schema.Types.Mixed, alias: "oldData" },
      new_data: { type: Schema.Types.Mixed, alias: "newData" },
      ip: optionalString,
      user_agent: { type: String, alias: "userAgent" },
      metadata: Schema.Types.Mixed,
    },
    {
      ...schemaOptions,
      timestamps: { createdAt: "created_at", updatedAt: false },
    }
  ),
  "auditlogs"
);

module.exports = {
  ActivityLog,
  Address,
  Permission,
  Role,
  RolePermission,
  Profile,
  LoginHistory,
  AuditLog,
  Banner,
  Notification,
  Settings,
  SecuritySetting,
  SupportTicket,
  Vendor,
  Blog,
  Brand,
  Cart,
  CartItem,
  Category,
  Collection,
  CollectionProduct,
  Coupon,
  Customer,
  EmailTemplate,
  FAQ,
  Inventory,
  Menu,
  MenuItem,
  NewsletterSubscriber,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductImage,
  ProductTag,
  ProductTagMapping,
  ProductVariant,
  RecentlyViewed,
  Refund,
  ReturnRequest,
  Review,
  SearchHistory,
  Shipment,
  ShippingMethod,
  Stock,
  StockMovement,
  Testimonial,
  TrustBadge,
  Warehouse,
  Wishlist,
  WishlistItem,
};
