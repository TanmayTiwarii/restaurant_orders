import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Ban,
  UserPlus,
  UserMinus,
  MessageSquare,
  Archive,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  User,
  Shield,
  Utensils,
  Mail,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/Orders/StatusBadge';
import OrderLineItem from '../components/Orders/OrderLineItem';
import OrderTimeline from '../components/Orders/OrderTimeline';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { OrderDetailSkeleton } from '../components/common/Skeleton';
import { VALID_NEXT_STATUSES, STATUS_LABELS } from '../utils/constants';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();

  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  // Add Line Modal
  const [addLineModalOpen, setAddLineModalOpen] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [lineQuantity, setLineQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [lineSubmitting, setLineSubmitting] = useState(false);

  // Void Line Modal
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [lineToVoid, setLineToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);

  // Collaborator Modal
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [selectedCollabId, setSelectedCollabId] = useState('');
  const [collabSubmitting, setCollabSubmitting] = useState(false);

  // Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Email Receipt Modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');

  const fetchOrderData = useCallback(async () => {
    try {
      const [orderRes, historyRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/orders/${id}/history`),
      ]);
      setOrder(orderRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      setActionError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderData();
    // Pre-fetch menu items for adding lines
    api.get('/menu').then((res) => {
      setMenuItems(res.data.filter((item) => item.available));
      if (res.data.length > 0) setSelectedMenuItemId(res.data[0].id);
    }).catch(() => {});

    // Pre-fetch users for collaborator assignment
    api.get('/auth/users').then((res) => {
      setAllUsers(res.data);
    }).catch(() => {});
  }, [fetchOrderData]);

  // Check if current user has permission to edit this order
  const isPrimary = order?.primary_waiter_id === user?.id;
  const isCollab = order?.collaborators?.some((c) => c.id === user?.id);
  const canAct = isManager || isPrimary || isCollab;
  const isClosed = order?.status === 'served' || order?.status === 'cancelled';

  // Transitions
  const handleTransition = async (nextStatus) => {
    setActionError('');
    try {
      await api.patch(`/orders/${id}/status`, { status: nextStatus });
      fetchOrderData();
    } catch (err) {
      setActionError(err.message || 'Status transition rejected');
    }
  };

  // Add Line
  const handleAddLine = async (e) => {
    e.preventDefault();
    if (!selectedMenuItemId) return;
    setLineSubmitting(true);
    setActionError('');
    try {
      await api.post(`/orders/${id}/lines`, {
        menu_item_id: selectedMenuItemId,
        quantity: parseInt(lineQuantity, 10) || 1,
        special_instructions: specialInstructions,
      });
      setAddLineModalOpen(false);
      setLineQuantity(1);
      setSpecialInstructions('');
      fetchOrderData();
    } catch (err) {
      setActionError(err.message || 'Failed to add line item');
    } finally {
      setLineSubmitting(false);
    }
  };

  // Void Line
  const handleOpenVoid = (line) => {
    setLineToVoid(line);
    setVoidReason('');
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async (e) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      alert('A void reason is strictly required.');
      return;
    }
    setVoidSubmitting(true);
    setActionError('');
    try {
      await api.patch(`/orders/${id}/lines/${lineToVoid.id}/void`, {
        reason: voidReason.trim(),
      });
      setVoidModalOpen(false);
      setLineToVoid(null);
      fetchOrderData();
    } catch (err) {
      setActionError(err.message || 'Failed to void line');
    } finally {
      setVoidSubmitting(false);
    }
  };

  // Add Collaborator
  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!selectedCollabId) return;
    setCollabSubmitting(true);
    setActionError('');
    try {
      await api.post(`/orders/${id}/collaborators`, {
        user_id: selectedCollabId,
      });
      setCollabModalOpen(false);
      setSelectedCollabId('');
      fetchOrderData();
    } catch (err) {
      setActionError(err.message || 'Failed to add collaborator');
    } finally {
      setCollabSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    setActionError('');
    try {
      await api.delete(`/orders/${id}/collaborators/${userId}`);
      fetchOrderData();
    } catch (err) {
      setActionError(err.message || 'Failed to remove collaborator');
    }
  };

  // Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteSubmitting(true);
    setActionError('');
    try {
      await api.post(`/orders/${id}/notes`, { note: noteText.trim() });
      setNoteModalOpen(false);
      setNoteText('');
      fetchOrderData();
    } catch (err) {
      setActionError(err.message || 'Failed to add note');
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Email Receipt
  const handleSendReceipt = async (e) => {
    if (e) e.preventDefault();
    if (!customerEmail.trim()) return;

    try {
      setEmailSubmitting(true);
      setActionError('');
      const res = await api.post(`/orders/${id}/receipt`, {
        email: customerEmail.trim(),
      });
      setEmailSuccessMsg(res.data.message || 'Receipt sent successfully!');
      setTimeout(() => setEmailSuccessMsg(''), 5000);
      setEmailModalOpen(false);
      setCustomerEmail('');
      fetchOrderData();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to email receipt');
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Archive / Restore
  const handleToggleArchive = async () => {
    try {
      if (order.archived) {
        await api.patch(`/orders/${id}/restore`);
      } else {
        await api.patch(`/orders/${id}/archive`);
      }
      fetchOrderData();
    } catch (err) {
      setActionError(err.message || 'Failed to archive/restore order');
    }
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Order not found or permission denied.</h3>
        <Button variant="secondary" onClick={() => navigate('/orders')} style={{ marginTop: '1rem' }}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const nextStatuses = VALID_NEXT_STATUSES[order.status] || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} icon={ArrowLeft}>
          Back to Orders
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {canAct && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleArchive}
              icon={order.archived ? RotateCcw : Archive}
            >
              {order.archived ? 'Restore Order' : 'Archive Order'}
            </Button>
          )}

          {canAct && !isClosed && (
            <Button variant="secondary" size="sm" onClick={() => setNoteModalOpen(true)} icon={MessageSquare}>
              Add Note
            </Button>
          )}

          {canAct && (
            <Button variant="secondary" size="sm" onClick={() => setEmailModalOpen(true)} icon={Mail}>
              Email Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Global Action Error Alert Banner */}
      {actionError && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            backgroundColor: 'var(--danger-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <AlertOctagon size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Email Success Alert Banner */}
      {emailSuccessMsg && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            backgroundColor: 'var(--success-subtle)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{emailSuccessMsg}</span>
        </div>
      )}

      {/* Main Order Header Summary Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Table #{order.table_number}
            </span>
            <StatusBadge status={order.status} />
            {order.archived && <span className="badge badge-served">Archived</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Primary Waiter: <strong>{order.primary_waiter_name}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} style={{ color: 'var(--text-muted)' }} />
              <span>Placed: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Transitions Control (Goal 4 Rules) */}
        {canAct && nextStatuses.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Progress to:</span>
            {nextStatuses.map((nextStatus) => (
              <Button
                key={nextStatus}
                variant={nextStatus === 'cancelled' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleTransition(nextStatus)}
              >
                Mark as {STATUS_LABELS[nextStatus] || nextStatus}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Order Lines (Left) & Sidebar with Collaborators + Timeline (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT: Order Lines */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Utensils size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Order Lines</h3>
            </div>

            {canAct && !isClosed && (
              <Button variant="primary" size="sm" onClick={() => setAddLineModalOpen(true)} icon={Plus}>
                Add Line Item
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {order.lines && order.lines.length > 0 ? (
              order.lines.map((line) => (
                <OrderLineItem
                  key={line.id}
                  line={line}
                  orderStatus={order.status}
                  canEdit={canAct}
                  onVoidClick={handleOpenVoid}
                />
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1.5rem 0', textAlign: 'center' }}>
                No line items added to this order yet.
              </p>
            )}
          </div>

          {/* Running Order Total */}
          <div
            style={{
              marginTop: '0.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Running Total (excluding voided items)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Calculated dynamically from item price snapshots
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                }}
              >
                ₹{Number(order.total || 0).toFixed(2)}
              </div>
              {canAct && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEmailModalOpen(true)}
                  icon={Mail}
                >
                  Email Receipt
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Collaborators & Immutable Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Collaborators Panel (Goal 5) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Collaborators</h3>
              {canAct && !isClosed && (
                <Button variant="secondary" size="sm" onClick={() => setCollabModalOpen(true)} icon={UserPlus}>
                  Add Collaborator
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem' }}><strong>{order.primary_waiter_name}</strong> (Primary)</span>
                <span className="badge badge-accepted" style={{ fontSize: '0.7rem' }}>Lead</span>
              </div>

              {order.collaborators && order.collaborators.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.875rem' }}>{c.name}</span>
                  {canAct && !isClosed && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveCollaborator(c.id)} icon={UserMinus} style={{ color: 'var(--danger)', padding: '0.2rem 0.4rem' }} />
                  )}
                </div>
              ))}

              {(!order.collaborators || order.collaborators.length === 0) && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No additional collaborators assigned.
                </span>
              )}
            </div>
          </div>

          {/* Immutable Order Timeline (Goal 9) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Order Timeline & Audit Log</h3>
            <OrderTimeline history={history} />
          </div>
        </div>

      </div>

      {/* Add Line Modal */}
      <Modal
        isOpen={addLineModalOpen}
        onClose={() => setAddLineModalOpen(false)}
        title="Add Order Line"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddLineModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddLine} loading={lineSubmitting}>Add to Order</Button>
          </>
        }
      >
        <form onSubmit={handleAddLine}>
          <div className="form-group">
            <label className="form-label">Select Menu Item</label>
            <select
              className="form-select"
              value={selectedMenuItemId}
              onChange={(e) => setSelectedMenuItemId(e.target.value)}
              required
            >
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — ₹{Number(item.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Quantity"
            type="number"
            min="1"
            value={lineQuantity}
            onChange={(e) => setLineQuantity(e.target.value)}
            required
          />

          <div className="form-group">
            <label className="form-label">Special Instructions / Customizations (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Dressing on side, extra crispy, no onions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Void Line Modal (Goal 4 & 9) */}
      <Modal
        isOpen={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        title="Void Order Line Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setVoidModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmVoid} loading={voidSubmitting}>Confirm Void</Button>
          </>
        }
      >
        <form onSubmit={handleConfirmVoid}>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Voiding <strong>{lineToVoid?.menu_item_name}</strong> will keep the item on the ticket for the audit trail but deduct its price from the order total.
          </p>

          <div className="form-group">
            <label className="form-label">Reason for Void (Mandatory)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Customer changed mind, sent back to kitchen, ordered wrong dish"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              required
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* Add Collaborator Modal (Goal 5) */}
      <Modal
        isOpen={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        title="Add Waiter Collaborator"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCollabModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddCollaborator} loading={collabSubmitting}>Add Collaborator</Button>
          </>
        }
      >
        <form onSubmit={handleAddCollaborator}>
          <div className="form-group">
            <label className="form-label">Select Waiter</label>
            <select
              className="form-select"
              value={selectedCollabId}
              onChange={(e) => setSelectedCollabId(e.target.value)}
              required
            >
              <option value="">Choose a waiter...</option>
              {allUsers
                .filter((u) => u.role === 'waiter' && u.id !== order.primary_waiter_id && !order.collaborators?.some((c) => c.id === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Add Note to Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddNote} loading={noteSubmitting}>Save Note</Button>
          </>
        }
      >
        <form onSubmit={handleAddNote}>
          <div className="form-group">
            <label className="form-label">Internal Ticket Note</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Table requested check in 10 minutes, allergy alert noted with chef"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              required
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* Email Receipt Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Email Order Receipt"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEmailModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSendReceipt} loading={emailSubmitting} icon={Mail}>
              Send Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendReceipt}>
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
              Dispatch an official itemized bill for <strong>Table #{order.table_number}</strong> directly to the customer via Resend.
            </p>
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Total Billed:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '1.1rem' }}>
                ₹{Number(order.total || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          <Input
            label="Customer Email Address"
            type="email"
            placeholder="customer@example.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
}
