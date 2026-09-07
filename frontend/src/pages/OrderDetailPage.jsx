import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { ordersApi } from '../api/orders';

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await ordersApi.getOrderDetail(orderNumber);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-sm text-slate-500">Loading order info...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Order not found</h2>
        <Link to="/orders" className="text-blue-600 underline text-sm font-semibold">
          Return to My Orders
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'accepted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order #{order.order_number}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <span
            className={`inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border self-start sm:self-auto ${getStatusBadge(
              order.status
            )}`}
          >
            {order.status || 'New'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Purchased Items List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 text-sm">Ordered Products</h2>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{item.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">Color: {item.color}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">Size: {item.size}</span>
                      <span>× {item.quantity}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-slate-900 text-base">${item.subtotal}</span>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      (${item.price} each)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Shipping Destination
            </h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 text-sm">{order.full_name}</p>
              <p>{order.address_line_1}</p>
              {order.address_line_2 && <p>{order.address_line_2}</p>}
              <p>{order.city}, {order.state}, {order.country} - {order.pincode}</p>
              <div className="pt-2 flex flex-wrap gap-4 text-slate-500">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {order.phone}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {order.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
              Payment Breakdown
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">${order.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (2%)</span>
                <span className="font-semibold text-slate-900">${order.tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between text-base">
                <span className="font-bold text-slate-900">Total Paid</span>
                <span className="font-black text-xl text-blue-600">${order.grand_total}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payment status: {order.is_ordered ? 'Paid & Verified' : 'Pending'}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
