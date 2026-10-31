import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import PlanFormModal from './PlanFormModal.jsx';
import PlanDetailModal from './PlanDetailModal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const PlanList = () => {
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [intervalFilter, setIntervalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [detailPlan, setDetailPlan] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Delete / Close dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, plan: null, loading: false });

  const { isAdmin, isStaff, isCustomer } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (intervalFilter) params.append('billingInterval', intervalFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/plans?${params.toString()}`);
      setPlans(res.data || []);
      setPagination(res.meta);
    } catch (err) {
      error(err.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [page, intervalFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPlans();
  };

  const handleStatusAction = async (plan, action) => {
    try {
      const res = await api.patch(`/plans/${plan.id}/status`, { action });
      success(res.message || `Plan ${action.toLowerCase()}d successfully`);
      if (detailPlan && detailPlan.id === plan.id) {
        setDetailPlan(res.data.plan);
      }
      fetchPlans();
    } catch (err) {
      error(err.message || `Failed to ${action.toLowerCase()} plan`);
    }
  };

  const handleConfirmDelete = async () => {
    const { plan } = deleteDialog;
    if (!plan) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      const res = await api.delete(`/plans/${plan.id}`);
      success(res.message || 'Plan removed successfully');
      setDeleteDialog({ isOpen: false, plan: null, loading: false });
      fetchPlans();
    } catch (err) {
      error(err.message || 'Failed to remove plan');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleOpenCreate = () => {
    setPlanToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setPlanToEdit(plan);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (plan) => {
    setDetailPlan(plan);
    setIsDetailModalOpen(true);
  };

  const handleCustomerSubscribe = (plan) => {
    navigate('/quotations', { state: { preselectedPlanId: plan.id } });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Subscription Plans & Billing Schedules</h2>
          <p>Multi-cycle billing tiers: Daily on-demand, Weekly sprints, Monthly standard, and Annual commitments</p>
        </div>
        {(isAdmin || isStaff) && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Create Plan
          </button>
        )}
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
                  placeholder="Search plans by name, code or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={intervalFilter}
                onChange={(e) => { setIntervalFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Intervals</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>

              {!isCustomer && (
                <select
                  className="form-select"
                  style={{ width: 'auto' }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CLOSED">Closed</option>
                </select>
              )}

              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading plans..." />
      ) : plans.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: '4px solid #7c3aed'
              }}
            >
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{plan.name}</h3>
                    <code style={{ fontSize: '0.75rem', color: '#7c3aed' }}>{plan.code}</code>
                  </div>
                  <Badge status={plan.status} />
                </div>

                <div style={{ margin: '1.25rem 0' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
                    ${Number(plan.price).toFixed(2)}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem', marginLeft: '0.25rem' }}>
                    / {plan.billingInterval.toLowerCase()}
                  </span>
                </div>

                {plan.description && (
                  <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#475569' }}>
                    {plan.description}
                  </p>
                )}

                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>Min Quantity: <strong>{plan.minQuantity}</strong></span>
                  <span>Available From: <strong>{new Date(plan.availabilityStartDate).toLocaleDateString()}</strong></span>
                  {plan.availabilityEndDate && (
                    <span>Expires On: <strong>{new Date(plan.availabilityEndDate).toLocaleDateString()}</strong></span>
                  )}
                  <span>Active Subscribers: <strong>{plan._count?.subscriptions || 0}</strong></span>
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#fdfcff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {isCustomer ? (
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1 }}
                      onClick={() => handleOpenDetail(plan)}
                    >
                      View Details
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                      onClick={() => handleCustomerSubscribe(plan)}
                    >
                      Select & Request Quote
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenDetail(plan)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenEdit(plan)}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {plan.status === 'ACTIVE' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusAction(plan, 'PAUSE')}
                        >
                          Pause
                        </button>
                      )}
                      {plan.status === 'PAUSED' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusAction(plan, 'RESUME')}
                        >
                          Resume
                        </button>
                      )}
                      {plan.status !== 'CLOSED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusAction(plan, 'CLOSE')}
                        >
                          Close
                        </button>
                      )}
                      {plan.status === 'CLOSED' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusAction(plan, 'RENEW')}
                        >
                          Reopen
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteDialog({ isOpen: true, plan, loading: false })}
                          title="Delete or Close Plan"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No subscription plans found"
          description="Try adjusting your interval or status filters."
          actionText={isAdmin ? "+ Create First Plan" : null}
          onAction={isAdmin ? handleOpenCreate : null}
        />
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <PlanFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={() => { setPage(1); fetchPlans(); }}
        planToEdit={planToEdit}
      />

      <PlanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        plan={detailPlan}
        onEdit={handleOpenEdit}
        onStatusAction={handleStatusAction}
        canManage={isAdmin || isStaff}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, plan: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Remove or Close Plan"
        message={`Are you sure you want to delete "${deleteDialog.plan?.name}" (${deleteDialog.plan?.code})? If this plan is already referenced by existing subscriptions, it will be safely closed to protect contract history.`}
        confirmText="Confirm Delete / Close"
        danger
        loading={deleteDialog.loading}
      />
    </div>
  );
};

export default PlanList;
