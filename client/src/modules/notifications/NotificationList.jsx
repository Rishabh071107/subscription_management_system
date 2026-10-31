import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Modal from '../../components/Modal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const { error } = useNotification();
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/notifications?${params.toString()}`);
      const data = res.data?.data || res.data || {};
      setNotifications(data.notifications || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      error(err.message || 'Failed to load notifications history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotifications(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return <span className="badge badge-success">SENT</span>;
      case 'PENDING':
        return <span className="badge badge-warning">PENDING</span>;
      case 'FAILED':
        return <span className="badge badge-danger">FAILED</span>;
      default:
        return <Badge text={status} />;
    }
  };

  return (
    <div>
      <PageHeader
        title={isCustomer ? 'My Notification History' : 'Notification & Communication History'}
        subtitle={
          isCustomer
            ? 'Review billing receipts, statements, and email notices delivered to your account'
            : 'Audit email deliveries, automated billing notifications, and communication dispatch status'
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
          <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search by recipient or subject..."
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
                  fetchNotifications(1);
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#6C757D' }}>Type:</label>
              <select
                className="form-control"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="">All Types</option>
                <option value="INVOICE_SENT">Invoice Sent</option>
                <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
                <option value="OVERDUE_NOTICE">Overdue Notice</option>
                <option value="WELCOME">Welcome</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#6C757D' }}>Status:</label>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '140px' }}
              >
                <option value="">All Statuses</option>
                <option value="SENT">SENT</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>
        </form>
      </Card>

      {/* Notifications Table */}
      <Card>
        {loading ? (
          <LoadingSpinner text="Loading notifications history..." />
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔔</div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#212529', marginBottom: '6px' }}>
              No notification logs found
            </h4>
            <p style={{ fontSize: '13px' }}>
              Dispatched notifications and customer communication events will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif.id}>
                      <td style={{ fontWeight: 500 }}>
                        {notif.recipient}
                        {notif.user && (
                          <div style={{ fontSize: '11px', color: '#6C757D' }}>
                            {notif.user.firstName} {notif.user.lastName}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge text={notif.type.replace(/_/g, ' ')} />
                      </td>
                      <td style={{ maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {notif.subject}
                      </td>
                      <td>{getStatusBadge(notif.status)}</td>
                      <td>
                        {notif.sentAt ? new Date(notif.sentAt).toLocaleString() : new Date(notif.createdAt).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedNotification(notif)}
                        >
                          View Notice
                        </button>
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
                    onClick={() => fetchNotifications(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchNotifications(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <Modal
          isOpen={true}
          title={selectedNotification.subject}
          onClose={() => setSelectedNotification(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8F9FA', padding: '12px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#6C757D' }}>Recipient</span>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{selectedNotification.recipient}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#6C757D' }}>Delivery Status</span>
                <div>{getStatusBadge(selectedNotification.status)}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#6C757D' }}>Notification Type</span>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{selectedNotification.type}</div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#6C757D' }}>Dispatch Timestamp</span>
                <div style={{ fontSize: '13px' }}>
                  {selectedNotification.sentAt
                    ? new Date(selectedNotification.sentAt).toLocaleString()
                    : new Date(selectedNotification.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: '#6C757D', display: 'block', marginBottom: '6px' }}>
                Delivered Message Body:
              </span>
              <pre
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  padding: '14px',
                  borderRadius: '6px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {selectedNotification.body || 'No message content available.'}
              </pre>
            </div>

            {selectedNotification.metadata && (
              <div>
                <span style={{ fontSize: '12px', color: '#6C757D', display: 'block', marginBottom: '4px' }}>
                  Delivery Metadata:
                </span>
                <pre
                  style={{
                    background: '#F1F3F5',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#495057',
                    overflowX: 'auto'
                  }}
                >
                  {typeof selectedNotification.metadata === 'string'
                    ? selectedNotification.metadata
                    : JSON.stringify(selectedNotification.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

