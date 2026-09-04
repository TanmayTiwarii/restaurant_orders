import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

export default function MenuItemForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price !== undefined ? initialData.price : '',
        available: initialData.available !== undefined ? initialData.available : true,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid non-negative number');
      return;
    }

    setError('');
    onSubmit({
      ...formData,
      price: priceNum,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--danger-subtle)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <Input
        label="Item Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g. Truffle Fries"
        required
      />

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          className="form-textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed ingredients or preparation notes"
        />
      </div>

      <Input
        label="Price (₹)"
        name="price"
        type="number"
        step="0.01"
        min="0"
        value={formData.price}
        onChange={handleChange}
        placeholder="250.00"
        required
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <input
          type="checkbox"
          id="available"
          name="available"
          checked={formData.available}
          onChange={handleChange}
          style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <label htmlFor="available" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
          Mark as currently available for ordering
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initialData ? 'Update Menu Item' : 'Create Menu Item'}
        </Button>
      </div>
    </form>
  );
}
