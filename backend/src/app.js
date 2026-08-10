const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const buildResourceRouter = require("./routes/resourceRoutes");
const models = require("./models/erdModels");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
    resources: Object.keys(models),
    roles: ["customer", "admin", "superadmin"],
  });
});

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/rbac", require("./routes/rbacRoutes"));

app.use("/api/store", require("./routes/customerFlowRoutes"));

app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/brands", require("./routes/brandRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

app.use("/api/admin", require("./routes/adminRoutes"));

const publicResources = [
  ["/api/customers", models.Customer],
  ["/api/address", models.Address, ["customer"]],
  ["/api/variants", models.ProductVariant, ["product"]],
  ["/api/product-images", models.ProductImage, ["product"]],
  ["/api/warehouses", models.Warehouse],
  ["/api/inventory", models.Inventory, ["variant", "warehouse"]],
  ["/api/stock", models.Stock, ["product", "variant", "warehouse"]],
  ["/api/cart", models.Cart, ["customer"]],
  ["/api/wishlist", models.Wishlist, ["customer"]],
  ["/api/orders", models.Order, ["customer", "address", "coupon"]],
  ["/api/payments", models.Payment, ["order"]],
  ["/api/shipments", models.Shipment, ["order", "shipping_method"]],
  ["/api/returns", models.ReturnRequest, ["order"]],
  ["/api/refunds", models.Refund, ["order"]],
  ["/api/reviews", models.Review, ["customer", "product"]],
  ["/api/recently-viewed", models.RecentlyViewed, ["customer", "product"]],
  ["/api/search-history", models.SearchHistory, ["customer"]],
  ["/api/coupons", models.Coupon],
  ["/api/blogs", models.Blog],
  ["/api/faqs", models.FAQ],
  ["/api/banners", models.Banner],
  ["/api/menus", models.Menu],
  ["/api/menu-items", models.MenuItem, ["menu"]],
  ["/api/newsletter", models.NewsletterSubscriber],
  ["/api/activity-logs", models.ActivityLog, ["user"]],
];

publicResources.forEach(([path, Model, populate]) => {
  app.use(path, buildResourceRouter(Model, { populate }));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  const statusCode = error.name === "ValidationError" ? 400 : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message,
  });
});

module.exports = app;
