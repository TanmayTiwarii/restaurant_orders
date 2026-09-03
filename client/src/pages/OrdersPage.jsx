import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, ClipboardList } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import OrderCard from '../components/Orders/OrderCard';
import OrderFilters from '../components/Orders/OrderFilters';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { OrdersGridSkeleton } from '../components/common/Skeleton';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  waiter_id: '',
  date: '',
  sort: 'created_at',
  order: 'desc',
  page: 1,
  limit: 12,
  archived: false,
};

export default function OrdersPage() {
  const { isManager } = useAuth();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Order Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.waiter_id) params.append('waiter_id', filters.waiter_id);
      if (filters.date) params.append('date', filters.date);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.archived) params.append('archived', 'true');

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data.orders);
      setTotalOrders(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (isManager) {
      api.get('/auth/users').then((res) => setUsers(res.data)).catch(() => {});
    }
  }, [isManager]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const tableNum = parseInt(tableNumber, 10);
    if (!tableNum || tableNum <= 0) {
      setCreateError('Please enter a valid positive table number');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    try {
      await api.post('/orders', { table_number: tableNum });
      setCreateModalOpen(false);
      setTableNumber('');
      fetchOrders();
    } catch (err) {
      setCreateError(err.message || 'Failed to create order');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Live Orders Queue</h1>
          <p style={{ fontSize: '0.875rem' }}>
            Track and progress orders across all active restaurant tables
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            icon={Plus}
          >
            Create Order
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchOrders} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Server-side Search & Filter Control Panel */}
      <OrderFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        users={users}
        isManager={isManager}
      />

      {/* Orders Grid */}
      {loading ? (
        <OrdersGridSkeleton count={8} />
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-elevated)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
            }}
          >
            <ClipboardList size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>No orders found</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 1.5rem auto' }}>
            No orders match the selected filters or search parameters.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Server-side Pagination */}
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            totalItems={totalOrders}
            pageSize={filters.limit}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}

      {/* Create Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateOrder} loading={createLoading}>
              Create Order
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder}>
          {createError && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--danger-subtle)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              {createError}
            </div>
          )}

          <Input
            label="Table Number"
            type="number"
            min="1"
            placeholder="e.g. 14"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            helperText="Identify the floor table for this dining ticket"
            required
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
}
