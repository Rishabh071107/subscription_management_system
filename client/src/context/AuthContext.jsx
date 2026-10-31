import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on initial load and page refresh via server-managed HTTP-only cookie
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (isMounted && res?.data?.user) {
          setUser(res.data.user);
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const receivedUser = res?.data?.user;
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (customerData) => {
    // Endpoints: POST /api/auth/signup (or /register)
    const res = await api.post('/auth/signup', customerData);
    const receivedUser = res?.data?.user;
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API call returned error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const updateUserProfile = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isStaff: user?.role === 'STAFF',
        isCustomer: user?.role === 'CUSTOMER',
        login,
        register,
        signup: register,
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
