import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Package, Heart, ShoppingBag, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
            {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-white/10 px-3 py-1 rounded-full text-xs text-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified GreatKart Customer
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-5 py-2.5 rounded-xl text-xs backdrop-blur-sm transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Account Info Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Info Column */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Personal Details
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
              <p className="text-slate-800 font-semibold text-sm mt-0.5">
                {user?.first_name} {user?.last_name}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
              <p className="text-slate-800 font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Phone Number</span>
              <p className="text-slate-800 font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {user?.phone_number || 'Not provided'}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Member Since</span>
              <p className="text-slate-800 font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />{' '}
                {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Access Cards Column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/orders"
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit group-hover:scale-110 transition">
              <Package className="w-6 h-6" />
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                My Orders
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Track current deliveries and inspect past order receipts.
              </p>
            </div>
          </Link>

          <Link
            to="/wishlist"
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
          >
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit group-hover:scale-110 transition">
              <Heart className="w-6 h-6" />
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition">
                  Wishlist
                </h3>
                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {wishlistCount} items
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                View saved clothes, shoes, and styles to buy later.
              </p>
            </div>
          </Link>

          <Link
            to="/cart"
            className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
          >
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:scale-110 transition">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
                  Shopping Cart
                </h3>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {itemCount} units
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Complete checkout or manage items in your bag.
              </p>
            </div>
          </Link>

          <Link
            to="/store"
            className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl shadow-md hover:shadow-lg transition duration-200 flex flex-col justify-between"
          >
            <div className="p-3 bg-white/20 text-white rounded-2xl w-fit">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-white text-base">Browse Store</h3>
              <p className="text-xs text-blue-100 mt-1">
                Explore brand new collections and seasonal discounts.
              </p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
