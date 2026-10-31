import React from 'react';
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

  return (
    <header className="internal-topbar">
      <div className="internal-topbar-left">
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
        <div className="workspace-badge">
          <span className="workspace-label">{workspaceName}</span>
          <span className="workspace-pill">Live Ops</span>
        </div>
      </div>

      <div className="internal-topbar-right">
        <div className="user-menu-badge">
          <div className="avatar-circle">{userInitials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">
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
          className="btn-signout"
          title="Sign Out"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
