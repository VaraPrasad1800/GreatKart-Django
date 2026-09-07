import client from './client';

export const ordersApi = {
  // Submit checkout order
  checkout: async (shippingData) => {
    // shippingData: { full_name, phone, email, address_line_1, address_line_2, city, state, country, pincode }
    const response = await client.post('/orders/api/checkout/', shippingData);
    return response.data;
  },

  // Get order history
  getOrders: async (page = 1) => {
    const params = page > 1 ? { page } : {};
    const response = await client.get('/orders/api/orders/', { params });
    return response.data;
  },

  // Get order details by order_number
  getOrderDetail: async (orderNumber) => {
    const response = await client.get(`/orders/api/orders/${orderNumber}/`);
    return response.data;
  },
};
