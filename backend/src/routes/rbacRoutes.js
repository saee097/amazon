const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const rbacController = require("../controllers/rbacController");
const profileController = require("../controllers/profileController");
const auditController = require("../controllers/auditController");
const settingsController = require("../controllers/settingsController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const superAdminMiddleware = require("../middlewares/superAdminMiddleware");
const rbacMiddleware = require("../middlewares/rbacMiddleware");
const validation = require("../middlewares/validationMiddleware");
const { requireRole, ROLES, canAccessUser } = require("../middlewares/roleMiddleware");
const { Customer, Profile } = require("../models/erdModels");
const crypto = require("crypto");

function generateDefaultPassword() {
  return "Default@" + crypto.randomBytes(4).toString("hex");
}

router.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }
  next(err);
});

// ---------- AUTH ROUTES ----------
router.post("/auth/register", validation.validate(validation.registerValidation), authController.register);
router.post("/auth/login", validation.validate(validation.loginValidation), rbacMiddleware.checkAccountLockout, authController.login);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/logout", authMiddleware, authController.logout);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password/:token", authController.resetPassword);
router.post("/auth/verify-email/:token", authController.verifyEmail);
router.post("/auth/resend-verification", authController.resendVerification);
router.post("/auth/change-password", authMiddleware, validation.validate(validation.passwordChangeValidation), authController.changePassword);
router.get("/auth/login-history", authMiddleware, authController.getLoginHistory);
router.get("/auth/active-sessions", authMiddleware, authController.getActiveSessions);
router.post("/auth/logout-all", authMiddleware, authController.logoutAllDevices);

// ---------- USER ROUTES (admin + superadmin scope) ----------
router.get("/users", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), userController.listUsers);
router.get("/users/:id", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), userController.getUser);
router.put("/users/:id", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), validation.validate(validation.userUpdateValidation), userController.updateUser);
router.delete("/users/:id", authMiddleware, superAdminMiddleware, userController.deleteUser);

