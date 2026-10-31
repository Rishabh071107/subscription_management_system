import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'subscriptions' | 'invoices' | 'payments'
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Report Data States
  const [reportData, setReportData] = useState(null);

  const { error } = useNotification();

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter) {
        if (activeTab === 'payments') {
          params.append('paymentMethod', statusFilter);
        } else {
          params.append('status', statusFilter);
        }
      }
      params.append('page', page);
      params.append('limit', '10');

      let endpoint = '/reports/revenue';
      if (activeTab === 'subscriptions') endpoint = '/reports/subscriptions';
      else if (activeTab === 'invoices') endpoint = '/reports/invoices';
      else if (activeTab === 'payments') endpoint = '/reports/payments';

      const res = await api.get(`${endpoint}?${params.toString()}`);
      setReportData(res.data || res);
    } catch (err) {
      error(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, statusFilter, page, error]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter) {
        if (activeTab === 'payments') params.append('paymentMethod', statusFilter);
        else params.append('status', statusFilter);
      }
      params.append('export', 'csv');

      let endpoint = '/reports/revenue';
      if (activeTab === 'subscriptions') endpoint = '/reports/subscriptions';
      else if (activeTab === 'invoices') endpoint = '/reports/invoices';
      else if (activeTab === 'payments') endpoint = '/reports/payments';

      // Open or trigger direct download
      const downloadUrl = `${api.defaults.baseURL || '/api'}${endpoint}?${params.toString()}`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      error(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleTimeframePreset = (days) => {
    if (days === 0) {
      setStartDate('');
      setEndDate('');
    } else {
      const d = new Date();
      d.setDate(d.getDate() - days);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
    setPage(1);
  };

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Financial Reports & Analytics"
        subtitle="Reconciled financial intelligence, recurring subscriber yields, and billing performance."
        actions={
          <Button
            variant="primary"
            onClick={handleExportCsv}
            disabled={exporting || loading}
          >
            {exporting ? 'Exporting...' : '📥 Export to CSV'}
          </Button>
        }
      />

      {/* Report Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'revenue', label: '💰 Revenue Analytics' },
          { id: 'subscriptions', label: '🔄 Subscription Cohorts' },
          { id: 'invoices', label: '📄 Invoice Reconciliation' },
          { id: 'payments', label: '💳 Payment Ledgers' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={() => {
              setActiveTab(tab.id);
              setStatusFilter('');
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Card */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Window:
            </span>
            <div style={{ display: 'inline-flex', gap: 4 }}>
              {[
                { label: '30 Days', days: 30 },
                { label: '90 Days', days: 90 },
                { label: '1 Year', days: 365 },
                { label: 'All Time', days: 0 }
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => handleTimeframePreset(p.days)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Pickers & Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>From:</label>
              <input
                type="date"
                className="form-control"
                style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>To:</label>
              <input
                type="date"
                className="form-control"
                style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Dynamic Status Filter */}
            {activeTab !== 'revenue' && (
              <select
                className="form-select"
                style={{ width: 150, padding: '4px 8px', fontSize: 12 }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                {activeTab === 'invoices' && (
                  <>
                    <option value="PAID">Paid</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </>
                )}
                {activeTab === 'subscriptions' && (
                  <>
                    <option value="ACTIVE">Active</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PAUSED">Paused</option>
                    <option value="CLOSED">Closed</option>
                    <option value="DRAFT">Draft</option>
                  </>
                )}
                {activeTab === 'payments' && (
                  <>
                    <option value="BANK_TRANSFER">Bank Wire</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </>
                )}
              </select>
            )}
          </div>
        </div>
      </Card>

      {/* Main Report Content */}
      {loading ? (
        <LoadingSpinner text="Crunching financial reports..." />
      ) : (
        <>
          {/* TAB 1: REVENUE REPORT */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Total Collected Revenue
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: 4 }}>
                    ${formatCurrency(reportData?.totalRevenue)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Reconciled payment receipts
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Transactions Count
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                    {reportData?.totalTransactions || 0}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Cleared receipts in window
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366F1' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Average Transaction
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#6366F1', marginTop: 4 }}>
                    ${formatCurrency(reportData?.averageTransaction)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Per cleared payment
                  </span>
                </div>
              </div>

              {/* Timeline Table */}
              <Card title="Revenue Collection Timeline">
                {reportData?.timeline && reportData.timeline.length > 0 ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Cleared Volume</th>
                          <th>Transactions</th>
                          <th style={{ width: '40%' }}>Share of Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.timeline.map((point) => {
                          const pct = reportData.totalRevenue > 0
                            ? Math.round((point.revenue / reportData.totalRevenue) * 100)
                            : 0;
                          return (
                            <tr key={point.date}>
                              <td style={{ fontWeight: 600 }}>{point.date}</td>
                              <td style={{ fontFamily: 'var(--font-metric)', fontWeight: 700, color: '#059669' }}>
                                ${formatCurrency(point.revenue)}
                              </td>
                              <td>{point.transactions}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div style={{ flex: 1, height: 6, background: 'var(--color-bg-muted)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 35 }}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                    No revenue recorded in this date range.
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION REPORT */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Active Subscriptions
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                    {reportData?.summary?.activeSubscriptions || 0}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Total Cohorts: {reportData?.summary?.totalSubscriptions || 0}
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Estimated MRR
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: 4 }}>
                    ${formatCurrency(reportData?.summary?.estimatedMrr)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Monthly Recurring Revenue
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366F1' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Estimated ARR
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#6366F1', marginTop: 4 }}>
                    ${formatCurrency(reportData?.summary?.estimatedArr)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Annual Recurring Run-rate
                  </span>
                </div>
              </div>

              {/* Subscriptions Ledger Table */}
              <Card title="Subscription Cohorts Details">
                {reportData?.data && reportData.data.length > 0 ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Subscription #</th>
                          <th>Customer</th>
                          <th>Plan</th>
                          <th>Interval</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Start Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                              {sub.subscriptionNumber}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{sub.customer?.firstName} {sub.customer?.lastName}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{sub.customer?.email}</div>
                            </td>
                            <td>{sub.plan?.name || 'N/A'}</td>
                            <td><span style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>{sub.billingInterval}</span></td>
                            <td style={{ fontFamily: 'var(--font-metric)', fontWeight: 700, color: '#059669' }}>
                              ${formatCurrency(sub.totalAmount)}
                            </td>
                            <td><Badge status={sub.status} /></td>
                            <td style={{ fontSize: 12 }}>{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                    No subscriptions match this filter criteria.
                  </div>
                )}

                {reportData?.pagination?.totalPages > 1 && (
                  <div style={{ marginTop: '1rem' }}>
                    <Pagination
                      currentPage={page}
                      totalPages={reportData.pagination.totalPages}
                      onPageChange={(p) => setPage(p)}
                    />
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 3: INVOICE REPORT */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Total Billed
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                    ${formatCurrency(reportData?.summary?.totalBilled)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Across {reportData?.summary?.totalInvoices || 0} invoices
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Total Paid
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: 4 }}>
                    ${formatCurrency(reportData?.summary?.totalPaid)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Collection rate: {reportData?.summary?.collectionRate || 0}%
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #DC2626' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Total Outstanding
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#DC2626', marginTop: 4 }}>
                    ${formatCurrency(reportData?.summary?.totalOutstanding)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Awaiting customer settlement
                  </span>
                </div>
              </div>

              {/* Invoices Table */}
              <Card title="Invoices Reconciliation Ledger">
                {reportData?.data && reportData.data.length > 0 ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Customer</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Billed</th>
                          <th>Paid</th>
                          <th>Outstanding</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.map((inv) => (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                              <Link to={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{inv.customer?.firstName} {inv.customer?.lastName}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{inv.customer?.email}</div>
                            </td>
                            <td style={{ fontSize: 12 }}>{new Date(inv.issueDate).toLocaleDateString()}</td>
                            <td style={{ fontSize: 12 }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                            <td style={{ fontFamily: 'var(--font-metric)', fontWeight: 600 }}>${formatCurrency(inv.total)}</td>
                            <td style={{ fontFamily: 'var(--font-metric)', color: '#059669', fontWeight: 600 }}>${formatCurrency(inv.amountPaid)}</td>
                            <td style={{ fontFamily: 'var(--font-metric)', color: Number(inv.outstandingAmount) > 0 ? '#DC2626' : '#059669', fontWeight: 700 }}>
                              ${formatCurrency(inv.outstandingAmount)}
                            </td>
                            <td><Badge status={inv.status} /></td>
                            <td style={{ textAlign: 'right' }}>
                              <Link to={`/invoices/${inv.id}`} className="btn btn-outline btn-sm">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                    No invoices match this filter criteria.
                  </div>
                )}

                {reportData?.pagination?.totalPages > 1 && (
                  <div style={{ marginTop: '1rem' }}>
                    <Pagination
                      currentPage={page}
                      totalPages={reportData.pagination.totalPages}
                      onPageChange={(p) => setPage(p)}
                    />
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 4: PAYMENT REPORT */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Total Payments Volume
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: 4 }}>
                    ${formatCurrency(reportData?.summary?.totalCollected)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Reconciled receipts
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Payment Records
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                    {reportData?.summary?.totalPayments || 0}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Individual transactions
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366F1' }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Average Payment
                  </span>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#6366F1', marginTop: 4 }}>
                    ${formatCurrency(reportData?.summary?.averagePayment)}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Per completed transaction
                  </span>
                </div>
              </div>

              {/* Payments Table */}
              <Card title="Payment Transactions Audit Ledger">
                {reportData?.data && reportData.data.length > 0 ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Payment #</th>
                          <th>Invoice #</th>
                          <th>Customer</th>
                          <th>Payment Date</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{p.paymentNumber}</td>
                            <td>
                              <Link to={`/invoices/${p.invoiceId || p.invoice?.id}`} style={{ fontWeight: 600 }}>
                                {p.invoice?.invoiceNumber || 'View Invoice'}
                              </Link>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.customer?.firstName} {p.customer?.lastName}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{p.customer?.email}</div>
                            </td>
                            <td style={{ fontSize: 12 }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td><Badge status={p.paymentMethod} /></td>
                            <td style={{ fontFamily: 'var(--font-metric)', fontWeight: 700, color: '#059669' }}>
                              ${formatCurrency(p.amount)}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                              {p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : 'System'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                    No payments match this filter criteria.
                  </div>
                )}

                {reportData?.pagination?.totalPages > 1 && (
                  <div style={{ marginTop: '1rem' }}>
                    <Pagination
                      currentPage={page}
                      totalPages={reportData.pagination.totalPages}
                      onPageChange={(p) => setPage(p)}
                    />
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

