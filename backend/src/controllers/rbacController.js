const { Role, Permission, RolePermission } = require("../models/erdModels");

exports.listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().populate("permissions").sort({ name: 1 });
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

exports.createRole = async (req, res, next) => {
  try {
    const { name, description, is_system } = req.body;

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists",
      });
    }

    const role = await Role.create({
      name,
      description,
      is_system: is_system || false,
    });

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

exports.getRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).populate("permissions");
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
    res.json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;

    await role.save();
    res.json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (role.is_system) {
      return res.status(403).json({
        success: false,
        message: "System roles cannot be deleted",
      });
    }

    await RolePermission.deleteMany({ role: role._id });
    await role.deleteOne();

    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.assignPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Permissions array is required",
      });
    }

    for (const permId of permissions) {
      const perm = await Permission.findById(permId);
      if (!perm) continue;

      const exists = await RolePermission.findOne({
        role: role._id,
        permission: perm._id,
      });
      if (!exists) {
        await RolePermission.create({ role: role._id, permission: perm._id });
      }

      if (!role.permissions.includes(perm._id)) {
        role.permissions.push(perm._id);
      }
    }

    await role.save();

    const updated = await Role.findById(role._id).populate("permissions");
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.removePermission = async (req, res, next) => {
  try {
    const { permissionId } = req.params;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    await RolePermission.deleteOne({
      role: role._id,
      permission: permissionId,
    });

    role.permissions = role.permissions.filter(
      (p) => p.toString() !== permissionId
    );
    await role.save();

    const updated = await Role.findById(role._id).populate("permissions");
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.listPermissions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.module) filter.module = req.query.module;
    if (req.query.action) filter.action = req.query.action;

    const permissions = await Permission.find(filter).sort({ module: 1, action: 1 });
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

exports.createPermission = async (req, res, next) => {
  try {
    const { name, module, action, description } = req.body;

    const existing = await Permission.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Permission with this name already exists",
      });
    }

    const permission = await Permission.create({
      name,
      module,
      action,
      description,
    });

    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    next(error);
  }
};

exports.bulkCreatePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Permissions array is required",
      });
    }

    const created = [];
    const errors = [];

    for (const perm of permissions) {
      const name = `${perm.module}:${perm.action}`;
      const existing = await Permission.findOne({ name });
      if (existing) {
        errors.push({ name, message: "Already exists" });
        continue;
      }
      const p = await Permission.create({
        name,
        module: perm.module,
        action: perm.action,
        description: perm.description,
      });
      created.push(p);
    }

    res.status(201).json({
      success: true,
      data: created,
      skipped: errors,
    });
  } catch (error) {
    next(error);
  }
};
