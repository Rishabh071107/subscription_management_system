import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please fill in both email and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      success(`Welcome back, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (err) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Sign In to Your Account
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Enter your credentials to access the system
      </p>

      {/* Quick Demo Credentials Bar */}
      <div
        style={{
          background: '#f5f3ff',
          border: '1px dashed #c4b5fd',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1.5rem',
          fontSize: '0.75rem'
        }}
      >
        <span style={{ fontWeight: 700, color: '#6d28d9', display: 'block', marginBottom: '0.35rem' }}>
          Quick Demo Credentials:
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            onClick={() => setDemoUser('admin@brightloop.io', 'Brightloop@2026')}
          >
            Admin
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            onClick={() => setDemoUser('staff@brightloop.io', 'Staff@2026!')}
          >
            Staff
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            onClick={() => setDemoUser('customer@acmecorp.com', 'Customer@2026!')}
          >
            Customer
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#7c3aed' }}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ fontWeight: 600, color: '#7c3aed' }}>
          Create Customer Account
        </Link>
      </div>
    </div>
  );
};

export default Login;
