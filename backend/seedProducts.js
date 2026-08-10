const mongoose = require("mongoose");

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const IMAGES = {
  p0: "/images/products/nishat-0.jpg",
  p1: "/images/products/nishat-1.jpg",
  p2: "/images/products/nishat-2.jpg",
  p3: "/images/products/nishat-3.jpg",
  p4: "/images/products/nishat-4.jpg",
  p5: "/images/products/nishat-5.jpg",
  p6: "/images/products/nishat-6.jpg",
  p7: "/images/products/nishat-7.jpg",
  p8: "/images/products/nishat-8.jpg",
  p9: "/images/products/nishat-9.jpg",
  p10: "/images/products/nishat-10.jpg",
  p11: "/images/products/nishat-11.jpg",
  p12: "/images/products/nishat-12.jpg",
  p13: "/images/products/nishat-13.jpg",
  p14: "/images/products/nishat-14.jpg",
  p15: "/images/products/nishat-15.jpg",
  p16: "/images/products/nishat-16.jpg",
  p17: "/images/products/nishat-17.jpg",
  p18: "/images/products/nishat-18.jpg",
  p19: "/images/products/nishat-19.jpg",
  p20: "/images/products/nishat-20.jpg",
  p21: "/images/products/nishat-21.jpg",
  p22: "/images/products/nishat-22.jpg",
  p23: "/images/products/nishat-23.jpg",
  p24: "/images/products/nishat-24.jpg",
  p25: "/images/products/nishat-25.jpg",
  p26: "/images/products/nishat-26.jpg",
  p27: "/images/products/nishat-27.jpg",
  p28: "/images/products/nishat-28.jpg",
  p29: "/images/products/nishat-29.jpg",
  p30: "/images/products/nishat-30.jpg",
  p31: "/images/products/nishat-31.jpg",
  p32: "/images/products/nishat-32.jpg",
  p33: "/images/products/nishat-33.jpg",
  p34: "/images/products/nishat-34.jpg",
  p35: "/images/products/nishat-35.jpg",
  p36: "/images/products/nishat-36.jpg",
  p37: "/images/products/nishat-37.jpg",
  p38: "/images/products/nishat-38.jpg",
  p39: "/images/products/nishat-39.jpg",
  p40: "/images/products/nishat-40.jpg",
  p41: "/images/products/nishat-41.jpg",
  p42: "/images/products/nishat-42.jpg",
  p43: "/images/products/nishat-43.jpg",
  p44: "/images/products/nishat-44.jpg",
  p45: "/images/products/nishat-45.jpg",
  p46: "/images/products/nishat-46.jpg",
  p47: "/images/products/nishat-47.jpg",
};

const SIZES = ["XS", "S", "M", "L", "XL"];
const COLORS = ["Black", "White", "Navy", "Sand", "Red", "Gray", "Blue", "Beige"];

const categories = [
  { name: "Unstitched", slug: "unstitched" },
  { name: "Ready to Wear", slug: "ready-to-wear" },
  { name: "Luxury Pret", slug: "luxury-pret" },
  { name: "Men", slug: "men" },
  { name: "Footwear", slug: "footwear" },
  { name: "Accessories", slug: "accessories" },
  { name: "Bottoms", slug: "bottoms" },
  { name: "New Arrivals", slug: "new" },
  { name: "Sale", slug: "sale" },
];

const brands = [
  { name: "Nishat", slug: "nishat" },
  { name: "Nishat Linen", slug: "nishat-linen" },
];

