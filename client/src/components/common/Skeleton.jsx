import React from 'react';

/**
 * Base Skeleton Component
 */
export function Skeleton({
  variant = 'text', // 'text' | 'rectangular' | 'circular' | 'rounded'
  width,
  height,
  style = {},
  className = '',
}) {
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return 'var(--radius-full)';
      case 'rounded':
        return 'var(--radius-md)';
      case 'rectangular':
        return 'var(--radius-sm)';
      case 'text':
      default:
        return 'var(--radius-sm)';
    }
  };

  const defaultHeight = variant === 'text' ? '1rem' : '100%';

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || defaultHeight,
        borderRadius: getBorderRadius(),
        ...style,
      }}
    />
  );
}

/**
 * Skeleton for an Order Ticket Card
 */
export function OrderCardSkeleton() {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Header: Table # + Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton width="90px" height="24px" variant="rounded" />
        <Skeleton width="75px" height="22px" variant="circular" />
      </div>

      {/* Meta Row: Waiter & Time */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Skeleton width="16px" height="16px" variant="circular" />
          <Skeleton width="120px" height="14px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Skeleton width="16px" height="16px" variant="circular" />
          <Skeleton width="80px" height="14px" />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

      {/* Bottom Footer: Total & Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <Skeleton width="60px" height="16px" />
        <Skeleton width="40px" height="16px" />
      </div>
    </div>
  );
}

/**
 * Skeleton Grid for Orders Page
 */
export function OrdersGridSkeleton({ count = 8 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for Menu Item Card
 */
export function MenuItemCardSkeleton() {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <Skeleton width="70%" height="20px" variant="rounded" />
          <Skeleton width="40%" height="16px" />
        </div>
        <Skeleton width="60px" height="24px" variant="rounded" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.5rem 0' }}>
        <Skeleton width="100%" height="13px" />
        <Skeleton width="85%" height="13px" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <Skeleton width="90px" height="24px" variant="circular" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Skeleton width="28px" height="28px" variant="rounded" />
          <Skeleton width="28px" height="28px" variant="rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Grid for Menu Page
 */
export function MenuGridSkeleton({ count = 8 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <MenuItemCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for Dashboard Stat Cards
 */
export function StatCardSkeleton() {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton width="110px" height="16px" />
        <Skeleton width="36px" height="36px" variant="rounded" />
      </div>
      <Skeleton width="80px" height="32px" variant="rounded" />
      <Skeleton width="140px" height="12px" />
    </div>
  );
}

/**
 * Skeleton for Chart & Tables in Dashboard
 */
export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Chart Skeleton */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="220px" height="20px" variant="rounded" />
          <Skeleton width="100px" height="16px" />
        </div>
        <Skeleton width="100%" height="240px" variant="rounded" />
      </div>

      {/* Breakdowns Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton width="160px" height="20px" variant="rounded" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton width="100%" height="36px" variant="rounded" />
            <Skeleton width="100%" height="36px" variant="rounded" />
            <Skeleton width="100%" height="36px" variant="rounded" />
            <Skeleton width="100%" height="36px" variant="rounded" />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton width="160px" height="20px" variant="rounded" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton width="100%" height="36px" variant="rounded" />
            <Skeleton width="100%" height="36px" variant="rounded" />
            <Skeleton width="100%" height="36px" variant="rounded" />
            <Skeleton width="100%" height="36px" variant="rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Order Details Page
 */
export function OrderDetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Skeleton width="160px" height="32px" variant="rounded" />
            <Skeleton width="90px" height="26px" variant="circular" />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Skeleton width="150px" height="16px" />
            <Skeleton width="120px" height="16px" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Skeleton width="130px" height="36px" variant="rounded" />
          <Skeleton width="100px" height="36px" variant="rounded" />
        </div>
      </div>

      {/* Grid: Order Lines Left + Timeline/Collab Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Lines */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="140px" height="24px" variant="rounded" />
            <Skeleton width="120px" height="32px" variant="rounded" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton width="100%" height="60px" variant="rounded" />
            <Skeleton width="100%" height="60px" variant="rounded" />
            <Skeleton width="100%" height="60px" variant="rounded" />
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="100px" height="24px" />
            <Skeleton width="80px" height="28px" variant="rounded" />
          </div>
        </div>

        {/* Right: Collabs + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton width="140px" height="22px" variant="rounded" />
            <Skeleton width="100%" height="45px" variant="rounded" />
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton width="150px" height="22px" variant="rounded" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem' }}>
              <Skeleton width="100%" height="40px" variant="rounded" />
              <Skeleton width="100%" height="40px" variant="rounded" />
              <Skeleton width="100%" height="40px" variant="rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Alerts Page
 */
export function AlertsSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderLeft: '4px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <Skeleton width="40px" height="40px" variant="rounded" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Skeleton width="100px" height="20px" variant="rounded" />
                <Skeleton width="70px" height="20px" variant="circular" />
              </div>
              <Skeleton width="200px" height="14px" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Skeleton width="110px" height="34px" variant="rounded" />
            <Skeleton width="90px" height="34px" variant="rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
