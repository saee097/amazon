const { Customer, Profile } = require("../models/erdModels");
const crypto = require("crypto");

const getProfile = async (userId) => {
  let profile = await Profile.findOne({ user: userId });
  if (!profile) {
    profile = await Profile.create({ user: userId });
  }
  return profile;
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await Customer.findById(req.userId).select(
      "-password_hash -password_reset_token -password_reset_expires -email_verification_token -two_factor_secret -two_factor_recovery_codes"
    );
    const profile = await getProfile(req.userId);

    res.json({
      success: true,
      data: { user, profile },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      email,
      bio,
      avatar,
      cover_image,
    } = req.body;

    const customer = await Customer.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email && email !== customer.email) {
      const existing = await Customer.findOne({
        email,
        _id: { $ne: customer._id },
      });
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
    if (bio !== undefined) customer.bio = bio;
    if (avatar !== undefined) customer.avatar = avatar;
    if (cover_image !== undefined) customer.cover_image = cover_image;

    await customer.save();

    const profileData = req.body.profile || {};
    const profile = await getProfile(req.userId);
    const allowedProfileFields = [
      "gender",
      "dob",
      "address",
      "city",
      "state",
      "country",
      "zip",
      "website",
      "linkedin",
      "github",
      "twitter",
      "facebook",
      "company",
      "department",
      "position",
      "skills",
      "experience",
      "language",
      "timezone",
      "theme",
    ];
    allowedProfileFields.forEach((f) => {
      if (profileData[f] !== undefined) profile[f] = profileData[f];
    });
    await profile.save();

    res.json({ success: true, data: { user: customer, profile } });
  } catch (error) {
    next(error);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: "Avatar URL is required",
      });
    }
    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      { avatar },
      { new: true }
    );
    res.json({ success: true, data: { avatar: customer.avatar } });
  } catch (error) {
    next(error);
  }
};

exports.deleteAvatar = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      { avatar: undefined },
      { new: true }
    );
    res.json({ success: true, data: { avatar: customer.avatar } });
  } catch (error) {
    next(error);
  }
};

exports.updateCoverImage = async (req, res, next) => {
  try {
    const { cover_image } = req.body;
    if (!cover_image) {
      return res.status(400).json({
        success: false,
        message: "Cover image URL is required",
      });
    }
    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      { cover_image },
      { new: true }
    );
    res.json({ success: true, data: { cover_image: customer.cover_image } });
  } catch (error) {
    next(error);
  }
};

exports.updateSecuritySettings = async (req, res, next) => {
  try {
    const { recovery_email, recovery_phone } = req.body;
    const profile = await getProfile(req.userId);

    profile.notification_preferences = {
      ...(profile.notification_preferences || {}),
      recovery_email,
      recovery_phone,
    };
    await profile.save();

    res.json({ success: true, data: profile.notification_preferences });
  } catch (error) {
    next(error);
  }
};

exports.enable2FA = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.userId).select(
      "+two_factor_secret +two_factor_recovery_codes"
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const secret = crypto.randomBytes(20).toString("hex");
    const recoveryCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(6).toString("hex")
    );

    customer.two_factor_secret = secret;
    customer.two_factor_recovery_codes = recoveryCodes;
    customer.two_factor_enabled = true;
    await customer.save();

    res.json({
      success: true,
      data: {
        secret,
        recoveryCodes,
        message: "2FA enabled. Store recovery codes safely.",
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.disable2FA = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.userId).select(
      "+two_factor_secret +two_factor_recovery_codes"
    );

    customer.two_factor_enabled = false;
    customer.two_factor_secret = undefined;
    customer.two_factor_recovery_codes = undefined;
    await customer.save();

    res.json({ success: true, message: "2FA disabled" });
  } catch (error) {
    next(error);
  }
};

exports.getTrustedDevices = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.userId);
    res.json({ success: true, data: customer.trusted_devices || [] });
  } catch (error) {
    next(error);
  }
};

exports.addTrustedDevice = async (req, res, next) => {
  try {
    const { device, browser, os, ip } = req.body;
    const customer = await Customer.findById(req.userId);

    customer.trusted_devices.push({
      device,
      browser,
      os,
      ip,
      last_used: new Date(),
    });
    await customer.save();

    res.status(201).json({ success: true, data: customer.trusted_devices });
  } catch (error) {
    next(error);
  }
};

exports.removeTrustedDevice = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.userId);
    customer.trusted_devices = customer.trusted_devices.filter(
      (d) => d._id.toString() !== req.params.id
    );
    await customer.save();

    res.json({ success: true, data: customer.trusted_devices });
  } catch (error) {
    next(error);
  }
};

exports.getNotificationSettings = async (req, res, next) => {
  try {
    const profile = await getProfile(req.userId);
    res.json({
      success: true,
      data: profile.notification_preferences || {},
    });
  } catch (error) {
    next(error);
  }
};

exports.updateNotificationSettings = async (req, res, next) => {
  try {
    const profile = await getProfile(req.userId);
    profile.notification_preferences = {
      ...(profile.notification_preferences || {}),
      ...req.body,
    };
    await profile.save();

    res.json({ success: true, data: profile.notification_preferences });
  } catch (error) {
    next(error);
  }
};

exports.getPrivacySettings = async (req, res, next) => {
  try {
    const profile = await getProfile(req.userId);
    res.json({ success: true, data: profile.privacy_settings || {} });
  } catch (error) {
    next(error);
  }
};

exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const profile = await getProfile(req.userId);
    profile.privacy_settings = {
      ...(profile.privacy_settings || {}),
      ...req.body,
    };
    await profile.save();

    res.json({ success: true, data: profile.privacy_settings });
  } catch (error) {
    next(error);
  }
};

exports.requestAccountDeletion = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.userId,
      { status: "suspended", deleted_at: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: "Account deletion requested. Contact support to complete.",
      data: { status: customer.status },
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadAccountData = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.userId).select(
      "-password_hash -password_reset_token -password_reset_expires -email_verification_token -two_factor_secret -two_factor_recovery_codes"
    );
    const profile = await getProfile(req.userId);

    const exportData = {
      user: customer,
      profile,
      exported_at: new Date(),
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    next(error);
  }
};
