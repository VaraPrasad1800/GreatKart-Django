import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { ordersApi } from '../api/orders';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await ordersApi.getOrders();
        // Check if paginated or array
        const list = Array.isArray(data) ? data : data.results || [];
        setOrders(list);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-md w-1/4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-3xl p-6"></div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">No orders found</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          You haven't placed any orders yet. Once you complete checkout, your order history will appear right here.
        </p>
        <div className="pt-2">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full text-sm shadow-md transition"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Orders ({orders.length})
        </h1>
        <p className="text-sm text-slate-500 mt-1">Check current status and past order history</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || order.items?.length || 0;

          return (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs hover:shadow-md transition duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900 text-base">
                    #{order.order_number}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status || 'New'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{itemCount} item(s)</span>
                  <span>•</span>
                  <span>Total: <strong className="text-slate-800 font-bold">${order.grand_total}</strong></span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1">
                  Deliver to: {order.full_name}, {order.city}
                </p>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-end">
                <Link
                  to={`/orders/${order.order_number}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-600 font-semibold px-5 py-2.5 rounded-xl text-xs transition"
                >
                  View Order Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
