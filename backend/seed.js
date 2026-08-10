const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./src/config/db");
const { Customer, Role, Permission, RolePermission, Profile, Settings, EmailTemplate, SecuritySetting } = require("./src/models/erdModels");

const PERMISSIONS = [
  { name: "dashboard:view", module: "dashboard", action: "view", description: "View dashboard" },
  { name: "dashboard:edit", module: "dashboard", action: "edit", description: "Edit dashboard" },
  { name: "users:view", module: "users", action: "view", description: "View users" },
  { name: "users:create", module: "users", action: "create", description: "Create users" },
  { name: "users:edit", module: "users", action: "edit", description: "Edit users" },
  { name: "users:delete", module: "users", action: "delete", description: "Delete users" },
  { name: "users:suspend", module: "users", action: "suspend", description: "Suspend users" },
  { name: "users:activate", module: "users", action: "activate", description: "Activate users" },
  { name: "users:reset_password", module: "users", action: "reset_password", description: "Reset user passwords" },
  { name: "admins:view", module: "admins", action: "view", description: "View admins" },
  { name: "admins:create", module: "admins", action: "create", description: "Create admins" },
  { name: "admins:edit", module: "admins", action: "edit", description: "Edit admins" },
  { name: "admins:delete", module: "admins", action: "delete", description: "Delete admins" },
  { name: "roles:view", module: "roles", action: "view", description: "View roles" },
  { name: "roles:create", module: "roles", action: "create", description: "Create roles" },
  { name: "roles:edit", module: "roles", action: "edit", description: "Edit roles" },
  { name: "roles:delete", module: "roles", action: "delete", description: "Delete roles" },
  { name: "permissions:view", module: "permissions", action: "view", description: "View permissions" },
  { name: "permissions:create", module: "permissions", action: "create", description: "Create permissions" },
  { name: "permissions:edit", module: "permissions", action: "edit", description: "Edit permissions" },
  { name: "permissions:delete", module: "permissions", action: "delete", description: "Delete permissions" },
  { name: "settings:view", module: "settings", action: "view", description: "View settings" },
  { name: "settings:edit", module: "settings", action: "edit", description: "Edit settings" },
  { name: "logs:view", module: "logs", action: "view", description: "View logs" },
  { name: "logs:export", module: "logs", action: "export", description: "Export logs" },
  { name: "products:view", module: "products", action: "view", description: "View products" },
  { name: "products:create", module: "products", action: "create", description: "Create products" },
  { name: "products:edit", module: "products", action: "edit", description: "Edit products" },
  { name: "products:delete", module: "products", action: "delete", description: "Delete products" },
  { name: "orders:view", module: "orders", action: "view", description: "View orders" },
  { name: "orders:edit", module: "orders", action: "edit", description: "Edit orders" },
  { name: "orders:delete", module: "orders", action: "delete", description: "Delete orders" },
  { name: "categories:view", module: "categories", action: "view", description: "View categories" },
  { name: "categories:create", module: "categories", action: "create", description: "Create categories" },
  { name: "categories:edit", module: "categories", action: "edit", description: "Edit categories" },
  { name: "categories:delete", module: "categories", action: "delete", description: "Delete categories" },
  { name: "inventory:view", module: "inventory", action: "view", description: "View inventory" },
  { name: "inventory:edit", module: "inventory", action: "edit", description: "Edit inventory" },
  { name: "analytics:view", module: "analytics", action: "view", description: "View analytics" },
  { name: "customers:view", module: "customers", action: "view", description: "View customers" },
  { name: "customers:edit", module: "customers", action: "edit", description: "Edit customers" },
  { name: "vendors:view", module: "vendors", action: "view", description: "View vendors" },
  { name: "vendors:edit", module: "vendors", action: "edit", description: "Edit vendors" },
  { name: "reports:view", module: "reports", action: "view", description: "View reports" },
  { name: "reports:export", module: "reports", action: "export", description: "Export reports" },
  { name: "reviews:view", module: "reviews", action: "view", description: "View reviews" },
  { name: "reviews:edit", module: "reviews", action: "edit", description: "Edit reviews" },
  { name: "coupons:view", module: "coupons", action: "view", description: "View coupons" },
  { name: "coupons:create", module: "coupons", action: "create", description: "Create coupons" },
  { name: "coupons:edit", module: "coupons", action: "edit", description: "Edit coupons" },
  { name: "coupons:delete", module: "coupons", action: "delete", description: "Delete coupons" },
  { name: "blogs:view", module: "blogs", action: "view", description: "View blogs" },
  { name: "blogs:create", module: "blogs", action: "create", description: "Create blogs" },
  { name: "blogs:edit", module: "blogs", action: "edit", description: "Edit blogs" },
  { name: "blogs:delete", module: "blogs", action: "delete", description: "Delete blogs" },
  { name: "banners:view", module: "banners", action: "view", description: "View banners" },
  { name: "banners:create", module: "banners", action: "create", description: "Create banners" },
  { name: "banners:edit", module: "banners", action: "edit", description: "Edit banners" },
  { name: "banners:delete", module: "banners", action: "delete", description: "Delete banners" },
  { name: "support:view", module: "support", action: "view", description: "View support tickets" },
  { name: "support:edit", module: "support", action: "edit", description: "Edit support tickets" },
  { name: "security:view", module: "security", action: "view", description: "View security settings" },
  { name: "security:edit", module: "security", action: "edit", description: "Edit security settings" },
  { name: "notifications:view", module: "notifications", action: "view", description: "View notifications" },
  { name: "notifications:send", module: "notifications", action: "send", description: "Send notifications" },
  { name: "shipments:view", module: "shipments", action: "view", description: "View shipments" },
  { name: "shipments:edit", module: "shipments", action: "edit", description: "Edit shipments" },
  { name: "returns:view", module: "returns", action: "view", description: "View returns" },
  { name: "returns:edit", module: "returns", action: "edit", description: "Edit returns" },
  { name: "refunds:view", module: "refunds", action: "view", description: "View refunds" },
  { name: "refunds:edit", module: "refunds", action: "edit", description: "Edit refunds" },
  { name: "payments:view", module: "payments", action: "view", description: "View payments" },
  { name: "payments:edit", module: "payments", action: "edit", description: "Edit payments" },
  { name: "warehouses:view", module: "warehouses", action: "view", description: "View warehouses" },
  { name: "warehouses:edit", module: "warehouses", action: "edit", description: "Edit warehouses" },
  { name: "stock:view", module: "stock", action: "view", description: "View stock" },
  { name: "stock:edit", module: "stock", action: "edit", description: "Edit stock" },
  { name: "collections:view", module: "collections", action: "view", description: "View collections" },
  { name: "collections:create", module: "collections", action: "create", description: "Create collections" },
  { name: "collections:edit", module: "collections", action: "edit", description: "Edit collections" },
  { name: "collections:delete", module: "collections", action: "delete", description: "Delete collections" },
  { name: "faqs:view", module: "faqs", action: "view", description: "View FAQs" },
  { name: "faqs:create", module: "faqs", action: "create", description: "Create FAQs" },
  { name: "faqs:edit", module: "faqs", action: "edit", description: "Edit FAQs" },
  { name: "faqs:delete", module: "faqs", action: "delete", description: "Delete FAQs" },
  { name: "newsletter:view", module: "newsletter", action: "view", description: "View newsletter" },
  { name: "newsletter:send", module: "newsletter", action: "send", description: "Send newsletter" },
  { name: "menu:view", module: "menu", action: "view", description: "View menus" },
  { name: "menu:edit", module: "menu", action: "edit", description: "Edit menus" },
];

