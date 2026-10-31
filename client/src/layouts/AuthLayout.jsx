import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ffffff 100%)',
        padding: '2rem 1rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 20px 25px -5px rgba(124, 58, 237, 0.12), 0 8px 10px -6px rgba(124, 58, 237, 0.08)',
          border: '1px solid #e9d5ff'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#blAuthGrad)" />
              <circle cx="24" cy="24" r="14" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="22 8" />
              <circle cx="24" cy="24" r="6" fill="#ffffff" />
              <defs>
                <linearGradient id="blAuthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Brightloop
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Subscription & Recurring Billing Platform</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
