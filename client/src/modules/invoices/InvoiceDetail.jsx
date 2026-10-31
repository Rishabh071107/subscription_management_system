import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import RecordPaymentModal from '../payments/RecordPaymentModal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { isAdmin, isStaff, isCustomer } = useAuth();
  const { success, error } = useNotification();

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

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/invoices/${id}/confirm`);
      success(`Invoice confirmed successfully`);
      setInvoice(res.data?.invoice || invoice);
    } catch (err) {
      error(err.message || 'Failed to confirm invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.post(`/invoices/${id}/cancel`);
      success(`Invoice cancelled successfully`);
      setInvoice(res.data?.invoice || invoice);
    } catch (err) {
      error(err.message || 'Failed to cancel invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      setActionLoading(true);
      await api.post(`/invoices/${id}/send`);
      success(`Invoice notification recorded as sent to customer`);
    } catch (err) {
      error(err.message || 'Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading invoice statement..." />;
  }

  if (!invoice) {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Invoice not found</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>
          The requested invoice statement does not exist or you do not have permission to access it.
        </p>
        <Link to={isCustomer ? '/portal/invoices' : '/invoices'} className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Invoices
        </Link>
      </Card>
    );
  }

  const isOutstanding = Number(invoice.outstandingAmount) > 0 && invoice.status !== 'CANCELLED';

  return (
    <div className="invoice-detail-root">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Period: ${new Date(invoice.billingPeriodStart).toLocaleDateString()} to ${new Date(invoice.billingPeriodEnd).toLocaleDateString()}`}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={handlePrint}>
              🖨️ Print / PDF
            </Button>

            {!isCustomer && invoice.status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                loading={actionLoading}
              >
                Confirm Invoice
              </Button>
            )}

            {!isCustomer && invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
              <Button
                variant="danger"
                onClick={handleCancel}
                loading={actionLoading}
              >
                Cancel
              </Button>
            )}

            {!isCustomer && (
              <Button
                variant="secondary"
                onClick={handleSend}
                loading={actionLoading}
              >
                ✉️ Send to Customer
              </Button>
            )}

            {(isAdmin || isStaff) && isOutstanding && (
              <Button variant="primary" onClick={() => setIsPaymentModalOpen(true)}>
                + Record Payment
              </Button>
            )}

            <Link to={isCustomer ? '/portal/invoices' : '/invoices'} className="btn btn-outline">
              Back to List
            </Link>
          </div>
        }
      />

      {/* Meta Information Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <Card title="Customer Information">
          <p><strong>Billed To:</strong> {invoice.customer?.firstName} {invoice.customer?.lastName}</p>
          <p><strong>Email:</strong> {invoice.customer?.email}</p>
          <p><strong>Phone:</strong> {invoice.customer?.phone || 'Not provided'}</p>
        </Card>

        <Card title="Billing Details">
          <p><strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <Badge status={invoice.displayStatus || invoice.status} /></p>
          {invoice.subscription && (
            <p>
              <strong>Subscription:</strong>{' '}
              <Link to={`/subscriptions`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                {invoice.subscription.subscriptionNumber}
              </Link>{' '}
              ({invoice.subscription.plan?.name || invoice.subscription.billingInterval})
            </p>
          )}
        </Card>

        <Card title="Financial Snapshot">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Invoiced:</span>
              <strong style={{ fontFamily: 'var(--font-metric)' }}>${Number(invoice.total).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
              <span>Amount Paid:</span>
              <strong style={{ fontFamily: 'var(--font-metric)' }}>${Number(invoice.amountPaid).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: 6, fontWeight: 700, color: Number(invoice.outstandingAmount) > 0 ? '#DC2626' : '#059669' }}>
              <span>Outstanding:</span>
              <strong style={{ fontFamily: 'var(--font-metric)', fontSize: 16 }}>${Number(invoice.outstandingAmount).toFixed(2)}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card title="Invoice Line Items" style={{ marginBottom: 24 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="col-numeric">Qty</th>
                <th className="col-currency">Unit Price</th>
                <th className="col-numeric">Tax Rate</th>
                <th className="col-currency">Subtotal</th>
                <th className="col-currency">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines?.map((line) => (
                <tr key={line.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{line.description}</div>
                    {line.product && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        Product: {line.product.name}
                      </div>
                    )}
                  </td>
                  <td className="col-numeric">{line.quantity}</td>
                  <td className="col-currency">${Number(line.unitPrice).toFixed(2)}</td>
                  <td className="col-numeric">{Number(line.taxRate).toFixed(1)}%</td>
                  <td className="col-currency">${Number(line.subtotal).toFixed(2)}</td>
                  <td className="col-currency" style={{ fontWeight: 700 }}>${Number(line.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div style={{ width: 320, background: 'var(--color-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span>Subtotal:</span>
              <span style={{ fontFamily: 'var(--font-metric)', fontWeight: 600 }}>${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span>Tax ({Number(invoice.taxRate)}%):</span>
              <span style={{ fontFamily: 'var(--font-metric)', fontWeight: 600 }}>${Number(invoice.taxAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span>Discount:</span>
              <span style={{ fontFamily: 'var(--font-metric)', fontWeight: 600 }}>-${Number(invoice.discountAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-primary)', paddingTop: 10, marginTop: 8, fontWeight: 700, fontSize: 16, color: 'var(--color-primary)' }}>
              <span>Total Due:</span>
              <span style={{ fontFamily: 'var(--font-metric)' }}>${Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment History Section */}
      <Card title="Payment History">
        {invoice.payments && invoice.payments.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Recorded By</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{pmt.paymentNumber}</td>
                    <td>{new Date(pmt.paymentDate).toLocaleDateString()}</td>
                    <td><Badge status={pmt.paymentMethod} /></td>
                    <td style={{ fontWeight: 700, color: '#059669', fontFamily: 'var(--font-metric)' }}>
                      ${Number(pmt.amount).toFixed(2)}
                    </td>
                    <td>{pmt.recordedBy ? `${pmt.recordedBy.firstName} ${pmt.recordedBy.lastName}` : 'System'}</td>
                    <td>{pmt.referenceNote || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '16px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            No payments have been recorded against this invoice yet.
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          invoice={invoice}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={() => {
            setIsPaymentModalOpen(false);
            fetchInvoice();
          }}
        />
      )}
    </div>
  );
}
