import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  AlertTriangle,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function Sidebar() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchAlertCount = async () => {
      try {
        const res = await api.get('/alerts/count');
        if (isMounted) {
          setAlertCount(res.data.count || 0);
        }
      } catch {
        // quiet catch
      }
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 15000); // 15-second polling for real-time alert awareness
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand / Logo */}
      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <UtensilsCrossed size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
            Corkless
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Orders & Kitchen
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1.25rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`
          }
          style={{ justifyContent: 'flex-start', width: '100%', padding: '0.65rem 1rem' }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`
          }
          style={{ justifyContent: 'flex-start', width: '100%', padding: '0.65rem 1rem' }}
        >
          <ClipboardList size={18} />
          <span>Orders Queue</span>
        </NavLink>

        <NavLink
          to="/menu"
          className={({ isActive }) =>
            `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`
          }
          style={{ justifyContent: 'flex-start', width: '100%', padding: '0.65rem 1rem' }}
        >
          <UtensilsCrossed size={18} />
          <span>Menu Catalog</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`
          }
          style={{
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.65rem 1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={alertCount > 0 ? { color: 'var(--warning)' } : {}} />
            <span>Slow Orders</span>
          </div>
          {alertCount > 0 && (
            <span
              className="alert-pulse"
              style={{
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                padding: '0.1rem 0.5rem',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {alertCount}
            </span>
          )}
        </NavLink>
      </nav>

      {/* User Profile & Logout */}
      <div
        style={{
          padding: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            {isManager ? <Shield size={18} /> : <User size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role} • {user?.email}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
