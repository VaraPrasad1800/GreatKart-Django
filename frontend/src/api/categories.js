import client from './client';

export const categoriesApi = {
  getCategories: async () => {
    const response = await client.get('/category/api/categories/');
    // If paginated, return results array
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return response.data;
  },
};
