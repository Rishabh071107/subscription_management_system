import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/Modal.jsx';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';

export default function FollowUpModal({ isOpen, onClose, invoice, onSaved }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [history, setHistory] = useState([]);
  const { success, error } = useNotification();

  const loadFollowUpHistory = useCallback(async () => {
    if (!invoice?.id) return;
    try {
      setFetching(true);
      const res = await api.get(`/overdue/invoices/${invoice.id}`);
      setHistory(res.data?.invoice?.followUpLogs || []);
    } catch {
      // silently fallback
    } finally {
      setFetching(false);
    }
  }, [invoice?.id]);

  useEffect(() => {
    if (isOpen && invoice?.id) {
      loadFollowUpHistory();
    }
  }, [isOpen, invoice?.id, loadFollowUpHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      error('Please enter a follow-up note');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/overdue/invoices/${invoice.id}/follow-up`, { note });
      success('Collection follow-up logged successfully');
      setNote('');
      loadFollowUpHistory();
      if (typeof onSaved === 'function') onSaved();
    } catch (err) {
      error(err.message || 'Failed to log follow-up note');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Collection Follow-Up — ${invoice.invoiceNumber}`}>
      <div>
        {/* Invoice Brief */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            fontSize: 13
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>
              Customer
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {invoice.customer?.firstName} {invoice.customer?.lastName}
            </span>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
              {invoice.customer?.email} {invoice.customer?.phone ? `• ${invoice.customer.phone}` : ''}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>
              Overdue Amount
            </span>
            <span style={{ fontFamily: 'var(--font-metric)', fontWeight: 700, color: '#DC2626', fontSize: 16 }}>
              ${Number(invoice.outstandingAmount).toFixed(2)}
            </span>
            <div style={{ color: '#DC2626', fontSize: 12 }}>
              Due: {new Date(invoice.dueDate).toLocaleDateString()} ({invoice.daysOverdue || 'Past Due'} days overdue)
            </div>
          </div>
        </div>

        {/* New Note Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Add Follow-Up / Contact Record *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Called customer finance contact; promised wire transfer by Friday. Payment link re-sent."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Saving...' : 'Log Follow-Up'}
            </button>
          </div>
        </form>

        {/* History Log */}
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Collection Activity Log ({history.length})
          </h4>

          {fetching ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
              Loading logs...
            </div>
          ) : history.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              No follow-up notes recorded yet for this invoice.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    background: '#F8F9FA',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.625rem 0.75rem',
                    fontSize: 13
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {h.user ? `${h.user.firstName} ${h.user.lastName}` : 'Staff Member'}
                    </span>
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ color: 'var(--color-text-primary)' }}>{h.details}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
