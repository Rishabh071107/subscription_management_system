import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="page-title">{title || 'Dashboard'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
            {user?.firstName} {user?.lastName}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {user?.email}
          </div>
        </div>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#8b5cf6',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          {user?.firstName?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
