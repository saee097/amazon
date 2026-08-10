const jwt = require("jsonwebtoken");
const { Customer, Role, Permission } = require("../models/erdModels");

const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

const ROLE_HIERARCHY = {
  [ROLES.CUSTOMER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPERADMIN]: 3,
};

const hasRole = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};

const hasMinimumRole = (userRole, minimumRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const minLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= minLevel;
};

const canAccessUser = (requesterRole, targetUserRole, targetUserId, requesterId) => {
  if (requesterId && targetUserId && requesterId.toString() === targetUserId.toString()) {
    return true;
  }

  const requesterLevel = ROLE_HIERARCHY[requesterRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetUserRole] || 0;
  return requesterLevel > targetLevel;
};

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development-secret");

    const user = await Customer.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!hasRole(req.user.role, allowedRoles)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

const requireMinimumRole = (minimumRole) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!hasMinimumRole(req.user.role, minimumRole)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

const resolveRolePermissions = async (roleName) => {
  const roleDoc = await Role.findOne({ name: roleName }).populate("permissions");
  if (!roleDoc) return [];
  return (roleDoc.permissions || []).map((p) =>
    typeof p === "object" ? `${p.module}:${p.action}` : p
  );
};

const checkPermission = async (user, permission) => {
  if (!user) return false;
  if (user.role === ROLES.SUPERADMIN) return true;

  if (permission === "*") return true;

  const roleDoc = await Role.findOne({ name: user.role }).populate("permissions");
  if (!roleDoc || !roleDoc.permissions) return false;

  const permissions = roleDoc.permissions.map((p) =>
    typeof p === "object" ? `${p.module}:${p.action}` : p
  );

  return permissions.includes(permission) || permissions.includes("*");
};

const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      for (const permission of permissions) {
        const granted = await checkPermission(req.user, permission);
        if (granted) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

const requirePermissionByModule = (module, action) => {
  return requirePermission(`${module}:${action}`);
};

const requireOwnershipOrRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const targetId = req.params.id || req.params.userId;
    if (targetId && req.userId.toString() === targetId.toString()) {
      return next();
    }

    if (hasRole(req.user.role, allowedRoles)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  };
};

const getPermissions = (role) => {
  switch (role) {
    case ROLES.SUPERADMIN:
      return ["*"];
    case ROLES.ADMIN:
      return [
        "dashboard:read",
        "products:read",
        "products:write",
        "categories:read",
        "categories:write",
        "orders:read",
        "orders:write",
        "customers:read",
        "customers:write",
        "profile:read",
        "profile:write",
        "settings:read",
        "settings:write",
        "analytics:read",
        "inventory:read",
        "inventory:write",
        "reports:read",
      ];
    case ROLES.CUSTOMER:
    default:
      return [
        "profile:read",
        "profile:write",
        "orders:read:own",
        "cart:read",
        "cart:write",
        "wishlist:read",
        "wishlist:write",
        "products:read",
        "categories:read",
        "reviews:read",
        "reviews:write",
      ];
  }
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  hasRole,
  hasMinimumRole,
  canAccessUser,
  authenticateToken,
  requireRole,
  requireMinimumRole,
  requirePermission,
  requirePermissionByModule,
  requireOwnershipOrRole,
  checkPermission,
  resolveRolePermissions,
  getPermissions,
};
