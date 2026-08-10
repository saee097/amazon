const { body, param, query } = require("express-validator");

const registerValidation = [
  body("firstName")
    .optional()
    .isString()
    .withMessage("First name must be a string"),
  body("first_name")
    .optional()
    .isString()
    .withMessage("First name must be a string"),
  body("lastName").optional().isString().withMessage("Last name must be a string"),
  body("last_name").optional().isString().withMessage("Last name must be a string"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").optional().isString().withMessage("Phone must be a string"),
  body("username").optional().isString().withMessage("Username must be a string"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").exists().withMessage("Password is required"),
  body("remember").optional().isBoolean().withMessage("Remember must be boolean"),
];

const passwordChangeValidation = [
  body("currentPassword")
    .exists()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  body("confirmPassword")
    .optional()
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];

const userUpdateValidation = [
  param("id").isMongoId().withMessage("Valid user id is required"),
  body("first_name").optional().isString(),
  body("last_name").optional().isString(),
  body("email").optional().isEmail().normalizeEmail(),
  body("phone").optional().isString(),
  body("role")
    .optional()
    .isIn(["customer", "admin", "superadmin"])
    .withMessage("Invalid role"),
  body("status")
    .optional()
    .isIn(["active", "blocked", "suspended"])
    .withMessage("Invalid status"),
];

const roleValidation = [
  body("name")
    .exists()
    .withMessage("Role name is required")
    .isString()
    .trim()
    .toLowerCase(),
  body("description").optional().isString(),
  body("is_system").optional().isBoolean(),
];

const permissionValidation = [
  body("name")
    .exists()
    .withMessage("Permission name is required")
    .isString()
    .trim()
    .toLowerCase(),
  body("module").exists().withMessage("Module is required").isString().trim().toLowerCase(),
  body("action").exists().withMessage("Action is required").isString().trim().toLowerCase(),
  body("description").optional().isString(),
];

const bulkPermissionValidation = [
  body("permissions")
    .isArray({ min: 1 })
    .withMessage("Permissions array is required"),
  body("permissions.*.name").exists().withMessage("Permission name is required"),
  body("permissions.*.module").exists().withMessage("Module is required"),
  body("permissions.*.action").exists().withMessage("Action is required"),
];

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = require("express-validator").validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  };
};

module.exports = {
  registerValidation,
  loginValidation,
  passwordChangeValidation,
  userUpdateValidation,
  roleValidation,
  permissionValidation,
  bulkPermissionValidation,
  validate,
};
