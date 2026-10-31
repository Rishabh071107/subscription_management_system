import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Sidebar = () => {
  const { user, isAdmin, isStaff, isCustomer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="url(#blGradSide)" />
          <circle cx="24" cy="24" r="14" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="22 8" />
          <circle cx="24" cy="24" r="6" fill="#ffffff" />
          <defs>
            <linearGradient id="blGradSide" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        <span className="sidebar-logo">Brightloop</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>

        <div className="nav-section-title">Subscriptions & Sales</div>
        <NavLink to="/subscriptions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon">🔄</span>
          <span>{isCustomer ? 'My Subscriptions' : 'Subscriptions'}</span>
        </NavLink>

        <NavLink to="/quotations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon">📝</span>
          <span>{isCustomer ? 'My Quotes' : 'Quotations'}</span>
        </NavLink>

        <NavLink to="/plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon">📦</span>
          <span>Plans & Pricing</span>
        </NavLink>

        <div className="nav-section-title">Billing & Finance</div>
        <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon">📄</span>
          <span>{isCustomer ? 'My Invoices' : 'Invoices'}</span>
        </NavLink>

        <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon">💳</span>
          <span>{isCustomer ? 'Payment History' : 'Payments'}</span>
        </NavLink>

        {!isCustomer && (
          <NavLink to="/discounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon">🏷️</span>
            <span>Discounts</span>
          </NavLink>
        )}

        {(isAdmin || isStaff) && (
          <>
            <div className="nav-section-title">Operations</div>
            <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-item-icon">🧩</span>
              <span>Products Catalog</span>
            </NavLink>

            <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-item-icon">👥</span>
              <span>{isAdmin ? 'Users & Staff' : 'Customers'}</span>
            </NavLink>

            <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-item-icon">📈</span>
              <span>Analytics & Reports</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.firstName} {user?.lastName}</div>
            <div className="user-role-badge">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-outline btn-sm"
          style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
