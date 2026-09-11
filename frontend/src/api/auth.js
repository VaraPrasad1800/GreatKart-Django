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

  // Step 1 (forgot password): request a reset link for an email address.
  // Always resolves with the same generic message whether or not the account
  // exists (the backend does not reveal valid addresses).
  forgotPassword: async (email) => {
    const response = await client.post('/accounts/api/password-reset/', { email });
    return response.data; // { message }
  },

  // Step 1b: verify a reset link (uid + token) is still valid, so the reset
  // page can show "link expired" before the user types a new password.
  validateResetToken: async (uid, token) => {
    const response = await client.get('/accounts/api/password-reset/validate/', {
      params: { uid, token },
    });
    return response.data; // { valid: true }
  },

  // Step 2: submit the new password with the uid + token from the reset link.
  resetPassword: async (uid, token, new_password, confirm_password) => {
    const response = await client.post('/accounts/api/password-reset/confirm/', {
      uid,
      token,
      new_password,
      confirm_password,
    });
    return response.data; // { message }
  },
};
