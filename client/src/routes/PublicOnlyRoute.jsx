import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingState from '../components/LoadingState.jsx';

export default function PublicOnlyRoute() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingState message="Checking session..." />;
  }

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'STAFF') {
      return <Navigate to="/customers" replace />;
    }
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/portal/dashboard" replace />;
    }
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <Outlet />;
}

