import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('brightloop_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('brightloop_token'));
  const [loading, setLoading] = useState(true);

  // Verify token on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('brightloop_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('brightloop_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token invalid or expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('brightloop_token');
          localStorage.removeItem('brightloop_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('brightloop_token', receivedToken);
    localStorage.setItem('brightloop_user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const register = async (customerData) => {
    const res = await api.post('/auth/register', customerData);
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('brightloop_token', receivedToken);
    localStorage.setItem('brightloop_user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
  };

  const updateUserProfile = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('brightloop_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        isStaff: user?.role === 'STAFF',
        isCustomer: user?.role === 'CUSTOMER',
        login,
        register,
        logout,
        updateUserProfile
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
