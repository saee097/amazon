const { Customer, AuditLog } = require("../models/erdModels");
const { checkPermission, ROLES } = require("./roleMiddleware");

const checkAccountLockout = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next();

    const user = await Customer.findOne({ email }).select(
      "+locked_until +failed_login_attempts +status"
    );

    if (!user) return next();

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "This account has been blocked",
      });
    }

    if (user.locked_until && user.locked_until > Date.now()) {
      const minutesLeft = Math.ceil((user.locked_until - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed attempts. Try again in ${minutesLeft} minute(s)`,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const logActivity = (action, module) => {
  return async (req, res, next) => {
    try {
      res.on("finish", async () => {
        try {
          if (res.statusCode >= 400) return;

          await AuditLog.create({
            user: req.userId || null,
            action,
            module,
            entity_id: req.params.id || null,
            entity_type: module,
            ip:
              req.ip ||
              req.headers["x-forwarded-for"] ||
              req.connection.remoteAddress,
            user_agent: req.headers["user-agent"],
            metadata: {
              method: req.method,
              path: req.originalUrl,
            },
          });
        } catch (err) {
          console.error("Audit log failed:", err.message);
        }
      });
    } catch (error) {
      console.error("Audit log setup failed:", error.message);
    }

    next();
  };
};

const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const granted = await checkPermission(req.user, permission);
      if (!granted) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const targetId = req.params.id || req.params.userId;
  if (!targetId) {
    return res.status(400).json({
      success: false,
      message: "Resource identifier missing",
    });
  }

  if (req.userId.toString() !== targetId.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own resources",
    });
  }

  next();
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = require("jsonwebtoken").verify(
      token,
      process.env.JWT_SECRET || "development-secret"
    );

    const user = await Customer.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    if (user.role !== ROLES.SUPERADMIN) {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const requireAdminOrSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = require("jsonwebtoken").verify(
      token,
      process.env.JWT_SECRET || "development-secret"
    );

    const user = await Customer.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPERADMIN) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = {
  checkAccountLockout,
  logActivity,
  requirePermission,
  requireOwnership,
  requireSuperAdmin,
  requireAdminOrSuperAdmin,
};
