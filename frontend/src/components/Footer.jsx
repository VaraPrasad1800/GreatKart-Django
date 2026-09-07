import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      {/* Features highlight banner */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-300">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Free Shipping</h4>
                <p className="text-xs text-slate-400">On all prepaid orders</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Easy Returns</h4>
                <p className="text-xs text-slate-400">30 days return policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">100% Secure</h4>
                <p className="text-xs text-slate-400">Encrypted transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">24/7 Support</h4>
                <p className="text-xs text-slate-400">Dedicated assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">GreatKart</span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Your one-stop destination for premium fashion, apparel, and lifestyle products. Powered by a high-performance REST API.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/store" className="hover:text-blue-400 transition">Shop All</Link></li>
              <li><Link to="/cart" className="hover:text-blue-400 transition">Shopping Cart</Link></li>
              <li><Link to="/wishlist" className="hover:text-blue-400 transition">My Wishlist</Link></li>
              <li><Link to="/orders" className="hover:text-blue-400 transition">Track Orders</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Customer Care</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-blue-400 cursor-pointer transition">Contact Us</li>
              <li className="hover:text-blue-400 cursor-pointer transition">Shipping Policies</li>
              <li className="hover:text-blue-400 cursor-pointer transition">Returns & Exchanges</li>
              <li className="hover:text-blue-400 cursor-pointer transition">Privacy Policy</li>
            </ul>
          </div>

          {/* Tech & Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">Architecture</h4>
            <p className="text-xs text-slate-400 mb-3">
              Built with Django REST Framework, JWT Authentication & Modern React.
            </p>
            <div className="text-xs text-slate-500">
              API Status: <span className="text-emerald-400 font-semibold">Online (127.0.0.1:8000)</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} GreatKart E-Commerce. All rights reserved.</p>
          <p className="text-slate-400">Crafted for modern API-driven shopping.</p>
        </div>
      </div>
    </footer>
  );
}
