import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Alert from '../../components/Alert.jsx';
import Badge from '../../components/Badge.jsx';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Manage Brightloop system configuration and operational policies"
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Settings' }
        ]}
      />

      <Alert type="info">
        Foundation Phase: Core system settings parameters are configured via server environment variables.
      </Alert>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card title="Security & Authentication">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              <span>Session Strategy</span>
              <strong>Server HTTP-Only Cookies</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              <span>Password Algorithm</span>
              <strong>bcrypt (Salt: 10)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              <span>Rate Limiting</span>
              <Badge status="ACTIVE" text="30 req / 15m" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Public Registration</span>
              <Badge status="ACTIVE" text="CUSTOMER Only" />
            </div>
          </div>
        </Card>

        <Card title="Billing & Localization">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              <span>Default Currency</span>
              <strong>USD ($)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              <span>Default Tax Rate</span>
              <strong>18.00%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              <span>Payment Grace Period</span>
              <strong>15 Days</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Invoicing Cadence</span>
              <strong>Automated Recurring</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

