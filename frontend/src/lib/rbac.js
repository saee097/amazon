export const ROLES = {
  USER: "customer",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",
  ADMINS_VIEW: "admins:view",
  ADMINS_CREATE: "admins:create",
  ADMINS_EDIT: "admins:edit",
  ADMINS_DELETE: "admins:delete",
  ROLES_VIEW: "roles:view",
  ROLES_CREATE: "roles:create",
  ROLES_EDIT: "roles:edit",
  ROLES_DELETE: "roles:delete",
  PERMISSIONS_VIEW: "permissions:view",
  PERMISSIONS_CREATE: "permissions:create",
  PERMISSIONS_EDIT: "permissions:edit",
  PERMISSIONS_DELETE: "permissions:delete",
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",
  LOGS_VIEW: "logs:view",
  LOGS_EXPORT: "logs:export",
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_EDIT: "products:edit",
  PRODUCTS_DELETE: "products:delete",
  ORDERS_VIEW: "orders:view",
  ORDERS_EDIT: "orders:edit",
  ORDERS_DELETE: "orders:delete",
  CATEGORIES_VIEW: "categories:view",
  CATEGORIES_CREATE: "categories:create",
  CATEGORIES_EDIT: "categories:edit",
  CATEGORIES_DELETE: "categories:delete",
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_EDIT: "inventory:edit",
  ANALYTICS_VIEW: "analytics:view",
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_EDIT: "customers:edit",
  VENDORS_VIEW: "vendors:view",
  VENDORS_EDIT: "vendors:edit",
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.ADMINS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.VENDORS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.USER]: [PERMISSIONS.DASHBOARD_VIEW],
};

export const getAllowedRoutes = (role) => {
  const routes = {
    [ROLES.SUPERADMIN]: [
      "/admin/dashboard",
      "/admin/users",
      "/admin/admins",
      "/admin/roles",
      "/admin/permissions",
      "/admin/settings",
      "/admin/logs",
      "/admin/profile",
      "/admin/superadmin",
      "/admin/analytics",
      "/admin/orders",
      "/admin/products",
      "/admin/categories",
      "/admin/inventory",
      "/admin/customers",
      "/admin/vendors",
      "/admin/reports",
    ],
    [ROLES.ADMIN]: [
      "/admin/dashboard",
      "/admin/users",
      "/admin/settings",
      "/admin/logs",
      "/admin/profile",
      "/admin/analytics",
      "/admin/orders",
      "/admin/products",
      "/admin/categories",
      "/admin/inventory",
      "/admin/customers",
      "/admin/vendors",
      "/admin/reports",
    ],
    [ROLES.USER]: ["/profile", "/settings"],
  };
  return routes[role] || [];
};

export const canAccess = (role, resource, action) => {
  const permission = `${resource}:${action}`;
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(permission);
};

export const getRedirectPath = (role) => {
  if (role === ROLES.SUPERADMIN) return "/admin/superadmin";
  if (role === ROLES.ADMIN) return "/admin/dashboard";
  return "/";
};

export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLES.SUPERADMIN:
      return "Super Admin";
    case ROLES.ADMIN:
      return "Admin";
    case ROLES.USER:
      return "User";
    default:
      return role;
  }
};
