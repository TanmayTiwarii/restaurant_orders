import React from 'react';
import StatusBadge from '../Orders/StatusBadge';

export default function StatusBreakdown({ breakdown = [] }) {
  const total = breakdown.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', height: '100%' }}>
      <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Orders by Status</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {breakdown.map((item) => {
          const count = parseInt(item.count, 10);
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={item.status} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StatusBadge status={item.status} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                  {count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({percentage}%)</span>
                </span>
              </div>

              <div
                style={{
                  height: '6px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: `var(--status-${item.status})`,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}

        {breakdown.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
            No active order data available.
          </p>
        )}
      </div>
    </div>
  );
}
