import React from 'react';
import { format } from 'date-fns';
import {
  Activity,
  PlusCircle,
  Ban,
  MessageSquare,
  UserPlus,
  UserMinus,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import Badge from '../common/Badge';
import { EVENT_TYPE_LABELS } from '../../utils/constants';

export default function OrderTimeline({ history = [] }) {
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'status_change':
        return <Activity size={16} style={{ color: 'var(--primary)' }} />;
      case 'line_added':
        return <PlusCircle size={16} style={{ color: 'var(--success)' }} />;
      case 'line_voided':
        return <Ban size={16} style={{ color: 'var(--danger)' }} />;
      case 'note_added':
        return <MessageSquare size={16} style={{ color: 'var(--info)' }} />;
      case 'collaborator_added':
        return <UserPlus size={16} style={{ color: 'var(--purple)' }} />;
      case 'collaborator_removed':
        return <UserMinus size={16} style={{ color: 'var(--warning)' }} />;
      default:
        return <Clock size={16} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const renderEventDetails = (event) => {
    const details = typeof event.details === 'string' ? JSON.parse(event.details) : event.details || {};

    if (event.event_type === 'status_change') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {event.old_value && (
            <>
              <Badge variant={`badge-${event.old_value}`}>{event.old_value}</Badge>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
            </>
          )}
          <Badge variant={`badge-${event.new_value}`}>{event.new_value}</Badge>
        </div>
      );
    }

    if (event.event_type === 'line_added') {
      return (
        <div>
          <span>
            Added <strong>{details.quantity}x {details.menu_item}</strong> (@ ${Number(details.unit_price).toFixed(2)})
          </span>
          {details.special_instructions && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Note: {details.special_instructions}
            </div>
          )}
        </div>
      );
    }

    if (event.event_type === 'line_voided') {
      return (
        <div>
          <span style={{ color: 'var(--danger)' }}>Voided line item</span>
          {details.reason && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Reason: <em>"{details.reason}"</em>
            </div>
          )}
        </div>
      );
    }

    if (event.event_type === 'note_added') {
      return (
        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--info)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
            "{event.new_value}"
          </p>
        </div>
      );
    }

    if (event.event_type === 'collaborator_added') {
      return <span>Added <strong>{details.user_name || 'Waiter'}</strong> as collaborator</span>;
    }

    if (event.event_type === 'collaborator_removed') {
      return <span>Removed <strong>{details.user_name || 'Waiter'}</strong> from collaborators</span>;
    }

    return <span>{event.new_value}</span>;
  };

  if (!history || history.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No recorded history events for this order yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
        <span>Append-only immutable audit trail</span>
      </div>

      <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
        {/* Continuous vertical timeline line */}
        <div
          style={{
            position: 'absolute',
            left: '6px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: 'var(--border-subtle)',
          }}
        />

        {history.map((event) => (
          <div
            key={event.id}
            style={{
              position: 'relative',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            {/* Timeline bullet icon */}
            <div
              style={{
                position: 'absolute',
                left: '-1.5rem',
                top: '2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getEventIcon(event.event_type)}
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  by <strong>{event.performed_by_name || 'Staff'}</strong>
                </span>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {event.created_at ? format(new Date(event.created_at), 'MMM d, yyyy • hh:mm:ss a') : ''}
              </span>
            </div>

            <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {renderEventDetails(event)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
