import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import RecordPaymentModal from '../payments/RecordPaymentModal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { isAdmin, isStaff } = useAuth();
  const { error } = useNotification();

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data?.invoice || null);
    } catch (err) {
      error(err.message || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/invoices/${id}/print`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <LoadingSpinner text="Loading invoice statement..." />;
  }

  if (!invoice) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Invoice not found</h3>
          <Link to="/invoices" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const isOutstanding = Number(invoice.outstandingAmount) > 0 && invoice.status !== 'CANCELLED';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Invoice {invoice.invoiceNumber}</h2>
            <Badge status={invoice.displayStatus || invoice.status} />
          </div>
          <p>
            Period: <strong>{new Date(invoice.billingPeriodStart).toLocaleDateString()}</strong> to{' '}
            <strong>{new Date(invoice.billingPeriodEnd).toLocaleDateString()}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            🖨️ Print / Download PDF
          </button>
          {(isAdmin || isStaff) && isOutstanding && (
            <button className="btn btn-primary" onClick={() => setIsPaymentModalOpen(true)}>
              + Record Payment
            </button>
          )}
          <Link to="/invoices" className="btn btn-outline">
            Back to Invoices
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Details</h3>
          </div>
          <div className="card-body">
            <p><strong>Billed To:</strong> {invoice.customer?.firstName} {invoice.customer?.lastName}</p>
            <p><strong>Email:</strong> {invoice.customer?.email}</p>
            <p><strong>Phone:</strong> {invoice.customer?.phone || 'Not provided'}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payment & Schedule Details</h3>
          </div>
          <div className="card-body">
            <p><strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
            {invoice.subscription && (
              <p>
                <strong>Subscription:</strong>{' '}
                <Link to={`/subscriptions/${invoice.subscription.id}`} style={{ color: '#7c3aed', fontWeight: 600 }}>
                  {invoice.subscription.subscriptionNumber}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Invoice Line Items</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines?.map((line) => (
                  <tr key={line.id}>
                    <td style={{ fontWeight: 600 }}>{line.description}</td>
                    <td>{line.quantity}</td>
                    <td>${Number(line.unitPrice).toFixed(2)}</td>
                    <td>{Number(line.taxRate)}%</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>
                      ${Number(line.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginLeft: 'auto', width: '300px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              <span>Subtotal:</span>
              <span>${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              <span>Tax ({Number(invoice.taxRate)}%):</span>
              <span>${Number(invoice.taxAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#dc2626' }}>
              <span>Discount:</span>
              <span>-${Number(invoice.discountAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#7c3aed', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginBottom: '0.4rem' }}>
              <span>Total:</span>
              <span>${Number(invoice.total).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#059669' }}>
              <span>Paid:</span>
              <span>${Number(invoice.amountPaid).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: Number(invoice.outstandingAmount) > 0 ? '#dc2626' : '#059669', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
              <span>Outstanding:</span>
              <span>${Number(invoice.outstandingAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Payments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recorded Payments History</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Payment Date</th>
                    <th>Transaction Ref</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: '#7c3aed' }}>{p.paymentNumber}</td>
                      <td><Badge text={p.paymentMethod} /></td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>${Number(p.amount).toFixed(2)}</td>
                      <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td>{p.transactionId || p.referenceNote || '—'}</td>
                      <td>{p.recordedBy?.firstName} {p.recordedBy?.lastName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No payments recorded against this invoice yet.
            </p>
          )}
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSaved={fetchInvoice}
        defaultInvoiceId={invoice.id}
        maxAmount={Number(invoice.outstandingAmount)}
      />
    </div>
  );
};

export default InvoiceDetail;