const productSeed = [
  { title: "2 Piece - Printed Suit - 42602064", cat: "unstitched", brand: "Nishat", price: 3590, compare: 4590, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p0 },
  { title: "2 Piece - Embroidered Suit - 42602077", cat: "unstitched", brand: "Nishat", price: 5990, compare: 7990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p1 },
  { title: "3 Piece - Digital Printed Embroidered Suit - 42602176", cat: "unstitched", brand: "Nishat", price: 7490, compare: 9990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p2 },
  { title: "3 Piece - Digital Printed Embroidered Suit - 42602099", cat: "unstitched", brand: "Nishat", price: 6490, compare: 8490, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p3 },
  { title: "3 Piece - Digital Printed Suit - 42602117", cat: "unstitched", brand: "Nishat", price: 5990, compare: 7990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p4 },
  { title: "2 Piece - Printed Suit - 42602072", cat: "unstitched", brand: "Nishat", price: 3590, compare: 4590, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p5 },
  { title: "3 Piece - Digital Printed Embroidered Suit - 42602173", cat: "unstitched", brand: "Nishat", price: 7490, compare: 9990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p6 },
  { title: "2 Piece - Embroidered Suit - 42602083", cat: "unstitched", brand: "Nishat", price: 5990, compare: 7990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p7 },
  { title: "3 Piece - Printed Embroidered Suit - PE26-287", cat: "ready-to-wear", brand: "Nishat", price: 16990, compare: 21990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p8 },
  { title: "3 Piece - Embroidered Suit - PE26-289", cat: "ready-to-wear", brand: "Nishat", price: 17990, compare: 22990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p9 },
  { title: "3 Piece - Printed Embroidered Suit - PS26-117", cat: "ready-to-wear", brand: "Nishat", price: 15990, compare: 19990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p10 },
  { title: "3 Piece - Embroidered Suit - PE26-295", cat: "ready-to-wear", brand: "Nishat", price: 12990, compare: 16990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p11 },
  { title: "Printed Dress - FS26-13", cat: "ready-to-wear", brand: "Nishat", price: 7990, compare: 9990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p12 },
  { title: "2 Piece - Embroidered Suit - PE26-255", cat: "ready-to-wear", brand: "Nishat", price: 12990, compare: 16990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p13 },
  { title: "3 Piece - Embroidered Suit - PS26-118", cat: "ready-to-wear", brand: "Nishat", price: 15990, compare: 19990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p14 },
  { title: "Embroidered Tunic - AS26-83", cat: "ready-to-wear", brand: "Nishat", price: 6490, compare: 8490, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p15 },
  { title: "3 Piece - Printed Embroidered Suit - KFE26-210", cat: "luxury-pret", brand: "Nishat", price: 22000, compare: 28000, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p16 },
  { title: "3 Piece - Printed Embroidered Suit - KFE26-177", cat: "luxury-pret", brand: "Nishat", price: 20000, compare: 26000, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p17 },
  { title: "2 Piece - Embroidered Suit - KFE26-148", cat: "luxury-pret", brand: "Nishat", price: 19900, compare: 24900, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p18 },
  { title: "2 Piece - Embroidered Suit - KFE26-145", cat: "luxury-pret", brand: "Nishat", price: 17500, compare: 22500, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p19 },
  { title: "2 Piece - Naqsh Suit - 42508040", cat: "men", brand: "Nishat", price: 9490, compare: 12490, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p20 },
  { title: "2 Piece - Naqsh Suit - 42508041", cat: "men", brand: "Nishat", price: 9490, compare: 12490, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p21 },
  { title: "2 Piece - Naqsh Suit - 42508046", cat: "men", brand: "Nishat", price: 9490, compare: 12490, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p22 },
  { title: "2 Piece - Naqsh Suit - 42508021", cat: "men", brand: "Nishat", price: 9490, compare: 12490, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p23 },
  { title: "Embroidered Kurta - KBS26-17", cat: "men", brand: "Nishat", price: 7500, compare: 9990, colors: ["Multi"], sizes: ["S","M","L","XL"], img: IMAGES.p24 },
  { title: "Embroidered Kurta - KBS26-16", cat: "men", brand: "Nishat", price: 6500, compare: 8990, colors: ["Multi"], sizes: ["S","M","L","XL"], img: IMAGES.p25 },
  { title: "Black Pumps - 449322903", cat: "footwear", brand: "Nishat", price: 7990, compare: 9990, colors: ["Black"], sizes: ["36","37","38","39","40","41"], img: IMAGES.p26 },
  { title: "Gold Pumps - 449322919", cat: "footwear", brand: "Nishat", price: 7990, compare: 9990, colors: ["Gold"], sizes: ["36","37","38","39","40","41"], img: IMAGES.p27 },
  { title: "Beige Chappal - 445422918", cat: "footwear", brand: "Nishat", price: 6990, compare: 8990, colors: ["Beige"], sizes: ["36","37","38","39","40","41"], img: IMAGES.p28 },
  { title: "Black Sandals - 449312903", cat: "footwear", brand: "Nishat", price: 7990, compare: 9990, colors: ["Black"], sizes: ["36","37","38","39","40","41"], img: IMAGES.p29 },
  { title: "Beige Block Heels - 449302918", cat: "footwear", brand: "Nishat", price: 7990, compare: 9990, colors: ["Beige"], sizes: ["36","37","38","39","40","41"], img: IMAGES.p30 },
  { title: "White Canvas - 449252912", cat: "footwear", brand: "Nishat", price: 7990, compare: 9990, colors: ["White"], sizes: ["36","37","38","39","40","41"], img: IMAGES.p31 },
  { title: "Silver Evening Bag - 448792120", cat: "accessories", brand: "Nishat", price: 6990, compare: 8990, colors: ["Silver"], sizes: ["One Size"], img: IMAGES.p32 },
  { title: "Gold Evening Bag - 448792119", cat: "accessories", brand: "Nishat", price: 6990, compare: 8990, colors: ["Gold"], sizes: ["One Size"], img: IMAGES.p33 },
  { title: "Gold Clutch - 448522119", cat: "accessories", brand: "Nishat", price: 8990, compare: 11990, colors: ["Gold"], sizes: ["One Size"], img: IMAGES.p34 },
  { title: "Black Clutch - 448512103", cat: "accessories", brand: "Nishat", price: 7990, compare: 9990, colors: ["Black"], sizes: ["One Size"], img: IMAGES.p35 },
  { title: "Maroon Women Scarf - 447822122", cat: "accessories", brand: "Nishat", price: 2990, compare: 3990, colors: ["Maroon"], sizes: ["One Size"], img: IMAGES.p36 },
  { title: "Black Hand Bag - 448972103", cat: "accessories", brand: "Nishat", price: 7990, compare: 9990, colors: ["Black"], sizes: ["One Size"], img: IMAGES.p37 },
  { title: "Straight Trousers - AS26-79", cat: "bottoms", brand: "Nishat", price: 5990, compare: 7990, colors: ["Black","Navy","Sand"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p38 },
  { title: "Loose Trousers - FS26-14", cat: "bottoms", brand: "Nishat", price: 4990, compare: 6990, colors: ["Sand","White","Blue"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p39 },
  { title: "3 Piece - Digital Printed Suit - 42602185", cat: "new", brand: "Nishat", price: 5990, compare: 7990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p40 },
  { title: "2 Piece - Embroidered Suit - PS26-162", cat: "new", brand: "Nishat", price: 8990, compare: 11990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p41 },
  { title: "3 Piece - Embroidered Suit - PE26-296", cat: "new", brand: "Nishat", price: 12990, compare: 16990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p42 },
  { title: "3 Piece - Printed Embroidered Suit - PE26-333", cat: "new", brand: "Nishat", price: 10990, compare: 14990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p43 },
  { title: "2 Piece - Naqsh Suit - 42508096", cat: "sale", brand: "Nishat", price: 7990, compare: 12990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p44 },
  { title: "2 Piece - Naqsh Suit - 42508066", cat: "sale", brand: "Nishat", price: 10490, compare: 16990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p45 },
  { title: "3 Piece - Embroidered Suit - PE26-516", cat: "sale", brand: "Nishat", price: 14990, compare: 19990, colors: ["Multi"], sizes: ["XS","S","M","L","XL"], img: IMAGES.p46 },
  { title: "3 Piece - Digital Printed Embroidered Suit - 42602162", cat: "sale", brand: "Nishat", price: 9990, compare: 14990, colors: ["Multi"], sizes: ["Unstitched"], img: IMAGES.p47 },
];

async function seed() {
  const { Category, Brand, Product, ProductVariant, ProductImage } = require("./src/models/erdModels");

  const catDocs = await Promise.all(
    categories.map((c) =>
      Category.findOneAndUpdate(
        { slug: c.slug },
        { category_name: c.name, slug: c.slug },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
  const brandDocs = await Promise.all(
    brands.map((b) =>
      Brand.findOneAndUpdate(
        { slug: b.slug },
        { brand_name: b.name, slug: b.slug },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
  const catMap = Object.fromEntries(catDocs.map((c) => [c.slug, c._id]));
  const brandByName = Object.fromEntries(brandDocs.map((b) => [b.brand_name, b._id]));

  await Product.deleteMany({});
  await ProductVariant.deleteMany({});
  await ProductImage.deleteMany({});

  for (const p of productSeed) {
    const product = await Product.create({
      title: p.title,
      slug: slugify(p.title) + "-" + Math.random().toString(36).slice(2, 6),
      description: `${p.title} by ${p.brand}. Crafted for everyday comfort and style.`,
      price: p.price,
      compare_price: p.compare || undefined,
      status: "active",
      category: catMap[p.cat],
      brand: brandByName[p.brand],
      average_rating: Math.round((3 + Math.random() * 2) * 10) / 10,
    });

    for (const color of p.colors) {
      for (const size of p.sizes) {
        await ProductVariant.create({
          product: product._id,
          size,
          color,
          price: p.price,
          inventory_quantity: Math.floor(Math.random() * 40) + 5,
          sku: `SKU-${product._id.toString().slice(-4)}-${slugify(color)}-${slugify(size)}`,
        });
      }
    }

    await ProductImage.create({
      product: product._id,
      image_url: p.img,
      alt_text: p.title,
      sort_order: 0,
    });
  }

  const count = await Product.countDocuments();
  console.log(`Seeded ${count} products with variants and images.`);
}

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce")
  .then(async () => {
    await seed();
    await mongoose.disconnect();
  })
  .catch((e) => {
    console.error("SEED ERROR:", e);
    process.exit(1);
  });