import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/Button.jsx';

export default function AccessDenied() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'STAFF') {
      navigate('/customers');
    } else if (user?.role === 'CUSTOMER') {
      navigate('/portal/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-danger)' }}>
        403 — Access Denied
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
        You do not have the required permissions or role to view this page or perform this action.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" onClick={handleGoHome}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}

