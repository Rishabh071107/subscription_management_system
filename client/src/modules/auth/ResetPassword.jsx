import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { success, error } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const validatePasswordRules = (pass) => {
    return {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    };
  };

  const passRules = validatePasswordRules(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      error('Reset token is required');
      return;
    }

    if (!passRules.length || !passRules.upper || !passRules.lower || !passRules.special) {
      error('Password does not satisfy complexity requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      success(res.message || 'Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Set New Password
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Create a secure password with required complexity
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Reset Token</label>
          <input
            type="text"
            className="form-control"
            placeholder="Paste reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ color: passRules.length ? '#059669' : '#94a3b8' }}>
              {passRules.length ? '✓' : '○'} Longer than 8 characters
            </span>
            <span style={{ color: passRules.upper ? '#059669' : '#94a3b8' }}>
              {passRules.upper ? '✓' : '○'} At least one uppercase letter
            </span>
            <span style={{ color: passRules.lower ? '#059669' : '#94a3b8' }}>
              {passRules.lower ? '✓' : '○'} At least one lowercase letter
            </span>
            <span style={{ color: passRules.special ? '#059669' : '#94a3b8' }}>
              {passRules.special ? '✓' : '○'} At least one special character (!@#$%^&*)
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? 'Updating Password...' : 'Reset Password'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        <Link to="/login" style={{ color: '#7c3aed', fontWeight: 600 }}>
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
