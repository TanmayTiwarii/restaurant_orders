import React from 'react';
import { useLocation } from 'react-router-dom';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/orders/')) return 'Order Details';
    if (path === '/orders') return 'Live Orders';
    if (path === '/menu') return 'Menu Management';
    if (path === '/dashboard') return 'Operations Dashboard';
    if (path === '/alerts') return 'Slow-Order Alerts';
    return 'Restaurant System';
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{getPageTitle()}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Logged in as:
          </span>
          <Badge variant={user?.role === 'manager' ? 'badge-accepted' : 'badge-placed'}>
            {user?.role?.toUpperCase()}
          </Badge>
        </div>
      </div>
    </header>
  );
}
