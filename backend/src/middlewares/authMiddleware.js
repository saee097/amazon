const { authenticateToken } = require("./roleMiddleware");
const { Customer, Profile } = require("../models/erdModels");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = require("jsonwebtoken").verify(
      token,
      process.env.JWT_SECRET || "development-secret"
    );

    const customer = await Customer.findById(decoded.id)
      .populate("role_ref")
      .populate("profile");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer no longer exists",
      });
    }

    if (customer.is_deleted) {
      return res.status(401).json({
        success: false,
        message: "Account has been deleted",
      });
    }

    req.customer = customer;
    req.user = customer;
    req.userId = customer._id;
    req.userRole = customer.role;

    Customer.findByIdAndUpdate(
      customer._id,
      { last_activity: new Date() },
      { validateBeforeSave: false }
    ).exec().catch(() => {});

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;
module.exports.authenticateToken = authenticateToken;
module.exports.User = Customer;
