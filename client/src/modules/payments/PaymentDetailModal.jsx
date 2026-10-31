import React from 'react';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';

export default function PaymentDetailModal({ isOpen, onClose, payment }) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payment Receipt — ${payment.paymentNumber}`}>
      <div className="printable-receipt" style={{ padding: '0.5rem 0' }}>
        {/* Receipt Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--color-border-light)',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Payment Receipt
            </span>
            <h3 style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: 20 }}>
              {payment.paymentNumber}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge status="PAID" text="Completed" />
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {new Date(payment.paymentDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Big Amount Callout */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Amount Received
          </span>
          <div
            style={{
              fontFamily: 'var(--font-metric)',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#059669',
              marginTop: '0.25rem'
            }}
          >
            ${Number(payment.amount).toFixed(2)}
          </div>
          <div style={{ display: 'inline-block', marginTop: '0.5rem' }}>
            <Badge status={payment.paymentMethod} />
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Customer Details
            </h4>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {payment.customer?.companyName || `${payment.customer?.firstName || ''} ${payment.customer?.lastName || ''}`.trim() || 'N/A'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {payment.customer?.email}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Associated Invoice
            </h4>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {payment.invoice?.invoiceNumber || 'N/A'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Invoice Total: ${Number(payment.invoice?.total || 0).toFixed(2)}
            </div>
            {payment.invoice?.outstandingAmount !== undefined && (
              <div style={{ fontSize: 12, color: Number(payment.invoice.outstandingAmount) > 0 ? '#D97706' : '#059669', fontWeight: 600 }}>
                Balance Remaining: ${Number(payment.invoice.outstandingAmount).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Details */}
        <div
          style={{
            borderTop: '1px solid var(--color-border-light)',
            paddingTop: '1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            fontSize: 13
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 2 }}>
              Transaction Reference
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {payment.transactionId || 'None Provided'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: 2 }}>
              Recorded By
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {payment.recordedBy ? `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}` : 'System Automated'}
            </span>
          </div>
        </div>

        {payment.referenceNote && (
          <div style={{ marginTop: '1rem', background: '#F8F9FA', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Note: </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{payment.referenceNote}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

