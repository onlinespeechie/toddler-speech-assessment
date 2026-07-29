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

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

interface AnalyticsData {
  starts: number;
  completions: number;
  completionRate: number;
  avgCompletionTimeSeconds: number;
  period: {
    startDate: string;
    endDate: string;
  };
  funnel?: FunnelStep[];
}

export default function AnalyticsDashboard() {
  const [filterType, setFilterType] = useState<'7days' | 'month' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

          {/* User Drop-off Funnel */}
          {data.funnel && data.funnel.length > 0 && (
            <div 
              className="card-panel animate-fade-in" 
              style={{ 
                backgroundColor: '#ffffff', 
                padding: '32px',
                marginBottom: '32px',
                border: '2px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                boxShadow: 'none'
              }}
            >
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
                User Drop-off Funnel
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
                Analyze how users progress through each stage of the questionnaire, identifying exactly where they drop off.
              </p>

              {/* Visual Funnel Line/Area Graph */}
              <div style={{ position: 'relative', marginBottom: '40px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <svg viewBox="0 0 1000 250" width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="50%" stopColor="#2EBCAB" />
                      <stop offset="100%" stopColor="#CE90FF" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines & Y labels */}
                  {[0, 25, 50, 75, 100].map((val) => {
                    const y = 20 + ((100 - val) / 100 * 190);
                    return (
                      <g key={val}>
                        <line 
                          x1="60" 
                          y1={y} 
                          x2="960" 
                          y2={y} 
                          stroke="#e2e8f0" 
                          strokeDasharray="4 4" 
                          strokeWidth="1" 
                        />
                        <text 
                          x="45" 
                          y={y + 4} 
                          fill="var(--text-muted)" 
                          fontSize="11" 
                          fontWeight="600" 
                          textAnchor="end"
                          style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
                        >
                          {val}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical grid lines & X labels */}
                  {data.funnel.map((step, index) => {
                    const x = 60 + (index * (900 / 15));
                    
                    let shortLabel = `Q${index - 1}`;
                    if (index === 0) shortLabel = 'Landed';
                    else if (index === 1) shortLabel = 'DOB';
                    else if (index === 14) shortLabel = 'Lead';
                    else if (index === 15) shortLabel = 'Done';

                    return (
                      <g key={index}>
                        <line 
                          x1={x} 
                          y1="20" 
                          x2={x} 
                          y2="210" 
                          stroke="#f1f5f9" 
                          strokeWidth="1" 
                        />
                        <text 
                          x={x} 
                          y="230" 
                          fill="var(--text-muted)" 
                          fontSize="11" 
                          fontWeight="700" 
                          textAnchor="middle"
                          style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
                        >
                          {shortLabel}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  <path 
                    d={`M 60 210 ${data.funnel.map((step, i) => {
                      const x = 60 + (i * (900 / 15));
                      const y = 20 + ((100 - step.percentage) / 100 * 190);
                      return `L ${x} ${y}`;
                    }).join(' ')} L 960 210 Z`} 
                    fill="url(#areaGradient)" 
                  />

                  {/* Connection Line */}
                  <path 
                    d={data.funnel.map((step, i) => {
                      const x = 60 + (i * (900 / 15));
                      const y = 20 + ((100 - step.percentage) / 100 * 190);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive dots */}
                  {data.funnel.map((step, index) => {
                    const x = 60 + (index * (900 / 15));
                    const y = 20 + ((100 - step.percentage) / 100 * 190);
                    const isHovered = hoveredIndex === index;

                    return (
                      <g key={index}>
                        <circle 
                          cx={x} 
                          cy={y} 
                          r="15" 
                          fill="transparent" 
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={isHovered ? 7 : 5} 
                          fill="#ffffff" 
                          stroke={index === 0 ? 'var(--primary)' : index === 15 ? '#2EBCAB' : '#818cf8'} 
                          strokeWidth={isHovered ? 4 : 3}
                          style={{ pointerEvents: 'none', transition: 'all 0.15s ease' }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* HTML Tooltip overlay */}
                {hoveredIndex !== null && (() => {
                  const step = data.funnel![hoveredIndex];
                  const x = 60 + (hoveredIndex * (900 / 15));
                  const y = 20 + ((100 - step.percentage) / 100 * 190);
                  
                  return (
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${(x / 1000) * 100}%`,
                        top: `${(y / 250) * 100 - 15}%`,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        pointerEvents: 'none',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        border: '1px solid #334155',
                        fontFamily: "'Quicksand', sans-serif"
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '4px', color: '#38bdf8' }}>{step.name}</div>
                      <div style={{ fontWeight: 500 }}>
                        <span style={{ color: '#e2e8f0' }}>Reach:</span> <strong style={{ color: '#ffffff' }}>{step.count.toLocaleString()}</strong> ({step.percentage}%)
                      </div>
                      {hoveredIndex > 0 && (() => {
                        const prevStep = data.funnel![hoveredIndex - 1];
                        const dropCount = prevStep.count - step.count;
                        const dropPct = prevStep.count > 0 ? ((dropCount / prevStep.count) * 100).toFixed(1) : '0.0';
                        return (
                          <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '4px', fontWeight: 600 }}>
                            ↓ {dropCount.toLocaleString()} dropped ({dropPct}%)
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.funnel.map((step, index) => {
                  const landedCount = data.funnel![0].count;
                  const overallConversion = landedCount > 0 ? ((step.count / landedCount) * 100).toFixed(1) : '0.0';
                  
                  let dropOffCount = 0;
                  let dropOffPercent = '0.0';
                  if (index > 0) {
                    const prevStep = data.funnel![index - 1];
                    dropOffCount = prevStep.count - step.count;
                    dropOffPercent = prevStep.count > 0 ? ((dropOffCount / prevStep.count) * 100).toFixed(1) : '0.0';
                  }

                  return (
                    <div key={index}>
                      {/* Drop-off Badge & Connector */}
                      {index > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0', paddingLeft: '24px' }}>
                          <div style={{ width: '4px', height: '24px', backgroundColor: '#f1f5f9', borderRadius: '2px' }}></div>
                          {dropOffCount > 0 ? (
                            <div style={{ marginLeft: '16px', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: '#fee2e2', padding: '2px 10px', borderRadius: '99px' }}>
                              <span>↓ {dropOffCount.toLocaleString()} abandoned ({dropOffPercent}% drop-off)</span>
                            </div>
                          ) : (
                            <div style={{ marginLeft: '16px', fontSize: '0.82rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', padding: '2px 10px', borderRadius: '99px' }}>
                              <span>→ 100% conversion (0 drop-off)</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step Row */}
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '16px 20px', 
                          borderRadius: '12px', 
                          backgroundColor: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          gap: '20px'
                        }}
                      >
                        {/* Step Circle */}
                        <div 
                          style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            backgroundColor: index === 0 ? 'var(--primary)' : index === data.funnel!.length - 1 ? '#2EBCAB' : '#e2e8f0', 
                            color: index === 0 || index === data.funnel!.length - 1 ? '#000000' : 'var(--text-muted)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 700, 
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          {index + 1}
                        </div>

                        {/* Step Title */}
                        <div style={{ width: '220px', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem', flexShrink: 0 }}>
                          {step.name}
                        </div>

                        {/* Progress Bar Container */}
                        <div style={{ flex: 1, height: '24px', backgroundColor: '#e2e8f0', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                          <div 
                            style={{ 
                              width: `${overallConversion}%`, 
                              height: '100%', 
                              background: index === 0 
                                ? 'linear-gradient(90deg, var(--primary) 0%, #2EBCAB 100%)'
                                : index === data.funnel!.length - 1
                                ? 'linear-gradient(90deg, #2EBCAB 0%, #CE90FF 100%)'
                                : 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                              borderRadius: '12px',
                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        </div>

                        {/* Count & Percent */}
                        <div style={{ width: '180px', textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {step.count.toLocaleString()}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '6px', fontWeight: 600 }}>
                            ({overallConversion}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
