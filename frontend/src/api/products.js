import client from './client';

export const productsApi = {
  // List products with optional category, search, page, and all filter params
  getProducts: async (params = {}) => {
    const queryParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== false && value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else {
          queryParams[key] = value;
        }
      }
    });

    const response = await client.get('/store/api/products/', { params: queryParams });
    return response.data; // { count, next, previous, results }
  },

  // Get single product detail by slug
  getProductDetail: async (slug) => {
    const response = await client.get(`/store/api/products/${slug}/`);
    return response.data;
  },

  // Get reviews for a product
  getReviews: async (slug, page = 1) => {
    const params = page > 1 ? { page } : {};
    const response = await client.get(`/store/api/products/${slug}/reviews/`, { params });
    return response.data;
  },

  // Post a review (user must have delivered order for this product)
  postReview: async (slug, { rating, comment }) => {
    const response = await client.post(`/store/api/products/${slug}/reviews/`, {
      rating,
      comment,
    });
    return response.data;
  },

  // Get filter options for current category/search
  getFilterOptions: async ({ category = '', search = '' } = {}) => {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;

    const response = await client.get('/store/api/products/filter-options/', { params });
    return response.data;
  },
};
