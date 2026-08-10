const express = require("express");
const jwt = require("jsonwebtoken");
const { Customer } = require("../models/erdModels");
const flow = require("../controllers/customerFlowController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    const customer = await Customer.findById(decoded.id);

    if (customer) {
      req.customer = customer;
      req.customerId = customer._id;
    }
  } catch (error) {
  }

  next();
};

router.get("/categories", optionalAuth, flow.listCategories);
router.get("/products", optionalAuth, flow.listProducts);
router.get("/products/:id", optionalAuth, flow.getProduct);
router.get("/activity", authMiddleware, flow.getCustomerActivity);
router.get("/wishlist", authMiddleware, flow.getWishlist);
router.post("/wishlist", authMiddleware, flow.addWishlist);
router.get("/cart", authMiddleware, flow.getCart);
router.post("/cart", authMiddleware, flow.addCart);
router.post("/checkout", authMiddleware, flow.checkout);
router.get("/orders", authMiddleware, flow.getOrders);
router.patch("/orders/:orderId/delivered", authMiddleware, flow.markDelivered);
router.post("/reviews", authMiddleware, flow.createReview);
router.post("/returns", authMiddleware, flow.requestReturn);
router.get("/returns", authMiddleware, flow.getReturnRequests);
router.post("/refunds", authMiddleware, flow.createRefund);
router.get("/refunds", authMiddleware, flow.getRefunds);

module.exports = router;
