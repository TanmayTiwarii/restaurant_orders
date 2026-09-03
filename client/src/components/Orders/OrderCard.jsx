import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';

export default function OrderCard({ order }) {
  const navigate = useNavigate();

  const formattedTime = order.created_at
    ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
    : '';

  return (
    <div
      className="glass-card"
      onClick={() => navigate(`/orders/${order.id}`)}
      style={{
        padding: '1.25rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Table
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              #{order.table_number}
            </span>
          </div>

          <StatusBadge status={order.status} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Primary: <strong>{order.primary_waiter_name || 'Waiter'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Placed {formattedTime}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.8125rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>
          {order.created_at ? format(new Date(order.created_at), 'hh:mm a') : ''}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--primary)',
            fontWeight: 600,
          }}
        >
          View Order <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
}
