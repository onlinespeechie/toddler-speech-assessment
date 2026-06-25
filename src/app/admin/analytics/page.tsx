'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  BarChart2, 
  CheckCircle2, 
  Percent, 
  Clock, 
  Calendar, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface AnalyticsData {
  starts: number;
  completions: number;
  completionRate: number;
  avgCompletionTimeSeconds: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export default function AnalyticsDashboard() {
  const [filterType, setFilterType] = useState<'7days' | 'month' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/admin/analytics';
      
      if (filterType === '7days') {
        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = new Date().toISOString().split('T')[0];
        url += `?startDate=${start}&endDate=${end}`;
      } else if (filterType === 'month') {
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = new Date().toISOString().split('T')[0];
        url += `?startDate=${start}&endDate=${end}`;
      } else if (filterType === 'custom') {
        if (!customStartDate || !customEndDate) {
          setError('Please select both start and end dates');
          setLoading(false);
          return;
        }
        url += `?startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const res = await fetch(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.status === 401 || res.status === 403) {
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch metrics');
      }

      const resData = await res.json();
      setData(resData);
    } catch (err: unknown) {
      console.error(err);
      const errorObject = err as Error;
      setError(errorObject.message || 'An error occurred while loading metrics.');
    } finally {
      setLoading(false);
    }
  }, [filterType, customStartDate, customEndDate]);

  useEffect(() => {
    if (filterType !== 'custom') {
      Promise.resolve().then(() => {
        fetchAnalytics();
      });
    }
  }, [filterType, fetchAnalytics]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics();
  };

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Quicksand', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700 }}>Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '1rem' }}>
            Track screen start metrics, completion volumes, conversion ratios, and speed.
          </p>
        </div>
        <Link 
          href="/admin" 
          style={{ 
            color: 'var(--text-main)', 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontWeight: 600,
            border: '2px solid var(--border-color)',
            padding: '8px 16px',
            borderRadius: '99px',
            backgroundColor: '#ffffff'
          }}
        >
          <ArrowLeft size={18} />
          Back to Admin
        </Link>
      </div>

      {/* Date Filter & Control Panel */}
      <div 
        className="card-panel" 
        style={{ 
          marginBottom: '32px', 
          backgroundColor: '#ffffff',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
              Date Filter:
            </span>
            
            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setFilterType('7days')}
                className={`btn`}
                style={{
                  background: filterType === '7days' ? 'var(--primary)' : 'white',
                  boxShadow: filterType === '7days' ? '3px 3px 0 #000' : 'none',
                  border: filterType === '7days' ? '2px solid #000' : '2px solid var(--border-color)',
                  padding: '8px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setFilterType('month')}
                className={`btn`}
                style={{
                  background: filterType === 'month' ? 'var(--primary)' : 'white',
                  boxShadow: filterType === 'month' ? '3px 3px 0 #000' : 'none',
                  border: filterType === 'month' ? '2px solid #000' : '2px solid var(--border-color)',
                  padding: '8px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Last Month
              </button>
              <button
                onClick={() => setFilterType('custom')}
                className={`btn`}
                style={{
                  background: filterType === 'custom' ? 'var(--primary)' : 'white',
                  boxShadow: filterType === 'custom' ? '3px 3px 0 #000' : 'none',
                  border: filterType === 'custom' ? '2px solid #000' : '2px solid var(--border-color)',
                  padding: '8px 16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Custom Range
              </button>
            </div>

            {/* Date range descriptor */}
            {data && !loading && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
                <Calendar size={16} />
                <span>
                  {formatDate(data.period.startDate)} – {formatDate(data.period.endDate)}
                </span>
              </div>
            )}
          </div>

          {/* Custom Date Inputs (Conditional) */}
          {filterType === 'custom' && (
            <form 
              onSubmit={handleCustomSubmit} 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'flex-end', 
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>Start Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.95rem', width: '180px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>End Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.95rem', width: '180px' }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              >
                Apply Range
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div 
          style={{ 
            backgroundColor: '#fee2e2', 
            border: '2px solid #ef4444', 
            borderRadius: '12px', 
            padding: '16px', 
            color: '#991b1b', 
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertCircle size={20} />
          <div style={{ flex: 1, fontWeight: 500 }}>{error}</div>
          <button 
            onClick={fetchAnalytics}
            className="btn"
            style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#ffffff', color: '#991b1b', border: '1px solid #ef4444' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Metrics Panels */}
      {loading ? (
        // Loading Skeleton Screen
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="card-panel" 
              style={{ 
                height: '160px', 
                backgroundColor: '#ffffff', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                padding: '24px',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '80px', height: '16px', backgroundColor: '#e2e2d1', borderRadius: '4px' }}></div>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#e2e2d1', borderRadius: '50%' }}></div>
              </div>
              <div style={{ width: '120px', height: '36px', backgroundColor: '#e2e2d1', borderRadius: '8px' }}></div>
              <div style={{ width: '160px', height: '12px', backgroundColor: '#e2e2d1', borderRadius: '4px' }}></div>
            </div>
          ))}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      ) : data ? (
        // Loaded Data View
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            
            {/* Card 1: Quiz Starts */}
            <div 
              className="card-panel"
              style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>QUIZ STARTS</span>
                <BarChart2 size={22} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '12px 0 4px 0' }}>
                {data.starts.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total quiz sessions initiated
              </span>
            </div>

            {/* Card 2: Quiz Completions */}
            <div 
              className="card-panel"
              style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>COMPLETIONS</span>
                <CheckCircle2 size={22} color="#2EBCAB" />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '12px 0 4px 0' }}>
                {data.completions.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total completed submissions
              </span>
            </div>

            {/* Card 3: Completion Rate */}
            <div 
              className="card-panel"
              style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>COMPLETION RATE</span>
                <Percent size={22} color="#CE90FF" />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '12px 0 4px 0' }}>
                {data.completionRate}%
              </div>
              <div style={{ width: '100%', backgroundColor: '#e2e2d1', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '4px', marginBottom: '8px' }}>
                <div style={{ width: `${data.completionRate}%`, backgroundColor: '#CE90FF', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            {/* Card 4: Average Duration */}
            <div 
              className="card-panel"
              style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AVG COMPLETION TIME</span>
                <Clock size={22} color="#D387FF" />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', margin: '12px 0 4px 0' }}>
                {formatDuration(data.avgCompletionTimeSeconds)}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Excluding sessions &gt; 30 mins
              </span>
            </div>

          </div>

          {/* Analytics Summary Context */}
          <div 
            className="card-panel" 
            style={{ 
              backgroundColor: '#fafaf5', 
              padding: '24px',
              borderStyle: 'dashed'
            }}
          >
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>Understanding these metrics</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <li><strong>Quiz Starts</strong> indicates the count of sessions where a user entered their child&apos;s DOB (Step 1) and generated a quiz sequence.</li>
              <li><strong>Quiz Completions</strong> indicates the count of sessions that completed the full quiz questionnaire and submitted contact details.</li>
              <li><strong>Completion Rate</strong> is the proportion of started sessions that turned into completed sessions in this date window.</li>
              <li><strong>Avg Completion Time</strong> calculates the active session length between start and completion. Open tabs exceeding 30 minutes are excluded as outliers to ensure clean data.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="card-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No data available for this range.
        </div>
      )}
    </div>
  );
}
