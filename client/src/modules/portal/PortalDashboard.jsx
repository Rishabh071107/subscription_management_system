import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function PortalDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useNotification();

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/portal/dashboard');
        setDashboardData(res.data?.data || res.data || {});
      } catch (err) {
        error(err.message || 'Failed to load customer portal dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading your customer portal..." />;
  }

  const metrics = dashboardData?.metrics || {};
  const recentSubs = dashboardData?.recentSubscriptions || [];
  const recentInvs = dashboardData?.recentInvoices || [];
  const user = dashboardData?.user || {};

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.firstName || 'Customer'}`}
        subtitle="Manage your active subscriptions, billing statements, and payment records"
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/portal/subscriptions" className="btn btn-primary">
              My Subscriptions
            </Link>
            <Link to="/portal/invoices" className="btn btn-outline">
              My Invoices
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="card" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
              Active Subscriptions
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#F3E9F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#714B67' }}>
              📦
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#212529', lineHeight: 1.2 }}>
            {metrics.activeSubscriptionsCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '6px' }}>
            Active cloud & software contracts
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
              Outstanding Balance
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: Number(metrics.totalOutstanding || 0) > 0 ? '#FEE2E2' : '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              💳
            </div>
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              fontFamily: 'Space Grotesk, sans-serif',
              color: Number(metrics.totalOutstanding || 0) > 0 ? '#DC2626' : '#16A34A',
              lineHeight: 1.2
            }}
          >
            ${Number(metrics.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '6px' }}>
            Due across unpaid invoices
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
              Total Paid
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#F3E9F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#714B67' }}>
              ✨
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#212529', lineHeight: 1.2 }}>
            ${Number(metrics.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '6px' }}>
            Lifetime payments completed
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6C757D', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
              Total Invoices
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📄
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#212529', lineHeight: 1.2 }}>
            {metrics.invoicesCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '6px' }}>
            Billing statements issued
          </div>
        </div>
      </div>

      {/* Grid of Subscriptions & Invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Recent Subscriptions */}
        <Card
          title="My Active Subscriptions"
          actions={
            <Link to="/portal/subscriptions" className="btn btn-outline btn-sm">
              View All
            </Link>
          }
        >
          {recentSubs && recentSubs.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subscription #</th>
                    <th>Plan</th>
                    <th>Interval</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubs.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600, color: '#714B67' }}>
                        <Link to={`/portal/subscriptions/${sub.id}`} style={{ color: 'inherit' }}>
                          {sub.subscriptionNumber}
                        </Link>
                      </td>
                      <td>{sub.plan?.name || 'Standard'}</td>
                      <td>
                        <Badge text={sub.plan?.billingInterval || 'MONTHLY'} />
                      </td>
                      <td>
                        <Badge status={sub.status} />
                      </td>
                      <td>
                        <Link to={`/portal/subscriptions/${sub.id}`} className="btn btn-outline btn-sm">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6C757D' }}>
              No subscriptions found.
            </div>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card
          title="Recent Invoices"
          actions={
            <Link to="/portal/invoices" className="btn btn-outline btn-sm">
              View All
            </Link>
          }
        >
          {recentInvs && recentInvs.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvs.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: '#714B67' }}>
                        <Link to={`/portal/invoices/${inv.id}`} style={{ color: 'inherit' }}>
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td>
                        <Badge status={inv.status} />
                      </td>
                      <td>
                        <Link to={`/portal/invoices/${inv.id}`} className="btn btn-outline btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6C757D' }}>
              No invoices generated yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

