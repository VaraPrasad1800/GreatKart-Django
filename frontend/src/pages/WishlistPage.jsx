import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const handleMoveToCart = async (item) => {
    if (item.stock <= 0) {
      addToast('This item is currently out of stock', 'error');
      return;
    }
    try {
      await addToCart(item.variant_id);
      await removeFromWishlist(item.variant_id);
      addToast(`Moved ${item.product_name} to your cart!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Could not move to cart', 'error');
    }
  };

  const handleRemove = async (variantId) => {
    try {
      await removeFromWishlist(variantId);
      addToast('Removed from wishlist', 'info');
    } catch (err) {
      addToast('Could not remove item', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to view your wishlist</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Save items you love and track them easily across all your devices.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full text-sm shadow-md transition"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  const items = wishlist.results || [];

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Your wishlist is empty</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Explore products you like and hit the heart icon to save them for later.
        </p>
        <div className="pt-2">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full text-sm shadow-md transition"
          >
            Explore Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Wishlist ({items.length} items)
        </h1>
        <p className="text-sm text-slate-500 mt-1">Saved items you are watching</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const inStock = item.stock > 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemove(item.variant_id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 rounded-full shadow-xs transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2">
                  <Link
                    to={`/product/${item.product_slug}`}
                    className="font-bold text-slate-900 hover:text-blue-600 text-base transition-colors line-clamp-1"
                  >
                    {item.product_name}
                  </Link>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">Color: {item.color}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">Size: {item.size}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-black text-slate-900">${item.price}</span>
                    {inStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <Check className="w-3 h-3" /> In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleMoveToCart(item)}
                  disabled={!inStock}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition ${
                    inStock
                      ? 'bg-slate-900 hover:bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {inStock ? 'Move to Cart' : 'Currently Unavailable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
