const { Customer, Profile, LoginHistory } = require("../models/erdModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const signToken = (customer, expiresIn) =>
  jwt.sign(
    {
      id: customer._id,
      role: customer.role,
    },
    process.env.JWT_SECRET || "development-secret",
    {
      expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "7d",
    }
  );

const getDeviceInfo = (req) => {
  const ua = req.headers["user-agent"] || "";
  const uaParser = (s) => {
    let browser = "unknown";
    let os = "unknown";
    if (/firefox/i.test(s)) browser = "Firefox";
    else if (/edg/i.test(s)) browser = "Edge";
    else if (/chrome/i.test(s)) browser = "Chrome";
    else if (/safari/i.test(s)) browser = "Safari";
    if (/windows/i.test(s)) os = "Windows";
    else if (/mac/i.test(s)) os = "MacOS";
    else if (/android/i.test(s)) os = "Android";
    else if (/linux/i.test(s)) os = "Linux";
    else if (/iphone|ipad/i.test(s)) os = "iOS";
    return { browser, os };
  };
  const parsed = uaParser(ua);
  return {
    ip: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    userAgent: ua,
    browser: parsed.browser,
    os: parsed.os,
    device: /mobile/i.test(ua) ? "mobile" : "desktop",
  };
};

exports.register = async (req, res) => {
  try {
    const {
      firstName,
      first_name,
      lastName,
      last_name,
      email,
      phone,
      password,
      username,
    } = req.body;

    if (!email || !password || !(first_name || firstName) || !(last_name || lastName)) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required",
      });
    }

    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingUsername = username
      ? await Customer.findOne({ username })
      : null;
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const customer = await Customer.create({
      first_name: first_name || firstName,
      last_name: last_name || lastName,
      email,
      phone,
      username,
      password_hash: passwordHash,
      email_verification_token: hashedToken,
    });

    await Profile.create({ user: customer._id });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/auth/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        to: customer.email,
        subject: "Verify your email",
        text: `Use this link to verify your email: ${verifyUrl}`,
        html: `<p>Use this link to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (e) {
      console.error("Verification email failed:", e.message);
    }

    const customerJson = customer.toJSON();
    delete customerJson.password_hash;

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account, then sign in.",
      customer: customerJson,
      emailVerificationRequired: true,
      redirectTo: "/login",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.profile = async (req, res) => {
  res.json({
    success: true,
    customer: req.customer,
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, email } = req.body;
    const customer = await Customer.findById(req.customerId);

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
      customer: customerJson,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const customer = await Customer.findOne({ email }).select(
      "+password_reset_token +password_reset_expires +email_verification_token"
    );

    if (!customer) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    customer.password_reset_token = hashedToken;
    customer.password_reset_expires = Date.now() + 15 * 60 * 1000;
    await customer.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/auth/reset-password/${resetToken}`;

    await sendEmail({
      to: customer.email,
      subject: "Reset your password",
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    res.json({
      success: true,
      message: "Reset link sent to your email",
      resetToken:
        process.env.NODE_ENV === "production" ? undefined : resetToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const customer = await Customer.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: Date.now() },
    }).select("+password_hash +password_reset_token +password_reset_expires");

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or expired",
      });
    }

    customer.password_hash = await bcrypt.hash(password, 10);
    customer.password_reset_token = undefined;
    customer.password_reset_expires = undefined;
    customer.failed_login_attempts = 0;
    customer.locked_until = undefined;
    await customer.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    const customer = await Customer.findOne({ email }).select(
      "+password_hash +failed_login_attempts +locked_until +status"
    );

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (customer.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "This account has been blocked",
      });
    }

    if (customer.locked_until && customer.locked_until > Date.now()) {
      const minutesLeft = Math.ceil((customer.locked_until - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${minutesLeft} minute(s)`,
      });
    }

    const passwordMatches = await bcrypt.compare(password, customer.password_hash);

    if (!passwordMatches) {
      customer.failed_login_attempts = (customer.failed_login_attempts || 0) + 1;

      if (customer.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
        customer.locked_until = Date.now() + LOCK_DURATION_MINUTES * 60 * 1000;
        customer.failed_login_attempts = 0;
      }
      await customer.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    customer.failed_login_attempts = 0;
    customer.locked_until = undefined;
    customer.last_login = new Date();
    customer.last_activity = new Date();
    await customer.save({ validateBeforeSave: false });

    const deviceInfo = getDeviceInfo(req);
    await LoginHistory.create({
      user: customer._id,
      ...deviceInfo,
      is_successful: true,
    });

    const expiresIn = remember ? "30d" : process.env.JWT_EXPIRES_IN || "7d";

    const customerJson = customer.toJSON();
    delete customerJson.password_hash;

    res.json({
      success: true,
      token: signToken(customer, expiresIn),
      customer: customerJson,
      email_verified: customer.email_verified,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.userId) {
      await LoginHistory.findOneAndUpdate(
        { user: req.userId, logout_time: null },
        { logout_time: new Date() },
        { sort: { login_time: -1 } }
      );
    }
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const customer = await Customer.findOne({
      email_verification_token: hashedToken,
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    customer.email_verified = true;
    customer.email_verified_at = new Date();
    customer.email_verification_token = undefined;
    await customer.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const customer = await Customer.findOne({ email }).select(
      "+email_verification_token"
    );

    if (!customer) {
      return res.json({
        success: true,
        message: "If that email exists, a verification link has been sent",
      });
    }

    if (customer.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    customer.email_verification_token = hashedToken;
    await customer.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/auth/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        to: customer.email,
        subject: "Verify your email",
        text: `Use this link to verify your email: ${verifyUrl}`,
        html: `<p>Use this link to verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (e) {
      console.error("Verification email failed:", e.message);
    }

    res.json({
      success: true,
      message: "Verification link sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token =
      req.body.token ||
      req.body.refreshToken ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "development-secret"
    );

    const customer = await Customer.findById(decoded.id).select("+status");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    if (customer.status === "blocked" || customer.is_deleted) {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    const newToken = signToken(customer);

    res.json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
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

    const customer = await Customer.findById(req.userId || req.customerId).select(
      "+password_hash"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const bcryptLib = require("bcryptjs");
    const passwordMatches = await bcryptLib.compare(
      currentPassword,
      customer.password_hash
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    customer.password_hash = await bcryptLib.hash(newPassword, 10);
    customer.failed_login_attempts = 0;
    customer.locked_until = undefined;
    await customer.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getLoginHistory = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { user: req.userId };
    const [history, total] = await Promise.all([
      LoginHistory.find(filter)
        .sort({ login_time: -1 })
        .skip(skip)
        .limit(limit),
      LoginHistory.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: history,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await LoginHistory.find({
      user: req.userId,
      logout_time: null,
    }).sort({ login_time: -1 });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

exports.logoutAllDevices = async (req, res, next) => {
  try {
    await LoginHistory.updateMany(
      { user: req.userId, logout_time: null },
      { logout_time: new Date() }
    );

    res.json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    next(error);
  }
};
