import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal.jsx';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';

const PlanFormModal = ({ isOpen, onClose, onSaved, planToEdit = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    billingInterval: 'MONTHLY',
    intervalCount: 1,
    price: '',
    minQuantity: 1,
    availabilityStartDate: new Date().toISOString().slice(0, 10),
    availabilityEndDate: ''
  });
  const [loading, setLoading] = useState(false);

  const { success, error } = useNotification();

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        name: planToEdit.name || '',
        code: planToEdit.code || '',
        description: planToEdit.description || '',
        billingInterval: planToEdit.billingInterval || 'MONTHLY',
        intervalCount: planToEdit.intervalCount || 1,
        price: planToEdit.price || '',
        minQuantity: planToEdit.minQuantity || 1,
        availabilityStartDate: planToEdit.availabilityStartDate ? new Date(planToEdit.availabilityStartDate).toISOString().slice(0, 10) : '',
        availabilityEndDate: planToEdit.availabilityEndDate ? new Date(planToEdit.availabilityEndDate).toISOString().slice(0, 10) : ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        billingInterval: 'MONTHLY',
        intervalCount: 1,
        price: '',
        minQuantity: 1,
        availabilityStartDate: new Date().toISOString().slice(0, 10),
        availabilityEndDate: ''
      });
    }
  }, [planToEdit, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      error('Plan name and unique code are required');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      error('Price must be a valid non-negative number');
      return;
    }

    const minQty = parseInt(formData.minQuantity, 10);
    if (isNaN(minQty) || minQty < 1) {
      error('Minimum quantity must be at least 1');
      return;
    }

    if (formData.availabilityEndDate && formData.availabilityStartDate) {
      if (new Date(formData.availabilityEndDate) <= new Date(formData.availabilityStartDate)) {
        error('Availability end date must be strictly after the start date');
        return;
      }
    }

    try {
      setLoading(true);
      if (planToEdit) {
        await api.put(`/plans/${planToEdit.id}`, formData);
        success('Subscription plan updated successfully');
      } else {
        await api.post('/plans', formData);
        success('Subscription plan created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={planToEdit ? 'Edit Subscription Plan' : 'Create Subscription Plan'}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Plan Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. Professional Monthly"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Plan Code *</label>
            <input
              type="text"
              name="code"
              className="form-control"
              placeholder="e.g. PLAN-M-PRO"
              value={formData.code}
              onChange={handleChange}
              disabled={!!planToEdit}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Billing Interval *</label>
            <select
              name="billingInterval"
              className="form-select"
              value={formData.billingInterval}
              onChange={handleChange}
            >
              <option value="DAILY">Daily (Burst compute)</option>
              <option value="WEEKLY">Weekly (Sprint cycle)</option>
              <option value="MONTHLY">Monthly (Standard)</option>
              <option value="YEARLY">Yearly (Annual commitment)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Recurring Price ($) *</label>
            <input
              type="number"
              step="0.01"
              name="price"
              className="form-control"
              placeholder="0.00"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Minimum Quantity *</label>
          <input
            type="number"
            min="1"
            name="minQuantity"
            className="form-control"
            value={formData.minQuantity}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">Availability Start Date *</label>
            <input
              type="date"
              name="availabilityStartDate"
              className="form-control"
              value={formData.availabilityStartDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Availability End Date (Optional)</label>
            <input
              type="date"
              name="availabilityEndDate"
              className="form-control"
              value={formData.availabilityEndDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Plan Description</label>
          <textarea
            name="description"
            rows="2"
            className="form-control"
            placeholder="Benefits, SLA commitments, user limits"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : planToEdit ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PlanFormModal;
