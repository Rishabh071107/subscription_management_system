import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { isCustomer } = useAuth();
  const { error } = useNotification();

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

  const handlePrint = (invoiceId) => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/invoices/${invoiceId}/print`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {isCustomer ? 'My Invoices & Statements' : 'Invoices & Recurring Billing'}
          </h2>
          <p>Billing cycles, double-billing protections, payments reconciliation, and printable statements</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="action-bar" style={{ margin: 0 }}>
            <div className="filter-group">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search invoice # or customer..."
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
                <option value="CONFIRMED">Confirmed / Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Fully Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner text="Loading invoices..." />
          ) : invoices.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Billing Period</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: '#7c3aed' }}>
                        <Link to={`/invoices/${inv.id}`} style={{ color: 'inherit' }}>
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td>{inv.customer?.firstName} {inv.customer?.lastName}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(inv.billingPeriodStart).toLocaleDateString()} - {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td style={{ color: '#059669' }}>
                        ${Number(inv.amountPaid).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 700, color: Number(inv.outstandingAmount) > 0 ? '#dc2626' : '#059669' }}>
                        ${Number(inv.outstandingAmount).toFixed(2)}
                      </td>
                      <td>
                        <Badge status={inv.displayStatus || inv.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <Link to={`/invoices/${inv.id}`} className="btn btn-outline btn-sm">
                            View
                          </Link>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handlePrint(inv.id)}
                            title="Print / PDF Invoice"
                          >
                            Print PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No invoices found"
              description="Invoices are automatically created on recurring billing cycles or generated from active subscriptions."
            />
          )}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
