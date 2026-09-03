import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import api from '../api/client';
import Button from '../components/common/Button';
import StatusBadge from '../components/Orders/StatusBadge';
import { AlertsSkeleton } from '../components/common/Skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load slow-order alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // 15s auto-poll
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (orderId) => {
    setAcknowledgingId(orderId);
    try {
      await api.post(`/alerts/${orderId}/acknowledge`);
      setAlerts((prev) => prev.filter((a) => a.id !== orderId));
    } catch (err) {
      alert('Failed to acknowledge alert: ' + err.message);
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.625rem',
              backgroundColor: 'var(--danger-subtle)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem' }}>Slow-Order Alerts</h1>
            <p style={{ fontSize: '0.875rem' }}>
              Orders open for &gt; 15 minutes that have not reached Ready status
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={fetchAlerts} icon={RefreshCw}>
          Refresh Alerts
        </Button>
      </div>

      {/* Alert List */}
      {loading ? (
        <AlertsSkeleton count={3} />
      ) : alerts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--success-subtle)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>All Orders Flowing Smoothly</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '0.875rem' }}>
            No tickets have exceeded the latency threshold without reaching Ready status.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.map((order) => {
            const elapsed = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
            return (
              <div
                key={order.id}
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderLeft: '4px solid var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Table
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      #{order.table_number}
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div style={{ fontSize: '0.875rem' }}>
                    <div>
                      Primary Waiter: <strong>{order.primary_waiter_name}</strong>
                    </div>
                    <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <Clock size={14} />
                      <span>Open for <strong>{elapsed}</strong> without reaching Ready</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAcknowledge(order.id)}
                    loading={acknowledgingId === order.id}
                    icon={BellRing}
                  >
                    Acknowledge Alert
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    View Ticket <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
