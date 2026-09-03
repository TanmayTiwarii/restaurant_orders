import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MenuItemCard from '../components/Menu/MenuItemCard';
import MenuItemForm from '../components/Menu/MenuItemForm';
import BulkActionBar from '../components/Menu/BulkActionBar';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { MenuGridSkeleton } from '../components/common/Skeleton';

export default function MenuPage() {
  const { isManager } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/menu?includeArchived=${includeArchived}`);
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [includeArchived]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingItem) {
        await api.patch(`/menu/${editingItem.id}`, formData);
      } else {
        await api.post('/menu', formData);
      }
      setModalOpen(false);
      fetchMenuItems();
    } catch (err) {
      alert('Error saving menu item: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleArchive = async (item) => {
    try {
      await api.patch(`/menu/${item.id}/archive`, {
        archived: !item.archived,
      });
      fetchMenuItems();
    } catch (err) {
      alert('Failed to update archive status: ' + err.message);
    }
  };

  const handleBulkAction = async (changes) => {
    setBulkLoading(true);
    try {
      const res = await api.post('/menu/bulk', {
        item_ids: selectedIds,
        changes,
      });
      fetchMenuItems();
      return res.data;
    } catch (err) {
      alert('Bulk action failed: ' + err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Menu Catalog</h1>
          <p style={{ fontSize: '0.875rem' }}>
            {isManager
              ? 'Manage dishes, real-time availability, pricing, and bulk edits'
              : 'Live restaurant menu and dish availability for floor ordering'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isManager && (
            <Button variant="primary" onClick={handleOpenCreate} icon={Plus}>
              New Menu Item
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search dishes or ingredients..."
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {isManager && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  id="includeArchivedMenu"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="includeArchivedMenu" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Show Archived
                </label>
              </div>

              {filteredItems.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAll}
                  icon={Layers}
                >
                  {selectedIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </>
          )}

          <Button variant="ghost" size="sm" onClick={fetchMenuItems} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Grid of Menu Items */}
      {loading ? (
        <MenuGridSkeleton count={8} />
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No menu items match your search.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              isManager={isManager}
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={handleToggleSelect}
              onEdit={handleOpenEdit}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      )}

      {/* Bulk Action Sticky Bar (Goal 7) */}
      {isManager && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onApplyBulkAction={handleBulkAction}
          loading={bulkLoading}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
      >
        <MenuItemForm
          initialData={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={() => setModalOpen(false)}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
