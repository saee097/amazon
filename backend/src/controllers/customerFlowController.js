const mongoose = require("mongoose");
const {
  Address,
  Banner,
  Brand,
  Cart,
  CartItem,
  Category,
  Collection,
  CollectionProduct,
  Coupon,
  Inventory,
  Menu,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductImage,
  ProductVariant,
  RecentlyViewed,
  Refund,
  ReturnRequest,
  Review,
  SearchHistory,
  Shipment,
  ShippingMethod,
  Warehouse,
  Wishlist,
  WishlistItem,
} = require("../models/erdModels");

const seedCatalog = async () => {
  const [productCount, bannerCount, menuCount, menuItemCount] = await Promise.all([
    Product.countDocuments(),
    Banner.countDocuments(),
    Menu.countDocuments(),
    MenuItem.countDocuments(),
  ]);

  if (productCount === 0) {
    const categories = await Category.insertMany([
      {
        category_name: "Footwear",
        slug: "footwear",
        description: "Performance and everyday shoes for every season.",
      },
      {
        category_name: "Accessories",
        slug: "accessories",
        description: "Finish any outfit with premium accessories.",
      },
      {
        category_name: "Bags",
        slug: "bags",
        description: "Travel-ready bags for work, weekend and daily commutes.",
      },
      {
        category_name: "Watches",
        slug: "watches",
        description: "Modern watches with fitness and style.",
      },
      {
        category_name: "Apparel",
        slug: "apparel",
        description: "Comfortable, durable and fashionable apparel.",
      },
      {
        category_name: "Outdoor",
        slug: "outdoor",
        description: "Gear built for adventure and every-weather use.",
      },
    ]);

    const brands = await Brand.insertMany([
      { brand_name: "6PM Originals", slug: "6pm-originals" },
      { brand_name: "Trail Runner", slug: "trail-runner" },
      { brand_name: "Urban Pack", slug: "urban-pack" },
      { brand_name: "Peak Performance", slug: "peak-performance" },
    ]);

    const warehouse = await Warehouse.create({
      warehouse_name: "Main Warehouse",
      location: "Lahore",
    });

    const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));
    const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b._id]));

    const products = await Product.insertMany([
      {
        title: "Urban Trail Running Shoes",
        slug: "urban-trail-running-shoes",
        description: "Lightweight trail running shoes with responsive cushioning and grippy tread.",
        price: 129,
        compare_price: 179,
        sku: "RUN-001",
        status: "active",
        category: categoryMap["footwear"],
        brand: brandMap["trail-runner"],
      },
      {
        title: "Classic Leather Backpack",
        slug: "classic-leather-backpack",
        description: "Premium carryall backpack for work, travel, and everyday essentials.",
        price: 109,
        compare_price: 149,
        sku: "BAG-002",
        status: "active",
        category: categoryMap["bags"],
        brand: brandMap["urban-pack"],
      },
      {
        title: "Smart Fitness Watch",
        slug: "smart-fitness-watch",
        description: "Stay connected and active with heart rate tracking, GPS, and long battery life.",
        price: 159,
        compare_price: 199,
        sku: "WATCH-003",
        status: "active",
        category: categoryMap["watches"],
        brand: brandMap["peak-performance"],
      },
      {
        title: "Everyday Crossbody Bag",
        slug: "everyday-crossbody-bag",
        description: "Compact, stylish bag for running errands and weekend outings.",
        price: 69,
        compare_price: 89,
        sku: "BAG-004",
        status: "active",
        category: categoryMap["accessories"],
        brand: brandMap["6pm-originals"],
      },
      {
        title: "Lightweight Performance Hoodie",
        slug: "lightweight-performance-hoodie",
        description: "Soft, breathable hoodie designed for workouts and relaxed weekends.",
        price: 79,
        compare_price: 99,
        sku: "APP-005",
        status: "active",
        category: categoryMap["apparel"],
        brand: brandMap["6pm-originals"],
      },
      {
        title: "All-Season Hiking Jacket",
        slug: "all-season-hiking-jacket",
        description: "Durable jacket with weather-resistant fabric and tactical pockets.",
        price: 139,
        compare_price: 179,
        sku: "OUT-006",
        status: "active",
        category: categoryMap["outdoor"],
        brand: brandMap["peak-performance"],
      },
    ]);

    const productImages = {
      "urban-trail-running-shoes": "https://images.unsplash.com/photo-1528701800489-476cecdb9e34?auto=format&fit=crop&w=900&q=80",
      "classic-leather-backpack": "https://images.unsplash.com/photo-1512436991641-6817eab5b527?auto=format&fit=crop&w=900&q=80",
      "smart-fitness-watch": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
      "everyday-crossbody-bag": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80",
      "lightweight-performance-hoodie": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      "all-season-hiking-jacket": "https://images.unsplash.com/photo-1506103530826-4088f7e5f1ac?auto=format&fit=crop&w=900&q=80",
    };

    for (const product of products) {
      const sizes = ["S", "M", "L", "XL"];
      const colors = ["Black", "Stone", "Olive", "Navy"];

      for (const size of sizes) {
        for (const color of colors) {
          await ProductVariant.create({
            product: product._id,
            size,
            color,
            price: product.price,
            inventory_quantity: 120,
            sku: `${product.sku}-${size.toUpperCase()}-${color.toUpperCase()}`,
          });
        }
      }

      await ProductImage.create({
        product: product._id,
        image_url: productImages[product.slug] || "https://images.unsplash.com/photo-1512436991641-6817eab5b527?auto=format&fit=crop&w=900&q=80",
        alt_text: product.title,
        sort_order: 1,
      });

      const variant = await ProductVariant.findOne({ product: product._id });
      await Inventory.create({
        variant: variant._id,
        warehouse: warehouse._id,
        quantity: 100,
      });
    }

    await Coupon.create({
      code: "DEMO10",
      discount_type: "percentage",
      discount_value: 10,
      is_active: true,
    });

    await ShippingMethod.create({
      method_name: "Standard Delivery",
      cost: 8,
    });
  }

  if (bannerCount === 0) {
    await Banner.insertMany([
      {
        heading: "Seasonal Favorites",
        subheading: "Shop the best sellers that customers love.",
        image: "https://images.unsplash.com/photo-1495121605193-b116b5b9c5d9?auto=format&fit=crop&w=1200&q=80",
        link_url: "/products?category=footwear",
      },
      {
        heading: "Fresh Arrivals",
        subheading: "New drops from premium brands, ready to ship.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
        link_url: "/products?category=accessories",
      },
      {
        heading: "Adventure Ready",
        subheading: "Gear up with durable, high-performance essentials.",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        link_url: "/products?category=outdoor",
      },
    ]);
  }

  if (menuItemCount === 0) {
    let mainMenu = await Menu.findOne({ name: "Main Menu" });
    if (!mainMenu) {
      mainMenu = await Menu.create({ name: "Main Menu" });
    }

    await MenuItem.insertMany([
      { menu: mainMenu._id, title: "Home", url: "/", sort_order: 0 },
      { menu: mainMenu._id, title: "Shop All", url: "/products", sort_order: 1 },
      { menu: mainMenu._id, title: "New Arrivals", url: "/products?category=new", sort_order: 2 },
      { menu: mainMenu._id, title: "Footwear", url: "/products?category=footwear", sort_order: 3 },
      { menu: mainMenu._id, title: "Bags", url: "/products?category=bags", sort_order: 4 },
      { menu: mainMenu._id, title: "Accessories", url: "/products?category=accessories", sort_order: 5 },
      { menu: mainMenu._id, title: "Outdoor", url: "/products?category=outdoor", sort_order: 6 },
      { menu: mainMenu._id, title: "Sale", url: "/products?category=sale", sort_order: 7 },
    ]);
  }
};

