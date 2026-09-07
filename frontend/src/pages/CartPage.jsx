import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function CartPage() {
  const { cart, addToCart, removeFromCart, removeCartItem, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleIncrement = async (item) => {
    if (item.quantity >= item.max_stock) {
      addToast(`Only ${item.max_stock} units available in stock`, 'error');
      return;
    }
    try {
      await addToCart(item.variant_id);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Could not increase quantity', 'error');
    }
  };

  const handleDecrement = async (item) => {
    try {
      await removeFromCart(item.variant_id);
    } catch (err) {
      addToast('Could not decrease quantity', 'error');
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      await removeCartItem(item.variant_id);
      addToast(`Removed ${item.product_name} from cart`, 'info');
    } catch (err) {
      addToast('Could not remove item', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to view your cart</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Please log in to your account to view your saved cart items, check out, and place orders.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full text-sm shadow-md transition"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const items = cart.items || [];

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Your shopping cart is empty</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Looks like you haven't added any items to your cart yet. Explore our curated collections and find something you love.
        </p>
        <div className="pt-2">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full text-sm shadow-md transition"
          >
            Start Shopping Now
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
          Shopping Cart ({cart.quantity} items)
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review your selections before proceeding to checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.variant_id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product_slug}`}
                    className="font-bold text-slate-900 hover:text-blue-600 text-base transition-colors truncate block"
                  >
                    {item.product_name}
                  </Link>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">Color: {item.color}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">Size: {item.size}</span>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-slate-700">
                    ${item.unit_price} each
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => handleDecrement(item)}
                      className="p-2 text-slate-600 hover:bg-slate-200 transition"
                      title="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item)}
                      disabled={item.quantity >= item.max_stock}
                      className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition"
                      title="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="w-20 text-right font-black text-slate-900 text-base">
                    ${item.subtotal}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">${cart.total}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (2%)</span>
                <span className="font-semibold text-slate-900">${cart.tax}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between text-base">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="font-black text-xl text-blue-600">${cart.grand_total}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/30 transition hover:scale-[1.01]"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & 100% Encrypted Checkout</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
