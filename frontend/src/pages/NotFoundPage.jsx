import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-5">
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center font-black text-3xl shadow-xs">
        404
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-sm">
        Oops! The page you are looking for might have been moved or doesn't exist in our catalog.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full text-xs shadow-md transition"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          to="/store"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full text-xs shadow-xs transition"
        >
          Browse Store
        </Link>
      </div>
    </div>
  );
}
