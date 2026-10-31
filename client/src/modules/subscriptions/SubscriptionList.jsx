import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const SubscriptionList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Lifecycle confirmation modal
  const [lifecycleDialog, setLifecycleDialog] = useState({
    isOpen: false,
    subscription: null,
    action: '',
    loading: false
  });

  const { isCustomer, isAdmin, isStaff } = useAuth();
  const { success, error } = useNotification();

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/subscriptions?${params.toString()}`);
      setSubscriptions(res.data || []);
      setPagination(res.meta);
    } catch (err) {
      error(err.message || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter]);

  const handleTriggerLifecycle = async () => {
    const { subscription, action } = lifecycleDialog;
    if (!subscription || !action) return;

    try {
      setLifecycleDialog((prev) => ({ ...prev, loading: true }));
      const res = await api.patch(`/subscriptions/${subscription.id}/lifecycle`, { action });
      success(res.message || `Subscription ${action.toLowerCase()}d successfully`);
      setLifecycleDialog({ isOpen: false, subscription: null, action: '', loading: false });
      fetchSubscriptions();
    } catch (err) {
      error(err.message || `Failed to ${action.toLowerCase()} subscription`);
      setLifecycleDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleGenerateInvoice = async (subscription) => {
    try {
      const res = await api.post('/invoices/generate', { subscriptionId: subscription.id });
      success(`Invoice ${res.data?.invoice?.invoiceNumber} generated successfully!`);
    } catch (err) {
      error(err.message || 'Failed to generate recurring invoice');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {isCustomer ? 'My Subscriptions' : 'Subscription Lifecycle Management'}
          </h2>
          <p>Active billing contracts, lifecycle controls (Activate, Pause, Resume, Renew, Close), and line items</p>
        </div>
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
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner text="Loading subscriptions..." />
          ) : subscriptions.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subscription #</th>
                    <th>Customer</th>
                    <th>Plan</th>
                    <th>Interval</th>
                    <th>Start Date</th>
                    <th>Next Billing</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 700, color: '#7c3aed' }}>
                        <Link to={`/subscriptions/${sub.id}`} style={{ color: 'inherit' }}>
                          {sub.subscriptionNumber}
                        </Link>
                      </td>
                      <td>{sub.customer?.firstName} {sub.customer?.lastName}</td>
                      <td style={{ fontWeight: 600 }}>{sub.plan?.name}</td>
                      <td><Badge text={sub.billingInterval} /></td>
                      <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                      <td>{sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '—'}</td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>
                        ${Number(sub.totalAmount).toFixed(2)}
                      </td>
                      <td><Badge status={sub.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <Link to={`/subscriptions/${sub.id}`} className="btn btn-outline btn-sm">
                            View
                          </Link>

                          {(isAdmin || isStaff) && (
                            <>
                              {sub.status === 'CONFIRMED' && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => setLifecycleDialog({ isOpen: true, subscription: sub, action: 'ACTIVATE', loading: false })}
                                >
                                  Activate
                                </button>
                              )}

                              {sub.status === 'ACTIVE' && (
                                <>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleGenerateInvoice(sub)}
                                    title="Generate next recurring invoice"
                                  >
                                    + Bill
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setLifecycleDialog({ isOpen: true, subscription: sub, action: 'PAUSE', loading: false })}
                                  >
                                    Pause
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => setLifecycleDialog({ isOpen: true, subscription: sub, action: 'CLOSE', loading: false })}
                                  >
                                    Close
                                  </button>
                                </>
                              )}

                              {sub.status === 'PAUSED' && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => setLifecycleDialog({ isOpen: true, subscription: sub, action: 'RESUME', loading: false })}
                                >
                                  Resume
                                </button>
                              )}

                              {sub.status === 'CLOSED' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => setLifecycleDialog({ isOpen: true, subscription: sub, action: 'RENEW', loading: false })}
                                >
                                  Renew
                                </button>
                              )}
                            </>
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
              title="No subscriptions found"
              description="Convert a quotation or subscribe to a plan to start."
            />
          )}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      <ConfirmDialog
        isOpen={lifecycleDialog.isOpen}
        onClose={() => setLifecycleDialog({ isOpen: false, subscription: null, action: '', loading: false })}
        onConfirm={handleTriggerLifecycle}
        title={`${lifecycleDialog.action} Subscription`}
        message={`Are you sure you want to perform action "${lifecycleDialog.action}" on subscription ${lifecycleDialog.subscription?.subscriptionNumber}?`}
        confirmText={`Confirm ${lifecycleDialog.action}`}
        danger={lifecycleDialog.action === 'CLOSE'}
        loading={lifecycleDialog.loading}
      />
    </div>
  );
};

export default SubscriptionList;
