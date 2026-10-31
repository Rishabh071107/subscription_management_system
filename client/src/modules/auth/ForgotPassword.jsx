import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Alert from '../../components/Alert.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetTokenReceived, setResetTokenReceived] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMessage(res.message || 'If an account exists with this email, password reset instructions have been generated.');
      if (res.data?.resetToken) {
        setResetTokenReceived(res.data.resetToken);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to process password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>
        Reset Your Password
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        Enter your verified email to receive password reset instructions
      </p>

      {errorMessage && (
        <Alert type="danger" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert type="info" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {resetTokenReceived ? (
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
            Generated Reset Token (Development/Testing):
          </p>
          <code style={{ display: 'block', backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', padding: '8px', borderRadius: '4px', wordBreak: 'break-all', fontSize: '12px' }}>
            {resetTokenReceived}
          </code>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link
              to={`/reset-password?token=${resetTokenReceived}`}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-block' }}
            >
              Continue to Reset Password →
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Button
            type="submit"
            variant="primary"
            block
            loading={loading}
          >
            Send Reset Instructions
          </Button>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
        <Link to="/login" style={{ fontWeight: 600 }}>
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}
