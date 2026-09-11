import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Star,
  MessageSquare
} from 'lucide-react';
import { productsApi } from '../api/products';
import { getImageUrl } from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../components/StarRating';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getProductDetail(slug);
      setProduct(data);

      // Set default color
      const firstColor = data.product_colors?.[0] || null;
      setSelectedColor(firstColor);

      if (firstColor) {
        // Set default image
        const primImg = firstColor.images?.find((i) => i.is_primary) || firstColor.images?.[0];
        setSelectedImage(primImg?.image || '');

        // Set default variant
        const firstVar = firstColor.variants?.[0] || null;
        setSelectedVariant(firstVar);
      }
    } catch (err) {
      console.error('Failed to load product detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const handleColorChange = (colorObj) => {
    setSelectedColor(colorObj);
    const primImg = colorObj.images?.find((i) => i.is_primary) || colorObj.images?.[0];
    setSelectedImage(primImg?.image || '');
    // Select first variant of new color
    const firstVar = colorObj.variants?.[0] || null;
    setSelectedVariant(firstVar);
  };

  const handleVariantChange = (variantObj) => {
    setSelectedVariant(variantObj);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      addToast('Please select a color and size variant', 'error');
      return;
    }
    if (!isAuthenticated) {
      addToast('Please sign in to add items to your cart', 'info');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(selectedVariant.id);
      addToast(`Added ${product.product_name} (${selectedVariant.size}) to cart!`, 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to add item to cart';
      addToast(msg, 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const isWishlisted = selectedVariant
    ? wishlist?.results?.some((item) => item.variant_id === selectedVariant.id)
    : false;

  const handleWishlistToggle = async () => {
    if (!selectedVariant) return;
    if (!isAuthenticated) {
      addToast('Please sign in to manage your wishlist', 'info');
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(selectedVariant.id);
        addToast('Removed from wishlist', 'info');
      } else {
        await addToWishlist(selectedVariant.id);
        addToast('Saved to wishlist', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.detail || err.message || 'Could not update wishlist', 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!isAuthenticated) {
      setReviewError('You must be signed in to submit a review.');
      return;
    }

    try {
      setSubmittingReview(true);
      await productsApi.postReview(slug, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess('Thank you! Your review has been submitted.');
      setReviewComment('');
      // Reload product to refresh reviews and breakdown
      await loadProduct();
    } catch (err) {
      const errDetail = err.response?.data?.detail || 'Unable to submit review.';
      setReviewError(errDetail);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="bg-slate-200 aspect-square rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-md w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Product not found</h2>
        <Link to="/store" className="mt-4 inline-block text-blue-600 font-semibold underline">
          Return to Store
        </Link>
      </div>
    );
  }

  const reviewSummary = product.review_summary || { count: 0, average_rating: 0, rating_breakdown: {} };
  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;

  // A product whose variants all share one dimension value (e.g. "One Size"
  // for beauty, or groceries' Default x One Size) renders no size selector.
  const distinctVariantSizes = new Set(
    (product.product_colors || []).flatMap((c) => c.variants.map((v) => v.size))
  ).size;
  const showVariantSelector = distinctVariantSizes > 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <Link to="/" className="hover:text-blue-600 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/store" className="hover:text-blue-600 transition">Store</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/store?category=${product.category.toLowerCase()}`} className="hover:text-blue-600 transition">
              {product.category}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-medium truncate max-w-xs">{product.product_name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery Column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs">
            <img
              src={getImageUrl(selectedImage)}
              alt={product.product_name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60';
              }}
            />
            {/* Out of Stock Ribbon */}
            {!inStock && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                Out of Stock
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {selectedColor?.images && selectedColor.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {selectedColor.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img.image
                      ? 'border-blue-600 scale-95 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={getImageUrl(img.image)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Variant Selection Column */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {product.category || 'Apparel'}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {product.product_name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 mt-3">
              <StarRating rating={reviewSummary.average_rating} count={reviewSummary.count} size="md" showValue />
              <span className="text-xs text-slate-400">|</span>
              <a href="#reviews" className="text-xs font-semibold text-blue-600 hover:underline">
                Read {reviewSummary.count} verified reviews
              </a>
            </div>
          </div>

          {/* Price & Stock Display */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Price</span>
              <span className="text-3xl font-black text-slate-900">
                ${selectedVariant?.price ?? '--'}
              </span>
            </div>
            <div>
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  {selectedVariant.stock} in stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100/80 px-3 py-1.5 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Color Selector — hidden for no-variant categories (groceries/books)
              whose single collapsed color is the "Default" placeholder. */}
          {product.has_color && product.product_colors && product.product_colors.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Color: <span className="text-slate-900 font-semibold">{selectedColor?.color}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.product_colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleColorChange(c)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      selectedColor?.id === c.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {c.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size / Storage Variant Selector — hidden when every variant shares
              the same dimension value ("One Size" products). Label comes from the
              category config, so phones show "Storage" instead of a wrong "Size". */}
          {showVariantSelector && selectedColor?.variants && selectedColor.variants.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {product.variant_label}: <span className="text-slate-900 font-semibold">{selectedVariant?.size}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {selectedColor.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleVariantChange(v)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    } ${v.stock <= 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    disabled={v.stock <= 0}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions: Add to Cart & Wishlist */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-lg transition-all duration-200 ${
                inStock
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:scale-[1.01]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {addingToCart ? 'Adding to Cart...' : inStock ? 'Add to Shopping Cart' : 'Out of Stock'}
            </button>

            <button
              onClick={handleWishlistToggle}
              className={`p-4 rounded-2xl border transition-all ${
                isWishlisted
                  ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200'
              }`}
              title={isWishlisted ? 'Saved in wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Description */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || 'No description provided.'}
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-slate-600 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Free Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Genuine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section id="reviews" className="pt-12 border-t border-slate-200 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Customer Reviews & Ratings</h2>
          </div>
        </div>

        {/* Rating Breakdown Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0">
            <span className="text-5xl font-black text-slate-900">
              {reviewSummary.average_rating ? reviewSummary.average_rating.toFixed(1) : '0.0'}
            </span>
            <div className="mt-2">
              <StarRating rating={reviewSummary.average_rating} size="md" />
            </div>
            <span className="text-xs text-slate-400 mt-1">
              Based on {reviewSummary.count} verified reviews
            </span>
          </div>

          {/* Breakdown bars */}
          <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewSummary.rating_breakdown?.[stars] || 0;
              const pct = reviewSummary.count > 0 ? (count / reviewSummary.count) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="w-12 flex items-center gap-1 font-semibold">
                    {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List & Write Review Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Verified Customer Feedback</h3>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((rev) => (
                  <div key={rev.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">{rev.user_name || 'Anonymous Customer'}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <StarRating rating={rev.rating} size="sm" />
                    <p className="text-sm text-slate-600 leading-relaxed pt-1">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                No customer reviews yet. Be the first to review after purchase!
              </div>
            )}
          </div>

          {/* Write Review Form */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Write a Review</h3>
              <p className="text-xs text-slate-500">
                Only verified buyers with a completed/delivered order can publish reviews for this item.
              </p>

              {reviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-slate-300 hover:text-amber-400 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            reviewRating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} out of 5</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Comment</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share your experience with quality, fit, and satisfaction..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
