import client from './client';

export const wishlistApi = {
  // Get wishlist items
  getWishlist: async () => {
    const response = await client.get('/wishlist/api/');
    if (response.data && Array.isArray(response.data.results)) {
      return response.data; // { count, results, ... }
    }
    return { count: response.data.length || 0, results: response.data };
  },

  // Add variant to wishlist
  addToWishlist: async (variantId) => {
    const response = await client.post(`/wishlist/api/add/${variantId}/`);
    return response.data;
  },

  // Remove variant from wishlist
  removeFromWishlist: async (variantId) => {
    const response = await client.delete(`/wishlist/api/remove/${variantId}/`);
    return response.data;
  },
};
