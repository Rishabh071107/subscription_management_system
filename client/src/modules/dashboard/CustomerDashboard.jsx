import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const CustomerDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const { error } = useNotification();

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        setMetrics(res.data?.metrics || {});
      } catch (err) {
        error(err.message || 'Failed to load account dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading your subscription portal..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Customer Self-Service Portal</h2>
          <p>Monitor your active subscriptions, billing statements, and payments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/plans" className="btn btn-primary">
            Browse Plans & Services
          </Link>
          <Link to="/quotations" className="btn btn-secondary">
            Request Quote
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
            {metrics?.activeSubscriptionsCount || 0}
          </div>
          <div className="metric-footer">Active software & cloud services</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Outstanding Balance</span>
            <div className="metric-icon-box">📄</div>
          </div>
          <div className="metric-value" style={{ color: Number(metrics?.totalOutstanding || 0) > 0 ? '#dc2626' : '#059669' }}>
            ${Number(metrics?.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-footer">Due across pending invoices</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Spent</span>
            <div className="metric-icon-box">💳</div>
          </div>
          <div className="metric-value">
            ${Number(metrics?.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-footer">Total payments recorded</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Invoices Issued</span>
            <div className="metric-icon-box">📑</div>
          </div>
          <div className="metric-value">
            {metrics?.invoicesCount || 0}
          </div>
          <div className="metric-footer">Total billing statements</div>
        </div>
      </div>

      {/* Active Subscriptions List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">My Active Subscriptions</h3>
          <Link to="/subscriptions" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {metrics?.activeSubscriptions && metrics.activeSubscriptions.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subscription #</th>
                    <th>Plan</th>
                    <th>Interval</th>
                    <th>Start Date</th>
                    <th>Next Billing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.activeSubscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 700, color: '#7c3aed' }}>{sub.subscriptionNumber}</td>
                      <td>{sub.plan?.name}</td>
                      <td><Badge text={sub.billingInterval} /></td>
                      <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                      <td>{sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}</td>
                      <td><Badge status={sub.status} /></td>
                      <td>
                        <Link to={`/subscriptions/${sub.id}`} className="btn btn-outline btn-sm">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ marginBottom: '1rem' }}>You have no active subscriptions yet.</p>
              <Link to="/plans" className="btn btn-primary btn-sm">Browse Available Plans</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
