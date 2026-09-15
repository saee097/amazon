"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { FiHeart, FiSearch, FiStar, FiMinus, FiPlus, FiArrowLeft, FiShare } from "react-icons/fi";
import ProductImageGallery from "@/components/ui/ProductImageGallery";
import { getToken } from "@/lib/auth";

type ProductDetail = {
  _id: string;
  title: string;
  price?: number;
  compare_price?: number;
  slug: string;
  description?: string;
  category?: { _id: string; category_name: string; slug?: string };
  brand?: { _id: string; brand_name: string };
  variants?: Array<{
    _id: string;
    size: string;
    color: string;
    circle?: string;
    price: number;
    compare_price?: number;
    inventory_quantity: number;
  }>;
  images?: Array<{ _id: string; image_url: string; alt_text?: string; sort_order: number }>;
  reviews?: Array<{
    _id: string;
    rating: number;
    comment: string;
    customer?: { name?: string };
    created_at?: string;
  }>;
  created_at?: string;
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedCircle, setSelectedCircle] = useState<string>("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string>("");
  const router = useRouter();

  const productImages = product?.images?.length
    ? product.images
    : product?.images?.[0]
    ? [{ _id: "main", image_url: product.images[0].image_url, alt_text: product.images[0].alt_text || product.title }]
    : [];

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await api.get(`/store/products/${productId}`);
        const data = res.data.data || null;
        setProduct(data);

        if (data?.variants?.length) {
          const firstVariant = data.variants[0];
          setSelectedSize(firstVariant.size);
          setSelectedColor(firstVariant.color);
          setSelectedCircle(firstVariant.circle || "1");
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const selectedVariant = product?.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor && (v.circle || "1") === selectedCircle
  ) || product?.variants?.[0];

  const currentPrice = selectedVariant?.price || product?.price || 0;
  const comparePrice = selectedVariant?.compare_price || product?.compare_price || 0;
  const hasDiscount = comparePrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0;
  const inStock = (selectedVariant?.inventory_quantity ?? 0) > 0;
  const averageRating = product?.reviews?.length
    ? (product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / product.reviews.length).toFixed(1)
    : "0.0";

  const formatPrice = (price: number | undefined) => {
    if (!price && price !== 0) return "$0";
    return `$${price.toLocaleString()}`;
  };

  const productUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const addToCart = async () => {
    if (!product || !inStock) return;
    setAddingToCart(true);
    setCartMessage("");
    try {
      const token = getToken();
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const variant = selectedVariant || product.variants?.[0];
      const productId = variant ? product._id : product._id;
      await api.post("/store/cart", {
        productId,
        quantity,
      });
      setCartMessage("Added to cart successfully");
      setTimeout(() => setCartMessage(""), 3000);
    } catch {
      setCartMessage("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const buyNow = async () => {
    if (!product || !inStock) return;
    await addToCart();
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#0F766E] border-t-transparent animate-spin"></div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 dark:text-gray-100 text-lg font-medium mb-2">Product not found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">The product you are looking for does not exist or has been removed.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#0F766E] text-white text-sm font-medium hover:bg-[#0F766E]/90 transition rounded-lg"
          >
            <FiArrowLeft size={14} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#0F766E] transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#0F766E] transition">Products</Link>
          {product.category?.category_name && (
            <>
              <span>/</span>
              <Link
                href={`/products?category=${product.category.slug || product.category.category_name.toLowerCase()}`}
                className="hover:text-[#0F766E] transition"
              >
                {product.category.category_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* Product */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
{/* Images */}
             <div className="p-6 lg:p-8 bg-gray-50 dark:bg-gray-800">
               <ProductImageGallery
                 images={productImages}
                 title={product.title}
               />
             </div>

         

            {/* Details */}
            <div className="p-6 lg:p-8 flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                <h1 className="text-xl md:text-1xl font-medium text-gray-900 dark:text-gray-100 tracking-wide">
                  {product.title}
                </h1>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: product.title, text: `${product.title} - ${formatPrice(currentPrice)}`, url: productUrl });
                      }
                    }}
                    title="Share"
                    className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <FiShare size={14} />
                  </button>
                </div>
              </div> {/* Description */}
                {product.description && (
                  <div className="mt-6">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2"></h3>
<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3">
                  {product.brand?.brand_name && (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {product.brand.brand_name}
                    </span>
                  )}
                  {product.brand?.brand_name && product.category?.category_name && (
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                  )}
                  {product.category?.category_name && (
                    <Link
                      href={`/products?category=${product.category.slug || product.category.category_name.toLowerCase()}`}
                      className="text-xs text-[#0F766E] hover:underline uppercase tracking-wider"
                    >
                      {product.category.category_name}
                    </Link>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        size={16}
                        className={star <= Math.round(parseFloat(averageRating)) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {averageRating} ({product.reviews?.length || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mt-6">
                  <span className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                    {formatPrice(currentPrice)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(comparePrice)}
                      </span>
                      <span className="text-sm font-medium text-red-500">
                        -{discountPercent}%
                      </span>
                    </>
                  )}
                </div>

               

                {/* Variant Details */}
                {product?.variants && product.variants.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {(() => {
                      const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)));
                      const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)));

                      const availableColorsForSize = sizes.length > 0 && selectedSize
                        ? Array.from(new Set(
                            product.variants
                              .filter((v) => v.size === selectedSize)
                              .map((v) => v.color)
                              .filter(Boolean)
                          ))
                        : colors;

                      const availableSizesForColor = colors.length > 0 && selectedColor
                        ? Array.from(new Set(
                            product.variants
                              .filter((v) => v.color === selectedColor)
                              .map((v) => v.size)
                              .filter(Boolean)
                          ))
                        : sizes;

                       const handleSizeSelect = (size: string) => {
                        setSelectedSize(size);
                        const match = product?.variants?.find(
                          (v) => v.size === size && v.color === selectedColor
                        );
                        if (match) {
                          setSelectedColor(match.color);
                        } else if (availableColorsForSize.length > 0 && !availableColorsForSize.includes(selectedColor)) {
                          setSelectedColor(availableColorsForSize[0]);
                        }
                      };

                      const handleColorSelect = (color: string) => {
                        setSelectedColor(color);
                        const match = product?.variants?.find(
                          (v) => v.size === selectedSize && v.color === color
                        );
                        if (match) {
                          setSelectedSize(match.size);
                        } else if (availableSizesForColor.length > 0 && !availableSizesForColor.includes(selectedSize)) {
                          setSelectedSize(availableSizesForColor[0]);
                        }
                      };

                      return (
                        <>
                           {colors.length > 0 && (
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100  tracking-wider block mb-2">Choose Color</span>
                              <div className="flex flex-wrap gap-2">
                                {colors.map((color) => {
                                  const isAvailable = availableColorsForSize.length === 0 || availableColorsForSize.includes(color);
                                  const isSelected = selectedColor === color;
                                  return (
                                    <button
                                      key={color}
                                      onClick={() => handleColorSelect(color)}
                                      disabled={!isAvailable}
                                      className={`w-10 h-10 flex items-center justify-center text-sm border rounded-full transition ${
                                        isSelected
                                          ? "border-[#0F766E] bg-[#0F766E] text-white"
                                          : isAvailable
                                      ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E]"
                                           : "border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed"
                                      }`}
                                    >
                                      {color}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
{sizes.length > 0 && (
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100  tracking-wider block mb-2">Sellect Size</span>
                              <div className="flex flex-wrap gap-2">
                                {sizes.map((size) => {
                                  const isAvailable = availableSizesForColor.length === 0 || availableSizesForColor.includes(size);
                                  const isSelected = selectedSize === size;
                                  return (
                                    <button
                                      key={size}
                                      onClick={() => handleSizeSelect(size)}
                                      disabled={!isAvailable}
                                      className={`w-10 h-10 flex items-center justify-center text-sm border rounded-full transition ${
                                        isSelected
                                          ? "border-[#0F766E] bg-[#0F766E] text-white"
                                          : isAvailable
                                      ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#0F766E] hover:text-[#0F766E]"
                                           : "border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed"
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                       

                      

                          
                        </>
                      );
                    })()}
                  </div>
                )}

               {/* Quantity & Actions */}
{inStock && (
  <div className="mt-4">

    {/* Quantity & Stock */}
    <div className="flex items-center gap-px mb-6">

      {/* Quantity */}
      <div className=" mb-6  items-center gap-3">
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          Quantity
        </span>

        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FiMinus size={14} />
          </button>

          <span className="w-10 h-10 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-gray-100 border-x border-gray-300 dark:border-gray-600">
            {quantity}
          </span>

          <button
            onClick={() =>
              setQuantity((q) =>
                Math.min(selectedVariant?.inventory_quantity || 99, q + 1)
              )
            }
            className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FiPlus size={14} />
          </button>
        </div>
      </div>

      {/* Stock Status */}
      <div className="flex items-center ml-3">
        <span
          className={`text-sm font-semibold ${
            inStock ? "text-green-600" : "text-red-500"
          }`}
        >
          {inStock
            ? `In Stock (${selectedVariant?.inventory_quantity || 0})`
            : "Out of Stock"}
        </span>
      </div>
    </div>

     {/* Action Buttons */}
     <div className="flex gap-3">
       <button
         onClick={buyNow}
         disabled={!inStock || addingToCart}
         className="flex-1 py-3 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition disabled:opacity-70 disabled:cursor-not-allowed"
       >
         Buy Now
       </button>

       <button
         onClick={addToCart}
         disabled={!inStock || addingToCart}
         className="flex-1 py-3 border border-[#0F766E] text-[#0F766E] text-sm font-medium rounded-lg hover:bg-[#0F766E]/5 transition disabled:opacity-70 disabled:cursor-not-allowed"
       >
         {addingToCart ? "Adding..." : "Add to Cart"}
       </button>
     </div>

     {cartMessage && (
       <p className={`mt-3 text-sm ${cartMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`} role="status">
         {cartMessage}
       </p>
     )}

  </div>
)}
              </div>

              
             
             </div>
          </div>
        </div>

        {/* Reviews */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 tracking-wide mb-6">
              Customer Reviews ({product.reviews.length})
            </h2>
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                        {review.customer?.name?.charAt(0) || "U"}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {review.customer?.name || "Anonymous"}
                      </span>
                    </div>
                    {review.created_at && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        size={14}
                        className={star <= (review.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-500"}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
