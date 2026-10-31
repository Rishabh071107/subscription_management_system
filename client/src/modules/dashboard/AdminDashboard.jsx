import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);

  const { success, error } = useNotification();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      setMetrics(res.data?.metrics || {});
    } catch (err) {
      error(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/invoices/run-billing-cycle');
      success(`Billing run completed. Evaluated: ${res.data.totalEvaluated}, Generated: ${res.data.generated.length}`);
      fetchDashboardData();
    } catch (err) {
      error(err.message || 'Billing cycle execution failed');
    } finally {
      setRunningBilling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading system metrics..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Executive Overview</h2>
          <p>Real-time metrics, recurring revenues, and operational workflows</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleRunBilling}
            disabled={runningBilling}
          >
            {runningBilling ? 'Generating Invoices...' : '⚡ Run Automated Billing Cycle'}
          </button>
          <Link to="/quotations" className="btn btn-primary">
            + New Quotation
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Revenue</span>
            <div className="metric-icon-box">💰</div>
          </div>
          <div className="metric-value">
            ${Number(metrics?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-footer">Billed across all confirmed invoices</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Payments Received</span>
            <div className="metric-icon-box">💳</div>
          </div>
          <div className="metric-value" style={{ color: '#059669' }}>
            ${Number(metrics?.paymentsReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-footer">Reconciled cash & digital receipts</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Subscriptions</span>
            <div className="metric-icon-box">🔄</div>
          </div>
          <div className="metric-value" style={{ color: '#7c3aed' }}>
            {metrics?.activeSubscriptions || 0}
          </div>
          <div className="metric-footer">
            Closed/Cancelled: {metrics?.closedSubscriptions || 0}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Customers</span>
            <div className="metric-icon-box">👥</div>
          </div>
          <div className="metric-value">
            {metrics?.totalCustomers || 0}
          </div>
          <div className="metric-footer">
            Active Staff: {metrics?.totalStaff || 0}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Pending Invoices</span>
            <div className="metric-icon-box">⏳</div>
          </div>
          <div className="metric-value" style={{ color: '#d97706' }}>
            {metrics?.pendingInvoices || 0}
          </div>
          <div className="metric-footer">Awaiting customer payment</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Overdue Invoices</span>
            <div className="metric-icon-box">⚠️</div>
          </div>
          <div className="metric-value" style={{ color: '#dc2626' }}>
            {metrics?.overdueInvoices || 0}
          </div>
          <div className="metric-footer">Past specified payment terms</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Catalog & Subscription Setup</h3>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Configure recurring plans with daily, weekly, monthly, and yearly cycles. Manage products and variants.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/plans" className="btn btn-secondary btn-sm">Manage Plans</Link>
              <Link to="/products" className="btn btn-secondary btn-sm">Manage Products</Link>
              <Link to="/discounts" className="btn btn-secondary btn-sm">Coupons & Discounts</Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Financial Reconciliation</h3>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Record customer payments, print/download PDF invoices, and monitor aged accounts receivables.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/invoices" className="btn btn-secondary btn-sm">Browse Invoices</Link>
              <Link to="/payments" className="btn btn-secondary btn-sm">Record Payment</Link>
              <Link to="/reports" className="btn btn-secondary btn-sm">View Reports</Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Staff & Access Control</h3>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Create operational staff accounts, audit users, and manage account activation/deactivation.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/users" className="btn btn-secondary btn-sm">Manage Staff & Users</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
