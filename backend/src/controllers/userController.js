const { Customer } = require("../models/erdModels");
const { canAccessUser, ROLES } = require("../middlewares/roleMiddleware");

const buildUserFilter = (requesterRole) => {
  if (requesterRole === ROLES.SUPERADMIN) {
    return {};
  }
  return { role: ROLES.CUSTOMER };
};

const validateRoleAssignment = (requesterRole, targetRole) => {
  if (requesterRole === ROLES.SUPERADMIN) {
    return true;
  }
  if (requesterRole === ROLES.ADMIN) {
    return targetRole === ROLES.CUSTOMER;
  }
  return false;
};

exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const filter = buildUserFilter(req.userRole);

    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      Customer.find(filter)
        .select("-password_hash -password_reset_token -password_reset_expires")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await Customer.findById(req.params.id)
      .select("-password_hash -password_reset_token -password_reset_expires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!canAccessUser(req.userRole, user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this user",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password, role, status } = req.body;

    if (!validateRoleAssignment(req.userRole, role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to assign this role",
      });
    }

    const existingUser = await Customer.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const passwordHash = await require("bcryptjs").hash(password || "defaultPassword123", 10);

    const user = await Customer.create({
      first_name,
      last_name,
      email,
      phone,
      password_hash: passwordHash,
      role: role || ROLES.CUSTOMER,
      status: status || "active",
    });

    const userJson = user.toJSON();
    delete userJson.password_hash;

    res.status(201).json({
      success: true,
      data: userJson,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await Customer.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!canAccessUser(req.userRole, user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this user",
      });
    }

    const { first_name, last_name, email, phone, role, status } = req.body;

    if (role && !validateRoleAssignment(req.userRole, role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to assign this role",
      });
    }

    if (email && email !== user.email) {
      const existing = await Customer.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        });
      }
      user.email = email;
    }

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    const userJson = user.toJSON();
    delete userJson.password_hash;

    res.json({
      success: true,
      data: userJson,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await Customer.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!canAccessUser(req.userRole, user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this user",
      });
    }

    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyProfile = async (req, res) => {
  const user = await Customer.findById(req.userId)
    .select("-password_hash -password_reset_token -password_reset_expires");

  res.json({
    success: true,
    data: user,
  });
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, email } = req.body;
    const customer = await Customer.findById(req.userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (email && email !== customer.email) {
      const existing = await Customer.findOne({ email, _id: { $ne: customer._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        });
      }
      customer.email = email;
    }

    if (first_name) customer.first_name = first_name;
    if (last_name) customer.last_name = last_name;
    if (phone !== undefined) customer.phone = phone;

    await customer.save();

    const customerJson = customer.toJSON();
    delete customerJson.password_hash;

    res.json({
      success: true,
      data: customerJson,
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const customer = await Customer.findById(req.userId).select("+password_hash");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const bcrypt = require("bcryptjs");
    const passwordMatches = await bcrypt.compare(currentPassword, customer.password_hash);

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    customer.password_hash = await bcrypt.hash(newPassword, 10);
    await customer.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
