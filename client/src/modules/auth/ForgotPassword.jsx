import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetTokenReceived, setResetTokenReceived] = useState(null);

  const { success, error } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      success(res.message || 'Password reset instructions have been generated.');
      if (res.data?.resetToken) {
        setResetTokenReceived(res.data.resetToken);
      }
    } catch (err) {
      error(err.message || 'Failed to process password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Reset Your Password
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Enter your verified email to receive a password reset token
      </p>

      {resetTokenReceived ? (
        <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6d28d9', marginBottom: '0.5rem' }}>
            Password Reset Token Generated:
          </p>
          <code style={{ display: 'block', background: '#ffffff', padding: '0.5rem', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.8rem', color: '#0f172a' }}>
            {resetTokenReceived}
          </code>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link
              to={`/reset-password?token=${resetTokenReceived}`}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-block' }}
            >
              Proceed to Reset Password →
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Sending Request...' : 'Send Reset Instructions'}
          </button>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        <Link to="/login" style={{ color: '#7c3aed', fontWeight: 600 }}>
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
