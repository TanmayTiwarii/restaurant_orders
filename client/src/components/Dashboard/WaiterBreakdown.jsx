import React from 'react';
import { User } from 'lucide-react';

export default function WaiterBreakdown({ breakdown = [] }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', height: '100%' }}>
      <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Orders by Waiter</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {breakdown.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={16} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {item.count}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>orders</span>
            </div>
          </div>
        ))}

        {breakdown.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
            No waiter activity data available.
          </p>
        )}
      </div>
    </div>
  );
}
