import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import CreateStaffModal from './CreateStaffModal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const { isAdmin, user: currentUser } = useAuth();
  const { success, error } = useNotification();

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

      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res.data || []);
      setPagination(res.meta);
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

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser.id && user.isActive) {
      error('You cannot deactivate your own administrative account');
      return;
    }

    try {
      const nextStatus = !user.isActive;
      await api.patch(`/users/${user.id}/status`, { isActive: nextStatus });
      success(`User ${user.firstName} ${user.lastName} has been ${nextStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to update user status');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>User Management</h2>
          <p>Directory of registered customers, staff members, and system administrators</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsStaffModalOpen(true)}>
            + Create Staff Account
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="action-bar" style={{ margin: 0 }}>
            <div className="filter-group">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="STAFF">Staff</option>
                {isAdmin && <option value="ADMIN">Admins</option>}
              </select>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Deactivated Only</option>
              </select>

              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner text="Loading users..." />
          ) : users.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#ede9fe',
                              color: '#6d28d9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            {u.firstName?.charAt(0) || 'U'}
                          </div>
                          <span style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td><Badge text={u.role} /></td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-active' : 'badge-closed'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td>
                          {u.id !== currentUser.id && (
                            <button
                              className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleStatus(u)}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No users found"
              description="No users matched your current search criteria or role filters."
            />
          )}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      <CreateStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onCreated={() => { setPage(1); fetchUsers(); }}
      />
    </div>
  );
};

export default UserList;
