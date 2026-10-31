import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Button from '../../components/Button.jsx';
import Alert from '../../components/Alert.jsx';
import Badge from '../../components/Badge.jsx';
import api from '../../services/api.js';

export default function PortalProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      setLoading(true);
      const res = await api.put(`/users/${user.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      });
      updateUserProfile(res.data?.user || formData);
      setSuccessMsg('Your profile has been successfully updated');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile & Settings"
        subtitle="Manage your contact information and customer portal account"
      />

      {successMsg && <Alert type="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
      {errorMsg && <Alert type="danger" onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        <Card title="Customer Account">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
            <div className="avatar-circle" style={{ width: 64, height: 64, fontSize: 22, marginBottom: 12 }}>
              {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 10 }}>{user?.email}</p>
            <Badge status="CUSTOMER" />
          </div>
        </Card>

        <Card title="Update Contact Information">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Email Address"
              name="email"
              value={user?.email || ''}
              disabled
              helper="Email cannot be changed directly in the customer portal"
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 555-0100"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button type="submit" variant="primary" loading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

