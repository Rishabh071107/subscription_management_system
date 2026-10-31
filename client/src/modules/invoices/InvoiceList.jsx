import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { isCustomer, isAdmin, isStaff } = useAuth();
  const { success, error } = useNotification();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/invoices?${params.toString()}`);
      setInvoices(res.data || []);
      setPagination(res.meta);
    } catch (err) {
      error(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/invoices/run-billing-cycle');
      success(`Billing run completed. Evaluated: ${res.data.totalEvaluated}, Generated: ${res.data.generated.length}`);
      fetchInvoices();
    } catch (err) {
      error(err.message || 'Billing cycle execution failed');
    } finally {
      setRunningBilling(false);
    }
  };

  const handlePrint = (invoiceId) => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/invoices/${invoiceId}/print`;
    window.open(url, '_blank');
  };

  return (
    <div className="invoice-list-root">
      <PageHeader
        title={isCustomer ? 'My Invoices & Statements' : 'Invoices & Recurring Billing'}
        subtitle="Track billing cycles, reconcile receipts, monitor outstanding balances, and print official statements"
        actions={
          isAdmin ? (
            <Button
              variant="secondary"
              onClick={handleRunBilling}
              loading={runningBilling}
            >
              ⚡ Run Automated Billing Cycle
            </Button>
          ) : null
        }
      />

      {/* Filter Card */}
      <Card style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearchSubmit} className="action-bar" style={{ margin: 0 }}>
          <div className="filter-group">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by invoice # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <Button type="submit" variant="secondary">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Invoices Table Card */}
      <Card>
        {loading ? (
          <LoadingSpinner text="Loading invoices..." />
        ) : invoices.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    {!isCustomer && <th>Customer</th>}
                    <th>Billing Period</th>
                    <th>Due Date</th>
                    <th className="col-currency">Total</th>
                    <th className="col-currency">Paid</th>
                    <th className="col-currency">Outstanding</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: '#714B67' }}>
                        <Link to={isCustomer ? `/portal/invoices/${inv.id}` : `/invoices/${inv.id}`} style={{ color: 'inherit' }}>
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      {!isCustomer && (
                        <td>
                          <div style={{ fontWeight: 600 }}>{inv.customer?.firstName} {inv.customer?.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{inv.customer?.email}</div>
                        </td>
                      )}
                      <td style={{ fontSize: 13 }}>
                        {new Date(inv.billingPeriodStart).toLocaleDateString()} &ndash; {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="col-currency" style={{ fontWeight: 700 }}>
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td className="col-currency" style={{ color: '#059669', fontWeight: 600 }}>
                        ${Number(inv.amountPaid).toFixed(2)}
                      </td>
                      <td className="col-currency" style={{ fontWeight: 700, color: Number(inv.outstandingAmount) > 0 ? '#DC2626' : '#059669' }}>
                        ${Number(inv.outstandingAmount).toFixed(2)}
                      </td>
                      <td>
                        <Badge status={inv.displayStatus || inv.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Link
                            to={isCustomer ? `/portal/invoices/${inv.id}` : `/invoices/${inv.id}`}
                            className="btn btn-outline btn-sm"
                          >
                            View
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePrint(inv.id)}
                            title="Print / PDF Invoice"
                          >
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No invoices found"
            description="Invoices are automatically created during recurring billing cycles or generated from active customer subscriptions."
          />
        )}
      </Card>
    </div>
  );
}
