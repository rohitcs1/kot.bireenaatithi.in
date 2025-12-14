import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Superadmin Dashboard Page
// TODO: GET /superadmin/hotels
// TODO: GET /superadmin/overview

export default function SuperadminDashboard() {
  const navigate = useNavigate();

  // Data from API
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    // Fetch overview (counts + trends) from backend
    api.get('/superadmin/overview')
      .then((res) => {
        if (!mounted) return;
        const ov = res.data?.overview || null;
        setOverview(ov);
        // set hotels/users to empty placeholders if needed
        setHotels([]);
        setUsers(Array.isArray(ov?.staffCount) ? ov.staffCount : []);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || err.message || 'Failed to load overview');
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const totalHotels = overview ? overview.total : 0;
  const activeHotels = overview ? overview.active : 0;
  const expiredHotels = overview ? overview.expired : 0;
  const disabledHotels = overview ? overview.disabled : 0;

  const recentActivity = [
    { id: 1, time: '2m ago', text: 'Hotel "The Seaview" created by superadmin' },
    { id: 2, time: '10m ago', text: 'Admin of "Green Inn" created manager account' },
    { id: 3, time: '1h ago', text: 'Subscription expired for "City Lodge"' },
    { id: 4, time: '3h ago', text: 'Invoice #INV-1021 generated for order #210' },
    { id: 5, time: 'Yesterday', text: 'System settings updated by superadmin' }
  ];

  const QuickLink = ({ title, subtitle, onClick }) => (
    <button onClick={onClick} className="group bg-white/60 hover:bg-white/80 border border-gray-100 rounded-lg p-4 text-left shadow-sm transition transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-indigo-500 opacity-80">›</div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-indigo-600">SaaS Restaurant</div>
              <div className="text-sm text-gray-500">Superadmin</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">Hello, Superadmin</div>
              <button
                onClick={() => { /* clear auth and redirect to login */ navigate('/superadmin/login'); }}
                className="px-3 py-1 rounded-md bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Top Stats - responsive grid */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-500">Total Hotels</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{totalHotels}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-500">Active Subscriptions</div>
                <div className="mt-2 text-2xl font-bold text-green-600">{activeHotels}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-500">Expired Subscriptions</div>
                <div className="mt-2 text-2xl font-bold text-red-600">{expiredHotels}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-sm text-gray-500">Total Staff Accounts</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{overview ? overview.staffCount : users.length}</div>
              </div>
            </div>
          </section>

          {/* Main content grid: Charts + Quick links + Activity */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Charts (span 2 on large) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Subscription Expiry Trend</h3>
                  <div className="text-xs text-gray-500">Last 30 days</div>
                </div>
                <div className="mt-4 h-48 bg-gray-50 rounded px-2 py-3 overflow-x-auto">
                  {overview && overview.expiryTrend && overview.expiryTrend.length > 0 ? (
                    (() => {
                      const data = overview.expiryTrend.map(d => ({ x: d.date, y: d.count }));
                      const width = Math.max(600, data.length * 14);
                      const height = 160;
                      const padding = { top: 10, right: 12, bottom: 22, left: 32 };
                      const innerW = width - padding.left - padding.right;
                      const innerH = height - padding.top - padding.bottom;
                      const maxY = Math.max(...data.map(d => d.y), 1);
                      const points = data.map((d, i) => {
                        const x = padding.left + (i / (data.length - 1 || 1)) * innerW;
                        const y = padding.top + innerH - (d.y / maxY) * innerH;
                        return [x, y];
                      });
                      const poly = points.map(p => p.join(',')).join(' ');
                      return (
                        <div style={{ width }} className="overflow-x-auto">
                          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                            {/* y grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => (
                              <line key={idx} x1={padding.left} x2={width - padding.right} y1={padding.top + t * innerH} y2={padding.top + t * innerH} stroke="#eee" />
                            ))}
                            {/* polyline */}
                            <polyline points={poly} fill="none" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            {/* area fill (subtle) */}
                            <polygon points={`${poly} ${width - padding.right},${height - padding.bottom} ${padding.left},${height - padding.bottom}`} fill="#EEF2FF" opacity="0.6" />
                            {/* points */}
                            {points.map((p, i) => (
                              <g key={i}>
                                <circle cx={p[0]} cy={p[1]} r={3} fill="#4F46E5" />
                              </g>
                            ))}
                            {/* x labels (every 5th) */}
                            {data.map((d, i) => {
                              if (i % 5 !== 0 && i !== data.length - 1) return null;
                              const x = padding.left + (i / (data.length - 1 || 1)) * innerW;
                              return (
                                <text key={d.x} x={x} y={height - 4} fontSize="10" textAnchor="middle" fill="#6B7280">{d.x.slice(5)}</text>
                              );
                            })}
                            {/* y labels */}
                            {[0, 0.5, 1].map((t, idx) => (
                              <text key={idx} x={6} y={padding.top + innerH - t * innerH + 4} fontSize="10" fill="#6B7280">{Math.round(t * maxY)}</text>
                            ))}
                          </svg>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-400">No expiry data</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Hotels Growth Trend</h3>
                  <div className="text-xs text-gray-500">Monthly</div>
                </div>
                <div className="mt-4 h-40 bg-gray-50 rounded px-4 py-3 overflow-x-auto">
                  {overview && overview.growthTrend && overview.growthTrend.length > 0 ? (
                    (() => {
                      const data = overview.growthTrend.map(g => ({ x: g.month, y: g.count }));
                      const width = Math.max(360, data.length * 80);
                      const height = 160;
                      const padding = { top: 8, right: 12, bottom: 36, left: 28 };
                      const innerW = width - padding.left - padding.right;
                      const innerH = height - padding.top - padding.bottom;
                      const maxY = Math.max(...data.map(d => d.y), 1);
                      return (
                        <div style={{ width }} className="overflow-x-auto">
                          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                            {data.map((d, i) => {
                              const bw = innerW / data.length * 0.6;
                              const x = padding.left + i * (innerW / data.length) + (innerW / data.length - bw) / 2;
                              const h = (d.y / maxY) * innerH;
                              const y = padding.top + innerH - h;
                              return (
                                <g key={d.x}>
                                  <rect x={x} y={y} width={bw} height={Math.max(4, h)} fill="#7C3AED" rx={4} />
                                  <text x={x + bw / 2} y={y - 6} fontSize="11" textAnchor="middle" fill="#374151">{d.y}</text>
                                  <text x={x + bw / 2} y={height - 8} fontSize="11" textAnchor="middle" fill="#6B7280">{d.x.split('-')[1]}/{d.x.split('-')[0].slice(2)}</text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-400">No growth data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick links + Recent Activity */}
            <aside className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickLink title="Manage Hotels" subtitle="View & edit hotels" onClick={() => navigate('/superadmin/hotels')} />
                  <QuickLink title="Create Hotel" subtitle="Add new hotel" onClick={() => navigate('/superadmin/hotels/create')} />
                  <QuickLink title="All Users" subtitle="Manage staff" onClick={() => navigate('/superadmin/users')} />
                  <QuickLink title="System Settings" subtitle="Global settings" onClick={() => navigate('/superadmin/settings')} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.map(a => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 mt-1 rounded-full bg-indigo-500/80" />
                      <div>
                        <div className="text-sm text-gray-700">{a.text}</div>
                        <div className="text-xs text-gray-400">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>

        </div>
      </main>
    </div>
  );
}
