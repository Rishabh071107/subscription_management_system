import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import QuotationFormModal from './QuotationFormModal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [convertModal, setConvertModal] = useState({ isOpen: false, quotation: null, planId: '', loading: false });
  const [plans, setPlans] = useState([]);

  const { isCustomer, isAdmin, isStaff } = useAuth();
  const { success, error } = useNotification();

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/quotations?${params.toString()}`);
      setQuotations(res.data || []);
      setPagination(res.meta);
    } catch (err) {
      error(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, statusFilter]);

  useEffect(() => {
    // Load plans for conversion modal
    api.get('/plans?status=ACTIVE&limit=100').then((res) => {
      setPlans(res.data || []);
    }).catch(() => {});
  }, []);

  const handleUpdateStatus = async (quotation, status) => {
    try {
      await api.patch(`/quotations/${quotation.id}/status`, { status });
      success(`Quotation marked as ${status}`);
      fetchQuotations();
    } catch (err) {
      error(err.message || `Failed to update quotation to ${status}`);
    }
  };

  const handleConvertSubscription = async (e) => {
    e.preventDefault();
    const { quotation, planId } = convertModal;
    if (!planId) {
      error('Please select an active subscription plan');
      return;
    }

    try {
      setConvertModal((prev) => ({ ...prev, loading: true }));
      const res = await api.post(`/quotations/${quotation.id}/convert`, { planId });
      success(`Quotation converted to subscription: ${res.data?.subscription?.subscriptionNumber}`);
      setConvertModal({ isOpen: false, quotation: null, planId: '', loading: false });
      fetchQuotations();
    } catch (err) {
      error(err.message || 'Failed to convert quotation to subscription');
      setConvertModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Quotations</h2>
          <p>Prepare proposals, set product line discounts, and convert to active recurring subscriptions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          + Create Quotation
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="action-bar" style={{ margin: 0 }}>
            <div className="filter-group">
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CONVERTED">Converted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner text="Loading quotations..." />
          ) : quotations.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quotation #</th>
                    <th>Customer</th>
                    <th>Subtotal</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 700, color: '#7c3aed' }}>{q.quotationNumber}</td>
                      <td>{q.customer?.firstName} {q.customer?.lastName}</td>
                      <td>${Number(q.subtotal).toFixed(2)}</td>
                      <td>${Number(q.taxAmount).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>
                        ${Number(q.totalAmount).toFixed(2)}
                      </td>
                      <td><Badge status={q.status} /></td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {(isAdmin || isStaff) && q.status === 'DRAFT' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUpdateStatus(q, 'CONFIRMED')}
                            >
                              Confirm
                            </button>
                          )}

                          {(isAdmin || isStaff) && (q.status === 'CONFIRMED' || q.status === 'SENT') && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setConvertModal({ isOpen: true, quotation: q, planId: plans[0]?.id || '', loading: false })}
                            >
                              Convert to Sub
                            </button>
                          )}

                          {(isAdmin || isStaff) && q.status !== 'CONVERTED' && q.status !== 'CANCELLED' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleUpdateStatus(q, 'CANCELLED')}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No quotations found"
              description="Create a quotation to specify products and pricing."
              actionText="+ Create First Quotation"
              onAction={() => setIsCreateOpen(true)}
            />
          )}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      <QuotationFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => { setPage(1); fetchQuotations(); }}
      />

      {/* Convert to Subscription Modal */}
      <Modal
        isOpen={convertModal.isOpen}
        onClose={() => setConvertModal({ isOpen: false, quotation: null, planId: '', loading: false })}
        title={`Convert Quote ${convertModal.quotation?.quotationNumber} to Subscription`}
      >
        <form onSubmit={handleConvertSubscription}>
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#475569' }}>
            Converting this quotation will instantiate a live subscription for{' '}
            <strong>{convertModal.quotation?.customer?.firstName} {convertModal.quotation?.customer?.lastName}</strong>{' '}
            with matching line items totaling <strong>${Number(convertModal.quotation?.totalAmount || 0).toFixed(2)}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Select Recurring Plan Cycle *</label>
            <select
              className="form-select"
              value={convertModal.planId}
              onChange={(e) => setConvertModal({ ...convertModal, planId: e.target.value })}
              required
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.billingInterval} - ${Number(p.price).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setConvertModal({ isOpen: false, quotation: null, planId: '', loading: false })}
              disabled={convertModal.loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={convertModal.loading}>
              {convertModal.loading ? 'Converting...' : 'Instantiate Subscription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuotationList;