const seed = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    await Customer.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await RolePermission.deleteMany({});
    await Profile.deleteMany({});
    await Settings.deleteMany({});
    await EmailTemplate.deleteMany({});
    await SecuritySetting.deleteMany({});

    console.log("Creating permissions...");
    const createdPermissions = await Permission.insertMany(PERMISSIONS);
    const permMap = {};
    createdPermissions.forEach((p) => {
      permMap[p.name] = p._id;
    });

    console.log("Creating roles...");
    const customerRole = await Role.create({
      name: "customer",
      description: "Regular customer",
      is_system: true,
    });

    const adminRole = await Role.create({
      name: "admin",
      description: "Administrator",
      is_system: true,
    });

    const superAdminRole = await Role.create({
      name: "superadmin",
      description: "Super Administrator with full access",
      is_system: true,
    });

    const adminPermissions = createdPermissions.filter((p) => {
      const excluded = [
        "permissions:delete",
        "roles:delete",
        "admins:delete",
        "logs:export",
        "reports:export",
        "users:delete",
      ];
      return !excluded.includes(p.name);
    });

    for (const perm of adminPermissions) {
      await RolePermission.create({ role: adminRole._id, permission: perm._id });
    }
    adminRole.permissions = adminPermissions.map((p) => p._id);
    await adminRole.save();

    for (const perm of createdPermissions) {
      await RolePermission.create({ role: superAdminRole._id, permission: perm._id });
    }
    superAdminRole.permissions = createdPermissions.map((p) => p._id);
    await superAdminRole.save();

    const defaultPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const superAdmin = await Customer.create({
      first_name: "Super",
      last_name: "Admin",
      email: "superadmin@example.com",
      phone: "+1234567890",
      password_hash: passwordHash,
      role: "superadmin",
      status: "active",
      email_verified: true,
      email_verified_at: new Date(),
    });

    await Profile.create({ user: superAdmin._id });

    const adminPassword = crypto.randomBytes(16).toString("hex");
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await Customer.create({
      first_name: "Store",
      last_name: "Admin",
      email: "admin@example.com",
      phone: "+1234567891",
      password_hash: adminPasswordHash,
      role: "admin",
      status: "active",
      email_verified: true,
      email_verified_at: new Date(),
    });

    await Profile.create({ user: admin._id });

    await Settings.create({
      store_name: "STORE",
      support_email: "support@example.com",
      currency: "USD",
      maintenance_mode: false,
    });

    const templates = [
      {
        template_name: "welcome",
        subject: "Welcome to STORE!",
        body: "<h1>Welcome!</h1><p>Thank you for registering with us.</p>",
      },
      {
        template_name: "password_reset",
        subject: "Reset your password",
        body: "<h1>Reset Password</h1><p>Click the link below to reset your password.</p>",
      },
      {
        template_name: "order_confirmation",
        subject: "Order Confirmed",
        body: "<h1>Order Confirmed</h1><p>Your order has been placed successfully.</p>",
      },
    ];

    await EmailTemplate.insertMany(templates);

    const securitySettings = [
      { key: "password_min_length", value: "8", description: "Minimum password length" },
      { key: "max_login_attempts", value: "5", description: "Maximum failed login attempts before lockout" },
      { key: "lockout_duration", value: "15", description: "Account lockout duration in minutes" },
      { key: "session_timeout", value: "30", description: "Session timeout in minutes" },
      { key: "require_email_verification", value: "true", description: "Require email verification on registration" },
      { key: "allow_registration", value: "true", description: "Allow new user registrations" },
    ];

    await SecuritySetting.insertMany(securitySettings);

    console.log("\n=== SEED COMPLETED SUCCESSFULLY ===");
    console.log(`Default Super Admin Credentials:`);
    console.log(`Email: superadmin@example.com`);
    console.log(`Password: ${defaultPassword}`);
    console.log(`Default Admin Credentials:`);
    console.log(`Email: admin@example.com`);
    console.log(`Password: ${adminPassword}`);
    console.log("\nRoles created: customer, admin, superadmin");
    console.log(`Permissions created: ${createdPermissions.length}`);
    console.log("Settings and templates initialized.");
    console.log("===================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seed();
