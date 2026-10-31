import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal.jsx';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';

const ProductFormModal = ({ isOpen, onClose, onSaved, productToEdit = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    productType: 'SOFTWARE',
    salesPrice: '',
    costPrice: '',
    notes: '',
    isActive: true
  });
  const [variants, setVariants] = useState([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantSku, setNewVariantSku] = useState('');
  const [loading, setLoading] = useState(false);

  const { success, error } = useNotification();

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        productType: productToEdit.productType || 'SOFTWARE',
        salesPrice: productToEdit.salesPrice || '',
        costPrice: productToEdit.costPrice || '',
        notes: productToEdit.notes || '',
        isActive: productToEdit.isActive !== undefined ? productToEdit.isActive : true
      });
      setVariants(productToEdit.variants || []);
    } else {
      setFormData({
        name: '',
        productType: 'SOFTWARE',
        salesPrice: '',
        costPrice: '',
        notes: '',
        isActive: true
      });
      setVariants([]);
    }
    setNewVariantName('');
    setNewVariantPrice('');
    setNewVariantSku('');
  }, [productToEdit, isOpen]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

    const handleAddVariant = async () => {
      if (!newVariantName.trim()) {
        error('Please enter a variant name');
        return;
      }
      const addPrice = parseFloat(newVariantPrice) || 0;
      const variantPayload = {
        name: newVariantName.trim(),
        additionalPrice: addPrice,
        sku: newVariantSku.trim() || undefined
      };

      if (productToEdit) {
        try {
          setLoading(true);
          const res = await api.post(`/products/${productToEdit.id}/variants`, variantPayload);
          setVariants([...variants, res.data.variant]);
          setNewVariantName('');
          setNewVariantPrice('');
          setNewVariantSku('');
          success('Variant added to product');
        } catch (err) {
          error(err.message || 'Failed to add variant');
        } finally {
          setLoading(false);
        }
      } else {
        setVariants([...variants, variantPayload]);
        setNewVariantName('');
        setNewVariantPrice('');
        setNewVariantSku('');
      }
    };

      const handleRemoveVariant = async (index, variant) => {
        if (productToEdit && variant?.id) {
          try {
            setLoading(true);
            await api.delete(`/products/${productToEdit.id}/variants/${variant.id}`);
            setVariants(variants.filter((_, i) => i !== index));
            success('Variant removed');
          } catch (err) {
            error(err.message || 'Failed to remove variant');
          } finally {
            setLoading(false);
          }
        } else {
          setVariants(variants.filter((_, i) => i !== index));
        }
      };

      const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
          error('Product name is required');
          return;
        }

        const sPrice = parseFloat(formData.salesPrice);
        if (isNaN(sPrice) || sPrice < 0) {
          error('Sales price must be a valid positive amount');
          return;
        }

        try {
          setLoading(true);
          if (productToEdit) {
            await api.put(`/products/${productToEdit.id}`, formData);
            success('Product updated successfully');
          } else {
            await api.post('/products', {
              ...formData,
              variants
            });
            success('Product created successfully');
          }
          onSaved();
          onClose();
        } catch (err) {
          error(err.message || 'Failed to save product');
        } finally {
          setLoading(false);
        }
      };

      return (
        <Modal isOpen={isOpen} onClose={onClose} title={productToEdit ? 'Edit Product' : 'Add New Product'}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. Odoo ERP, Brightloop CRM"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Product Type</label>
                <select
                  name="productType"
                  className="form-select"
                  value={formData.productType}
                  onChange={handleChange}
                >
                  <option value="SOFTWARE">Software</option>
                  <option value="SERVICE">Service</option>
                  <option value="MODULE">Addon Module</option>
                  <option value="HARDWARE">Hardware</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sales Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="salesPrice"
                  className="form-control"
                  placeholder="0.00"
                  value={formData.salesPrice}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="costPrice"
                className="form-control"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Internal Notes</label>
              <textarea
                name="notes"
                rows="2"
                className="form-control"
                placeholder="Features, module specs, or vendor notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                    Product Variants {productToEdit ? '(Manage Variants)' : '(Optional)'}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Variant name (e.g. Pro, 5-User)"
                      className="form-control"
                      value={newVariantName}
                      onChange={(e) => setNewVariantName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="SKU (optional)"
                      className="form-control"
                      value={newVariantSku}
                      onChange={(e) => setNewVariantSku(e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="+$ Price"
                      className="form-control"
                      value={newVariantPrice}
                      onChange={(e) => setNewVariantPrice(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddVariant} disabled={loading}>
                      Add
                    </button>
                  </div>

                          {variants.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {variants.map((v, idx) => (
                                <div key={v.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                                  <div>
                                    <strong>{v.name}</strong>
                                    {v.sku && <span style={{ marginLeft: '0.4rem', color: '#64748b', fontSize: '0.75rem' }}>[SKU: {v.sku}]</span>}
                                    <span style={{ marginLeft: '0.5rem', color: '#059669', fontWeight: 600 }}>(+${Number(v.additionalPrice || 0).toFixed(2)})</span>
                                  </div>
                          <button type="button" onClick={() => handleRemoveVariant(idx, v)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No variants added yet.</span>
          )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : productToEdit ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
    </Modal>
      );
    };

    export default ProductFormModal;
