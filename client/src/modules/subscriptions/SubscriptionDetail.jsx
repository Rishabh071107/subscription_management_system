import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const SubscriptionDetail = () => {
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const { error } = useNotification();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/subscriptions/${id}`);
        setSubscription(res.data?.subscription || null);
      } catch (err) {
        error(err.message || 'Failed to fetch subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading subscription details..." />;
  }

  if (!subscription) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Subscription not found</h3>
          <Link to="/subscriptions" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{subscription.subscriptionNumber}</h2>
            <Badge status={subscription.status} />
          </div>
          <p>Plan: <strong>{subscription.plan?.name}</strong> • Billing Interval: <strong>{subscription.billingInterval}</strong></p>
        </div>
        <Link to="/subscriptions" className="btn btn-outline">
          ← Back to List
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Information</h3>
          </div>
          <div className="card-body">
            <p><strong>Name:</strong> {subscription.customer?.firstName} {subscription.customer?.lastName}</p>
            <p><strong>Email:</strong> {subscription.customer?.email}</p>
            <p><strong>Phone:</strong> {subscription.customer?.phone || 'Not provided'}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Billing & Schedule</h3>
          </div>
          <div className="card-body">
            <p><strong>Start Date:</strong> {new Date(subscription.startDate).toLocaleDateString()}</p>
            <p><strong>Next Billing Date:</strong> {subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Payment Terms:</strong> {subscription.paymentTerms}</p>
            <p><strong>Auto-Renew:</strong> {subscription.autoRenew ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Subscribed Products & Services</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {subscription.lines?.map((line) => (
                  <tr key={line.id}>
                    <td style={{ fontWeight: 600 }}>{line.product?.name}</td>
                    <td>{line.variant?.name || 'Base Standard'}</td>
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
        </div>
      </div>

      {/* Generated Invoices */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Billing History & Generated Invoices</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {subscription.invoices && subscription.invoices.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Billing Period</th>
                    <th>Issue Date</th>
                    <th>Total</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscription.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: '#7c3aed' }}>{inv.invoiceNumber}</td>
                      <td>
                        {new Date(inv.billingPeriodStart).toLocaleDateString()} to {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                      </td>
                      <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td>${Number(inv.total).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: Number(inv.outstandingAmount) > 0 ? '#dc2626' : '#059669' }}>
                        ${Number(inv.outstandingAmount).toFixed(2)}
                      </td>
                      <td><Badge status={inv.status} /></td>
                      <td>
                        <Link to={`/invoices/${inv.id}`} className="btn btn-outline btn-sm">
                          View Invoice
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No invoices generated yet for this subscription cycle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetail;
