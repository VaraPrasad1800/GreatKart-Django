import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  // Check profile on initial load if token exists
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Initial profile load failed or token expired', err);
        }
      }
      setLoading(false);
    };

    checkAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session_expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    const tokens = await authApi.login(email, password);
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    setToken(tokens.access);

    // Fetch user profile immediately
    const profile = await authApi.getProfile();
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile));
    return profile;
  };

  const register = async (userData) => {
    return await authApi.register(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
