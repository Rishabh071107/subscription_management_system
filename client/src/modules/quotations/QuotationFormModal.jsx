import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const QuotationFormModal = ({ isOpen, onClose, onSaved }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');

  // Line items
  const [lines, setLines] = useState([
    { productId: '', variantId: '', quantity: 1, unitPrice: 0, taxRate: 18, subtotal: 0, total: 0 }
  ]);

  const [loading, setLoading] = useState(false);

  const { isCustomer, user } = useAuth();
  const { success, error } = useNotification();

  useEffect(() => {
    if (isOpen) {
      // Load products catalog
      api.get('/products?limit=100').then((res) => {
        setProducts(res.data || []);
      }).catch(() => {});

      // If staff/admin, load customers
      if (!isCustomer) {
        api.get('/users?role=CUSTOMER&limit=100').then((res) => {
          setCustomers(res.data || []);
        }).catch(() => {});
      } else {
        setSelectedCustomerId(user.id);
      }
    }
  }, [isOpen, isCustomer, user]);

  const handleProductChange = (index, productId) => {
    const prod = products.find((p) => p.id === productId);
    const newLines = [...lines];
    newLines[index].productId = productId;
    newLines[index].variantId = '';
    newLines[index].unitPrice = prod ? parseFloat(prod.salesPrice) : 0;
    calculateLine(newLines, index);
  };

  const handleVariantChange = (index, variantId) => {
    const line = lines[index];
    const prod = products.find((p) => p.id === line.productId);
    const variant = prod?.variants?.find((v) => v.id === variantId);

    const basePrice = prod ? parseFloat(prod.salesPrice) : 0;
    const addPrice = variant ? parseFloat(variant.additionalPrice) : 0;

    const newLines = [...lines];
    newLines[index].variantId = variantId;
    newLines[index].unitPrice = basePrice + addPrice;
    calculateLine(newLines, index);
  };

  const handleQtyChange = (index, qty) => {
    const newLines = [...lines];
    newLines[index].quantity = Math.max(1, parseInt(qty, 10) || 1);
    calculateLine(newLines, index);
  };

  const handlePriceChange = (index, price) => {
    const newLines = [...lines];
    newLines[index].unitPrice = parseFloat(price) || 0;
    calculateLine(newLines, index);
  };

  const calculateLine = (lineArray, index) => {
    const line = lineArray[index];
    const sub = Math.round(line.quantity * line.unitPrice * 100) / 100;
    const tax = Math.round(sub * (taxRate / 100) * 100) / 100;
    line.subtotal = sub;
    line.total = Math.round((sub + tax) * 100) / 100;
    line.taxRate = taxRate;
    setLines([...lineArray]);
  };

  const addLine = () => {
    setLines([
      ...lines,
      { productId: '', variantId: '', quantity: 1, unitPrice: 0, taxRate, subtotal: 0, total: 0 }
    ]);
  };

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Grand totals
  const subtotalSum = lines.reduce((acc, l) => acc + (l.subtotal || 0), 0);
  const taxSum = Math.round(subtotalSum * (taxRate / 100) * 100) / 100;
  const totalSum = Math.max(0, Math.round((subtotalSum + taxSum - (parseFloat(discountAmount) || 0)) * 100) / 100);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const customerId = isCustomer ? user.id : selectedCustomerId;
    if (!customerId) {
      error('Please select a customer for this quotation');
      return;
    }

    const invalidLine = lines.find((l) => !l.productId);
    if (invalidLine) {
      error('All quotation line items must have a product selected');
      return;
    }

    try {
      setLoading(true);
      await api.post('/quotations', {
        customerId,
        templateName: isTemplate ? templateName : null,
        isTemplate,
        taxRate,
        discountAmount: parseFloat(discountAmount) || 0,
        notes,
        lines: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate
        }))
      });
      success('Quotation generated successfully');
      onSaved();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Quotation" size="lg">
      <form onSubmit={handleSubmit}>
        {!isCustomer && (
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Default Tax Rate (%)</label>
            <input
              type="number"
              className="form-control"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Discount Amount ($)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Lines Table */}
        <div style={{ margin: '1.25rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Product Line Items</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
              + Add Line
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {lines.map((line, idx) => {
              const currentProd = products.find((p) => p.id === line.productId);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 70px 100px 90px 40px',
                    gap: '0.5rem',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '0.5rem',
                    borderRadius: '6px'
                  }}
                >
                  <select
                    className="form-select"
                    value={line.productId}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    required
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <select
                    className="form-select"
                    value={line.variantId}
                    onChange={(e) => handleVariantChange(idx, e.target.value)}
                    disabled={!currentProd || !currentProd.variants || currentProd.variants.length === 0}
                  >
                    <option value="">Standard Base</option>
                    {currentProd?.variants?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (+${Number(v.additionalPrice).toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={line.quantity}
                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                  />

                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={line.unitPrice}
                    onChange={(e) => handlePriceChange(idx, e.target.value)}
                  />

                  <span style={{ fontWeight: 700, textAlign: 'right', fontSize: '0.85rem' }}>
                    ${Number(line.total || 0).toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.1rem' }}
                    disabled={lines.length === 1}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Box */}
        <div style={{ marginLeft: 'auto', width: '260px', background: '#faf5ff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9d5ff', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            <span>Subtotal:</span>
            <span>${subtotalSum.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            <span>Tax ({taxRate}%):</span>
            <span>${taxSum.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#dc2626' }}>
            <span>Discount:</span>
            <span>-${(parseFloat(discountAmount) || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#7c3aed', borderTop: '1px solid #d8b4fe', paddingTop: '0.4rem' }}>
            <span>Total:</span>
            <span>${totalSum.toFixed(2)}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes & Terms</label>
          <textarea
            rows="2"
            className="form-control"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special delivery clauses or payment terms..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Generate Quotation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuotationFormModal;
