import React from 'react';
import { NavLink } from 'react-router-dom';
import Badge from './Badge.jsx';

export default function TopNavbar({
  onToggleSidebar,
  workspaceName = 'Enterprise Workspace',
  user,
  onLogout
}) {
  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const isAdmin = user?.role === 'ADMIN';
  const isInternal = user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <header className="internal-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '64px', flexShrink: 0, borderBottom: '1px solid #e2e8f0', background: '#ffffff', gap: '16px' }}>
      <div className="internal-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          className="internal-topbar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          title="Toggle Navigation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="workspace-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="workspace-label" style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{workspaceName}</span>
          <span className="workspace-pill" style={{ background: '#f3e9f1', color: '#714B67', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>Live Ops</span>
        </div>

        {/* Top Navbar Quick Navigation Links */}
        {isInternal && (
          <nav className="topbar-nav-links" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '12px', flexWrap: 'wrap' }}>
            {isAdmin && (
              <NavLink
                to="/admin/dashboard"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: isActive ? '#714B67' : 'transparent',
                  color: isActive ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                })}
              >
                <span>📊</span>
                <span>Dashboard</span>
              </NavLink>
            )}

            <NavLink
              to="/reports"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? '#714B67' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              })}
            >
              <span>📈</span>
              <span>Reports</span>
            </NavLink>

            <NavLink
              to="/products"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? '#714B67' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              })}
            >
              <span>📦</span>
              <span>Products</span>
            </NavLink>

            <NavLink
              to="/plans"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? '#714B67' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              })}
            >
              <span>📋</span>
              <span>Plans</span>
            </NavLink>

            <NavLink
              to="/customers"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                background: isActive ? '#714B67' : 'transparent',
                color: isActive ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              })}
            >
              <span>🏢</span>
              <span>Customers</span>
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin/staff"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: isActive ? '#714B67' : 'transparent',
                  color: isActive ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                })}
              >
                <span>👥</span>
                <span>Staff</span>
              </NavLink>
            )}
          </nav>
        )}
      </div>

      <div className="internal-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="user-menu-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar-circle" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#714B67', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>{userInitials}</div>
          <div className="topbar-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="topbar-user-name" style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              {user?.firstName} {user?.lastName}
            </span>
            <div className="topbar-role-wrapper">
              <Badge status={user?.role} className="topbar-role-badge" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="btn btn-outline btn-sm"
          title="Sign Out"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
