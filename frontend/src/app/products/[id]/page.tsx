"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { FiHeart, FiStar, FiMinus, FiPlus, FiArrowLeft, FiShare, FiEdit2, FiX, FiChevronRight } from "react-icons/fi";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa6";
import ProductImageGallery from "@/components/ui/ProductImageGallery";
import { getToken } from "@/lib/auth";
import { notifyStoreUpdate } from "@/lib/storeEvents";
import { ProductDetailSkeleton } from "@/components/ui/skeleton";
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
    status?: string;
    created_at?: string;
  }>;
  created_at?: string;
};
export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedCircle, setSelectedCircle] = useState<string>("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string>("");
  const [inWishlist, setInWishlist] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
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
    const checkWishlist = async () => {
      if (!getToken()) return;
      try {
        const { data } = await api.get("/store/wishlist");
        const items = data.data || [];
        const found = items.some((p: { _id: string }) => p._id === productId);
        setInWishlist(found);
      } catch {
        setInWishlist(false);
      }
    };
    if (productId) {
      loadProduct();
      checkWishlist();
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
      notifyStoreUpdate();
      setTimeout(() => setCartMessage(""), 3000);
    } catch {
      setCartMessage("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };
  const toggleWishlist = async () => {
    if (!product) return;
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      await api.post("/store/wishlist", { productId: product._id });
      setInWishlist((prev) => !prev);
      notifyStoreUpdate();
    } catch (err) {
      console.error("Failed to update wishlist:", err);
    }
  };
  const submitReview = async () => {
    if (!product || reviewRating === 0) return;
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setSubmittingReview(true);
    setReviewMessage("");
    try {
      await api.post(`/store/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewMessage("Review submitted! It will appear after admin approval.");
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment("");
      // The review is pending approval, so refreshing the public product data is optional.
      api.get(`/store/products/${productId}`)
        .then((res) => setProduct(res.data.data))
        .catch((error) => console.error("Review submitted, but product refresh failed:", error));
    } catch (error) {
      console.error("Failed to submit review:", error);
      const responseMessage = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setReviewMessage(responseMessage || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
      setTimeout(() => setReviewMessage(""), 3000);
    }
  };
  if (loading) {
    return <ProductDetailSkeleton />;
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
          <FiChevronRight size={12} aria-hidden="true" />
          <Link href="/products" className="hover:text-[#0F766E] transition">Products</Link>
          {product.category?.category_name && (
            <>
              <FiChevronRight size={12} aria-hidden="true" />
              <Link
                href={`/products?category=${product.category.slug || product.category.category_name.toLowerCase()}`}
                className="hover:text-[#0F766E] transition"
              >
                {product.category.category_name}
              </Link>
            </>
          )}
          <FiChevronRight size={12} aria-hidden="true" />
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
                  <h1 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 tracking-wide">
                    {product.title}
                  </h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                   <button
                     type="button"
                     onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, "_blank", "noopener,noreferrer")}
                     title="Share on Facebook"
                     className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                   >
                     <FaFacebook size={14} />
                   </button>
                   <button
                     type="button"
                     onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(product.title)}`, "_blank", "noopener,noreferrer")}
                     title="Share on Twitter"
                     className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                   >
                     <FaTwitter size={14} />
                   </button>
                   <button
                     type="button"
                     onClick={() => window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer")}
                     title="Share on Instagram"
                     className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                   >
                     <FaInstagram size={14} />
                   </button>
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
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wider block mb-2">Choose Color</span>
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
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wider block mb-2">Sellect Size</span>
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
                      <div className="mb-6 flex items-center gap-3">
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
      <motion.div
        className="flex gap-3 mt-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.button
          type="button"
          onClick={addToCart}
          disabled={!inStock || addingToCart}
          whileTap={{ scale: 0.97 }}
          className="flex-1 py-3 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
        >
          {addingToCart ? "Adding..." : "Add to Cart"}
          {cartMessage && !cartMessage.includes("Failed") && !addingToCart && (
            <motion.span
              key="added-badge"
              initial={{ scale: 0, opacity: 0, y: -2 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut", delay: 0.05 }}
              className="absolute -top-1 -right-2 bg-green-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full"
            >
              +1
            </motion.span>
          )}
        </motion.button>
        <motion.button
          type="button"
          onClick={toggleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          whileTap={{ scale: 0.9 }}
          className={`relative w-12 h-12 rounded-lg border flex items-center justify-center text-sm font-medium transition ${
            inWishlist
              ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <motion.span
            animate={{ scale: inWishlist ? [1, 1.35, 1] : 1 }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
          >
            <FiHeart
              size={18}
              className={inWishlist ? "text-red-500 fill-current" : "text-gray-600 dark:text-gray-300"}
            />
          </motion.span>
        </motion.button>
      </motion.div>
      {cartMessage && (
        <motion.p
          key={cartMessage}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className={`mt-3 text-sm ${cartMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`}
          role="status"
        >
          {cartMessage}
        </motion.p>
      )}
    </div>
  )}
  {/* Write a Review */}
  <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 tracking-wide">Write a Review</h2>
      {!showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-4 py-2 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition"
        >
          <FiEdit2 size={14} className="inline-block mr-1" />
          Write a Review
        </button>
      )}
    </div>
    {showReviewForm && (
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">Write a Review</h3>
          <button
            onClick={() => setShowReviewForm(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                size={24}
                className={star <= reviewRating ? "text-yellow-400 fill-yellow-400 cursor-pointer" : "text-gray-300 dark:text-gray-500 cursor-pointer"}
                onClick={() => setReviewRating(star)}
              />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Your Review</label>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent"
            placeholder="Share your experience with this product..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={submitReview}
            disabled={submittingReview || reviewRating === 0}
            className="flex-1 py-2 bg-[#0F766E] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E]/90 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
          <button
            onClick={() => setShowReviewForm(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
        {reviewMessage && (
          <p className={`mt-3 text-sm ${reviewMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`} role="status">
            {reviewMessage}
          </p>
        )}
      </div>
    )}
  </div>
      </div>
      </div>
      </div>
      </div>
    </div>
    </div>
  );
}
