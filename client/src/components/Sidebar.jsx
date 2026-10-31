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
