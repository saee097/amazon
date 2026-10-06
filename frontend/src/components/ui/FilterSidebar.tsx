"use client";

import { useState, useMemo } from "react";
import { FiX, FiChevronDown, FiChevronUp, FiDollarSign, FiTag, FiPackage, FiDroplet, FiFilter, FiSliders, FiUser } from "react-icons/fi";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Product = {
  _id: string;
  title: string;
  price?: number;
  compare_price?: number;
  slug: string;
  category?: { _id: string; category_name: string; slug?: string };
  gender?: string;
  brand?: { _id: string; brand_name: string };
  variants?: {
    _id: string;
    size: string;
    color: string;
    circle?: string;
    price: number;
    compare_price?: number;
    inventory_quantity: number;
  }[];
  image?: { image_url: string; alt_text?: string };
  created_at?: string;
};

type Category = {
  _id: string;
  category_name: string;
  slug: string;
};

type FilterSidebarProps = {
  products: Product[];
  categories: Category[];
  initialFilters?: {
    category?: string;
    inStock?: boolean;
    outOfStock?: boolean;
    sizes?: string[];
    colors?: string[];
    genders?: string[];
    priceMin?: string;
    priceMax?: string;
  };
  onFiltersChange?: (filters: {
    category?: string;
    inStock?: boolean;
    outOfStock?: boolean;
    sizes?: string[];
    colors?: string[];
    genders?: string[];
    priceMin?: string;
    priceMax?: string;
  }) => void;
  isOpen?: boolean;
  onClose?: () => void;
};

const sizeOrder: Record<string, number> = {
  "XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "XXL": 6, "XXXL": 7,
  "28": 10, "30": 11, "32": 12, "34": 13, "36": 14, "38": 15, "40": 16, "42": 17,
  "One Size": 100
};

const colorOrder = [
  "Black", "Brown", "Blue", "Gray", "Grey", "Pink", "Green", "Multi", 
  "White", "Tan", "Purple", "Red", "Ivory", "Yellow", "Gold", "Orange", "Silver", "Animal"
];

const colorMap: Record<string, string> = {
  "Black": "#000000",
  "Brown": "#8B4513",
  "Blue": "#0000FF",
  "Gray": "#808080",
  "Grey": "#808080",
  "Pink": "#FFC0CB",
  "Green": "#008000",
  "Multi": "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #FFA07A, #98D8C8)",
  "White": "#FFFFFF",
  "Tan": "#D2B48C",
  "Purple": "#800080",
  "Red": "#FF0000",
  "Ivory": "#FFFFF0",
  "Yellow": "#FFD700",
  "Gold": "#FFD700",
  "Orange": "#FFA500",
  "Silver": "#C0C0C0",
  "Animal": "linear-gradient(45deg, #8B4513, #D2B48C, #FFFFFF, #000000)",
};

const genderOrder = ["Men", "Women", "Unisex", "Kids", "Baby"];

