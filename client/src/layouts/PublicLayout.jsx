import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="public-layout-root">
      <div className="public-auth-card">
        <div className="public-auth-logo">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="8" fill="#714B67" />
            <circle cx="24" cy="24" r="14" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="22 8" />
            <circle cx="24" cy="24" r="6" fill="#FFFFFF" />
          </svg>
          <span className="public-auth-logo-text">Brightloop</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

