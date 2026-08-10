const express = require("express");
const buildCrudController = require("../controllers/crudController");

const buildResourceRouter = (Model, options = {}) => {
  const router = express.Router();
  const controller = buildCrudController(Model, options);

  router.route("/").get(controller.list).post(controller.create);
  router.route("/:id").get(controller.get).put(controller.update).patch(controller.update).delete(controller.remove);

  return router;
};

module.exports = buildResourceRouter;
