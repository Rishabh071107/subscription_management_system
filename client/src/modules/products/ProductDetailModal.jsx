import React from 'react';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';

const ProductDetailModal = ({ isOpen, onClose, product, onEdit, onToggleStatus, canManage }) => {
  if (!product) return null;

  const salesPrice = Number(product.salesPrice || 0);
  const costPrice = Number(product.costPrice || 0);
  const margin = salesPrice > 0 ? (((salesPrice - costPrice) / salesPrice) * 100).toFixed(1) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Product Details — ${product.name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>{product.name}</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Type: {product.productType || 'SOFTWARE'}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`badge ${product.isActive ? 'badge-active' : 'badge-closed'}`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </span>
            <Badge text={product.productType || 'SOFTWARE'} />
          </div>
        </div>

        {/* Financial Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Base Sales Price</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
              ${salesPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Cost Price</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#475569' }}>
              ${costPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Gross Margin</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: margin >= 0 ? '#2563eb' : '#dc2626' }}>
              {margin}%
            </div>
          </div>
        </div>

        {/* Notes / Description */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>Description & Internal Notes</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', background: '#fff', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', minHeight: '60px' }}>
            {product.notes || 'No description or internal notes specified.'}
          </p>
        </div>

        {/* Variants List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>
              Configured Variants ({product.variants?.length || 0})
            </h4>
          </div>
          {product.variants && product.variants.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {product.variants.map((v) => {
                const addPrice = Number(v.additionalPrice || 0);
                const totalItemPrice = salesPrice + addPrice;
                return (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fff',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0f172a' }}>{v.name}</strong>
                      {v.sku && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>
                          SKU: {v.sku}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>+${addPrice.toFixed(2)} </span>
                      <strong style={{ color: '#059669', marginLeft: '0.25rem' }}>
                        (${totalItemPrice.toFixed(2)} total)
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '0.75rem', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
              No variants defined for this product.
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <span>Created: {new Date(product.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(product.updatedAt).toLocaleString()}</span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {canManage && (
            <>
              <button
                type="button"
                className={`btn ${product.isActive ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => onToggleStatus(product)}
              >
                {product.isActive ? 'Deactivate Product' : 'Activate Product'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
              >
                Edit Product
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;

