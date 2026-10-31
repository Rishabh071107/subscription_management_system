import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const ReportsView = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(true);

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

  const { error } = useNotification();

  const fetchRevenueReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/reports/revenue?fromDate=${fromDate}&toDate=${toDate}`);
      setRevenueData(res.data);
    } catch (err) {
      error(err.message || 'Failed to load revenue report');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/reports/subscriptions');
      setSubscriptionData(res.data);
    } catch (err) {
      error(err.message || 'Failed to load subscription analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/reports/overdue');
      setOverdueData(res.data);
    } catch (err) {
      error(err.message || 'Failed to load overdue report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'revenue') fetchRevenueReport();
    else if (activeTab === 'subscriptions') fetchSubscriptionReport();
    else if (activeTab === 'overdue') fetchOverdueReport();
  }, [activeTab]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Financial & Analytics Reports</h2>
        <p>Comprehensive reporting on recurring revenue, active subscription cohorts, and overdue balances</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'revenue' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Revenue Reports
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
        <LoadingSpinner text="Generating report analytics..." />
      ) : (
        <>
          {/* REVENUE TAB */}
          {activeTab === 'revenue' && revenueData && (
            <div>
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <form
                    onSubmit={(e) => { e.preventDefault(); fetchRevenueReport(); }}
                    style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
                  >
                    <div>
                      <label className="form-label">From Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">To Date</label>
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
                  </form>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Period Collections</span>
                    <div className="metric-icon-box">💵</div>
                  </div>
                  <div className="metric-value" style={{ color: '#059669' }}>
                    ${Number(revenueData.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="metric-footer">{revenueData.totalTransactions} recorded payments</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Daily Revenue Collection Timeline</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {revenueData.timeline && revenueData.timeline.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Total Collected</th>
                            <th>Visual Indicator</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueData.timeline.map((entry) => {
                            const maxAmt = Math.max(...revenueData.timeline.map(t => t.amount), 1);
                            const percent = Math.min(100, Math.round((entry.amount / maxAmt) * 100));
                            return (
                              <tr key={entry.date}>
                                <td style={{ fontWeight: 600 }}>{entry.date}</td>
                                <td style={{ fontWeight: 700, color: '#059669' }}>
                                  ${entry.amount.toFixed(2)}
                                </td>
                                <td style={{ width: '40%' }}>
                                  <div style={{ background: '#ede9fe', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percent}%`, height: '100%', background: '#7c3aed', borderRadius: '4px' }} />
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
                      No payments recorded in the selected date range.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === 'subscriptions' && subscriptionData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Subscriptions by Status</h3>
                </div>
                <div className="card-body">
                  {subscriptionData.statusDistribution.map((item) => (
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
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Subscriptions by Plan</h3>
                </div>
                <div className="card-body">
                  {subscriptionData.planDistribution.map((item) => (
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
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OVERDUE TAB */}
          {activeTab === 'overdue' && overdueData && (
            <div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Total Overdue Amount</span>
                    <div className="metric-icon-box">⚠️</div>
                  </div>
                  <div className="metric-value" style={{ color: '#dc2626' }}>
                    ${Number(overdueData.totalOverdueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="metric-footer">{overdueData.totalOverdueInvoices} overdue invoices</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Overdue Invoices Detail</h3>
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
                          </tr>
                        </thead>
                        <tbody>
                          {overdueData.invoices.map((inv) => (
                            <tr key={inv.id}>
                              <td style={{ fontWeight: 700, color: '#7c3aed' }}>{inv.invoiceNumber}</td>
                              <td>{inv.customer?.firstName} {inv.customer?.lastName}</td>
                              <td style={{ color: '#dc2626', fontWeight: 600 }}>
                                {new Date(inv.dueDate).toLocaleDateString()}
                              </td>
                              <td>${Number(inv.total).toFixed(2)}</td>
                              <td style={{ fontWeight: 700, color: '#dc2626' }}>
                                ${Number(inv.outstandingAmount).toFixed(2)}
                              </td>
                              <td><Badge status="OVERDUE" /></td>
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
