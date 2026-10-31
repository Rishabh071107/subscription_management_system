import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import StaffDashboard from './StaffDashboard.jsx';
import CustomerDashboard from './CustomerDashboard.jsx';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (user?.role === 'STAFF') {
    return <StaffDashboard />;
  }

  return <CustomerDashboard />;
};

export default DashboardRouter;
