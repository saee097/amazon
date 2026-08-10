const { AuditLog } = require("../models/erdModels");

const buildAuditFilter = (req) => {
  const filter = {};

  if (req.query.user) filter.user = req.query.user;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.module) filter.module = req.query.module;

  if (req.query.startDate || req.query.endDate) {
    filter.created_at = {};
    if (req.query.startDate)
      filter.created_at.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.created_at.$lte = new Date(req.query.endDate);
  }

  return filter;
};

exports.listAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = buildAuditFilter(req);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("user", "first_name last_name email")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate(
      "user",
      "first_name last_name email"
    );
    if (!log) {
      return res.status(404).json({ success: false, message: "Audit log not found" });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

exports.getUserActivity = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { user: req.params.id };
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getModuleActivity = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { module: req.params.module };
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("user", "first_name last_name email")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

exports.exportAuditLogs = async (req, res, next) => {
  try {
    const format = (req.query.format || "json").toLowerCase();
    const filter = buildAuditFilter(req);
    const logs = await AuditLog.find(filter)
      .populate("user", "first_name last_name email")
      .sort({ created_at: -1 });

    if (format === "csv") {
      const headers = [
        "id",
        "user",
        "action",
        "module",
        "entity_type",
        "entity_id",
        "ip",
        "created_at",
      ];
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
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="audit_logs.csv"'
      );
      return res.status(200).send(csv);
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit_logs.json"'
    );
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
