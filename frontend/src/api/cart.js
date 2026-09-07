import client from './client';

export const cartApi = {
  // Get cart
  getCart: async () => {
    const response = await client.get('/cart/api/');
    return response.data; // { items, total, quantity, tax, grand_total }
  },

  // Add 1 unit of variant to cart
  addToCart: async (variantId) => {
    const response = await client.post(`/cart/api/add/${variantId}/`);
    return response.data;
  },

  // Decrement 1 unit or remove if quantity reaches 0
  removeFromCart: async (variantId) => {
    const response = await client.post(`/cart/api/remove/${variantId}/`);
    return response.data;
  },

  // Remove entire line item
  removeCartItem: async (variantId) => {
    const response = await client.delete(`/cart/api/remove_item/${variantId}/`);
    return response.data;
  },
};