function FilterSection({ title, children, isOpen, onToggle, icon }: { 
  title: string; 
  children: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none rounded-lg -mx-3 px-3"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#0F766E]">{icon}</span>}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <FiChevronUp size={16} className="text-gray-500 dark:text-gray-400 transition-transform" />
          ) : (
            <FiChevronDown size={16} className="text-gray-500 dark:text-gray-400 transition-transform" />
          )}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 pt-2" : "max-h-0 opacity-0 -mt-2"}`}>
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange, count, disabled = false, className = "" }: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`flex items-center gap-3 text-sm cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#0F766E] focus:outline-none transition"
      />
      <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-normal">
          ({count})
        </span>
      )}
    </label>
  );
}

function ColorChip({ color, count, checked, onChange, disabled = false }: {
  color: string;
  count: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean; 
}) {
  const bgColor = colorMap[color] || "#6b7280";
  const isGradient = bgColor.startsWith("linear-gradient");
  const isLight = ["White", "Yellow", "Gold", "Silver", "Ivory", "Tan"].includes(color);
  
  return (
    <label className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${disabled
      ? "opacity-50 cursor-not-allowed"
      : checked
        ? "border-[#0F766E] bg-[#0F766E] text-white"
        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E]"
    }`}>
      <span
        className="w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center"
        style={{
          background: isGradient ? bgColor : bgColor,
          borderColor: isLight && !checked ? "#d1d5db" : "transparent",
        }}
      >
        {checked && !isGradient && (
          <FiX size={10} className={isLight ? "text-gray-600" : "text-white"} />
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span className="text-sm font-medium whitespace-nowrap">{color}</span>
      <span className={`text-xs font-normal ${checked ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
        {count}
      </span>
    </label>
  );
}

function SizeButton({ size, selected, onClick, disabled = false }: {
  size: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 flex items-center justify-center text-xs font-medium border rounded-lg transition-all duration-200 ${disabled
        ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed"
        : selected
          ? "border-[#0F766E] bg-[#0F766E] text-white"
          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E] hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
      aria-pressed={selected}
    >
      {size}
    </button>
  );
}

function PriceRangeSlider({ min, max, onChange }: { 
  min: string; 
  max: string; 
  onChange: (min: string, max: string) => void;
}) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);

  const handleMinChange = (value: string) => {
    const numValue = Number(value);
    const numMax = Number(localMax);
    if (!isNaN(numValue) && !isNaN(numMax) && numValue > numMax) {
      setLocalMax(value);
      onChange(value, value);
    } else {
      setLocalMin(value);
      onChange(value, localMax);
    }
  };

  const handleMaxChange = (value: string) => {
    const numValue = Number(value);
    const numMin = Number(localMin);
    if (!isNaN(numValue) && !isNaN(numMin) && numValue < numMin) {
      setLocalMin(value);
      onChange(value, value);
    } else {
      setLocalMax(value);
      onChange(localMin, value);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label htmlFor="price-min" className="sr-only">Minimum price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
            <input
              id="price-min"
              type="number"
              min="0"
              max="10000"
              step="1"
              value={localMin}
              onChange={(e) => handleMinChange(e.target.value)}
              placeholder="Min"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
            />
          </div>
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">-</span>
        <div className="flex-1">
          <label htmlFor="price-max" className="sr-only">Maximum price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
            <input
              id="price-max"
              type="number"
              min="0"
              max="10000"
              step="1"
              value={localMax}
              onChange={(e) => handleMaxChange(e.target.value)}
              placeholder="Max"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Min: ${min || 0}</span>
        <span>Max: ${max || 10000}</span>
      </div>
    </div>
  );
}

export default function FilterSidebar({ 
  products, 
  categories, 
  initialFilters = {},
  onFiltersChange,
  isOpen = false,
  onClose
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    availability: false,
    categories: false,
    gender: false,
    size: false,
    color: false,
    price: false,
  });

  const [filters, setFilters] = useState({
    category: initialFilters.category || searchParams.get("category") || "",
    inStock: initialFilters.inStock ?? false,
    outOfStock: initialFilters.outOfStock ?? false,
    sizes: initialFilters.sizes || [],
    colors: initialFilters.colors || [],
    genders: initialFilters.genders || [],
    priceMin: initialFilters.priceMin || "",
    priceMax: initialFilters.priceMax || "",
  });

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => p.variants?.forEach(v => v.size && sizes.add(v.size)));
    return Array.from(sizes).sort((a, b) => (sizeOrder[a] || 99) - (sizeOrder[b] || 99));
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.variants?.forEach(v => v.color && colors.add(v.color)));
    return Array.from(colors).sort();
  }, [products]);

  const inStockCount = useMemo(() => 
    products.filter(p => p.variants?.some(v => (v.inventory_quantity ?? 0) > 0)).length,
    [products]
  );

  const outOfStockCount = useMemo(() => 
    products.filter(p => !p.variants?.some(v => (v.inventory_quantity ?? 0) > 0)).length,
    [products]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.category?.slug) {
        counts[p.category.slug] = (counts[p.category.slug] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const sizeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      p.variants?.forEach(v => {
        if (v.size) {
          counts[v.size] = (counts[v.size] || 0) + 1;
        }
      });
    });
    return counts;
  }, [products]);

  const colorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      p.variants?.forEach(v => {
        if (v.color) {
       counts[v.color] = (counts[v.color] || 0) + 1;
        }
       });
     });
     return counts;
   }, [products]);

   const availableGenders = useMemo(() => {
     const genders = new Set<string>();
     products.forEach(p => {
       if (p.gender) {
         genders.add(p.gender);
       }
     });
     return Array.from(genders).sort((a, b) => {
       const aIdx = genderOrder.indexOf(a);
       const bIdx = genderOrder.indexOf(b);
       if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
       if (aIdx === -1) return 1;
       if (bIdx === -1) return -1;
       return aIdx - bIdx;
     });
   }, [products]);

   const genderCounts = useMemo(() => {
     const counts: Record<string, number> = {};
     products.forEach(p => {
       if (p.gender) {
         counts[p.gender] = (counts[p.gender] || 0) + 1;
       }
     });
     return counts;
   }, [products]);

  const hasActiveFilters = filters.inStock || filters.outOfStock || 
    filters.sizes.length > 0 || filters.colors.length > 0 || 
    filters.genders.length > 0 ||
    filters.priceMin || filters.priceMax || filters.category;

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange?.(updated);
    
    const params = new URLSearchParams(searchParams.toString());
    if (updated.category) params.set("category", updated.category);
    else params.delete("category");
    if (updated.inStock) params.set("inStock", "true");
    else params.delete("inStock");
    if (updated.outOfStock) params.set("outOfStock", "true");
    else params.delete("outOfStock");
    if (updated.sizes.length > 0) params.set("sizes", updated.sizes.join(","));
    else params.delete("sizes");
    if (updated.colors.length > 0) params.set("colors", updated.colors.join(","));
    else params.delete("colors");
    if (updated.genders.length > 0) params.set("gender", updated.genders.join(","));
    else params.delete("gender");
    if (updated.priceMin) params.set("minPrice", updated.priceMin);
    else params.delete("minPrice");
    if (updated.priceMax) params.set("maxPrice", updated.priceMax);
    else params.delete("maxPrice");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const cleared = {
      category: "",
      inStock: false,
      outOfStock: false,
      sizes: [],
      colors: [],
      genders: [],
      priceMin: "",
      priceMax: "",
    };
    setFilters(cleared);
    onFiltersChange?.(cleared);
    router.push(pathname);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const sizeDisabled = (size: string) => {
    if (filters.sizes.length === 0) return false;
    const otherSizes = filters.sizes.filter(s => s !== size);
    return !products.some(p => p.variants?.some(v => v.size === size && otherSizes.includes(v.size)));
  };

  const colorDisabled = (color: string) => {
    if (filters.colors.length === 0) return false;
    const otherColors = filters.colors.filter(c => c !== color);
    return !products.some(p => p.variants?.some(v => v.color === color && otherColors.includes(v.color)));
  };

  if (typeof window === "undefined") return null;

  return (
    <aside className={`fixed inset-0 z-50 lg:static lg:relative lg:z-auto lg:inset-auto w-full lg:w-72 flex-shrink-0 transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      {/* Mobile backdrop */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      
      <div className="h-full lg:h-auto flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Close filters"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Desktop Header with Clear All */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#0F766E] hover:underline font-medium flex items-center gap-1"
            >
              <FiX size={12} />
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-1">
          {/* Availability */}
          <FilterSection
            title="Availability"
            isOpen={expandedSections.availability}
            onToggle={() => toggleSection("availability")}
            icon={<FiPackage size={16} />}
          >
            <div className="space-y-3">
              <Checkbox
                label="In Stock"
                checked={filters.inStock}
                onChange={(checked) => handleFilterChange({ inStock: checked, outOfStock: checked && filters.outOfStock ? false : filters.outOfStock })}
                count={inStockCount}
              />
              <Checkbox
                label="Out of Stock"
                checked={filters.outOfStock}
                onChange={(checked) => handleFilterChange({ outOfStock: checked, inStock: checked && filters.inStock ? false : filters.inStock })}
                count={outOfStockCount}
              />
            </div>
          </FilterSection>

          {/* Categories */}
          <FilterSection
            title="Product Category"
            isOpen={expandedSections.categories}
            onToggle={() => toggleSection("categories")}
            icon={<FiTag size={16} />}
          >
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={!filters.category}
                  onChange={() => handleFilterChange({ category: "" })}
                  className="w-4 h-4 text-[#0F766E] border-gray-300 dark:border-gray-600 focus:ring-[#0F766E] focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                />
                <span className={`font-medium ${!filters.category ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>
                  All Categories
                </span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-normal">
                  ({products.length})
                </span>
              </label>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => handleFilterChange({ category: cat.slug })}
                  className={`flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg transition-colors w-full text-left ${
                    filters.category === cat.slug || filters.category === cat.category_name.toLowerCase()
                      ? "bg-[#0F766E]/10 text-[#0F766E] font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="flex-1 truncate">{cat.category_name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal whitespace-nowrap">
                    ({categoryCounts[cat.slug] || 0})
                  </span>
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Size */}
          <FilterSection
            title="Size"
            isOpen={expandedSections.size}
            onToggle={() => toggleSection("size")}
            icon={<FiPackage size={16} />}
          >
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <SizeButton
                  key={size}
                  size={size}
                  selected={filters.sizes.includes(size)}
                  onClick={() => handleFilterChange({
                    sizes: filters.sizes.includes(size)
                      ? filters.sizes.filter(s => s !== size)
                      : [...filters.sizes, size]
                  })}
                  disabled={sizeDisabled(size)}
                />
              ))}
            </div>
            {filters.sizes.length > 0 && (
              <button
                onClick={() => handleFilterChange({ sizes: [] })}
                className="mt-3 w-full text-left text-xs text-[#0F766E] hover:underline font-medium flex items-center gap-1"
              >
                <FiX size={12} />
                Clear size filters
              </button>
            )}
          </FilterSection>

          {/* Color */}
          <FilterSection
            title="Color"
            isOpen={expandedSections.color}
            onToggle={() => toggleSection("color")}
            icon={<FiDroplet size={16} />}
          >
            <div className="flex flex-wrap gap-2">
              {colorOrder
                .filter((color) => availableColors.includes(color))
                .map((color) => (
                  <ColorChip
                    key={color}
                    color={color}
                    count={colorCounts[color] || 0}
                    checked={filters.colors.includes(color)}
                    onChange={(checked) => handleFilterChange({
                      colors: checked
                        ? [...filters.colors, color]
                        : filters.colors.filter(c => c !== color)
                    })}
                    disabled={colorDisabled(color)}
                  />
                ))}
              {availableColors
                .filter((color) => !colorOrder.includes(color))
                .map((color) => (
                  <ColorChip
                    key={color}
                    color={color}
                    count={colorCounts[color] || 0}
                    checked={filters.colors.includes(color)}
                    onChange={(checked) => handleFilterChange({
                      colors: checked
                        ? [...filters.colors, color]
                        : filters.colors.filter(c => c !== color)
                    })}
                    disabled={colorDisabled(color)}
                  />
                ))}
            </div>
            {filters.colors.length > 0 && (
              <button
                onClick={() => handleFilterChange({ colors: [] })}
                className="mt-3 w-full text-left text-xs text-[#0F766E] hover:underline font-medium flex items-center gap-1"
              >
                <FiX size={12} />
                Clear color filters
              </button>
            )}
          </FilterSection>

          {/* Gender */}
          <FilterSection
            title="Gender"
            isOpen={expandedSections.gender}
            onToggle={() => toggleSection("gender")}
            icon={<FiUser size={16} />}
          >
            <div className="space-y-3">
              {genderOrder
                .filter((gender) => availableGenders.includes(gender))
                .map((gender) => (
                  <Checkbox
                    key={gender}
                    label={gender}
                    checked={filters.genders.includes(gender)}
                    onChange={(checked) => handleFilterChange({
                      genders: checked
                        ? [...filters.genders, gender]
                        : filters.genders.filter(g => g !== gender)
                    })}
                    count={genderCounts[gender] || 0}
                  />
                ))}
              {availableGenders
                .filter((gender) => !genderOrder.includes(gender))
                .map((gender) => (
                  <Checkbox
                    key={gender}
                    label={gender}
                    checked={filters.genders.includes(gender)}
                    onChange={(checked) => handleFilterChange({
                      genders: checked
                        ? [...filters.genders, gender]
                        : filters.genders.filter(g => g !== gender)
                    })}
                    count={genderCounts[gender] || 0}
                  />
                ))}
            </div>
            {filters.genders.length > 0 && (
              <button
                onClick={() => handleFilterChange({ genders: [] })}
                className="mt-3 w-full text-left text-xs text-[#0F766E] hover:underline font-medium flex items-center gap-1"
              >
                <FiX size={12} />
                Clear gender filters
              </button>
            )}
          </FilterSection>

          {/* Price */}
          <FilterSection
            title="Price"
            isOpen={expandedSections.price}
            onToggle={() => toggleSection("price")}
            icon={<FiDollarSign size={16} />}
          >
            <PriceRangeSlider
              min={filters.priceMin}
              max={filters.priceMax}
              onChange={(min, max) => handleFilterChange({ priceMin: min, priceMax: max })}
            />
            {(filters.priceMin || filters.priceMax) && (
              <button
                onClick={() => handleFilterChange({ priceMin: "", priceMax: "" })}
                className="mt-3 w-full text-left text-xs text-[#0F766E] hover:underline font-medium flex items-center gap-1"
              >
                <FiX size={12} />
                Clear price filter
              </button>
            )}
          </FilterSection>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#0F766E] text-white rounded-lg font-medium hover:bg-[#0F766E]/90 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}