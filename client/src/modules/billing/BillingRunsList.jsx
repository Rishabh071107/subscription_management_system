import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function BillingRunsList() {
  const [runs, setRuns] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [page, setPage] = useState(1);

  const { success, error } = useNotification();

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/billing/runs?page=${page}&limit=10`);
      setRuns(res.data || []);
      setPagination(res.meta);
    } catch (err) {
      error(err.message || 'Failed to fetch billing runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [page]);

  const handleTriggerRun = async () => {
    try {
      setTriggering(true);
      const res = await api.post('/billing/run');
      const details = res.data;
      success(`Billing run completed. Evaluated: ${details.totalEvaluated}, Generated: ${details.generated}, Failures: ${details.failed}`);
      fetchRuns();
    } catch (err) {
      error(err.message || 'Failed to trigger billing run');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="billing-runs-root">
      <PageHeader
        title="Recurring Billing Engine"
        subtitle="Automated batch billing scheduler, subscription due-date evaluation, execution history, and failure diagnostics"
        actions={
          <Button
            variant="primary"
            onClick={handleTriggerRun}
            loading={triggering}
          >
            ⚡ Trigger Billing Run Now
          </Button>
        }
      />

      {/* Runs Table Card */}
      <Card>
        {loading ? (
          <LoadingSpinner text="Loading recurring billing history..." />
        ) : runs.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Started At</th>
                    <th>Completed At</th>
                    <th className="col-numeric">Evaluated</th>
                    <th className="col-numeric">Generated</th>
                    <th className="col-numeric">Failed</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Diagnostics</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                        <Link to={`/admin/billing/${run.id}`} style={{ color: 'inherit' }}>
                          {run.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {run.completedAt ? new Date(run.completedAt).toLocaleString() : 'In Progress...'}
                      </td>
                      <td className="col-numeric">{run.processedCount}</td>
                      <td className="col-numeric" style={{ color: '#059669', fontWeight: 600 }}>
                        {run.successCount}
                      </td>
                      <td className="col-numeric" style={{ color: run.failureCount > 0 ? '#DC2626' : 'inherit', fontWeight: run.failureCount > 0 ? 700 : 'normal' }}>
                        {run.failureCount}
                      </td>
                      <td>
                        <Badge status={run.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/admin/billing/${run.id}`} className="btn btn-outline btn-sm">
                          View Items
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No billing execution runs recorded"
            description="Recurring billing runs will execute automatically when scheduled, or can be triggered manually above."
          />
        )}
      </Card>
    </div>
  );
}

