import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({
  isOpen = false,
  isCollapsed = false,
  onClose
}) {
  const { isAdmin, isStaff } = useAuth();

  return (
    <aside className={`internal-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`.trim()}>
      <div className="internal-sidebar-header">
        <div className="internal-sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
            <rect width="48" height="48" rx="10" fill="#FFFFFF" />
            <circle cx="24" cy="24" r="14" fill="none" stroke="#714B67" strokeWidth="3" strokeDasharray="22 8" />
            <circle cx="24" cy="24" r="6" fill="#714B67" />
          </svg>
          <span>Brightloop</span>
        </div>
      </div>

      <nav className="internal-sidebar-nav">

        {/* Overview */}
        <div className="internal-nav-section-title">Overview</div>
        {isAdmin && (
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            title="Admin Dashboard"
          >
            <span className="nav-icon">📊</span>
            <span>Admin Dashboard</span>
          </NavLink>
        )}
        {(isAdmin || isStaff) && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Dashboard"
            >
              <span className="nav-icon">🏠</span>
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Reports & Analytics"
            >
              <span className="nav-icon">📈</span>
              <span>Reports & Analytics</span>
            </NavLink>
          </>
        )}

        {/* Catalog & Subscriptions */}
        <div className="internal-nav-section-title">Catalog & Subscriptions</div>
        {(isAdmin || isStaff) && (
          <>
            <NavLink
              to="/products"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Products & Services"
            >
              <span className="nav-icon">📦</span>
              <span>Products & Services</span>
            </NavLink>

            <NavLink
              to="/plans"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Subscription Plans"
            >
              <span className="nav-icon">📋</span>
              <span>Subscription Plans</span>
            </NavLink>

            <NavLink
              to="/subscriptions"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Subscriptions"
            >
              <span className="nav-icon">📆</span>
              <span>Subscriptions</span>
            </NavLink>

            <NavLink
              to="/quotations"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Quotations"
            >
              <span className="nav-icon">🧾</span>
              <span>Quotations</span>
            </NavLink>
          </>
        )}

        {/* User Management */}
        <div className="internal-nav-section-title">User Management</div>
        {isAdmin && (
          <NavLink
            to="/admin/staff"
            className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            title="Staff Management"
          >
            <span className="nav-icon">👥</span>
            <span>Staff Management</span>
          </NavLink>
        )}
        {(isAdmin || isStaff) && (
          <NavLink
            to="/customers"
            className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            title="Customers"
          >
            <span className="nav-icon">🏢</span>
            <span>Customers</span>
          </NavLink>
        )}

        {/* Billing & Operations */}
        <div className="internal-nav-section-title">Billing & Operations</div>
        {isAdmin && (
          <NavLink
            to="/admin/billing"
            className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            title="Recurring Billing Engine"
          >
            <span className="nav-icon">⚡</span>
            <span>Recurring Billing</span>
          </NavLink>
        )}
        {(isAdmin || isStaff) && (
          <>
            <NavLink
              to="/invoices"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Invoices"
            >
              <span className="nav-icon">📄</span>
              <span>Invoices</span>
            </NavLink>

            <NavLink
              to="/payments"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Payments"
            >
              <span className="nav-icon">💳</span>
              <span>Payments</span>
            </NavLink>

            <NavLink
              to="/overdue"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              title="Collections & Overdue"
            >
              <span className="nav-icon">⚠️</span>
              <span>Overdue & Collections</span>
            </NavLink>
          </>
        )}

        {/* Settings & Account */}
        <div className="internal-nav-section-title">Settings & Account</div>
        <NavLink
          to="/profile"
          className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
          onClick={onClose}
          title="My Profile"
        >
          <span className="nav-icon">👤</span>
          <span>My Profile</span>
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/settings"
            className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            title="System Settings"
          >
            <span className="nav-icon">⚙️</span>
            <span>System Settings</span>
          </NavLink>
        )}

      </nav>
    </aside>
  );
}
