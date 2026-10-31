import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';

const titleMap = {
  '/dashboard': 'Dashboard Overview',
  '/subscriptions': 'Subscription Management',
  '/quotations': 'Quotation Management',
  '/plans': 'Plans & Pricing Intervals',
  '/invoices': 'Invoices & Recurring Billing',
  '/payments': 'Payments & Transactions',
  '/discounts': 'Discounts & Promotional Codes',
  '/products': 'Products & Variants Catalog',
  '/users': 'User & Staff Management',
  '/reports': 'Financial & Analytics Reports'
};

const DashboardLayout = () => {
  const location = useLocation();
  const currentPath = '/' + location.pathname.split('/')[1];
  const title = titleMap[currentPath] || 'Dashboard';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title={title} />
        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
