import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Table from '../../components/Table.jsx';
import Pagination from '../../components/Pagination.jsx';
import RecordPaymentModal from './RecordPaymentModal.jsx';
import PaymentDetailModal from './PaymentDetailModal.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function PaymentList({ isPortal = false }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { isAdmin, isStaff } = useAuth();
  const { error } = useNotification();

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '10');

      if (selectedMethod) params.append('paymentMethod', selectedMethod);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const endpoint = isPortal ? `/payments?${params.toString()}` : `/payments?${params.toString()}`;
      const res = await api.get(endpoint);

      const items = Array.isArray(res.data) ? res.data : (res.data?.payments || res.data || []);
      setPayments(items);

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
      error(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, selectedMethod, startDate, endDate, isPortal, error]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Client-side search filtering if search keyword provided
  const filteredPayments = payments.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const pNum = (p.paymentNumber || '').toLowerCase();
    const invNum = (p.invoice?.invoiceNumber || '').toLowerCase();
    const custName = `${p.customer?.firstName || ''} ${p.customer?.lastName || ''} ${p.customer?.companyName || ''}`.toLowerCase();
    const txn = (p.transactionId || '').toLowerCase();
    return pNum.includes(term) || invNum.includes(term) || custName.includes(term) || txn.includes(term);
  });

  // Calculate summary metrics
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const avgAmount = payments.length > 0 ? totalAmount / payments.length : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isPortal ? 'My Payments' : 'Payments'}
        subtitle={
          isPortal
            ? 'Review all recorded payments applied to your account and download official receipts.'
            : 'Track incoming payments, customer balance settlements, and transaction histories.'
        }
        actions={
          !isPortal && (isAdmin || isStaff) && (
            <Button variant="primary" onClick={() => setIsRecordModalOpen(true)}>
              + Record Payment
            </Button>
          )
        }
      />

      {/* Metric summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {isPortal ? 'Total Paid' : 'Payments (This Page)'}
          </span>
          <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: 4 }}>
            ${totalAmount.toFixed(2)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Across {filteredPayments.length} transactions
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Total Recorded Records
          </span>
          <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
            {totalCount}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Settled in system
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366F1' }}>
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Average Payment
          </span>
          <div style={{ fontFamily: 'var(--font-metric)', fontSize: '1.75rem', fontWeight: 700, color: '#6366F1', marginTop: 4 }}>
            ${avgAmount.toFixed(2)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Per transaction average
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search payment #, invoice, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Payment Methods</option>
              <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {(selectedMethod || startDate || endDate || search) && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setSelectedMethod('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Payments Table */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: 36, marginBottom: '0.5rem' }}>💳</div>
            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>No payments found</h4>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {search || selectedMethod || startDate || endDate
                ? 'Try adjusting your search filters.'
                : 'No payment transactions have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Payment Date</th>
                  {!isPortal && <th>Customer</th>}
                  <th>Invoice #</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  {!isPortal && <th>Recorded By</th>}
                  <th style={{ textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const invoiceLink = isPortal
                    ? `/portal/invoices/${p.invoiceId || p.invoice?.id}`
                    : `/invoices/${p.invoiceId || p.invoice?.id}`;

                  return (
                    <tr key={p.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline'
                          }}
                        >
                          {p.paymentNumber}
                        </button>
                      </td>
                      <td>
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      {!isPortal && (
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {p.customer?.companyName || `${p.customer?.firstName || ''} ${p.customer?.lastName || ''}`.trim() || 'N/A'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {p.customer?.email}
                          </div>
                        </td>
                      )}
                      <td>
                        <Link
                          to={invoiceLink}
                          style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                        >
                          {p.invoice?.invoiceNumber || 'View Invoice'}
                        </Link>
                      </td>
                      <td>
                        <Badge status={p.paymentMethod} />
                      </td>
                      <td style={{ fontWeight: 700, color: '#059669', fontFamily: 'var(--font-metric)' }}>
                        ${Number(p.amount).toFixed(2)}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.transactionId || p.referenceNote || '—'}
                      </td>
                      {!isPortal && (
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : 'System'}
                        </td>
                      )}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedPayment(p)}
                        >
                          Receipt
                        </button>
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
      {isRecordModalOpen && (
        <RecordPaymentModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSaved={() => {
            fetchPayments();
          }}
        />
      )}

      {/* Payment Detail / Receipt Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
        />
      )}
    </div>
  );
}

