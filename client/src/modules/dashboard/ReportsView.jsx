import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const ReportsView = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Revenue report state
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [revenueData, setRevenueData] = useState(null);

  // Subscription report state
  const [subscriptionData, setSubscriptionData] = useState(null);

  // Overdue report state
  const [overdueData, setOverdueData] = useState(null);

  const { error, success } = useNotification();

  const fetchRevenueReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/reports/revenue?fromDate=${fromDate}&toDate=${toDate}`);
      setRevenueData(res.data || res);
      setLastRefreshed(new Date());
    } catch (err) {
      error(err.message || 'Failed to load revenue report');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, error]);

  const fetchSubscriptionReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/reports/subscriptions');
      setSubscriptionData(res.data || res);
      setLastRefreshed(new Date());
    } catch (err) {
      error(err.message || 'Failed to load subscription analytics');
    } finally {
      setLoading(false);
    }
  }, [error]);

  const fetchOverdueReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/reports/overdue');
      setOverdueData(res.data || res);
      setLastRefreshed(new Date());
    } catch (err) {
      error(err.message || 'Failed to load overdue report');
    } finally {
      setLoading(false);
    }
  }, [error]);

  const refreshActiveReport = () => {
    if (activeTab === 'revenue') fetchRevenueReport();
    else if (activeTab === 'subscriptions') fetchSubscriptionReport();
    else if (activeTab === 'overdue') fetchOverdueReport();
    success('Refreshed real-time report metrics');
  };

  useEffect(() => {
    if (activeTab === 'revenue') fetchRevenueReport();
    else if (activeTab === 'subscriptions') fetchSubscriptionReport();
    else if (activeTab === 'overdue') fetchOverdueReport();
  }, [activeTab, fetchRevenueReport, fetchSubscriptionReport, fetchOverdueReport]);

  const applyPreset = (days) => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setFromDate(start);
    setToDate(end);
  };

  return (
    <div className="reports-view-root space-y-6">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Financial & Analytics Reports
            </h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Live Ledger Connected
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
            Real-time multi-dimensional reports on revenue collections, subscription cohorts, and overdue balances
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={refreshActiveReport}
            disabled={loading}
            title="Fetch latest transactions from database"
          >
            ⚡ Live Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'revenue' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Revenue Timeline
        </button>
        <button
          className={`btn ${activeTab === 'subscriptions' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          🔄 Subscription Cohorts
        </button>
        <button
          className={`btn ${activeTab === 'overdue' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('overdue')}
        >
          ⚠️ Overdue Receivables
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Querying database for real-time ledger report..." />
      ) : (
        <>
          {/* REVENUE TAB */}
          {activeTab === 'revenue' && revenueData && (
            <div>
              {/* Filter Controls Card */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <form
                    onSubmit={(e) => { e.preventDefault(); fetchRevenueReport(); }}
                    style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
                  >
                    <div>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>From Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>To Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Filter Date Range
                    </button>

                    {/* Presets */}
                    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(7)}>7 Days</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(30)}>30 Days</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(90)}>90 Days</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(365)}>1 Year</button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Revenue KPI Cards */}
              <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Total Realized Revenue</span>
                    <div className="metric-icon-box">💵</div>
                  </div>
                  <div className="metric-value" style={{ color: '#059669' }}>
                    ${Number(revenueData.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="metric-footer">Across {revenueData.totalTransactions || 0} reconciled payments</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Total Transactions</span>
                    <div className="metric-icon-box">💳</div>
                  </div>
                  <div className="metric-value" style={{ color: '#2563eb' }}>
                    {revenueData.totalTransactions || 0}
                  </div>
                  <div className="metric-footer">Payments settled in timeframe</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Avg Payment Value</span>
                    <div className="metric-icon-box">📊</div>
                  </div>
                  <div className="metric-value" style={{ color: '#7c3aed' }}>
                    ${revenueData.totalTransactions > 0
                      ? (revenueData.totalRevenue / revenueData.totalTransactions).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0.00'}
                  </div>
                  <div className="metric-footer">Average ticket size</div>
                </div>
              </div>

              {/* Timeline Table */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">Daily Revenue Collection Timeline</h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {revenueData.timeline?.length || 0} active collection day(s)
                  </span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {revenueData.timeline && revenueData.timeline.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Total Collected</th>
                            <th>Share of Period Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueData.timeline.map((entry) => {
                            const maxAmt = Math.max(...revenueData.timeline.map((t) => t.amount), 1);
                            const percent = Math.min(100, Math.round((entry.amount / maxAmt) * 100));
                            return (
                              <tr key={entry.date}>
                                <td style={{ fontWeight: 600 }}>{entry.date}</td>
                                <td style={{ fontWeight: 700, color: '#059669' }}>
                                  ${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ width: '45%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ flex: 1, background: '#ede9fe', borderRadius: '4px', height: '14px', overflow: 'hidden' }}>
                                      <div style={{ width: `${percent}%`, height: '100%', background: '#7c3aed', borderRadius: '4px' }} />
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', width: '40px', textAlign: 'right' }}>
                                      {percent}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No payments recorded in the selected date range. Try widening the date filter or recording a payment.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === 'subscriptions' && subscriptionData && (
            <div>
              {/* Subscription Metric Cards */}
              <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Active Subscriptions</span>
                    <div className="metric-icon-box">🔄</div>
                  </div>
                  <div className="metric-value" style={{ color: '#714B67' }}>
                    {subscriptionData.activeCount || 0}
                  </div>
                  <div className="metric-footer">Currently generating recurring value</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Estimated MRR</span>
                    <div className="metric-icon-box">📈</div>
                  </div>
                  <div className="metric-value" style={{ color: '#059669' }}>
                    ${Number(subscriptionData.estimatedMrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="metric-footer">Monthly Recurring Revenue run-rate</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Estimated ARR</span>
                    <div className="metric-icon-box">💼</div>
                  </div>
                  <div className="metric-value" style={{ color: '#2563eb' }}>
                    ${Number(subscriptionData.estimatedArr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="metric-footer">Annualized Run-Rate contract value</div>
                </div>
              </div>

              {/* Distributions Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Subscriptions by Status</h3>
                  </div>
                  <div className="card-body">
                    {subscriptionData.statusDistribution && subscriptionData.statusDistribution.length > 0 ? (
                      subscriptionData.statusDistribution.map((item) => (
                        <div
                          key={item.status}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 0',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <Badge status={item.status} />
                          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{item.count}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No subscriptions found.</p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Subscriptions by Plan</h3>
                  </div>
                  <div className="card-body">
                    {subscriptionData.planDistribution && subscriptionData.planDistribution.length > 0 ? (
                      subscriptionData.planDistribution.map((item) => (
                        <div
                          key={item.planId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 0',
                            borderBottom: '1px solid #f1f5f9'
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{item.planName}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>
                            {item.count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No subscriptions found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OVERDUE TAB */}
          {activeTab === 'overdue' && overdueData && (
            <div>
              <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Total Overdue Receivables</span>
                    <div className="metric-icon-box">⚠️</div>
                  </div>
                  <div className="metric-value" style={{ color: '#dc2626' }}>
                    ${Number(overdueData.totalOverdueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="metric-footer">{overdueData.totalOverdueInvoices || 0} overdue invoices past payment terms</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Delinquency Count</span>
                    <div className="metric-icon-box">📄</div>
                  </div>
                  <div className="metric-value" style={{ color: '#d97706' }}>
                    {overdueData.totalOverdueInvoices || 0}
                  </div>
                  <div className="metric-footer">Invoices requiring collection intervention</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">Delinquent Invoices Detail</h3>
                  <Link to="/overdue" className="btn btn-outline btn-sm">
                    Open Full Collections Ledger →
                  </Link>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {overdueData.invoices && overdueData.invoices.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Invoice #</th>
                            <th>Customer</th>
                            <th>Due Date</th>
                            <th>Total Amount</th>
                            <th>Outstanding</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overdueData.invoices.map((inv) => (
                            <tr key={inv.id}>
                              <td style={{ fontWeight: 700, color: '#7c3aed' }}>
                                <Link to={`/invoices/${inv.id}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                                  {inv.invoiceNumber}
                                </Link>
                              </td>
                              <td>{inv.customer?.firstName} {inv.customer?.lastName}</td>
                              <td style={{ color: '#dc2626', fontWeight: 600 }}>
                                {new Date(inv.dueDate).toLocaleDateString()}
                              </td>
                              <td>${Number(inv.total).toFixed(2)}</td>
                              <td style={{ fontWeight: 700, color: '#dc2626' }}>
                                ${Number(inv.outstandingAmount).toFixed(2)}
                              </td>
                              <td><Badge status="OVERDUE" /></td>
                              <td>
                                <Link to={`/invoices/${inv.id}`} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '12px' }}>
                                  Inspect
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                      ✓ Outstanding health check: There are zero overdue invoices!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsView;
