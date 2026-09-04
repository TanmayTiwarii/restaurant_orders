import React from 'react';
import { Ban, MessageSquare } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function OrderLineItem({
  line,
  orderStatus,
  canEdit,
  onVoidClick,
}) {
  const isOrderClosed = orderStatus === 'served' || orderStatus === 'cancelled';
  const lineTotal = (Number(line.unit_price) * line.quantity).toFixed(2);

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: line.voided ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-surface-elevated)',
        border: `1px solid ${line.voided ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-subtle)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        opacity: line.voided ? 0.75 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1rem',
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {line.quantity}x
          </span>
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: line.voided ? 'line-through' : 'none',
              color: line.voided ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {line.menu_item_name}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            (@ ₹{Number(line.unit_price).toFixed(2)})
          </span>
          {line.voided && (
            <Badge variant="badge-voided">
              Voided
            </Badge>
          )}
        </div>

        {line.special_instructions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8125rem',
              color: 'var(--warning)',
              fontStyle: 'italic',
              marginTop: '0.25rem',
            }}
          >
            <MessageSquare size={13} />
            <span>Note: {line.special_instructions}</span>
          </div>
        )}

        {line.voided && line.void_reason && (
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--danger)',
              marginTop: '0.25rem',
            }}
          >
            Reason for void: {line.void_reason}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '1.05rem',
            color: line.voided ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: line.voided ? 'line-through' : 'none',
          }}
        >
          ₹{lineTotal}
        </span>

        {canEdit && !line.voided && !isOrderClosed && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onVoidClick(line)}
            icon={Ban}
          >
            Void
          </Button>
        )}
      </div>
    </div>
  );
}
