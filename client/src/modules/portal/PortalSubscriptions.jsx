import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function PortalSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { error } = useNotification();

  const fetchSubscriptions = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (statusFilter) params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/portal/subscriptions?${params.toString()}`);
      const data = res.data?.data || res.data || {};
      setSubscriptions(data.subscriptions || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      error(err.message || 'Failed to load your subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubscriptions(1);
  };

  return (
    <div>
      <PageHeader
        title="My Subscriptions"
        subtitle="View and manage your active software subscriptions and service contracts"
        actions={
          <Link to="/plans" className="btn btn-primary">
            Explore Plans
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search by subscription # or plan..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSearch('');
                  fetchSubscriptions(1);
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#6C757D', whiteSpace: 'nowrap' }}>
              Status:
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PAUSED">PAUSED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </form>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        {loading ? (
          <LoadingSpinner text="Loading subscriptions..." />
        ) : subscriptions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📦</div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#212529', marginBottom: '6px' }}>
              No subscriptions found
            </h4>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              You do not have any subscriptions matching the selected filters.
            </p>
            <Link to="/plans" className="btn btn-primary btn-sm">
              Browse Available Plans
            </Link>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subscription #</th>
                    <th>Plan Name</th>
                    <th>Billing Interval</th>
                    <th>Start Date</th>
                    <th>Next Billing</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600, color: '#714B67' }}>
                        <Link to={`/portal/subscriptions/${sub.id}`} style={{ color: 'inherit' }}>
                          {sub.subscriptionNumber}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 500 }}>{sub.plan?.name || 'Standard Plan'}</td>
                      <td>
                        <Badge text={sub.billingInterval || sub.plan?.billingInterval || 'MONTHLY'} />
                      </td>
                      <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                      <td>
                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <Badge status={sub.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/portal/subscriptions/${sub.id}`} className="btn btn-outline btn-sm">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0 0 0',
                  borderTop: '1px solid #E5E7EB',
                  marginTop: '16px'
                }}
              >
                <span style={{ fontSize: '13px', color: '#6C757D' }}>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchSubscriptions(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchSubscriptions(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

