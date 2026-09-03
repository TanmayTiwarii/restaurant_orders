import React from 'react';
import { Edit2, Archive, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function MenuItemCard({
  item,
  isManager,
  isSelected,
  onToggleSelect,
  onEdit,
  onToggleArchive,
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        opacity: item.archived ? 0.6 : 1,
        borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
        boxShadow: isSelected ? '0 0 0 1px var(--primary)' : 'none',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {isManager && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer',
                }}
                aria-label={`Select ${item.name}`}
              />
            )}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.name}</h3>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'var(--primary)',
            }}
          >
            ${Number(item.price).toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '2.4em' }}>
            {item.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Badge variant={item.available ? 'badge-ready' : 'badge-cancelled'}>
            {item.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {item.available ? 'Available' : 'Sold Out'}
          </Badge>

          {item.archived && (
            <Badge variant="badge-served">
              Archived
            </Badge>
          )}
        </div>
      </div>

      {isManager && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            icon={Edit2}
          >
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleArchive(item)}
            icon={item.archived ? RotateCcw : Archive}
          >
            {item.archived ? 'Restore' : 'Archive'}
          </Button>
        </div>
      )}
    </div>
  );
}
