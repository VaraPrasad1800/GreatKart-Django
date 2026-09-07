import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../api/client';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product }) {
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const isWishlisted = wishlist?.results?.some(
    (item) => item.product_slug === product.slug
  );

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast('Please sign in to save items to your wishlist', 'info');
      return;
    }

    try {
      if (isWishlisted) {
        const item = wishlist.results.find((i) => i.product_slug === product.slug);
        if (item?.variant_id) {
          await removeFromWishlist(item.variant_id);
          addToast('Removed from wishlist', 'info');
        }
      } else {
        // Find variant from product or navigate to details
        // Since product list serializer does not have variant_id directly,
        // we can navigate to detail or inform user to pick size/color
        addToast('Choose your size and color on product page to save', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Could not update wishlist', 'error');
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={getImageUrl(product.image)}
          alt={product.product_name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60';
          }}
        />

        {/* Category Badge */}
        {product.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
            {product.category}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-500 shadow-sm'
              : 'bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white shadow-xs'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Quick View Overlay Button */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link
            to={`/product/${product.slug}`}
            className="w-full flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-slate-900 font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md backdrop-blur-sm transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            View Options
          </Link>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/product/${product.slug}`}
            className="block font-semibold text-slate-800 hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-1"
          >
            {product.product_name}
          </Link>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Starting at</span>
            <span className="text-base sm:text-lg font-bold text-slate-900">
              ${product.price !== null ? product.price : '--'}
            </span>
          </div>

          <Link
            to={`/product/${product.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}
