import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/Badge.jsx';

export default function CustomerPortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'C';

  return (
    <div className="portal-layout-root">
      {/* Top Brand & Profile Bar */}
      <header className="portal-topbar">
        <div className="portal-brand">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="8" fill="#FFFFFF" />
            <circle cx="24" cy="24" r="14" fill="none" stroke="#714B67" strokeWidth="3" strokeDasharray="22 8" />
            <circle cx="24" cy="24" r="6" fill="#714B67" />
          </svg>
          <span>Brightloop Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="user-menu-badge">
            <div className="avatar-circle">{userInitials}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>
                {user?.firstName} {user?.lastName}
              </span>
              <div>
                <Badge status="CUSTOMER" />
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Portal Navigation Tabs */}
      <nav className="portal-nav-bar">
        <NavLink
          to="/portal/dashboard"
          className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}
        >
          Overview
        </NavLink>
        <NavLink
          to="/portal/profile"
          className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}
        >
          My Profile & Settings
        </NavLink>
      </nav>

      {/* Main Content Viewport */}
      <main className="portal-main-container">
        <Outlet />
      </main>
    </div>
  );
}