router.post("/users/:id/suspend", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { status: "suspended" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.post("/users/:id/activate", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { status: "active" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.post("/users/:id/block", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { status: "blocked" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.post("/users/:id/unblock", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { status: "active" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.post("/users/:id/verify", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { email_verified: true, email_verified_at: new Date() }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.post("/users/:id/restore", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { is_deleted: false, deleted_at: undefined, status: "active" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.post("/users/:id/export", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const user = await Customer.findById(req.params.id).select("-password_hash -password_reset_token -password_reset_expires");
    const profile = await Profile.findOne({ user: req.params.id });
    res.json({ success: true, data: { user, profile } });
  } catch (e) { next(e); }
});

router.post("/users/import", authMiddleware, superAdminMiddleware, async (req, res, next) => {
  try {
    const users = req.body.users;
    if (!Array.isArray(users)) {
      return res.status(400).json({ success: false, message: "Users array required" });
    }
    const created = [];
    for (const u of users) {
      const existing = await Customer.findOne({ email: u.email });
      if (existing) continue;
      const passwordHash = await require("bcryptjs").hash(u.password || generateDefaultPassword(), 10);
      const user = await Customer.create({
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone,
        password_hash: passwordHash,
        role: u.role || ROLES.CUSTOMER,
        status: u.status || "active",
      });
      await Profile.create({ user: user._id });
      created.push(user);
    }
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

router.post("/users/:id/reset-password", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const user = await Customer.findById(req.params.id).select("+password_hash");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.password_hash = await require("bcryptjs").hash(req.body.password || generateDefaultPassword(), 10);
    user.failed_login_attempts = 0;
    user.locked_until = undefined;
    await user.save();
    res.json({ success: true, message: "Password reset successfully" });
  } catch (e) { next(e); }
});

router.post("/users/:id/send-notification", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    const Notification = require("../models/erdModels").Notification;
    const notification = await Notification.create({ title, message, type: type || "info", recipient: req.params.id });
    res.status(201).json({ success: true, data: notification });
  } catch (e) { next(e); }
});

router.post("/users/:id/tags", authMiddleware, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res, next) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ success: false, message: "Tags array required" });
    const user = await Customer.findByIdAndUpdate(req.params.id, { $addToSet: { tags: { $each: tags } } }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user.tags });
  } catch (e) { next(e); }
});

// ---------- PROFILE ROUTES ----------
router.get("/profile", authMiddleware, profileController.getMyProfile);
router.put("/profile", authMiddleware, profileController.updateMyProfile);
router.post("/profile/avatar", authMiddleware, profileController.updateAvatar);
router.delete("/profile/avatar", authMiddleware, profileController.deleteAvatar);
router.post("/profile/cover-image", authMiddleware, profileController.updateCoverImage);
router.put("/profile/security", authMiddleware, profileController.updateSecuritySettings);
router.post("/profile/2fa/enable", authMiddleware, profileController.enable2FA);
router.post("/profile/2fa/disable", authMiddleware, profileController.disable2FA);
router.get("/profile/trusted-devices", authMiddleware, profileController.getTrustedDevices);
router.post("/profile/trusted-devices", authMiddleware, profileController.addTrustedDevice);
router.delete("/profile/trusted-devices/:id", authMiddleware, profileController.removeTrustedDevice);
router.get("/profile/notifications", authMiddleware, profileController.getNotificationSettings);
router.put("/profile/notifications", authMiddleware, profileController.updateNotificationSettings);
router.get("/profile/privacy", authMiddleware, profileController.getPrivacySettings);
router.put("/profile/privacy", authMiddleware, profileController.updatePrivacySettings);
router.post("/profile/request-deletion", authMiddleware, profileController.requestAccountDeletion);
router.get("/profile/download-data", authMiddleware, profileController.downloadAccountData);

// ---------- ADMIN ROUTES ----------
router.get("/admin/users", adminMiddleware, userController.listUsers);
router.get("/admin/users/:id", adminMiddleware, userController.getUser);
router.put("/admin/users/:id", adminMiddleware, validation.validate(validation.userUpdateValidation), userController.updateUser);
router.delete("/admin/users/:id", superAdminMiddleware, userController.deleteUser);
router.post("/admin/users/:id/suspend", adminMiddleware, async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { status: "suspended" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});
router.post("/admin/users/:id/activate", adminMiddleware, async (req, res, next) => {
  try {
    const user = await Customer.findByIdAndUpdate(req.params.id, { status: "active" }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});
router.post("/admin/users/:id/reset-password", superAdminMiddleware, async (req, res, next) => {
  try {
    const user = await Customer.findById(req.params.id).select("+password_hash");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.password_hash = await require("bcryptjs").hash(req.body.password || "defaultPassword123", 10);
    await user.save();
    res.json({ success: true, message: "Password reset successfully" });
  } catch (e) { next(e); }
});
router.get("/admin/dashboard", adminMiddleware, (req, res) => {
  res.json({ success: true, message: "Admin dashboard data", data: {} });
});

// ---------- SUPERADMIN ROUTES ----------
router.get("/superadmin/users", superAdminMiddleware, userController.listUsers);
router.get("/superadmin/admins", superAdminMiddleware, async (req, res, next) => {
  try {
    const admins = await Customer.find({ role: ROLES.ADMIN });
    res.json({ success: true, data: admins });
  } catch (e) { next(e); }
});
router.post("/superadmin/admins", superAdminMiddleware, async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;
    const existing = await Customer.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already exists" });
    const passwordHash = await require("bcryptjs").hash(password || "defaultPassword123", 10);
    const admin = await Customer.create({ first_name, last_name, email, phone, password_hash: passwordHash, role: ROLES.ADMIN });
    const adminJson = admin.toJSON();
    delete adminJson.password_hash;
    res.status(201).json({ success: true, data: adminJson });
  } catch (e) { next(e); }
});
router.put("/superadmin/admins/:id", superAdminMiddleware, async (req, res, next) => {
  try {
    const admin = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    res.json({ success: true, data: admin });
  } catch (e) { next(e); }
});
router.delete("/superadmin/admins/:id", superAdminMiddleware, async (req, res, next) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Admin deleted" });
  } catch (e) { next(e); }
});
router.post("/superadmin/admins/:id/promote", superAdminMiddleware, async (req, res, next) => {
  try {
    const admin = await Customer.findByIdAndUpdate(req.params.id, { role: ROLES.SUPERADMIN }, { new: true });
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
    res.json({ success: true, data: admin });
  } catch (e) { next(e); }
});

// Roles
router.get("/superadmin/roles", superAdminMiddleware, rbacController.listRoles);
router.post("/superadmin/roles", superAdminMiddleware, validation.validate(validation.roleValidation), rbacController.createRole);
router.put("/superadmin/roles/:id", superAdminMiddleware, validation.validate(validation.roleValidation), rbacController.updateRole);
router.delete("/superadmin/roles/:id", superAdminMiddleware, rbacController.deleteRole);
router.post("/superadmin/roles/:id/permissions", superAdminMiddleware, rbacController.assignPermissions);
router.delete("/superadmin/roles/:id/permissions/:permissionId", superAdminMiddleware, rbacController.removePermission);

// Permissions
router.get("/superadmin/permissions", superAdminMiddleware, rbacController.listPermissions);
router.post("/superadmin/permissions", superAdminMiddleware, validation.validate(validation.permissionValidation), rbacController.createPermission);

// Settings
router.get("/superadmin/settings", superAdminMiddleware, settingsController.getSettings);
router.put("/superadmin/settings", superAdminMiddleware, settingsController.updateSettings);
router.get("/superadmin/audit-logs", superAdminMiddleware, auditController.listAuditLogs);
router.get("/superadmin/audit-logs/:id", superAdminMiddleware, auditController.getAuditLog);
router.get("/superadmin/login-history", superAdminMiddleware, async (req, res, next) => {
  try {
    const { LoginHistory } = require("../models/erdModels");
    const history = await LoginHistory.find().sort({ login_time: -1 }).limit(100);
    res.json({ success: true, data: history });
  } catch (e) { next(e); }
});

module.exports = router;
