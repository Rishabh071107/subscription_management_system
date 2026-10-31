import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Badge from '../../components/Badge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ProductFormModal from './ProductFormModal.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Safe delete
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, product: null, loading: false });

  const { isAdmin, isStaff } = useAuth();
  const { success, error } = useNotification();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (typeFilter) params.append('productType', typeFilter);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data || []);
      setPagination(res.meta);
    } catch (err) {
      error(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const { product } = deleteDialog;
    if (!product) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      const res = await api.delete(`/products/${product.id}`);
      success(res.message || 'Product removed successfully');
      setDeleteDialog({ isOpen: false, product: null, loading: false });
      fetchProducts();
    } catch (err) {
      error(err.message || 'Failed to remove product');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Products & Services Catalog</h2>
          <p>Manage subscription products, addon modules, and variant pricing</p>
        </div>
        {(isAdmin || isStaff) && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Add Product
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="action-bar" style={{ margin: 0 }}>
            <div className="filter-group">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search products or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Types</option>
                <option value="SOFTWARE">Software</option>
                <option value="SERVICE">Service</option>
                <option value="MODULE">Module</option>
                <option value="HARDWARE">Hardware</option>
              </select>

              <button type="submit" className="btn btn-secondary">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner text="Loading products catalog..." />
          ) : products.length > 0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Sales Price</th>
                    <th>Cost Price</th>
                    <th>Variants</th>
                    <th>Status</th>
                    {(isAdmin || isStaff) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                        {p.notes && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.notes}</div>}
                      </td>
                      <td><Badge text={p.productType} /></td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>
                        ${Number(p.salesPrice).toFixed(2)}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        ${Number(p.costPrice).toFixed(2)}
                      </td>
                      <td>
                        {p.variants && p.variants.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {p.variants.map((v) => (
                              <span key={v.id} style={{ fontSize: '0.78rem', color: '#475569' }}>
                                • {v.name} (+${Number(v.additionalPrice).toFixed(2)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${p.isActive ? 'badge-active' : 'badge-closed'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {(isAdmin || isStaff) && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenEdit(p)}
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleteDialog({ isOpen: true, product: p, loading: false })}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No products found"
              description="No products matched your search or filters."
              actionText={isAdmin ? "+ Add First Product" : null}
              onAction={isAdmin ? handleOpenCreate : null}
            />
          )}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={() => { setPage(1); fetchProducts(); }}
        productToEdit={productToEdit}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title="Remove or Deactivate Product"
        message={`Are you sure you want to delete "${deleteDialog.product?.name}"? If it has historical invoices or active subscriptions, it will be safely deactivated instead of deleted.`}
        confirmText="Confirm Delete / Deactivate"
        danger
        loading={deleteDialog.loading}
      />
    </div>
  );
};

export default ProductList;
