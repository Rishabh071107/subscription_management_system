import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Alert from '../../components/Alert.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      // Role-based redirect according to foundations.md
      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user?.role === 'STAFF') {
        navigate('/customers');
      } else if (user?.role === 'CUSTOMER') {
        navigate('/portal/dashboard');
      } else {
        navigate('/portal/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoUser = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
        Sign In to Brightloop
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        Enter your credentials to access your workspace
      </p>

      {errorMessage && (
        <Alert type="danger" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Quick Demo Credentials for Reviewers */}
      <div
        style={{
          backgroundColor: 'var(--color-primary-light)',
          border: '1px dashed var(--color-primary)',
          borderRadius: 'var(--radius-default)',
          padding: '10px 12px',
          marginBottom: '20px',
          fontSize: '12px'
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
          Quick Demo Accounts:
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDemoUser('admin@brightloop.io', 'Brightloop@2026')}
          >
            Admin
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDemoUser('staff@brightloop.io', 'Staff@2026!')}
          >
            Staff
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDemoUser('customer@acmecorp.com', 'Customer@2026!')}
          >
            Customer
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          id="email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />

        <div style={{ position: 'relative' }}>
          <Input
            label="Password"
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '32px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontFamily: 'var(--font-ui)'
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', marginTop: '-6px' }}>
          <Link to="/forgot-password" style={{ fontSize: '12px', fontWeight: 500 }}>
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          block
          loading={loading}
        >
          Sign In
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/signup" style={{ fontWeight: 600 }}>
          Create Customer Account
        </Link>
      </div>
    </div>
  );
}
