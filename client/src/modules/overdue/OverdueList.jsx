import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Pagination from '../../components/Pagination.jsx';
import RecordPaymentModal from '../payments/RecordPaymentModal.jsx';
import FollowUpModal from './FollowUpModal.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function OverdueList() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [dueStartDate, setDueStartDate] = useState('');
  const [dueEndDate, setDueEndDate] = useState('');

  // Modals
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [followUpInvoice, setFollowUpInvoice] = useState(null);

  const { isAdmin, isStaff } = useAuth();
  const { success, error } = useNotification();

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/overdue/summary');
      setSummary(res.data || null);
    } catch {
      // silently fallback
    }
  }, []);

  const fetchOverdueInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '10');

      if (selectedBucket) params.append('bucket', selectedBucket);
      if (dueStartDate) params.append('dueStartDate', dueStartDate);
      if (dueEndDate) params.append('dueEndDate', dueEndDate);

      const res = await api.get(`/overdue/invoices?${params.toString()}`);
      const items = Array.isArray(res.data) ? res.data : (res.data?.invoices || res.data || []);
      setInvoices(items);

      if (res.meta?.pagination) {
        setTotalPages(res.meta.pagination.totalPages || 1);
        setTotalCount(res.meta.pagination.total || items.length);
      } else if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || items.length);
      } else {
        setTotalPages(1);
        setTotalCount(items.length);
      }
    } catch (err) {
      error(err.message || 'Failed to load overdue invoices');
    } finally {
      setLoading(false);
    }
  }, [page, selectedBucket, dueStartDate, dueEndDate, error]);

  const loadData = useCallback(() => {
    fetchSummary();
    fetchOverdueInvoices();
  }, [fetchSummary, fetchOverdueInvoices]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncStatuses = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/overdue/sync');
      const updatedCount = res.data?.updatedCount || 0;
      success(`Overdue scan complete. ${updatedCount} invoice(s) marked as OVERDUE.`);
      loadData();
    } catch (err) {
      error(err.message || 'Failed to sync overdue statuses');
    } finally {
      setSyncing(false);
    }
  };

  // Client search filter
  const filteredInvoices = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const custName = `${inv.customer?.firstName || ''} ${inv.customer?.lastName || ''}`.toLowerCase();
    const custEmail = (inv.customer?.email || '').toLowerCase();
    return invNum.includes(term) || custName.includes(term) || custEmail.includes(term);
  });

  const getAgingBadgeColor = (days) => {
    if (days > 90) return { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' }; // dark red
    if (days > 60) return { bg: '#FFEDD5', text: '#9A3412', border: '#FB923C' }; // orange
    if (days > 30) return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' }; // amber
    return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' }; // gray
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Overdue & Collections"
        subtitle="Detect and manage past-due invoices, analyze aging debt buckets, and log customer collection activities."
        actions={
          (isAdmin || isStaff) && (
            <Button
              variant="primary"
              onClick={handleSyncStatuses}
              disabled={syncing}
            >
              {syncing ? 'Scanning Invoices...' : '🔄 Sync Overdue Statuses'}
            </Button>
          )
        }
      />

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #DC2626' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Total Overdue Debt
          </span>
          <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#DC2626', marginTop: 4 }}>
            ${summary ? Number(summary.totalOverdueAmount).toFixed(2) : '0.00'}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Uncollected balance past due
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #EA580C' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Overdue Invoices
          </span>
          <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#EA580C', marginTop: 4 }}>
            {summary?.totalOverdueInvoices || 0}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Requiring payment settlement
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #B91C1C' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Critical Overdue (&gt;60 Days)
          </span>
          <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#B91C1C', marginTop: 4 }}>
            {summary?.criticalOverdueCount || 0}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            ${summary ? Number(summary.criticalOverdueAmount).toFixed(2) : '0.00'} high risk
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Affected Customers
          </span>
          <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
            {summary?.affectedCustomersCount || 0}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Accounts in arrears
          </span>
        </div>
      </div>

      {/* Aging Debt Buckets Interactive Filter */}
      {summary?.agingBuckets && (
        <Card title="Debt Aging Buckets (Click to Filter)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {[
              { key: '', label: 'All Overdue', count: summary.totalOverdueInvoices, amount: summary.totalOverdueAmount, color: 'var(--color-primary)' },
              { key: '1-30', label: '1–30 Days', count: summary.agingBuckets['1-30'].count, amount: summary.agingBuckets['1-30'].amount, color: '#D97706' },
              { key: '31-60', label: '31–60 Days', count: summary.agingBuckets['31-60'].count, amount: summary.agingBuckets['31-60'].amount, color: '#EA580C' },
              { key: '61-90', label: '61–90 Days', count: summary.agingBuckets['61-90'].count, amount: summary.agingBuckets['61-90'].amount, color: '#DC2626' },
              { key: '90+', label: '90+ Days Critical', count: summary.agingBuckets['90+'].count, amount: summary.agingBuckets['90+'].amount, color: '#7F1D1D' }
            ].map((bucket) => {
              const isSelected = selectedBucket === bucket.key;
              return (
                <button
                  key={bucket.key || 'all'}
                  type="button"
                  onClick={() => {
                    setSelectedBucket(bucket.key);
                    setPage(1);
                  }}
                  style={{
                    background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: bucket.color }}>
                      {bucket.label}
                    </span>
                    <span style={{ fontSize: 11, background: '#FFFFFF', padding: '2px 6px', borderRadius: 10, fontWeight: 700, border: '1px solid var(--color-border-light)' }}>
                      {bucket.count}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-metric)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    ${Number(bucket.amount).toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Search & Filters Card */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Invoices</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search invoice #, customer name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Due Date From</label>
            <input
              type="date"
              className="form-control"
              value={dueStartDate}
              onChange={(e) => {
                setDueStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Due Date To</label>
            <input
              type="date"
              className="form-control"
              value={dueEndDate}
              onChange={(e) => {
                setDueEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {(selectedBucket || dueStartDate || dueEndDate || search) && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setSelectedBucket('');
                  setDueStartDate('');
                  setDueEndDate('');
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Overdue Table */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
            Loading overdue invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 36, marginBottom: '0.5rem' }}>🎉</div>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>No overdue invoices!</h4>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {search || selectedBucket || dueStartDate || dueEndDate
                ? 'No invoices match your selected filters.'
                : 'All accounts are current and up to date.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th>Overdue Age</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const badgeStyle = getAgingBadgeColor(inv.daysOverdue);
                  return (
                    <tr key={inv.id}>
                      <td>
                        <Link
                          to={`/invoices/${inv.id}`}
                          style={{ fontWeight: 700, color: 'var(--color-primary)' }}
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {inv.customer?.firstName} {inv.customer?.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {inv.customer?.email} {inv.customer?.phone ? `• ${inv.customer.phone}` : ''}
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 11,
                            fontWeight: 700,
                            background: badgeStyle.bg,
                            color: badgeStyle.text,
                            border: `1px solid ${badgeStyle.border}`
                          }}
                        >
                          {inv.daysOverdue} days overdue
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td style={{ fontSize: 13, color: '#059669' }}>
                        ${Number(inv.amountPaid).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 700, color: '#DC2626', fontFamily: 'var(--font-metric)', fontSize: 15 }}>
                        ${Number(inv.outstandingAmount).toFixed(2)}
                      </td>
                      <td>
                        <Badge status={inv.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setPaymentInvoice(inv)}
                            title="Record Payment"
                          >
                            Pay
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setFollowUpInvoice(inv)}
                            title="Log Follow-Up"
                          >
                            Note
                          </button>
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="btn btn-outline btn-sm"
                            title="View Invoice"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: '1rem' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={!!paymentInvoice}
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onPaymentSuccess={() => {
            setPaymentInvoice(null);
            loadData();
          }}
        />
      )}

      {/* Follow-Up Activity Modal */}
      {followUpInvoice && (
        <FollowUpModal
          isOpen={!!followUpInvoice}
          invoice={followUpInvoice}
          onClose={() => setFollowUpInvoice(null)}
          onSaved={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}

