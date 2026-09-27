import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

(async () => {
  // 1. Inspect products table columns
  console.log("=== products table columns ===");
  const { data: cols, error: colsErr } = await supabase.rpc("postgres_expire_connection");
  // fallback: query information_schema
  const { data: columns, error: colErr } = await supabase
    .from("information_schema.columns")
    .select("column_name, data_type, is_nullable, column_default")
    .eq("table_schema", "public")
    .eq("table_name", "products")
    .order("ordinal_position");
  if (colErr) console.error("colErr", colErr.message);
  console.log(columns?.map((c) => `${c.column_name} | ${c.data_type} | nullable=${c.is_nullable} | default=${c.column_default}`).join("\n"));

  // 2. Fetch a product with categories + brands joined (same as handler GET single)
  console.log("\n=== products with category/brand ===");
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("*, categories(*), brands(*)")
    .order("created_at", { ascending: false })
    .limit(5);
  if (pErr) console.error("pErr", pErr.message);
  console.log(JSON.stringify(products, null, 2));

  // 3. Pick first product and reproduce the PUT updates payload
  const p = products && products[0];
  if (!p) {
    console.log("\nNo products found, cannot reproduce PUT");
    return;
  }
  console.log("\n=== Reproducing PUT updates for product", p.id, "===");

  // Rebuild the form-derived productData (mirrors frontend handleSubmit + handler PUT mapping)
  const form = {
    title: p.title || "",
    slug: p.slug || "",
    description: p.description || "",
    shortDescription: p.short_description || "",
    price: p.price ?? "",
    compare_price: p.compare_price ?? "",
    cost_price: p.cost_price ?? "",
    category: p.categories?.id || "",
    brand: p.brands?.id || "",
    status: p.status || "draft",
    sku: p.sku || "",
    barcode: p.barcode || "",
    inventory_quantity: p.inventory_quantity ?? 0,
    inventory_policy: p.inventory_policy || "deny",
    low_stock_threshold: p.low_stock_threshold ?? 5,
    weight: p.weight ?? "",
    weight_unit: p.weight_unit || "kg",
    dimensions: p.dimensions || { length: "", width: "", height: "" },
    taxable: p.taxable ?? true,
    requires_shipping: p.requires_shipping ?? true,
    is_featured: p.is_featured ?? false,
    meta_title: p.meta_title || "",
    meta_description: p.meta_description || "",
    images: [],
    variants: [],
  };

  const tags = Array.isArray(p.tags) ? p.tags.join(", ") : "";
  const tagsInput = tags;
  const productData = {
    ...form,
    price: Number(form.price) || 0,
    compare_price: form.compare_price ? Number(form.compare_price) : undefined,
    cost_price: form.cost_price ? Number(form.cost_price) : undefined,
    inventory_quantity: Number(form.inventory_quantity) || 0,
    low_stock_threshold: Number(form.low_stock_threshold) || 0,
    weight: form.weight ? Number(form.weight) : undefined,
    dimensions: {
      length: form.dimensions.length ? Number(form.dimensions.length) : undefined,
      width: form.dimensions.width ? Number(form.dimensions.width) : undefined,
      height: form.dimensions.height ? Number(form.dimensions.height) : undefined,
    },
    category: form.category || undefined,
    brand: form.brand || undefined,
    tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    images: [],
    variants: [],
  };

  console.log("\n=== productData (body) ===");
  console.log(JSON.stringify(productData, null, 2));

  // Now mirror the handler's updates object exactly
  const body = productData;
  const updates = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.description !== undefined) updates.description = body.description;
  if (body.shortDescription !== undefined) updates.short_description = body.shortDescription;
  if (body.price !== undefined) updates.price = body.price;
  if (body.compare_price !== undefined) updates.compare_price = body.compare_price;
  if (body.cost_price !== undefined) updates.cost_price = body.cost_price;
  if (body.category !== undefined) updates.category_id = body.category || null;
  if (body.brand !== undefined) updates.brand_id = body.brand || null;
  if (body.sku !== undefined) updates.sku = body.sku;
  if (body.barcode !== undefined) updates.barcode = body.barcode;
  if (body.status !== undefined) updates.status = body.status;
  if (body.weight !== undefined) updates.weight = body.weight;
  if (body.weight_unit !== undefined) updates.weight_unit = body.weight_unit;
  if (body.dimensions !== undefined) updates.dimensions = body.dimensions;
  if (body.taxable !== undefined) updates.taxable = body.taxable;
  if (body.requires_shipping !== undefined) updates.requires_shipping = body.requires_shipping;
  if (body.is_featured !== undefined) updates.is_featured = body.is_featured;
  if (body.meta_title !== undefined) updates.meta_title = body.meta_title;
  if (body.meta_description !== undefined) updates.meta_description = body.meta_description;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.low_stock_threshold !== undefined) updates.low_stock_threshold = body.low_stock_threshold;

  console.log("\n=== updates object sent to supabase ===");
  console.log(JSON.stringify(updates, null, 2));

  const { data: updated, error: updErr } = await supabase
    .from("products")
    .update(updates)
    .eq("id", p.id)
    .select()
    .single();

  if (updErr) {
    console.log("\n=== SUPABASE UPDATE ERROR ===");
    console.log("message:", updErr.message);
    console.log("code:", updErr.code);
    console.log("details:", updErr.details);
    console.log("hint:", updErr.hint);
    console.log("full:", JSON.stringify(updErr, null, 2));
  } else {
    console.log("\n=== UPDATE SUCCESS ===", updated?.id);
  }

  process.exit(0);
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
