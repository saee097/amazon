const { Customer, Product, Category, Brand, Order, Inventory, Shipment, ReturnRequest, Refund } = require("../models/erdModels");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userRole = req.userRole;
    const isSuperAdmin = userRole === "superadmin";
    const isAdmin = userRole === "admin";

    let customerFilter = {};
    if (isAdmin && !isSuperAdmin) {
      customerFilter = { role: "customer" };
    }

    const [
      totalCustomers,
      totalProducts,
      totalCategories,
      totalBrands,
      totalOrders,
      totalSales,
      totalInventory,
      pendingShipments,
      pendingReturns,
      pendingRefunds,
      totalAdmins,
    ] = await Promise.all([
      Customer.countDocuments(customerFilter),
      Product.countDocuments({ status: "active" }),
      Category.countDocuments(),
      Brand.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total_amount" } } }]),
      Inventory.aggregate([{ $group: { _id: null, total: { $sum: "$quantity" } } }]),
      Shipment.countDocuments({ delivery_status: "pending" }),
      ReturnRequest.countDocuments({ status: "requested" }),
      Refund.countDocuments({ status: "pending" }),
      isSuperAdmin ? Customer.countDocuments({ role: "admin" }) : Promise.resolve(0),
    ]);

    const recentOrders = await Order.find()
      .populate("customer")
      .sort({ created_at: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalProducts,
          totalCategories,
          totalBrands,
          totalOrders,
          totalSales: totalSales[0]?.total || 0,
          totalInventory: totalInventory[0]?.total || 0,
          pendingShipments,
          pendingReturns,
          pendingRefunds,
          totalAdmins,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await require("../models/ActivityLog").ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminStats = async (req, res, next) => {
  try {
    const [
      totalAdmins,
      activeAdmins,
      totalCustomers,
      totalProducts,
      recentAdminActivity,
    ] = await Promise.all([
      Customer.countDocuments({ role: "admin" }),
      Customer.countDocuments({ role: "admin", status: "active" }),
      Customer.countDocuments({ role: "customer" }),
      Product.countDocuments({ status: "active" }),
      require("../models/ActivityLog").ActivityLog.find({
        $or: [
          { "metadata.role": "admin" },
          { "metadata.action": { $regex: "admin", $options: "i" } },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        totalAdmins,
        activeAdmins,
        totalCustomers,
        totalProducts,
        recentAdminActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