const getProductCard = async (product) => {
  const [variants, image] = await Promise.all([
    ProductVariant.find({ product: product._id }),
    ProductImage.findOne({ product: product._id }).sort({ sort_order: 1 }),
  ]);

  return {
    ...product.toObject(),
    variants,
    image,
  };
};

const getActiveCart = async (customerId) => {
  let cart = await Cart.findOne({
    customer: customerId,
    status: "active",
  });

  if (!cart) {
    cart = await Cart.create({
      customer: customerId,
    });
  }

  return cart;
};

const buildCart = async (customerId, couponCode) => {
  const cart = await getActiveCart(customerId);
  const items = await CartItem.find({ cart: cart._id }).populate({
    path: "variant",
    populate: {
      path: "product",
      populate: ["category", "brand"],
    },
  });

  let subtotal = 0;
  const normalizedItems = items.map((item) => {
    const price = item.variant.price || item.variant.product.price;
    const lineTotal = price * item.quantity;
    subtotal += lineTotal;

    return {
      _id: item._id,
      quantity: item.quantity,
      variant: item.variant,
      product: item.variant.product,
      price,
      lineTotal,
    };
  });

  let coupon = null;
  let discount = 0;

  if (couponCode) {
    coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      is_active: true,
    });

    if (coupon) {
      discount =
        coupon.discount_type === "percentage"
          ? subtotal * (coupon.discount_value / 100)
          : coupon.discount_value;
    }
  }

  const shipping = normalizedItems.length > 0 ? 8 : 0;
  const total = Math.max(subtotal - discount + shipping, 0);

  return {
    cart,
    items: normalizedItems,
    coupon,
    totals: {
      subtotal,
      discount,
      shipping,
      total,
    },
  };
};

