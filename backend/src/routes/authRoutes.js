const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.get("/verify-email/:token", authController.verifyEmail);
router.get("/verify", authMiddleware, (req, res) => {
  res.json({ success: true, user: req.customer || req.user });
});
router.get("/profile", authMiddleware, authController.profile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.post("/logout", authMiddleware, authController.logout);
router.post("/delete-account", authMiddleware, async (req, res, next) => {
  try {
    await require("../models/erdModels").Customer.findByIdAndUpdate(req.userId, { is_deleted: true, deleted_at: new Date(), status: "suspended" });
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
