/**
 * Seed script — adds 100+ products across multiple categories from 6pm.com.
 *
 * Usage:
 *   cd frontend
 *   npx tsx scripts/seed-6pm-products.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { envVar } from "../src/server/lib/env";
import ws from "ws";

function loadEnvFile(filename: string) {
  const envPath = resolve(process.cwd(), filename);
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.production.local");

const url = envVar("NEXT_PUBLIC_SUPABASE_URL") || envVar("SUPABASE_URL");
const serviceKey = envVar("SUPABASE_SERVICE_ROLE_KEY") || envVar("SUPABASE_SECRET_KEY");

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const connectionString =
  (process.env.POSTGRES_URL_NON_POOLING || "").replace("sslmode=require", "sslmode=no-verify");

const pgClient = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function hasColumn(table: string, column: string): Promise<boolean> {
  try {
    await pgClient.connect();
    const res = await pgClient.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
      [table, column]
    );
    return res.rows.length > 0;
  } catch (err) {
    return false;
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const imageUrl = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

const SIZES_SHOES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"];
const SIZES_CLOTHING = ["XS", "S", "M", "L", "XL", "XXL"];

// ─── CATEGORIES (6pm.com style) ────────────────────────────────────────────────

const categories = [
  { name: "Women's Sneakers", slug: "womens-sneakers", gender: "Women" },
  { name: "Men's Sneakers", slug: "mens-sneakers", gender: "Men" },
  { name: "Women's Boots", slug: "womens-boots", gender: "Women" },
  { name: "Men's Boots", slug: "mens-boots", gender: "Men" },
  { name: "Women's Sandals", slug: "womens-sandals", gender: "Women" },
  { name: "Men's Sandals", slug: "mens-sandals", gender: "Men" },
  { name: "Women's Heels", slug: "womens-heels", gender: "Women" },
  { name: "Women's Flats", slug: "womens-flats", gender: "Women" },
  { name: "Women's Athletic", slug: "womens-athletic", gender: "Women" },
  { name: "Men's Athletic", slug: "mens-athletic", gender: "Men" },
  { name: "Women's Dresses", slug: "womens-dresses", gender: "Women" },
  { name: "Women's Jeans", slug: "womens-jeans", gender: "Women" },
  { name: "Men's Jeans", slug: "mens-jeans", gender: "Men" },
  { name: "Women's Tops", slug: "womens-tops", gender: "Women" },
  { name: "Men's Tops", slug: "mens-tops", gender: "Men" },
  { name: "Women's Outerwear", slug: "womens-outerwear", gender: "Women" },
  { name: "Men's Outerwear", slug: "mens-outerwear", gender: "Men" },
  { name: "Women's Activewear", slug: "womens-activewear", gender: "Women" },
  { name: "Men's Activewear", slug: "mens-activewear", gender: "Men" },
  { name: "Kids' Shoes", slug: "kids-shoes", gender: "Kids" },
  { name: "Accessories", slug: "accessories", gender: "Unisex" },
];

// ─── BRANDS ────────────────────────────────────────────────────────────────────

const brands = [
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "New Balance", slug: "new-balance" },
  { name: "Converse", slug: "converse" },
  { name: "Vans", slug: "vans" },
  { name: "Skechers", slug: "skechers" },
  { name: "Reebok", slug: "reebok" },
  { name: "Puma", slug: "puma" },
  { name: "Dr. Martens", slug: "dr-martens" },
  { name: "UGG", slug: "ugg" },
  { name: "Clarks", slug: "clarks" },
  { name: "Crocs", slug: "crocs" },
  { name: "Birkenstock", slug: "birkenstock" },
  { name: "ASICS", slug: "asics" },
  { name: "Cole Haan", slug: "cole-haan" },
  { name: "Rockport", slug: "rockport" },
  { name: "Havaianas", slug: "havaianas" },
  { name: "Crocs", slug: "crocs-2" },
];

const DESCS = [
  "Premium quality with a comfortable fit. Perfect for all-day wear.",
  "Stylish design meets functionality. Elevate your everyday look.",
  "Crafted with soft materials for unmatched comfort and durability.",
  "Classic silhouette with modern touches. A wardrobe essential.",
  "Lightweight construction with excellent support. Ideal for any occasion.",
  "Contemporary design with superior comfort technology.",
  "Breathable materials keep you comfortable all day long.",
  "Sleek profile and premium materials for a polished appearance.",
];

const PRODUCT_TEMPLATES: Record<
  string,
  {
    names: string[];
    basePrice: number;
    discount: boolean;
    usesShoeSizes: boolean;
    colors: string[];
  }
> = {
  "womens-sneakers": {
    names: ["Running Ace", "Cloud Walk", "Urban Pulse", "Velocity Lite", "Stride Pro", "Flex Glide", "Nova Runner", "Eco Step"],
    basePrice: 79.99,
    discount: true,
    usesShoeSizes: true,
    colors: ["Black", "White", "Pink", "Blue"],
  },
  "mens-sneakers": {
    names: ["Street Runner", "Urban Trail", "Velocity Pro", "Court King", "Dash Elite", "Swift Motion", "Metro Lite", "Grid Flex"],
    basePrice: 89.99,
    discount: true,
    usesShoeSizes: true,
    colors: ["Black", "White", "Blue", "Gray"],
  },
  "womens-boots": {
    names: ["Chelsea Stack", "Riding Elite", "Ankle Strap", "Combat Luxe", "Knee High", "Chunky Sole", "Western Walk", "Suede Blend"],
    basePrice: 129.99,
    discount: true,
    usesShoeSizes: true,
    colors: ["Black", "Brown", "Tan", "Gray"],
  },
  "mens-boots": {
    names: ["Work Boot Pro", "Leather Hiker", "Chelsea Classic", "Desert Trek", "Lumber Jack", "Field Boot", "Combat Boot", "Chukka Low"],
    basePrice: 149.99,
    discount: false,
    usesShoeSizes: true,
    colors: ["Black", "Brown", "Tan"],
  },
  "womens-sandals": {
    names: ["Summer Strap", "Beach Walk", "Slide Comfort", "Wedge Elegance", "Thong Delight", "Platform Glide", "Espadrille Flex", "Raised Sole"],
    basePrice: 69.99,
    discount: true,
    usesShoeSizes: true,
    colors: ["Brown", "Black", "White", "Tan"],
  },
  "mens-sandals": {
    names: ["Sport Slide", "Beach Walker", "Casual Slide", "Thong Classic", "Hiking Sandal", "River Trek"],
    basePrice: 59.99,
    discount: true,
    usesShoeSizes: true,
    colors: ["Black", "Brown", "Gray"],
  },
  "womens-heels": {
    names: ["Stiletto Chic", "Block Party", "Pump Pride", "Wedge Wonder", "Kitten Step", "Slingback Elegance", "Platform Power", "Heel Click"],
    basePrice: 99.99,
    discount: true,
    usesShoeSizes: true,
    colors: ["Black", "Red", "Nude", "Blue"],
  },
  "womens-flats": {
    names: ["Loafers Soft", "Ballet Flat", "Slip-On Comfort", "Canvas Luxe", "Sneaker Flat", "Moccasin Walk"],
    basePrice: 64.99,
    discount: false,
    usesShoeSizes: true,
    colors: ["Black", "White", "Gray", "Pink"],
  },
  "womens-athletic": {
    names: ["Legging Pro", "Sports Bra Elite", "Tank Top Active", "Shorts Flex", "Zip-Up Hoodie", "Compression Shirt"],
    basePrice: 49.99,
    discount: true,
    usesShoeSizes: false,
    colors: ["Black", "Gray", "Blue", "Pink"],
  },
  "mens-athletic": {
    names: ["Tank Top Pro", "Shorts Elite", "Compression Shirt", "Hoodie Active", "Jogger Fit", "Gym Shorts"],
    basePrice: 59.99,
    discount: false,
    usesShoeSizes: false,
    colors: ["Black", "Gray", "Blue", "White"],
  },
  "womens-dresses": {
    names: ["Summer Floral", "Little Black", "Maxi Wrap", "Cocktail Shine", "T-Shirt Dress", "Denim Mini", "Shift Style", "A-Line Grace"],
    basePrice: 89.99,
    discount: true,
    usesShoeSizes: false,
    colors: ["Black", "Pink", "Blue", "White", "Multi"],
  },
  "womens-jeans": {
    names: ["Skinny Fit", "Straight Leg", "Bootcut Classic", "High Rise", "Distressed Denim", "Wide Leg", "Boyfriend", "Mom Jean"],
    basePrice: 74.99,
    discount: true,
    usesShoeSizes: false,
    colors: ["Blue", "Black", "White", "Gray"],
  },
  "mens-jeans": {
    names: ["Slim Fit", "Straight Leg", "Bootcut", "Skinny", "Relaxed Fit", "Distressed", "Dark Wash", "Light Wash"],
    basePrice: 69.99,
    discount: false,
    usesShoeSizes: false,
    colors: ["Blue", "Black", "Gray", "Tan"],
  },
  "womens-tops": {
    names: ["Cotton Tee", "Blouse Elegant", "Sweater Soft", "Crop Top", "Button Down", "Halter Top", "Off-Shoulder", "Striped Sweater"],
    basePrice: 44.99,
    discount: true,
    usesShoeSizes: false,
    colors: ["White", "Black", "Pink", "Blue", "Gray"],
  },
  "mens-tops": {
    names: ["Oxford Shirt", "Polo Classic", "Cotton Tee", "Henley", "Flannel Shirt", "Tank Top", "Sweater V-Neck", "Chambray Shirt"],
    basePrice: 39.99,
    discount: false,
    usesShoeSizes: false,
    colors: ["White", "Black", "Blue", "Gray", "Red"],
  },
  "womens-outerwear": {
    names: ["Denim Jacket", "Leather Moto", "Puffer Coat", "Cardigan Soft", "Trench Classic", "Windbreaker", "Parka Winter", "Vest Layered"],
    basePrice: 159.99,
    discount: true,
    usesShoeSizes: false,
    colors: ["Black", "Blue", "Gray", "Tan", "Khaki"],
  },
  "mens-outerwear": {
    names: ["Bomber Jacket", "Parka Winter", "Cardigan Classic", "Puffer Vest", "Denim Jacket", "Field Coat", "Hoodie Pullover", "Windbreaker"],
    basePrice: 149.99,
    discount: false,
    usesShoeSizes: false,
    colors: ["Black", "Gray", "Blue", "Green", "Khaki"],
  },
  "kids-shoes": {
    names: ["Sneaker K", "Bootie Cute", "Sandals Fun", "Slipper Soft", "High Top", "Velcro Walk", "Rain Boot", "Canvas Kick"],
    basePrice: 49.99,
    discount: true,
    usesShoeSizes: true,
    colors: ["Black", "White", "Blue", "Pink", "Gray"],
  },
  "accessories": {
    names: ["Canvas Backpack", "Leather Wallet", "Beanie Warm", "Sunglasses", "Scarf Soft", "Watch Minimal", "Belt Leather", "Gloves Warm"],
    basePrice: 34.99,
    discount: true,
    usesShoeSizes: false,
    colors: ["Black", "Brown", "Gray", "Blue", "Red"],
  },
};

const genderMap: Record<string, string> = {};
for (const c of categories) {
  genderMap[c.slug] = c.gender;
}

interface GeneratedProduct {
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_price?: number;
  category_id: string;
  brand_id: string;
  gender?: string;
  status: string;
  inventory_quantity: number;
  low_stock_threshold: number;
  short_description: string;
  variants: Array<{
    product_id?: string;
    size: string;
    color: string;
    circle: string;
    price: number;
    compare_price?: number;
    inventory_quantity: number;
    sku: string;
  }>;
  images: Array<{
    product_id?: string;
    image_url: string;
    alt_text: string;
    sort_order: number;
    is_primary: boolean;
  }>;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

async function main() {
  console.log("Seeding 6pm.com products...\n");

  // ─── Ensure warehouse exists ─────────────────────────────────────────────────
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  let warehouseId: string;
  if (warehouses?.id) {
    warehouseId = warehouses.id;
    console.log(`✓ Using existing warehouse: ${warehouses.name}`);
  } else {
    const { data: newWh, error: whErr } = await supabase
      .from("warehouses")
      .insert({ name: "Main Warehouse", location: "New York, NY", status: "active" })
      .select()
      .single();
    if (whErr || !newWh?.id) {
      console.error("✗ Failed to create warehouse:", whErr?.message);
      process.exit(1);
    }
    warehouseId = newWh.id;
    console.log(`✓ Created warehouse: ${newWh.name}`);
  }

  // ─── Insert / fetch categories ─────────────────────────────────────────────────
  console.log("\n📁 Creating categories...");
  const createdCategories: Record<string, string> = {};

  // Fetch existing categories
  const { data: existingCats } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", categories.map((c) => c.slug));

  for (const cat of categories) {
    const existing = (existingCats || []).find((e) => e.slug === cat.slug);
    if (existing) {
      createdCategories[cat.slug] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        category_name: cat.name,
        slug: cat.slug,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error(`  ✗ Failed to create category ${cat.name}:`, error.message);
      continue;
    }

    createdCategories[cat.slug] = data.id;
    console.log(`  + Created category: ${cat.name}`);
  }

  // ─── Insert / fetch brands ───────────────────────────────────────────────────
  console.log("\n🏷  Creating brands...");
  const createdBrands: Record<string, string> = {};

  const { data: existingBrands } = await supabase
    .from("brands")
    .select("id, slug")
    .in("slug", brands.map((b) => b.slug));

  for (const brand of brands) {
    const existing = (existingBrands || []).find((e) => e.slug === brand.slug);
    if (existing) {
      createdBrands[brand.slug] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from("brands")
      .insert({
        brand_name: brand.name,
        slug: brand.slug,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error(`  ✗ Failed to create brand ${brand.name}:`, error.message);
      continue;
    }

    createdBrands[brand.slug] = data.id;
    console.log(`  + Created brand: ${brand.name}`);
  }

  // ─── Check for existing 6pm products ─────────────────────────────────────────
  const existingSlugs = new Set<string>();
  const { data: existingProducts } = await supabase
    .from("products")
    .select("slug", { count: "exact" })
    .ilike("title", "6pm %");

  for (const p of existingProducts || []) {
    existingSlugs.add(p.slug);
  }

  console.log(`\n✓ Existing 6pm products: ${existingProducts?.length || 0}`);

  // ─── Generate all products ───────────────────────────────────────────────────
  console.log("\n📦 Generating products...");

  const allProducts: GeneratedProduct[] = [];

  for (const [categorySlug, template] of Object.entries(PRODUCT_TEMPLATES)) {
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    const gender = genderMap[categorySlug];
    const variantSizeList = template.usesShoeSizes ? SIZES_SHOES : SIZES_CLOTHING;
    const brandKeys = Object.keys(createdBrands);

    for (const name of template.names) {
      for (let v = 1; v <= 6; v++) {
        const modelName = `${name} ${v}`;
        const productName = `6pm ${modelName}`;
        const slug = slugify(`${name}-${v}-${categorySlug}`);

        if (existingSlugs.has(slug)) {
          continue;
        }

        const brandKey = brandKeys[Math.floor(Math.random() * brandKeys.length)];
        const brandId = createdBrands[brandKey];

        const priceVariance = (Math.random() - 0.5) * 20;
        const price = Math.round((template.basePrice + priceVariance) * 100) / 100;
        const comparePrice = template.discount
          ? Math.round((price * (1 + (0.15 + Math.random() * 0.2))) * 100) / 100
          : undefined;

        const selectedColors = shuffle(template.colors).slice(0, 3);

        const variants: GeneratedProduct["variants"] = [];
        const numSizes = template.usesShoeSizes ? 3 : 2;
        const sizesToUse = shuffle(variantSizeList).slice(0, numSizes + 2);

        for (const color of selectedColors) {
          for (const size of sizesToUse) {
            const variantPrice = template.discount
              ? Math.round((price * (0.9 + Math.random() * 0.05)) * 100) / 100
              : price;

            variants.push({
              size,
              color,
              circle: "1",
              price: variantPrice,
              compare_price: template.discount ? Math.round(variantPrice * 1.15 * 100) / 100 : undefined,
              inventory_quantity: 25 + Math.floor(Math.random() * 50),
              sku: `${categorySlug}-${size}-${color}`.toUpperCase().replace(/\s+/g, "-"),
            });
          }
        }

        const images = [0, 1, 2].map((idx) => ({
          image_url: imageUrl(`${slug}-${idx + 1}`),
          alt_text: `${productName} - view ${idx + 1}`,
          sort_order: idx,
          is_primary: idx === 0,
        }));

        allProducts.push({
          title: productName,
          slug,
          description: DESCS[Math.floor(Math.random() * DESCS.length)],
          price,
          compare_price: comparePrice,
          category_id: categoryId,
          brand_id: brandId,
          gender,
          status: "active",
          inventory_quantity: 100,
          low_stock_threshold: 5,
          short_description: `Premium ${modelName} from our ${categorySlug.replace(/-/g, " ")} collection.`,
          variants,
          images,
        });
      }
    }
  }

  console.log(`  Generated ${allProducts.length} products`);

  // ─── Check if gender column exists in the live schema ────────────────────────
  const hasGenderColumn = await hasColumn("products", "gender");
  if (hasGenderColumn) {
    console.log("✓ 'gender' column detected");
  } else {
    console.log("⚠ 'gender' column not found — skipping gender field in inserts");
  }

   // ─── Batch insert products ───────────────────────────────────────────────────
  console.log("\n📥 Inserting products into database...");

  let createdCount = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = allProducts.slice(i, i + BATCH_SIZE);
    console.log(`  Batch ${i / BATCH_SIZE + 1}/${Math.ceil(allProducts.length / BATCH_SIZE)} — ${batch.length} products`);

    // Build product insert rows (strip variant/image sub-objects)
    const productRows = batch.map((prod) => {
      const row: Record<string, unknown> = {
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        compare_price: prod.compare_price,
        category_id: prod.category_id,
        brand_id: prod.brand_id,
        status: prod.status,
        inventory_quantity: prod.inventory_quantity,
        low_stock_threshold: prod.low_stock_threshold,
        short_description: prod.short_description,
      };
      if (hasGenderColumn && prod.gender) {
        row.gender = prod.gender;
      }
      return row;
    });

    const { data: insertedProducts, error: batchErr } = await supabase
      .from("products")
      .insert(productRows)
      .select("id, slug");

    if (batchErr) {
      console.error(`  ✗ Batch insert failed, falling back to individual inserts:`, batchErr.message);
      // Fallback: insert one by one
      for (const prod of batch) {
        const productInsert: Record<string, unknown> = {
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          compare_price: prod.compare_price,
          category_id: prod.category_id,
          brand_id: prod.brand_id,
          status: prod.status,
          inventory_quantity: prod.inventory_quantity,
          low_stock_threshold: prod.low_stock_threshold,
          short_description: prod.short_description,
        };
        if (hasGenderColumn && prod.gender) {
          productInsert.gender = prod.gender;
        }

        const { data: insertedProduct, error: prodErr } = await supabase
          .from("products")
          .insert(productInsert)
          .select("id")
          .single();

        if (prodErr) {
          console.error(`  ✗ Failed: ${prod.title}`, prodErr.message);
          continue;
        }

        await insertProductRelations(insertedProduct.id, prod, warehouseId);
        createdCount++;
      }
      continue;
    }

    if (!insertedProducts || insertedProducts.length === 0) continue;

    // Map inserted products by slug to find their IDs
    const insertedById: Record<string, string> = {};
    for (const p of insertedProducts) {
      insertedById[p.slug] = p.id;
    }

    // Batch insert variants for all products in this batch
    const allVariantInserts: Array<Record<string, unknown>> = [];
    const allImageInserts: Array<Record<string, unknown>> = [];
    const productVariantMap: Record<string, Array<{ id: string; inventory_quantity: number }>> = {};

    for (const prod of batch) {
      const productId = insertedById[prod.slug];
      if (!productId) continue;

      for (const v of prod.variants) {
        allVariantInserts.push({
          product_id: productId,
          size: v.size,
          color: v.color,
          circle: v.circle,
          price: v.price,
          compare_price: v.compare_price,
          inventory_quantity: v.inventory_quantity,
          sku: v.sku,
        });
      }

      for (const img of prod.images) {
        allImageInserts.push({
          product_id: productId,
          image_url: img.image_url,
          alt_text: img.alt_text,
          sort_order: img.sort_order,
          is_primary: img.is_primary,
        });
      }
    }

    if (allVariantInserts.length > 0) {
      const { data: variantRows, error: variantErr } = await supabase
        .from("product_variants")
        .insert(allVariantInserts)
        .select("id, product_id, inventory_quantity");

      if (variantErr) {
        console.error(`  ✗ Batch variant insert failed:`, variantErr.message);
      } else if (variantRows) {
        for (const vr of variantRows) {
          if (!productVariantMap[vr.product_id]) {
            productVariantMap[vr.product_id] = [];
          }
          productVariantMap[vr.product_id].push({ id: vr.id, inventory_quantity: vr.inventory_quantity });
        }
      }
    }

    if (allImageInserts.length > 0) {
      const { error: imgErr } = await supabase
        .from("product_images")
        .insert(allImageInserts);

      if (imgErr) {
        console.error(`  ✗ Batch image insert failed:`, imgErr.message);
      }
    }

    // Batch insert stock records
    const allStockInserts: Array<Record<string, unknown>> = [];
    for (const prod of batch) {
      const productId = insertedById[prod.slug];
      if (!productId) continue;

      const variants = productVariantMap[productId];
      if (variants && variants.length > 0) {
        for (const vr of variants) {
          const qty = vr.inventory_quantity || 50;
          allStockInserts.push({
            warehouse_id: warehouseId,
            product_id: productId,
            variant_id: vr.id,
            quantity: qty,
            available_quantity: qty,
            reserved_quantity: 0,
            reorder_threshold: 5,
          });
        }
      } else {
        allStockInserts.push({
          warehouse_id: warehouseId,
          product_id: productId,
          variant_id: null,
          quantity: 100,
          available_quantity: 100,
          reserved_quantity: 0,
          reorder_threshold: 5,
        });
      }
    }

    if (allStockInserts.length > 0) {
      const { error: stockErr } = await supabase
        .from("stock")
        .insert(allStockInserts);

      if (stockErr) {
        console.error(`  ✗ Batch stock insert failed:`, stockErr.message);
      }
    }

    createdCount += insertedProducts.length;
    console.log(`  ✓ Batch complete — ${createdCount} total products created`);
  }

  console.log(`\n✓ Seed complete!`);
  console.log(`  Categories: ${Object.keys(createdCategories).length}`);
  console.log(`  Brands: ${Object.keys(createdBrands).length}`);
  console.log(`  New products created: ${createdCount}`);
  await pgClient.end();
  process.exit(0);
}

async function insertProductRelations(productId: string, prod: GeneratedProduct, warehouseId: string) {
  // Insert variants
  const variantInserts = prod.variants.map((v) => ({ product_id: productId, ...v }));
  const { data: variantRows, error: variantErr } = await supabase
    .from("product_variants")
    .insert(variantInserts)
    .select("id, inventory_quantity");

  if (variantErr) {
    console.error(`  ✗ Variant error for ${prod.title}:`, variantErr.message);
  }

  // Insert images
  const imageInserts = prod.images.map((img) => ({ product_id: productId, ...img }));
  const { error: imgErr } = await supabase
    .from("product_images")
    .insert(imageInserts);

  if (imgErr) {
    console.error(`  ✗ Image error for ${prod.title}:`, imgErr.message);
  }

  // Create stock records
  if (variantRows && variantRows.length > 0) {
    const stockInserts = variantRows.map((vr) => ({
      warehouse_id: warehouseId,
      product_id: productId,
      variant_id: vr.id,
      quantity: vr.inventory_quantity || 50,
      available_quantity: vr.inventory_quantity || 50,
      reserved_quantity: 0,
      reorder_threshold: 5,
    }));
    const { error: stockErr } = await supabase
      .from("stock")
      .insert(stockInserts);

    if (stockErr) {
      console.error(`  ✗ Stock error for ${prod.title}:`, stockErr.message);
    }
  } else {
    const { error: stockErr } = await supabase
      .from("stock")
      .insert({
        warehouse_id: warehouseId,
        product_id: productId,
        variant_id: null,
        quantity: 100,
        available_quantity: 100,
        reserved_quantity: 0,
        reorder_threshold: 5,
      });

    if (stockErr) {
      console.error(`  ✗ Stock error for ${prod.title}:`, stockErr.message);
    }
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
