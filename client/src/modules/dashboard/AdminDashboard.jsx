import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import KPIStatCard from '../../components/KPIStatCard.jsx';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [subscriptionStats, setSubscriptionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);

  // Timeframe filter: 'ALL', '30D', '90D', '1Y'
  const [timeframe, setTimeframe] = useState('ALL');

  const { success, error } = useNotification();

  const getDateRangeForTimeframe = (tf) => {
    const now = new Date();
    if (tf === '30D') {
      const start = new Date(now.getTime() - 30 * 86400000);
      return { startDate: start.toISOString() };
    }
    if (tf === '90D') {
      const start = new Date(now.getTime() - 90 * 86400000);
      return { startDate: start.toISOString() };
    }
    if (tf === '1Y') {
      const start = new Date(now.getTime() - 365 * 86400000);
      return { startDate: start.toISOString() };
    }
    return {};
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const dateParams = getDateRangeForTimeframe(timeframe);
      const queryStr = new URLSearchParams(dateParams).toString();

      const [summaryRes, paymentsRes, subRes] = await Promise.all([
        api.get(`/dashboard/summary${queryStr ? `?${queryStr}` : ''}`),
        api.get(`/dashboard/payments${queryStr ? `?${queryStr}` : ''}`).catch(() => ({ data: null })),
        api.get('/dashboard/subscriptions').catch(() => ({ data: null }))
      ]);

      setMetrics(summaryRes.data?.metrics || summaryRes.data || {});
      setPaymentsSummary(paymentsRes.data || null);
      setSubscriptionStats(subRes.data || null);
    } catch (err) {
      error(err.message || 'Failed to fetch financial dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [timeframe, error]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/invoices/run-billing-cycle');
      success(`Billing run finished: Evaluated ${res.data?.totalEvaluated || 0}, Generated ${res.data?.generated?.length || 0} invoice(s)`);
      fetchDashboardData();
    } catch (err) {
      error(err.message || 'Billing cycle execution failed');
    } finally {
      setRunningBilling(false);
    }
  };

  if (loading && !metrics) {
    return <LoadingSpinner text="Aggregating financial metrics..." />;
  }

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const revenueReceived = Number(metrics?.revenueReceived || metrics?.paymentsReceived || 0);
  const outstandingAmount = Number(metrics?.outstandingAmount || 0);
  const overdueAmount = Number(metrics?.overdueAmount || 0);
  const totalInvoiced = Number(metrics?.totalInvoiced || metrics?.totalRevenue || 0);

  return (
    <div className="admin-dashboard-root space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Financial Overview & Operations"
        subtitle="Real-time revenue reconciliation, active subscription yields, and collection monitoring"
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/reports" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>📈</span>
              <span>Reports & Analytics</span>
            </Link>
            <Button
              variant="secondary"
              onClick={handleRunBilling}
              loading={runningBilling}
            >
              ⚡ Run Billing Engine
            </Button>
            <Link to="/payments" className="btn btn-primary">
              + Record Payment
            </Link>
          </div>
        }
      />

      {/* Timeframe Presets Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Filter Window:
          </span>
          <div style={{ display: 'inline-flex', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: '30D', label: 'Last 30 Days' },
              { id: '90D', label: 'Last 90 Days' },
              { id: '1Y', label: 'Past Year' }
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                style={{
                  background: timeframe === tf.id ? 'var(--color-primary)' : 'transparent',
                  color: timeframe === tf.id ? '#FFFFFF' : 'var(--color-text-primary)',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontWeight: timeframe === tf.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Figures aggregated directly from live transaction ledgers
        </div>
      </div>

      {/* Critical Overdue Alert Banner if debt is past due */}
      {overdueAmount > 0 && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#991B1B' }}>
                ${formatCurrency(overdueAmount)} Overdue Debt Across {metrics?.overdueInvoices || 0} Account(s)
              </div>
              <div style={{ fontSize: 13, color: '#B91C1C' }}>
                Customer invoice payment terms have expired. Action is recommended to avoid default risk.
              </div>
            </div>
          </div>
          <Link to="/overdue" className="btn btn-sm" style={{ background: '#DC2626', color: '#FFFFFF', fontWeight: 600 }}>
            Open Collections Ledger →
          </Link>
        </div>
      )}

      {/* KPI Metrics Responsive Grid (6 Core Financial Metric Cards) */}
      <section className="metrics-grid" aria-label="Key Performance Indicators">
        <KPIStatCard
          title="Revenue Received"
          icon="💳"
          iconTheme="payments"
          value={`$${formatCurrency(revenueReceived)}`}
          valueColor="#059669"
          footer="Reconciled customer payments"
        />

        <KPIStatCard
          title="Outstanding Receivables"
          icon="⏳"
          iconTheme="pending"
          value={`$${formatCurrency(outstandingAmount)}`}
          valueColor="#D97706"
          footer={`Pending Invoices: ${metrics?.pendingInvoices || 0}`}
        />

        <KPIStatCard
          title="Overdue Debt"
          icon="⚠️"
          iconTheme="overdue"
          value={`$${formatCurrency(overdueAmount)}`}
          valueColor="#DC2626"
          footer={`Past Due Invoices: ${metrics?.overdueInvoices || 0}`}
        />

        <KPIStatCard
          title="Active Subscriptions"
          icon="🔄"
          iconTheme="subscriptions"
          value={metrics?.activeSubscriptions || 0}
          valueColor="var(--color-primary)"
          footer={
            subscriptionStats?.estimatedMrr
              ? `Est. MRR: $${formatCurrency(subscriptionStats.estimatedMrr)}`
              : `Closed: ${metrics?.closedSubscriptions || 0}`
          }
        />

        <KPIStatCard
          title="Total Billed"
          icon="💰"
          iconTheme="revenue"
          value={`$${formatCurrency(totalInvoiced)}`}
          footer="Gross invoiced across all contracts"
        />

        <KPIStatCard
          title="Total Customers"
          icon="👥"
          iconTheme="customers"
          value={metrics?.totalCustomers || 0}
          footer={`Staff Operators: ${metrics?.totalStaff || 0}`}
        />
      </section>

      {/* Financial Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Payment Methods Breakdown */}
        <Card title="Payment Method Distribution">
          {paymentsSummary?.byMethod && paymentsSummary.byMethod.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {paymentsSummary.byMethod.map((item) => {
                const totalAmt = paymentsSummary.totalAmount || 1;
                const percentage = Math.round((item.amount / totalAmt) * 100) || 0;
                return (
                  <div key={item.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        <Badge status={item.method} />
                      </span>
                      <span style={{ fontFamily: 'var(--font-metric)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        ${formatCurrency(item.amount)} ({percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--color-bg-muted)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                          height: '100%',
                          background: 'var(--color-primary)',
                          borderRadius: 3
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {item.count} payment transactions
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>
              No payments recorded in this timeframe window.
            </div>
          )}
        </Card>

        {/* Recent Payment Receipts Ledger */}
        <Card title="Recent Payment Receipts">
          {paymentsSummary?.recentPayments && paymentsSummary.recentPayments.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsSummary.recentPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.customer?.firstName} {p.customer?.lastName}</div>
                      </td>
                      <td><Badge status={p.paymentMethod} /></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'var(--font-metric)' }}>
                        ${formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <Link to="/payments" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                  View All Payments →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '1.5rem 0' }}>
              No recent payment receipts available.
            </div>
          )}
        </Card>
      </div>

      {/* Operational Sections */}
      <section className="dashboard-action-grid" aria-label="Quick Management Modules">
        <Card title="Billing & Invoicing Operations">
          <p className="card-description">
            Run automated recurring billing cycles, generate monthly statements, and inspect client invoices.
          </p>
          <div className="card-action-links">
            <Link to="/admin/billing" className="btn btn-secondary btn-sm">Recurring Billing Runs</Link>
            <Link to="/invoices" className="btn btn-secondary btn-sm">Browse Invoices</Link>
            <Link to="/overdue" className="btn btn-secondary btn-sm">Aged Collections</Link>
          </div>
        </Card>

        <Card title="Catalog & Subscription Setup">
          <p className="card-description">
            Manage subscription plans, recurring intervals, customer discounts, and product catalogs.
          </p>
          <div className="card-action-links">
            <Link to="/plans" className="btn btn-secondary btn-sm">Manage Plans</Link>
            <Link to="/products" className="btn btn-secondary btn-sm">Manage Products</Link>
            <Link to="/discounts" className="btn btn-secondary btn-sm">Coupons & Discounts</Link>
          </div>
        </Card>

        <Card title="Access & Administration">
          <p className="card-description">
            Audit system operations, administer staff permissions, and manage enterprise customers.
          </p>
          <div className="card-action-links">
            <Link to="/admin/staff" className="btn btn-secondary btn-sm">Manage Staff</Link>
            <Link to="/customers" className="btn btn-secondary btn-sm">Customer Directory</Link>
            <Link to="/settings" className="btn btn-secondary btn-sm">System Settings</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
