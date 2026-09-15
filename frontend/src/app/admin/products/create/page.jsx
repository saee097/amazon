"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  Package,
  Trash2,
  Upload,
  Save,
  ArrowLeft,
  Tag,
  Boxes,
  DollarSign,
  Layers,
  Info,
  Truck,
} from "lucide-react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useState, useMemo } from "react";

const STATUS_OPTIONS = [
  { value: "active", label: "Active — Visible to customers" },
  { value: "draft", label: "Draft — Hidden from customers" },
  { value: "archived", label: "Archived — Hidden from customers" },
];

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-start gap-4 border-b border-gray-200 bg-gray-50/60 px-6 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/10 text-[#0F766E]">
          <Icon size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-gray-500">{description}</p> : null}
        </div>
      </header>
      <div className="space-y-6 px-6 py-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700">
        <span>
          {label}
          {required ? <span className="ml-1 text-rose-500">*</span> : null}
        </span>
        {hint ? <span className="text-xs font-normal text-gray-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15";

export default function AdminProductsCreate() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [tagsInput, setTagsInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    compare_price: "",
    cost_price: "",
    category: "",
    brand: "",
    status: "active",
    sku: "",
    barcode: "",
    inventory_quantity: 0,
    low_stock_threshold: 5,
    weight: "",
    weight_unit: "kg",
    dimensions: { length: "", width: "", height: "" },
    taxable: true,
    requires_shipping: true,
    is_featured: false,
    meta_title: "",
    meta_description: "",
    images: [],
    variants: [],
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/auth/login");
      return;
    }
    const loadOptions = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get("/categories"),
          api.get("/brands"),
        ]);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
      } catch (error) {
        console.error("Failed to load options:", error);
      }
    };
    loadOptions();
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTitleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, slug: name === "title" ? slugify(value) : f.slug }));
  };

  const handleDimensionChange = (key, value) => {
    setForm((f) => ({ ...f, dimensions: { ...f.dimensions, [key]: value } }));
  };

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const dataUrls = await Promise.all(files.map(readFileAsDataURL));
      setForm((f) => ({
        ...f,
        images: [
          ...f.images,
          ...dataUrls.map((url, idx) => ({
            _id: `local-${Date.now()}-${idx}`,
            image_url: url,
            alt_text: f.title,
            sort_order: f.images.length + idx,
          })),
        ],
      }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (id) => setForm((f) => ({ ...f, images: f.images.filter((i) => i._id !== id) }));

  const addVariant = () =>
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        {
          _id: `new-${Date.now()}`,
          size: "",
          color: "",
          price: f.price || "",
          compare_price: f.compare_price || "",
          inventory_quantity: 0,
          sku: "",
          weight: "",
        },
      ],
    }));

  const updateVariant = (id, key, value) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v._id === id ? { ...v, [key]: value } : v)) }));

  const removeVariant = (id) => setForm((f) => ({ ...f, variants: f.variants.filter((v) => v._id !== id) }));

  const stockSummary = useMemo(() => {
    const total = form.variants.reduce((s, v) => s + Number(v.inventory_quantity || 0), 0);
    return total || Number(form.inventory_quantity || 0);
  }, [form.variants, form.inventory_quantity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
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
        tags,
        images: form.images.map((img, idx) => ({
          image_url: img.image_url,
          alt_text: img.alt_text || form.title,
          sort_order: idx,
          is_primary: idx === 0,
        })),
        variants: form.variants.map((v) => ({
          size: v.size,
          color: v.color,
          price: v.price === "" ? undefined : Number(v.price),
          compare_price: v.compare_price === "" ? undefined : Number(v.compare_price),
          inventory_quantity: Number(v.inventory_quantity) || 0,
          sku: v.sku,
          weight: v.weight === "" ? undefined : Number(v.weight),
        })),
      };
      const res = await api.post("/products", productData);
      if (res.data.success) router.push("/admin/products");
    } catch (error) {
      console.error("Failed to create product:", error);
      alert(error?.response?.data?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F766E]/10 text-[#0F766E]">
            <Package size={22} />
          </span>
          <div>
            <p className="text-sm font-medium text-[#0F766E]">Catalog</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-950">Add new product</h1>
            <p className="mt-1 text-sm text-gray-500">Create a product with media, variants, inventory and SEO settings.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><ArrowLeft size={15} /> Back</button>
          <button type="submit" form="product-create-form" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0F766E]/90 disabled:opacity-60">
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {submitting ? "Creating..." : "Create product"}
          </button>
        </div>
      </div>

      <form id="product-create-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section icon={Info} title="Basic information" description="Core details customers will see in your store.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product title" required>
                <input type="text" name="title" value={form.title} onChange={handleTitleChange} required className={inputClass} placeholder="Enter product title" />
              </Field>
              <Field label="URL slug" required hint="auto-generated">
                <input type="text" name="slug" value={form.slug} onChange={handleChange} required className={inputClass} />
              </Field>
            </div>
            <Field label="Short description" hint="Shown in product cards">
              <input type="text" name="shortDescription" value={form.shortDescription} onChange={handleChange} className={inputClass} placeholder="One-line summary" />
            </Field>
            <Field label="Full description">
              <textarea name="description" value={form.description} onChange={handleChange} rows={5} className={inputClass} placeholder="Rich description..." />
            </Field>
          </Section>

          <Section icon={ImagePlus} title="Media" description="Upload product images. First image is used as the cover.">
            <div onClick={() => fileInputRef.current?.click()} className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-[#0F766E] hover:bg-[#0F766E]/5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0F766E] shadow-sm ring-1 ring-gray-200"><Upload size={20} /></span>
              <p className="text-sm font-medium text-gray-800">Click to upload product images</p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB. Multiple files supported.</p>
              {uploading && <p className="flex items-center gap-2 text-xs text-[#0F766E]"><Loader2 size={12} className="animate-spin" /> Uploading...</p>}
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImagesUpload} />
            </div>
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {form.images.map((img, idx) => (
                  <div key={img._id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <img src={img.image_url} alt={img.alt_text || "Product"} className="aspect-square w-full object-cover" />
                    <button type="button" onClick={() => removeImage(img._id)} className="absolute right-2 top-2 rounded-md bg-white/90 p-1 text-rose-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-white"><Trash2 size={13} /></button>
                    {idx === 0 && <span className="absolute left-2 top-2 rounded-md bg-[#0F766E] px-2 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section icon={DollarSign} title="Pricing" description="Set price, cost and promotional pricing.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price" required hint="USD"><input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" required className={inputClass} /></Field>
              <Field label="Compare at price" hint="Strike-through"><input type="number" name="compare_price" value={form.compare_price} onChange={handleChange} min="0" step="0.01" className={inputClass} /></Field>
              <Field label="Cost per item" hint="For profit reports"><input type="number" name="cost_price" value={form.cost_price} onChange={handleChange} min="0" step="0.01" className={inputClass} /></Field>
            </div>
          </Section>

          <Section icon={Boxes} title="Inventory & variants" description="Track stock by size, color or any variant.">
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="SKU"><input type="text" name="sku" value={form.sku} onChange={handleChange} className={inputClass} placeholder="SKU-001" /></Field>
              <Field label="Barcode"><input type="text" name="barcode" value={form.barcode} onChange={handleChange} className={inputClass} /></Field>
              <Field label="Base stock" hint="When no variants"><input type="number" name="inventory_quantity" value={form.inventory_quantity} onChange={handleChange} min="0" className={inputClass} /></Field>
              <Field label="Low-stock alert" hint="units"><input type="number" name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} min="0" className={inputClass} /></Field>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Variants</p>
                  <p className="text-xs text-gray-500">Total stock across variants: <span className="font-semibold text-gray-700">{stockSummary}</span></p>
                </div>
                <button type="button" onClick={addVariant} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"><ImagePlus size={14} /> Add variant</button>
              </div>
              {form.variants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">No variants yet. Add size, color or bundle options to manage stock per option.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr><th className="px-3 py-2 text-left font-medium">Size</th><th className="px-3 py-2 text-left font-medium">Color</th><th className="px-3 py-2 text-left font-medium">SKU</th><th className="px-3 py-2 text-left font-medium">Price</th><th className="px-3 py-2 text-left font-medium">Stock</th><th className="px-3 py-2 text-left font-medium">Weight</th><th className="px-3 py-2 text-right font-medium">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.variants.map((v) => (
                        <tr key={v._id} className="bg-white">
                          <td className="px-3 py-2"><input className={inputClass + " py-1.5"} value={v.size} onChange={(e) => updateVariant(v._id, "size", e.target.value)} /></td>
                          <td className="px-3 py-2"><input className={inputClass + " py-1.5"} value={v.color} onChange={(e) => updateVariant(v._id, "color", e.target.value)} /></td>
                          <td className="px-3 py-2"><input className={inputClass + " py-1.5"} value={v.sku} onChange={(e) => updateVariant(v._id, "sku", e.target.value)} /></td>
                          <td className="px-3 py-2"><input type="number" className={inputClass + " py-1.5"} value={v.price} onChange={(e) => updateVariant(v._id, "price", e.target.value)} /></td>
                          <td className="px-3 py-2"><input type="number" className={inputClass + " py-1.5"} value={v.inventory_quantity} onChange={(e) => updateVariant(v._id, "inventory_quantity", e.target.value)} /></td>
                          <td className="px-3 py-2"><input type="number" className={inputClass + " py-1.5"} value={v.weight} onChange={(e) => updateVariant(v._id, "weight", e.target.value)} /></td>
                          <td className="px-3 py-2 text-right"><button type="button" onClick={() => removeVariant(v._id)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Section>

          <Section icon={Truck} title="Shipping" description="Physical properties required for shipping calculations.">
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Weight" hint={form.weight_unit}>
                <div className="flex gap-2">
                  <input type="number" name="weight" value={form.weight} onChange={handleChange} min="0" step="0.01" className={inputClass} />
                  <select name="weight_unit" value={form.weight_unit} onChange={handleChange} className={inputClass + " w-24"}>
                    <option value="kg">kg</option><option value="lb">lb</option><option value="g">g</option><option value="oz">oz</option>
                  </select>
                </div>
              </Field>
              <Field label="Length"><input type="number" value={form.dimensions.length} onChange={(e) => handleDimensionChange("length", e.target.value)} min="0" className={inputClass} /></Field>
              <Field label="Width"><input type="number" value={form.dimensions.width} onChange={(e) => handleDimensionChange("width", e.target.value)} min="0" className={inputClass} /></Field>
              <Field label="Height"><input type="number" value={form.dimensions.height} onChange={(e) => handleDimensionChange("height", e.target.value)} min="0" className={inputClass} /></Field>
            </div>
            <div className="flex flex-wrap gap-6 pt-2 text-sm text-gray-700">
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="requires_shipping" checked={form.requires_shipping} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]" /> Requires shipping</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="taxable" checked={form.taxable} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]" /> Charge tax</label>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section icon={Layers} title="Organization" description="Categorize and feature this product.">
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                <option value="">Select Category</option>
                {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.category_name}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <select name="brand" value={form.brand} onChange={handleChange} className={inputClass}>
                <option value="">Select Brand</option>
                {brands.map((b) => <option key={b._id} value={b._id}>{b.brand_name}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="comma separated">
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputClass} placeholder="summer, cotton, sale" />
            </Field>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]" /> Feature on storefront
            </label>
          </Section>

          <Section icon={Tag} title="SEO" description="Search engine metadata.">
            <Field label="Meta title"><input type="text" name="meta_title" value={form.meta_title} onChange={handleChange} className={inputClass} /></Field>
            <Field label="Meta description"><textarea name="meta_description" value={form.meta_description} onChange={handleChange} rows={3} className={inputClass} /></Field>
          </Section>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 shadow-sm">
            <p className="font-semibold">Inventory summary</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>Variants defined: <strong>{form.variants.length}</strong></li>
              <li>Total stock: <strong>{stockSummary}</strong></li>
              <li>Low-stock threshold: <strong>{form.low_stock_threshold}</strong></li>
              <li>Status: <strong className="capitalize">{form.status}</strong></li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}