exports.listCategories = async (req, res, next) => {
  try {
    await seedCatalog();
    const categories = await Category.find().sort({ category_name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    await seedCatalog();

    const { q } = req.query;
    const filter = {
      status: "active",
    };

    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];

      if (req.customer) {
        await SearchHistory.create({
          customer: req.customer._id,
          keyword: q,
        });
      }
    }

    const products = await Product.find(filter)
      .populate("category")
      .populate("brand")
      .sort({ created_at: -1 });

    const data = await Promise.all(products.map(getProductCard));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    await seedCatalog();

    const idOrSlug = req.params.id;
    let product = null;

    // Slugs are not ObjectIds — findById throws CastError on values like
    // "3-piece-printed-embroidered-suit-pe26-333-3l62" before slug fallback runs.
    if (mongoose.isValidObjectId(idOrSlug)) {
      product = await Product.findById(idOrSlug)
        .populate("category")
        .populate("brand");
    }

    if (!product) {
      product = await Product.findOne({ slug: idOrSlug })
        .populate("category")
        .populate("brand");
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (req.customer) {
      await RecentlyViewed.create({
        customer: req.customer._id,
        product: product._id,
      });
    }

    const [variant, images, reviews] = await Promise.all([
      ProductVariant.find({ product: product._id }),
      ProductImage.find({ product: product._id }).sort({ sort_order: 1 }),
      Review.find({ product: product._id }).populate("customer").sort({
        created_at: -1,
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        variants: variant,
        images,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerActivity = async (req, res, next) => {
  try {
    const [searchHistory, recentlyViewed] = await Promise.all([
      SearchHistory.find({ customer: req.customer._id }).sort({ created_at: -1 }).limit(20),
      RecentlyViewed.find({ customer: req.customer._id })
        .populate("product")
        .sort({ created_at: -1 })
        .limit(20),
    ]);

    res.json({
      success: true,
      data: {
        searchHistory,
        recentlyViewed,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ customer: req.customer._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ customer: req.customer._id });
    }

    const items = await WishlistItem.find({ wishlist: wishlist._id }).populate("product");
    const data = await Promise.all(items.map(async (item) => ({
      _id: item._id,
      product: await getProductCard(item.product),
    })));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ customer: req.customer._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ customer: req.customer._id });
    }

    const item = await WishlistItem.findOneAndUpdate(
      {
        wishlist: wishlist._id,
        product: productId,
      },
      {
        wishlist: wishlist._id,
        product: productId,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

exports.addCart = async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const cart = await getActiveCart(req.customer._id);
    const variant =
      variantId
        ? await ProductVariant.findById(variantId)
        : await ProductVariant.findOne({ product: productId });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    const inventory = await Inventory.findOne({ variant: variant._id });
    const availableQty = inventory ? inventory.quantity : variant.inventory_quantity;

    if (availableQty < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const existing = await CartItem.findOne({
      cart: cart._id,
      variant: variant._id,
    });

    if (existing) {
      existing.quantity += Number(quantity);
      await existing.save();
    } else {
      await CartItem.create({
        cart: cart._id,
        variant: variant._id,
        quantity,
      });
    }

    res.status(201).json({
      success: true,
      data: await buildCart(req.customer._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await buildCart(req.customer._id, req.query.coupon),
    });
  } catch (error) {
    next(error);
  }
};

exports.checkout = async (req, res, next) => {
  try {
    const {
      couponCode,
      paymentMethod = "cash_on_delivery",
      address = {},
    } = req.body;
    const cartData = await buildCart(req.customer._id, couponCode);

    if (cartData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    for (const item of cartData.items) {
      const inventory = await Inventory.findOne({ variant: item.variant._id });
      const availableQty = inventory ? inventory.quantity : item.variant.inventory_quantity;

      if (availableQty < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product?.title || "product"}`,
        });
      }
    }

    const savedAddress = await Address.create({
      customer: req.customer._id,
      country: address.country || "Pakistan",
      state: address.state || "",
      city: address.city || "Lahore",
      zip_code: address.zipCode || address.zip_code || "",
      street: address.street || "Default street",
      is_default: true,
    });

    const order = await Order.create({
      customer: req.customer._id,
      address: savedAddress._id,
      coupon: cartData.coupon?._id,
      total_amount: cartData.totals.total,
      payment_status: paymentMethod === "cash_on_delivery" ? "pending" : "paid",
      order_status: "processing",
    });

    for (const item of cartData.items) {
      await OrderItem.create({
        order: order._id,
        variant: item.variant._id,
        quantity: item.quantity,
        price: item.price,
      });

      await Inventory.updateOne(
        { variant: item.variant._id },
        { $inc: { quantity: -item.quantity } }
      );
    }

    const payment = await Payment.create({
      order: order._id,
      payment_method: paymentMethod,
      amount: cartData.totals.total,
      payment_status: paymentMethod === "cash_on_delivery" ? "pending" : "paid",
      transaction_id: `TXN-${Date.now()}`,
    });

    const shippingMethod =
      (await ShippingMethod.findOne()) ||
      (await ShippingMethod.create({
        method_name: "Standard Delivery",
        cost: 8,
      }));

    const shipment = await Shipment.create({
      order: order._id,
      shipping_method: shippingMethod._id,
      carrier: "Amazon Logistics",
      tracking_number: `TRK-${Date.now()}`,
      delivery_status: "shipped",
    });

    cartData.cart.status = "converted";
    await cartData.cart.save();

    res.status(201).json({
      success: true,
      data: {
        order,
        payment,
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.customer._id })
      .populate("address")
      .populate("coupon")
      .sort({ created_at: -1 });

    const data = await Promise.all(
      orders.map(async (order) => {
        const [items, payment, shipment, returnRequest, refund] = await Promise.all([
          OrderItem.find({ order: order._id }).populate({
            path: "variant",
            populate: {
              path: "product",
            },
          }),
          Payment.findOne({ order: order._id }),
          Shipment.findOne({ order: order._id }).populate("shipping_method"),
          ReturnRequest.findOne({ order: order._id }),
          Refund.findOne({ order: order._id }),
        ]);

        return {
          ...order.toObject(),
          items,
          payment,
          shipment,
          returnRequest,
          refund,
        };
      })
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.markDelivered = async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.orderId,
        customer: req.customer._id,
      },
      {
        order_status: "delivered",
        payment_status: "paid",
      },
      {
        new: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const shipment = await Shipment.findOneAndUpdate(
      { order: order._id },
      { delivery_status: "delivered" },
      { new: true }
    );

    await Payment.findOneAndUpdate(
      { order: order._id },
      { payment_status: "paid" }
    );

    res.json({
      success: true,
      data: {
        order,
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { productId, rating, reviewText } = req.body;

    const review = await Review.create({
      customer: req.customer._id,
      product: productId,
      rating,
      review_text: reviewText,
    });

    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: "$product", average: { $avg: "$rating" } } },
    ]);

    if (stats[0]) {
      await Product.findByIdAndUpdate(review.product, {
        average_rating: stats[0].average,
      });
    }

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

exports.requestReturn = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customer: req.customer._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const returnRequest = await ReturnRequest.findOneAndUpdate(
      { order: order._id },
      {
        order: order._id,
        reason,
        status: "approved",
      },
      {
        upsert: true,
        new: true,
      }
    );

    res.status(201).json({
      success: true,
      data: returnRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.createRefund = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({
      _id: orderId,
      customer: req.customer._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const refund = await Refund.findOneAndUpdate(
      { order: order._id },
      {
        order: order._id,
        amount: order.total_amount,
        status: "approved",
      },
      {
        upsert: true,
        new: true,
      }
    );

    await Order.findByIdAndUpdate(order._id, {
      payment_status: "refunded",
    });

    res.status(201).json({
      success: true,
      data: refund,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRefunds = async (req, res, next) => {
  try {
    const refunds = await Refund.find({ order: { $in: await Order.find({ customer: req.customer._id }).distinct("_id") } })
      .populate("order")
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: refunds,
    });
  } catch (error) {
    next(error);
  }
};

exports.getReturnRequests = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.order) {
      filter.order = req.query.order;
    } else {
      filter.order = { $in: await Order.find({ customer: req.customer._id }).distinct("_id") };
    }

    const returns = await ReturnRequest.find(filter)
      .populate("order")
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    next(error);
  }
};