import React from 'react';
import { Search, Filter, ArrowUpDown, Calendar, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

export default function OrderFilters({
  filters,
  onFilterChange,
  onReset,
  users = [],
  isManager,
}) {
  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value, page: 1 });
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        {/* Search by Table Number */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Search size={14} /> Search Table
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 5"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={14} /> Status
          </label>
          <select
            className="form-select"
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Waiter Filter (Managers can filter by any waiter) */}
        {isManager && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Primary Waiter</label>
            <select
              className="form-select"
              value={filters.waiter_id || ''}
              onChange={(e) => handleChange('waiter_id', e.target.value)}
            >
              <option value="">All Waiters</option>
              {users
                .filter((u) => u.role === 'waiter')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Date Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={14} /> Placed Date
          </label>
          <input
            type="date"
            className="form-input"
            value={filters.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>

        {/* Sort Column */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowUpDown size={14} /> Sort By
          </label>
          <select
            className="form-select"
            value={filters.sort || 'created_at'}
            onChange={(e) => handleChange('sort', e.target.value)}
          >
            <option value="created_at">Placed Time</option>
            <option value="table_number">Table Number</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Order</label>
          <select
            className="form-select"
            value={filters.order || 'desc'}
            onChange={(e) => handleChange('order', e.target.value)}
          >
            <option value="desc">Newest / Descending</option>
            <option value="asc">Oldest / Ascending</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="includeArchived"
            checked={filters.archived === 'true' || filters.archived === true}
            onChange={(e) => handleChange('archived', e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <label htmlFor="includeArchived" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Show Archived Orders
          </label>
        </div>

        <Button variant="ghost" size="sm" onClick={onReset} icon={RefreshCw}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
