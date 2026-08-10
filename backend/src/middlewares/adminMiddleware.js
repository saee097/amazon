const { requireRole, ROLES } = require("./roleMiddleware");

const adminMiddleware = requireRole(ROLES.ADMIN, ROLES.SUPERADMIN);

module.exports = adminMiddleware;
