import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, AlertCircle, ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api/orders';
import { getImageUrl } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    phone: user?.phone_number || '',
    email: user?.email || '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Add items to your shopping cart before proceeding to checkout.
        </p>
        <div className="pt-2">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full text-sm shadow-md transition"
          >
            Go to Store
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');

    // Client-side phone validation (must be 10 digits as required by backend CheckoutSerializer)
    const cleanPhone = formData.phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorBanner('Phone number must contain exactly 10 numeric digits.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await ordersApi.checkout(formData);
      addToast('Order placed successfully!', 'success');
      clearCart();
      const orderNumber = res.order?.order_number;
      navigate(`/order-complete/${orderNumber}`, { state: { order: res.order } });
    } catch (err) {
      console.error('Checkout error:', err);
      const data = err.response?.data;
      if (data?.detail) {
        setErrorBanner(data.detail);
      } else if (typeof data === 'object') {
        // Collect field validation messages
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join(' | ');
        setErrorBanner(messages);
      } else {
        setErrorBanner('An unexpected error occurred while placing your order. Please check stock and details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout & Shipping
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Please provide your delivery address to complete your purchase</p>
      </div>

      {errorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Checkout issue</p>
            <p className="mt-0.5">{errorBanner}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Shipping Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="address_line_1"
                  required
                  value={formData.address_line_1}
                  onChange={handleChange}
                  placeholder="Street address, apartment, house number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  name="address_line_2"
                  value={formData.address_line_2}
                  onChange={handleChange}
                  placeholder="Suite, unit, building floor"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Telangana"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="India"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Pincode / Postal Code *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="500001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Items in Order ({cart.quantity})
            </h2>

            {/* Items list preview */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.variant_id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border shrink-0">
                    <img
                      src={getImageUrl(item.image)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.product_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.color} / {item.size} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    ${item.subtotal}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 text-sm pt-4 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Items Total</span>
                <span className="font-semibold text-slate-900">${cart.total}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (2%)</span>
                <span className="font-semibold text-slate-900">${cart.tax}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between text-base">
                <span className="font-bold text-slate-900">Total Payable</span>
                <span className="font-black text-2xl text-blue-600">${cart.grand_total}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/30 transition hover:scale-[1.01] disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {submitting ? 'Placing Order...' : `Place Order ($${cart.grand_total})`}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Payments secured by GreatKart backend</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
