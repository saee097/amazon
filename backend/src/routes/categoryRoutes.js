const express = require("express");
const router = express.Router();
const buildResourceRouter = require("./resourceRoutes");
const models = require("../models/erdModels");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.use(adminMiddleware);

router.use("/", buildResourceRouter(models.Category, { populate: ["parent_category"] }));

module.exports = router;