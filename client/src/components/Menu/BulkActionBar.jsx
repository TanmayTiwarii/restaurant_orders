import React, { useState } from 'react';
import { Layers, IndianRupee, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function BulkActionBar({
  selectedCount,
  onClearSelection,
  onApplyBulkAction,
  loading,
}) {
  const [actionType, setActionType] = useState('availability'); // 'availability' | 'price'
  const [availabilityValue, setAvailabilityValue] = useState(true);
  const [newPrice, setNewPrice] = useState('');
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [batchResults, setBatchResults] = useState([]);

  if (selectedCount === 0) return null;

  const handleApply = async () => {
    let payload = {};
    if (actionType === 'availability') {
      payload = { available: availabilityValue };
    } else {
      const priceNum = parseFloat(newPrice);
      payload = { price: isNaN(priceNum) ? -1 : priceNum }; // passing negative price triggers server-side item rejection demo
    }

    try {
      const res = await onApplyBulkAction(payload);
      if (res && res.results) {
        setBatchResults(res.results);
        setResultModalOpen(true);
      }
    } catch {
      // errors handled by caller
    }
  };

  return (
    <>
      <div
        className="glass-panel animate-fade-in"
        style={{
          position: 'sticky',
          bottom: '1.5rem',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          zIndex: 40,
          boxShadow: 'var(--shadow-lg)',
          borderColor: 'var(--primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Choose a bulk update to apply across all selected items
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem' }}
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          >
            <option value="availability">Set Availability</option>
            <option value="price">Set New Price</option>
          </select>

          {actionType === 'availability' ? (
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.75rem' }}
              value={availabilityValue ? 'true' : 'false'}
              onChange={(e) => setAvailabilityValue(e.target.value === 'true')}
            >
              <option value="true">Available (In Stock)</option>
              <option value="false">Unavailable (Sold Out)</option>
            </select>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="250.00"
                className="form-input"
                style={{ width: '100px', padding: '0.45rem 0.65rem' }}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            loading={loading}
          >
            Apply to Selection
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Cancel Selection
          </Button>
        </div>
      </div>

      {/* Batch Results Report Modal */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => {
          setResultModalOpen(false);
          onClearSelection();
        }}
        title="Bulk Action Report"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setResultModalOpen(false);
              onClearSelection();
            }}
          >
            Close Report
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem' }}>
            The batch operation finished. Per-item status report:
          </p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item / ID</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {batchResults.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <strong>{res.item?.name || res.id.slice(0, 8)}</strong>
                    </td>
                    <td>
                      {res.success ? (
                        <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> Succeeded
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <XCircle size={14} /> Rejected
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {res.success ? (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Updated price: ₹${Number(res.item?.price).toFixed(2)}, Available:{' '}
                          {res.item?.available ? 'Yes' : 'No'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>{res.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
}
