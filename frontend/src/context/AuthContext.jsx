import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sv_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sv_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync user balance & details from backend on load
  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('sv_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to sync user data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sv_token', newToken);
    localStorage.setItem('sv_user', JSON.stringify(newUser));
    return newUser;
  };

  const register = async (email, username, password) => {
    const res = await api.post('/auth/register', { email, username, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('sv_token', newToken);
    localStorage.setItem('sv_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sv_token');
    localStorage.removeItem('sv_user');
  };

  const updateBalanceLocal = (newBalanceDollars) => {
    if (user) {
      const updated = { ...user, balance: Math.round(parseFloat(newBalanceDollars) * 100) };
      setUser(updated);
      localStorage.setItem('sv_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshUser,
        updateBalanceLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
