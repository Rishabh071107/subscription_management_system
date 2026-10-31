import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ConfirmationDialog from '../../components/ConfirmationDialog.jsx';
import CreateStaffModal from './CreateStaffModal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const UserList = ({ roleFilter: initialRoleFilter = '' }) => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const { isAdmin, user: currentUser } = useAuth();
  const { success, error } = useNotification();

  const isStaffView = initialRoleFilter === 'STAFF';
  const isCustomerView = initialRoleFilter === 'CUSTOMER';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter !== '') params.append('isActive', statusFilter);

      const endpoint = isStaffView ? '/admin/staff' : (isCustomerView ? '/customers' : '/users');
      const res = await api.get(`${endpoint}?${params.toString()}`);
      setUsers(res.data || []);
      setPagination(res.meta || res.pagination);
    } catch (err) {
      error(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedUserForStatus) return;
    const user = selectedUserForStatus;

    if (user.id === currentUser.id && user.isActive) {
      error('You cannot deactivate your own administrative account');
      setSelectedUserForStatus(null);
      return;
    }

    try {
      setStatusLoading(true);
      const nextStatus = !user.isActive;
      const statusEndpoint = isStaffView ? `/admin/staff/${user.id}/status` : (isCustomerView ? `/customers/${user.id}/status` : `/users/${user.id}/status`);
      await api.patch(statusEndpoint, { isActive: nextStatus });
      success(`User ${user.firstName} ${user.lastName} has been ${nextStatus ? 'activated' : 'deactivated'}`);
      setSelectedUserForStatus(null);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to update user status');
    } finally {
      setStatusLoading(false);
    }
  };

  const pageTitle = isStaffView
    ? 'Staff Management'
    : (isCustomerView ? 'Customer Management' : 'User Directory');

  const pageSubtitle = isStaffView
    ? 'Create, manage, and configure staff team members and permissions'
    : (isCustomerView ? 'Directory of active and registered customer accounts' : 'System users, staff members, and administrators');

  const breadcrumbs = isStaffView
    ? [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Staff Management' }]
    : (isCustomerView ? [{ label: 'Workspace', to: '/customers' }, { label: 'Customers' }] : [{ label: 'Directory' }]);

  return (
    <div>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        breadcrumbs={breadcrumbs}
        actions={
          (isAdmin && (isStaffView || !isCustomerView)) ? (
            <Button variant="primary" onClick={() => setIsStaffModalOpen(true)}>
              + Create Staff Account
            </Button>
          ) : null
        }
      />

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!isStaffView && !isCustomerView && (
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="STAFF">Staff</option>
              {isAdmin && <option value="ADMIN">Admins</option>}
            </select>
          )}

          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>

          <Button type="submit" variant="secondary">
            Search
          </Button>

          {(search || (roleFilter !== initialRoleFilter) || statusFilter !== '') && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setRoleFilter(initialRoleFilter);
                setStatusFilter('');
                setPage(1);
              }}
            >
              Reset
            </Button>
          )}
        </form>
      </Card>

      {/* Table Content */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <LoadingSpinner text="Loading records..." />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title={`No ${isStaffView ? 'staff' : (isCustomerView ? 'customers' : 'users')} found`}
            message="No user records matched your criteria or filter parameters."
            action={
              (isAdmin && isStaffView) ? (
                <Button size="sm" onClick={() => setIsStaffModalOpen(true)}>
                  Create Staff Account
                </Button>
              ) : null
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Account Status</th>
                <th>Created</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-circle">
                          {`${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {u.firstName} {u.lastName} {isSelf && '(You)'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge status={u.role} />
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {u.phone || <span style={{ color: 'var(--color-text-muted)' }}>None</span>}
                    </td>
                    <td>
                      <Badge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant={u.isActive ? 'danger' : 'success'}
                          size="sm"
                          disabled={isSelf}
                          onClick={() => setSelectedUserForStatus(u)}
                          title={isSelf ? 'Cannot deactivate self' : ''}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ marginTop: '20px' }}>
          <Pagination
            currentPage={pagination.page || page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Create Staff Modal */}
      {isStaffModalOpen && (
        <CreateStaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          onCreated={fetchUsers}
        />
      )}

      {/* Confirmation Dialog for Status Change */}
      {selectedUserForStatus && (
        <ConfirmationDialog
          isOpen={!!selectedUserForStatus}
          onClose={() => setSelectedUserForStatus(null)}
          onConfirm={handleConfirmToggleStatus}
          danger={selectedUserForStatus.isActive}
          loading={statusLoading}
          title={`${selectedUserForStatus.isActive ? 'Deactivate' : 'Activate'} Account`}
          message={`Are you sure you want to ${selectedUserForStatus.isActive ? 'deactivate' : 'activate'} the account for ${selectedUserForStatus.firstName} ${selectedUserForStatus.lastName} (${selectedUserForStatus.email})? ${selectedUserForStatus.isActive ? 'They will no longer be able to log in.' : 'They will regain access immediately.'}`}
          confirmText={selectedUserForStatus.isActive ? 'Deactivate Account' : 'Activate Account'}
        />
      )}
    </div>
  );
};

export default UserList;
