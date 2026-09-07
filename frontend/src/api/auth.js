import client from './client';

export const authApi = {
  // Obtain JWT tokens (email, password)
  login: async (email, password) => {
    const response = await client.post('/api/token/', { email, password });
    return response.data; // { access, refresh }
  },

  // Refresh access token
  refreshToken: async (refresh) => {
    const response = await client.post('/api/token/refresh/', { refresh });
    return response.data; // { access }
  },

  // Register a new account
  register: async (userData) => {
    // userData: { first_name, last_name, phone_number, email, password, confirm_password }
    const response = await client.post('/accounts/api/register/', userData);
    return response.data;
  },

  // Get current logged-in user profile
  getProfile: async () => {
    const response = await client.get('/accounts/api/profile/');
    return response.data; // { id, first_name, last_name, email, phone_number, date_joined }
  },
};
