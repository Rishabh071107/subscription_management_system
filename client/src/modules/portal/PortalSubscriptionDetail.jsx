import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function PortalSubscriptionDetail() {
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useNotification();

  useEffect(() => {
    const fetchSubscriptionDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/portal/subscriptions/${id}`);
        setSubscription(res.data?.data?.subscription || res.data?.subscription || null);
      } catch (err) {
        error(err.message || 'Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetail();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading subscription details..." />;
  }

  if (!subscription) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#212529', marginBottom: '8px' }}>
          Subscription Not Found
        </h3>
        <p style={{ color: '#6C757D', marginBottom: '16px' }}>
          The requested subscription contract was not found or you do not have permission to access it.
        </p>
        <Link to="/portal/subscriptions" className="btn btn-primary">
          Back to My Subscriptions
        </Link>
      </Card>
    );
  }

  const lines = subscription.lines || [];
  const invoices = subscription.invoices || [];

  return (
    <div>
      <PageHeader
        title={subscription.subscriptionNumber}
        subtitle={`Plan: ${subscription.plan?.name || 'Standard'} • Interval: ${subscription.billingInterval || 'MONTHLY'}`}
        badge={<Badge status={subscription.status} />}
        actions={
          <Link to="/portal/subscriptions" className="btn btn-outline">
            ← Back to My Subscriptions
          </Link>
        }
      />

      {/* Contract & Financial Metadata */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        <Card title="Contract Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6C757D', fontSize: '13px' }}>Start Date</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>
                {new Date(subscription.startDate).toLocaleDateString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6C757D', fontSize: '13px' }}>Next Billing Date</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>
                {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6C757D', fontSize: '13px' }}>Expiry Date</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>
                {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'Auto-renewing'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6C757D', fontSize: '13px' }}>Payment Terms</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{subscription.paymentTerms || 'Net 15'}</span>
            </div>
          </div>
        </Card>

        <Card title="Financial Overview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6C757D', fontSize: '13px' }}>Subtotal</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px' }}>
                ${Number(subscription.subtotal || 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6C757D', fontSize: '13px' }}>Tax Amount</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px' }}>
                ${Number(subscription.taxAmount || 0).toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #E5E7EB'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Total Recurring Amount</span>
              <span
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#714B67'
                }}
              >
                ${Number(subscription.totalAmount || subscription.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Products / Items */}
      {lines.length > 0 && (
        <Card title="Included Products & Services" style={{ marginBottom: '24px' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product / Service</th>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td style={{ fontWeight: 600 }}>{line.product?.name || 'Service Item'}</td>
                    <td>{line.variant?.name || '—'}</td>
                    <td>{line.quantity}</td>
                    <td style={{ fontFamily: 'Space Grotesk, sans-serif' }}>${Number(line.unitPrice).toFixed(2)}</td>
                    <td>{Number(line.taxRate || 18)}%</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>
                      ${Number(line.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Associated Invoices */}
      <Card title="Billing History & Statements">
        {invoices.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, color: '#714B67' }}>
                      <Link to={`/portal/invoices/${inv.id}`} style={{ color: 'inherit' }}>
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>
                      ${Number(inv.total).toFixed(2)}
                    </td>
                    <td style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      ${Number(inv.amountPaid || 0).toFixed(2)}
                    </td>
                    <td>
                      <Badge status={inv.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/portal/invoices/${inv.id}`} className="btn btn-outline btn-sm">
                        View Statement
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6C757D' }}>
            No invoices have been billed for this subscription yet.
          </div>
        )}
      </Card>
    </div>
  );
}

