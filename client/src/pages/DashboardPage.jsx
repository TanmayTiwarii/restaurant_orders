import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  IndianRupee,
  Download,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import StatCard from '../components/Dashboard/StatCard';
import StatusBreakdown from '../components/Dashboard/StatusBreakdown';
import WaiterBreakdown from '../components/Dashboard/WaiterBreakdown';
import DailyChart from '../components/Dashboard/DailyChart';
import Button from '../components/common/Button';
import { DashboardSkeleton } from '../components/common/Skeleton';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    open_orders: 0,
    placed_today: 0,
    served_today: 0,
    revenue_today: 0,
  });
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [waiterBreakdown, setWaiterBreakdown] = useState([]);
  const [dailyServed, setDailyServed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, statusRes, waiterRes, dailyRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/status-breakdown'),
        api.get('/dashboard/waiter-breakdown'),
        api.get('/dashboard/daily-served?days=14'),
      ]);

      setStats(statsRes.data);
      setStatusBreakdown(statusRes.data);
      setWaiterBreakdown(waiterRes.data);
      setDailyServed(dailyRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/export/orders?date=${exportDate}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `restaurant-orders-${exportDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header with CSV Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Operations Overview</h1>
          <p style={{ fontSize: '0.875rem' }}>
            Real-time floor velocity, kitchen performance, and revenue analytics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            loading={exporting}
            icon={Download}
          >
            Export Day CSV
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDashboardData}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Headline Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <StatCard
              title="Open Orders"
              value={stats.open_orders}
              subtitle="Currently active in kitchen or queue"
              icon={Clock}
              color="var(--primary)"
            />
            <StatCard
              title="Orders Placed Today"
              value={stats.placed_today}
              subtitle="Total tickets created today"
              icon={TrendingUp}
              color="var(--info)"
            />
            <StatCard
              title="Orders Served Today"
              value={stats.served_today}
              subtitle="Successfully fulfilled tickets"
              icon={CheckCircle2}
              color="var(--success)"
            />
            <StatCard
              title="Revenue Today"
              value={`₹${Number(stats.revenue_today || 0).toFixed(2)}`}
              subtitle="Total billed from served orders"
              icon={IndianRupee}
              color="var(--purple)"
            />
          </div>

          {/* 14-Day Served Trend Chart */}
          <DailyChart data={dailyServed} />

          {/* Breakdowns Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <StatusBreakdown breakdown={statusBreakdown} />
            <WaiterBreakdown breakdown={waiterBreakdown} />
          </div>
        </>
      )}
    </div>
  );
}
