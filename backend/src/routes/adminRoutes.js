const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middlewares/adminMiddleware");
const superAdminMiddleware = require("../middlewares/superAdminMiddleware");
const buildResourceRouter = require("./resourceRoutes");
const userController = require("../controllers/userController");
const auditController = require("../controllers/auditController");
const models = require("../models/erdModels");

router.use(adminMiddleware);

router.get("/users", userController.listUsers);
router.get("/users/:id", userController.getUser);
router.post("/users", superAdminMiddleware, userController.createUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

router.post("/users/bulk", async (req, res, next) => {
  try {
    const { userIds, action } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "User IDs array is required" });
    }
    if (!action) {
      return res.status(400).json({ success: false, message: "Action is required" });
    }

    let update = {};
    switch (action) {
      case "suspend":
        update = { status: "suspended" };
        break;
      case "activate":
        update = { status: "active" };
        break;
      case "block":
        update = { status: "blocked" };
        break;
      case "unblock":
        update = { status: "active" };
        break;
      case "delete":
        await models.Customer.deleteMany({ _id: { $in: userIds } });
        return res.json({ success: true, message: "Users deleted successfully" });
      default:
        return res.status(400).json({ success: false, message: "Invalid action" });
    }

    await models.Customer.updateMany({ _id: { $in: userIds } }, update);
    res.json({ success: true, message: `Users ${action}ed successfully` });
  } catch (e) {
    next(e);
  }
});

router.get("/profile/me", userController.getMyProfile);
router.put("/profile/me", userController.updateMyProfile);
router.post("/profile/change-password", userController.changePassword);

router.get("/logs", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.action) filter.action = new RegExp(req.query.action, "i");
    if (req.query.module) filter.module = new RegExp(req.query.module, "i");
    if (req.query.startDate || req.query.endDate) {
      filter.created_at = {};
      if (req.query.startDate) filter.created_at.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.created_at.$lte = new Date(req.query.endDate);
    }

    const [logs, total] = await Promise.all([
      models.AuditLog.find(filter)
        .populate("user", "first_name last_name email")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      models.AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/logs/export", async (req, res, next) => {
  try {
    const format = (req.query.format || "json").toLowerCase();
    const logs = await models.AuditLog.find()
      .populate("user", "first_name last_name email")
      .sort({ created_at: -1 })
      .limit(1000);

    if (format === "csv") {
      const headers = ["id", "user", "action", "module", "entity_type", "entity_id", "ip", "created_at"];
      const rows = logs.map((l) =>
        [
          l._id,
          l.user ? l.user.email : "",
          l.action,
          l.module,
          l.entity_type,
          l.entity_id,
          l.ip,
          l.created_at,
        ]
          .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="audit_logs.csv"');
      return res.status(200).send(csv);
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="audit_logs.json"');
    res.status(200).json({ success: true, data: logs });
  } catch (e) {
    next(e);
  }
});

router.get("/system/health", async (req, res) => {
  const mongoose = require("mongoose");
  const os = require("os");
  const memUsage = process.memoryUsage();
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + "MB",
    },
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    platform: os.platform(),
    nodeVersion: process.version,
    timestamp: new Date(),
  });
});

const resources = [
  ["/categories", models.Category, ["parent_category"]],
  ["/brands", models.Brand],
  ["/products", models.Product, ["category", "brand"]],
  ["/variants", models.ProductVariant, ["product"]],
  ["/product-images", models.ProductImage, ["product"]],
  ["/warehouses", models.Warehouse],
  ["/inventory", models.Inventory, ["variant", "warehouse"]],
  ["/stock", models.Stock, ["product", "variant", "warehouse"]],
  ["/orders", models.Order, ["customer", "address", "coupon"]],
  ["/payments", models.Payment, ["order"]],
  ["/shipments", models.Shipment, ["order"]],
  ["/returns", models.ReturnRequest, ["order"]],
  ["/refunds", models.Refund, ["order"]],
  ["/reviews", models.Review, ["customer", "product"]],
  ["/coupons", models.Coupon],
  ["/blogs", models.Blog],
  ["/faqs", models.FAQ],
  ["/banners", models.Banner],
  ["/menus", models.Menu],
  ["/newsletter", models.NewsletterSubscriber],
  ["/collections", models.Collection],
  ["/customers", models.Customer],
  ["/notifications", models.Notification],
  ["/support", models.SupportTicket],
  ["/vendors", models.Vendor],
  ["/security", models.SecuritySetting],
  ["/settings", models.Settings],
];

resources.forEach(([path, Model, populate]) => {
  router.use(path, buildResourceRouter(Model, { populate }));
});

const superAdminResources = [
  ["/admins", models.Customer],
];

superAdminResources.forEach(([path, Model, populate]) => {
  router.use(
    path,
    superAdminMiddleware,
    buildResourceRouter(Model, { populate })
  );
});

module.exports = router;
