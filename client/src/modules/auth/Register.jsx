import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePasswordRules = (pass) => {
    return {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    };
  };

  const passRules = validatePasswordRules(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      error('Please fill in all required fields');
      return;
    }

    if (!passRules.length || !passRules.upper || !passRules.lower || !passRules.special) {
      error('Password does not meet all security complexity requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      success('Account created successfully! Welcome to Brightloop.');
      navigate('/dashboard');
    } catch (err) {
      error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Create Customer Account
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Get started with Brightloop Subscription Services
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              name="firstName"
              className="form-control"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              name="lastName"
              className="form-control"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="form-control"
            placeholder="+1 555-0100"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password *</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
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
          <label className="form-label">Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
        Already registered?{' '}
        <Link to="/login" style={{ fontWeight: 600, color: '#7c3aed' }}>
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
