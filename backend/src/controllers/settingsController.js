const { Settings, SecuritySetting, EmailTemplate } = require("../models/erdModels");

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { store_name, support_email, currency, maintenance_mode } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    if (store_name !== undefined) settings.store_name = store_name;
    if (support_email !== undefined) settings.support_email = support_email;
    if (currency !== undefined) settings.currency = currency;
    if (maintenance_mode !== undefined) settings.maintenance_mode = maintenance_mode;

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.getSecuritySettings = async (req, res, next) => {
  try {
    const settings = await SecuritySetting.find().sort({ key: 1 });
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSecuritySettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: "Settings array is required",
      });
    }

    const updated = [];
    for (const s of settings) {
      const doc = await SecuritySetting.findOneAndUpdate(
        { key: s.key },
        { value: s.value, description: s.description },
        { new: true, upsert: true }
      );
      updated.push(doc);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleMaintenanceMode = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.maintenance_mode = !settings.maintenance_mode;
    await settings.save();

    res.json({
      success: true,
      data: { maintenance_mode: settings.maintenance_mode },
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmailTemplates = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find().sort({ template_name: 1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

exports.updateEmailTemplate = async (req, res, next) => {
  try {
    const { template_name, subject, body } = req.body;
    const template = await EmailTemplate.findOneAndUpdate(
      { template_name },
      { subject, body },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

exports.getNotificationTemplates = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find({
      template_name: /notification/i,
    }).sort({ template_name: 1 });

    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};
