import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, Calendar, MapPin, Phone } from 'lucide-react';
import { ordersApi } from '../api/orders';

export default function OrderCompletePage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order && orderNumber) {
      ordersApi.getOrderDetail(orderNumber)
        .then(setOrder)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [orderNumber, order]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-sm text-slate-500">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Success Hero Header */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center shadow-xs space-y-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          Order Confirmed
        </span>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Thank you for your purchase!
        </h1>

        <p className="text-sm text-slate-600 max-w-md mx-auto">
          We have received your order and are currently preparing it for shipment. A confirmation has been sent to your email.
        </p>

        <div className="inline-block bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl text-sm mt-2">
          <span className="text-slate-400 text-xs uppercase tracking-wider block font-medium">Order Number</span>
          <span className="text-lg font-black text-slate-900 tracking-wide">{orderNumber}</span>
        </div>
      </div>

      {/* Order Summary Card */}
      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Order Summary
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700">
              Status: {order.status || 'New'}
            </span>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-3.5 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-slate-900">{item.product_name}</p>
                  <p className="text-xs text-slate-500">
                    {item.color} | Size: {item.size} | Qty: {item.quantity}
                  </p>
                </div>
                <div className="font-bold text-slate-900">
                  ${item.subtotal}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Billing Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-slate-400 block">Shipping To</span>
              <p className="font-semibold text-slate-900 text-sm">{order.full_name}</p>
              <p>{order.address_line_1} {order.address_line_2}</p>
              <p>{order.city}, {order.state}, {order.country} - {order.pincode}</p>
              <p className="flex items-center gap-1 mt-1 text-slate-500">
                <Phone className="w-3 h-3" /> {order.phone}
              </p>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <span className="font-bold uppercase tracking-wider text-slate-400 block">Payment Summary</span>
              <p>Items Total: <span className="font-semibold text-slate-900">${order.total}</span></p>
              <p>Tax (2%): <span className="font-semibold text-slate-900">${order.tax}</span></p>
              <p className="text-base font-black text-slate-900 pt-1">
                Grand Total: <span className="text-blue-600">${order.grand_total}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-full text-sm shadow-sm transition"
        >
          <Package className="w-4 h-4" />
          View All Orders
        </Link>
        <Link
          to="/store"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full text-sm shadow-xs transition"
        >
          <Home className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
