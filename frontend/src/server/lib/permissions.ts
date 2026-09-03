export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: [
    "dashboard:view", "users:view", "users:create", "users:edit", "users:delete",
    "admins:view", "admins:create", "admins:edit", "admins:delete",
    "roles:view", "roles:create", "roles:edit", "roles:delete",
    "permissions:view", "permissions:create", "permissions:edit", "permissions:delete",
    "settings:view", "settings:edit", "logs:view", "logs:export",
    "products:view", "products:create", "products:edit", "products:delete",
    "orders:view", "orders:edit", "orders:delete",
    "categories:view", "categories:create", "categories:edit", "categories:delete",
    "inventory:view", "inventory:edit", "analytics:view",
    "customers:view", "customers:edit", "vendors:view", "vendors:edit",
    "reports:view", "reports:export",
  ],
  admin: [
    "dashboard:view", "users:view", "users:edit", "admins:view",
    "settings:view", "settings:edit", "logs:view",
    "products:view", "products:create", "products:edit",
    "orders:view", "orders:edit",
    "categories:view", "categories:create", "categories:edit",
    "inventory:view", "analytics:view", "customers:view", "vendors:view", "reports:view",
  ],
  customer: ["dashboard:view"],
};

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.customer;
}
