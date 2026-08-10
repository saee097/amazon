const buildCrudController = (Model, options = {}) => {
  const populate = options.populate || [];

  const applyPopulate = (query) =>
    populate.reduce((currentQuery, field) => currentQuery.populate(field), query);

  return {
    async list(req, res, next) {
      try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;
        const filter = options.filter ? options.filter(req) : {};

        const [items, total] = await Promise.all([
          applyPopulate(Model.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit)),
          Model.countDocuments(filter),
        ]);

        res.json({
          success: true,
          data: items,
          meta: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        next(error);
      }
    },

    async get(req, res, next) {
      try {
        const item = await applyPopulate(Model.findById(req.params.id));

        if (!item) {
          return res.status(404).json({
            success: false,
            message: `${Model.modelName} not found`,
          });
        }

        res.json({
          success: true,
          data: item,
        });
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        const item = await Model.create(req.body);

        res.status(201).json({
          success: true,
          data: item,
        });
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });

        if (!item) {
          return res.status(404).json({
            success: false,
            message: `${Model.modelName} not found`,
          });
        }

        res.json({
          success: true,
          data: item,
        });
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const item = await Model.findByIdAndDelete(req.params.id);

        if (!item) {
          return res.status(404).json({
            success: false,
            message: `${Model.modelName} not found`,
          });
        }

        res.json({
          success: true,
          message: `${Model.modelName} deleted`,
        });
      } catch (error) {
        next(error);
      }
    },
  };
};

module.exports = buildCrudController;
