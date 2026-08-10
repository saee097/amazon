const buildCrudController = require("../controllers/crudController");
const { Stock, StockMovement, Inventory, ProductVariant } = require("../models/erdModels");

const buildStockController = () => {
  const crud = buildCrudController(Stock);

  return {
    ...crud,
    async create(req, res, next) {
      try {
        const { product, variant, warehouse, type, quantity, reason, reference } = req.body;

        if (!product || !warehouse || quantity === undefined) {
          return res.status(400).json({
            success: false,
            message: "product, warehouse, and quantity are required",
          });
        }

        const stock = await Stock.create({
          product,
          variant,
          warehouse,
          type: type || "adjustment",
          quantity: Number(quantity),
          reason,
          reference,
        });

        if (variant) {
          const inv = await Inventory.findOneAndUpdate(
            { variant, warehouse },
            { $inc: { quantity: Number(quantity) } },
            { new: true, upsert: true }
          );

          await ProductVariant.findByIdAndUpdate(variant, {
            $inc: { inventory_quantity: Number(quantity) },
          });
        } else {
          const variants = await ProductVariant.find({ product });

          for (const v of variants) {
            await Inventory.findOneAndUpdate(
              { variant: v._id, warehouse },
              { $inc: { quantity: Number(quantity) } },
              { new: true, upsert: true }
            );

            await ProductVariant.findByIdAndUpdate(v._id, {
              $inc: { inventory_quantity: Number(quantity) },
            });
          }
        }

        await StockMovement.create({
          product,
          variant,
          warehouse,
          type: type === "purchase" || type === "return" ? "in" : type === "sale" ? "out" : "adjustment",
          quantity: Number(quantity),
          reason: reason || "Stock adjustment",
          note: reference,
        });

        res.status(201).json({
          success: true,
          data: stock,
        });
      } catch (error) {
        next(error);
      }
    },
  };
};

module.exports = buildStockController;
