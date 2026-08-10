const { requireRole, ROLES } = require("./roleMiddleware");

const superAdminMiddleware = requireRole(ROLES.SUPERADMIN);

module.exports = superAdminMiddleware;
