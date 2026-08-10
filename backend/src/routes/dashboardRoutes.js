const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.get("/stats", adminMiddleware, dashboardController.getDashboardStats);
router.get("/activity", adminMiddleware, dashboardController.getActivityLogs);
router.get("/admin-stats", adminMiddleware, dashboardController.getAdminStats);

module.exports = router;
