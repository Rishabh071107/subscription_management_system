import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/Badge.jsx';

export default function InternalLayout() {
  const { user, isAdmin, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';

  return (
    <div className="internal-layout-root">
      {/* Dark Sidebar */}
      <aside className={`internal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="internal-sidebar-header">
          <div className="internal-sidebar-logo">
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="8" fill="#714B67" />
              <circle cx="24" cy="24" r="14" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="22 8" />
              <circle cx="24" cy="24" r="6" fill="#FFFFFF" />
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
              onClick={() => setSidebarOpen(false)}
            >
              <span>📊</span>
              <span>Admin Dashboard</span>
            </NavLink>
          )}

          <div className="internal-nav-section-title">User Management</div>
          {isAdmin && (
            <NavLink
              to="/admin/staff"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>👥</span>
              <span>Staff Management</span>
            </NavLink>
          )}

          <NavLink
            to="/customers"
            className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span>🏢</span>
            <span>Customers</span>
          </NavLink>

          <div className="internal-nav-section-title">Settings & Account</div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span>👤</span>
            <span>My Profile</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/settings"
              className={({ isActive }) => `internal-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>⚙️</span>
              <span>System Settings</span>
            </NavLink>
          )}
        </nav>
      </aside>

      {/* Main Viewport */}
      <div className="internal-main-area">
        <header className="internal-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', padding: '6px 10px' }}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle Navigation Sidebar"
            >
              ☰
            </button>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Enterprise Workspace
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="user-menu-badge">
              <div className="avatar-circle">{userInitials}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {user?.firstName} {user?.lastName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Badge status={user?.role} />
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

        <main className="internal-content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

