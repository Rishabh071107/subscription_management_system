import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function BillingRunDetail() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const { success, error } = useNotification();

  const fetchRun = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/billing/runs/${id}`);
      setRun(res.data?.run || null);
    } catch (err) {
      error(err.message || 'Failed to fetch billing run details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();
  }, [id]);

  const handleRetry = async () => {
    try {
      setRetrying(true);
      const res = await api.post(`/billing/runs/${id}/retry`);
      success(res.data?.message || 'Retry batch executed');
      fetchRun();
    } catch (err) {
      error(err.message || 'Failed to retry failed items');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading billing run diagnostics..." />;
  }

  if (!run) {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Billing Run Not Found</h3>
        <Link to="/admin/billing" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Billing Runs
        </Link>
      </Card>
    );
  }

  const failedCount = run.items?.filter(item => item.status === 'FAILED').length || 0;

  return (
    <div className="billing-run-detail-root">
      <PageHeader
        title={`Billing Run ${run.id.slice(0, 8)}`}
        subtitle={`Started on ${new Date(run.startedAt).toLocaleString()}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {failedCount > 0 && (
              <Button
                variant="primary"
                onClick={handleRetry}
                loading={retrying}
              >
                🔄 Retry Failed Items ({failedCount})
              </Button>
            )}
            <Link to="/admin/billing" className="btn btn-outline">
              Back to History
            </Link>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card title="Execution Status">
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
            <Badge status={run.status} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Completed: {run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : 'Running...'}
          </div>
        </Card>

        <Card title="Subscriptions Evaluated">
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-metric)', color: 'var(--color-text-primary)' }}>
            {run.processedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Scanned against current billing cutoff
          </div>
        </Card>

        <Card title="Invoices Generated">
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-metric)', color: '#059669' }}>
            {run.successCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Successfully invoiced and advanced
          </div>
        </Card>

        <Card title="Failed Items">
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-metric)', color: run.failureCount > 0 ? '#DC2626' : 'var(--color-text-primary)' }}>
            {run.failureCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Errors encountered during run
          </div>
        </Card>
      </div>

      {/* Diagnostics / Items Table */}
      <Card title="Evaluated Subscriptions & Invoicing Diagnostics">
        {run.items && run.items.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscription</th>
                  <th>Customer</th>
                  <th>Interval</th>
                  <th>Status</th>
                  <th>Invoice Generated</th>
                  <th>Diagnostics / Error Notes</th>
                </tr>
              </thead>
              <tbody>
                {run.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>
                      {item.subscription?.subscriptionNumber || item.subscriptionId}
                    </td>
                    <td>
                      <div>{item.subscription?.customer?.firstName} {item.subscription?.customer?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.subscription?.customer?.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, textTransform: 'uppercase' }}>
                        {item.subscription?.billingInterval}
                      </span>
                    </td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                    <td>
                      {item.invoice ? (
                        <Link to={`/invoices/${item.invoice.id}`} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          {item.invoice.invoiceNumber} (${Number(item.invoice.total).toFixed(2)})
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: item.status === 'FAILED' ? '#DC2626' : 'var(--color-text-secondary)' }}>
                      {item.errorMessage || 'Processed successfully without errors.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px 0', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            No individual subscription items evaluated in this run.
          </div>
        )}
      </Card>
    </div>
  );
}

