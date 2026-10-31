import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal.jsx';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';

const RecordPaymentModal = ({ isOpen, onClose, onSaved, defaultInvoiceId = null, maxAmount = null }) => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(defaultInvoiceId || '');
  const [amount, setAmount] = useState(maxAmount ? maxAmount.toString() : '');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNote, setReferenceNote] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  const { success, error } = useNotification();

  useEffect(() => {
    if (defaultInvoiceId) {
      setSelectedInvoiceId(defaultInvoiceId);
      if (maxAmount) setAmount(maxAmount.toString());
    } else if (isOpen) {
      // Fetch unpaid invoices
      api.get('/invoices?status=CONFIRMED&limit=50').then((res) => {
        setInvoices(res.data || []);
        if (res.data && res.data.length > 0 && !selectedInvoiceId) {
          setSelectedInvoiceId(res.data[0].id);
          setAmount(Number(res.data[0].outstandingAmount).toString());
        }
      }).catch(() => {});
    }
  }, [isOpen, defaultInvoiceId, maxAmount]);

  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(Number(inv.outstandingAmount).toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInvoiceId) {
      error('Please select an invoice');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      error('Please enter a valid positive payment amount');
      return;
    }

    try {
      setLoading(true);
      await api.post('/payments', {
        invoiceId: selectedInvoiceId,
        amount: amt,
        paymentMethod,
        paymentDate,
        referenceNote,
        transactionId
      });
      success('Payment recorded successfully');
      onSaved();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Customer Payment">
      <form onSubmit={handleSubmit}>
        {!defaultInvoiceId && (
          <div className="form-group">
            <label className="form-label">Select Invoice *</label>
            <select
              className="form-select"
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              required
            >
              <option value="">Select outstanding invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customer?.firstName} {inv.customer?.lastName} (Due: ${Number(inv.outstandingAmount).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Payment Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {maxAmount !== null && (
              <span className="form-hint">Max outstanding: ${Number(maxAmount).toFixed(2)}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Payment Date *</label>
            <input
              type="date"
              className="form-control"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Reference #</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. TXN-9982103"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Reference Note</label>
          <input
            type="text"
            className="form-control"
            placeholder="Deposit receipt, bank memo, check number..."
            value={referenceNote}
            onChange={(e) => setReferenceNote(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Recording...' : 'Save Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
