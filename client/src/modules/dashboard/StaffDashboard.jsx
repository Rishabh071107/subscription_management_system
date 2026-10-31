import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const StaffDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const { error } = useNotification();

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        setMetrics(res.data?.metrics || {});
      } catch (err) {
        error(err.message || 'Failed to load staff metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading operational dashboard..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Staff Operational Workspace</h2>
          <p>Customer accounts, quotations, recurring billing, and payment receipts</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/quotations" className="btn btn-primary">
            + Create Quotation
          </Link>
          <Link to="/payments" className="btn btn-secondary">
            + Record Payment
          </Link>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Subscriptions</span>
            <div className="metric-icon-box">🔄</div>
          </div>
          <div className="metric-value" style={{ color: '#7c3aed' }}>
            {metrics?.activeSubscriptions || 0}
          </div>
          <div className="metric-footer">Live subscriber services</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Assigned Customers</span>
            <div className="metric-icon-box">👥</div>
          </div>
          <div className="metric-value">
            {metrics?.totalCustomers || 0}
          </div>
          <div className="metric-footer">Registered customer accounts</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Pending Invoices</span>
            <div className="metric-icon-box">📄</div>
          </div>
          <div className="metric-value" style={{ color: '#d97706' }}>
            {metrics?.pendingInvoices || 0}
          </div>
          <div className="metric-footer">Invoices requiring collection</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Payments Processed</span>
            <div className="metric-icon-box">💳</div>
          </div>
          <div className="metric-value" style={{ color: '#059669' }}>
            ${Number(metrics?.paymentsRecordedTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-footer">{metrics?.paymentsRecordedCount || 0} transactions recorded by you</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Workflows</h3>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Create and review quotations, convert quotations into active subscriptions, and check customer details.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/quotations" className="btn btn-secondary btn-sm">Quotations</Link>
              <Link to="/subscriptions" className="btn btn-secondary btn-sm">Subscriptions</Link>
              <Link to="/users" className="btn btn-secondary btn-sm">Customer Directory</Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Invoices & Collections</h3>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Generate invoices for confirmed subscriptions, record incoming bank wires and card payments.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/invoices" className="btn btn-secondary btn-sm">Invoices</Link>
              <Link to="/payments" className="btn btn-secondary btn-sm">Payments</Link>
              <Link to="/plans" className="btn btn-secondary btn-sm">Check Plans</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
