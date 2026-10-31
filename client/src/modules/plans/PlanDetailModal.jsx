import React from 'react';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';

const PlanDetailModal = ({ isOpen, onClose, plan, onEdit, onStatusAction, canManage }) => {
  if (!plan) return null;

  const price = Number(plan.price || 0);
  const isExpired = plan.availabilityEndDate && new Date(plan.availabilityEndDate) < new Date();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Plan Details — ${plan.name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: 800 }}>{plan.name}</h3>
            <code style={{ fontSize: '0.85rem', color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              {plan.code}
            </code>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Badge status={isExpired ? 'CLOSED' : plan.status} />
          </div>
        </div>

        {/* Commercial & Billing Terms */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Commercial Price</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              ${price.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>per {plan.billingInterval?.toLowerCase()}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Interval Frequency</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.2rem' }}>
              {plan.intervalCount > 1 ? `Every ${plan.intervalCount} ${plan.billingInterval}s` : `Every ${plan.billingInterval}`}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Minimum Quantity</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>
              {plan.minQuantity || 1}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>minimum seats/units</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>Description & Scope</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', background: '#fff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', minHeight: '50px' }}>
            {plan.description || 'No description specified for this subscription tier.'}
          </p>
        </div>

        {/* Availability Window & Lifecycle Info */}
        <div style={{ background: '#fdfcff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#6b21a8', fontWeight: 700, textTransform: 'uppercase' }}>
            Availability Schedule & Contract Status
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Available From: </span>
              <strong>{new Date(plan.availabilityStartDate).toLocaleDateString()}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Valid Until: </span>
              <strong>{plan.availabilityEndDate ? new Date(plan.availabilityEndDate).toLocaleDateString() : 'Continuous (No End Date)'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Active Contract Subscribers: </span>
              <strong style={{ color: '#059669' }}>{plan._count?.subscriptions || 0}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Schedule Expiration: </span>
              <strong style={{ color: isExpired ? '#dc2626' : '#16a34a' }}>
                {isExpired ? 'Expired (Auto-closed)' : 'Available for New Subscriptions'}
              </strong>
            </div>
          </div>
        </div>

        {/* Metadata Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <span>Created: {new Date(plan.createdAt).toLocaleString()}</span>
          <span>Last Updated: {new Date(plan.updatedAt).toLocaleString()}</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {canManage && (
            <>
              {plan.status === 'ACTIVE' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { onClose(); onStatusAction(plan, 'PAUSE'); }}
                >
                  Pause Plan
                </button>
              )}
              {plan.status === 'PAUSED' && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => { onClose(); onStatusAction(plan, 'RESUME'); }}
                >
                  Resume Plan
                </button>
              )}
              {plan.status !== 'CLOSED' && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => { onClose(); onStatusAction(plan, 'CLOSE'); }}
                >
                  Close Plan
                </button>
              )}
              {plan.status === 'CLOSED' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { onClose(); onStatusAction(plan, 'RENEW'); }}
                >
                  Reopen Plan
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { onClose(); onEdit(plan); }}
              >
                Edit Plan
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PlanDetailModal;

