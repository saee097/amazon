const express = require("express");
const router = express.Router();
const buildStockController = require("../controllers/stockController");
const { Stock } = require("../models/erdModels");

const controller = buildStockController();

router.route("/").get(controller.list).post(controller.create);
router.route("/:id").get(controller.get).put(controller.update).patch(controller.update).delete(controller.remove);

module.exports = router;
