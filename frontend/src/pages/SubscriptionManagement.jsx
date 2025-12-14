import React, { useState, useMemo, useEffect } from 'react';
import api from '../api';

// Subscription Management Page (Superadmin)
// PATCH /api/superadmin/subscription/update

export default function SubscriptionManagement() {
  const [hotels, setHotels] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [showExtend, setShowExtend] = useState(false);
  const [extendMonths, setExtendMonths] = useState(1);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoadingHotels(true);
    api.get('/hotels')
      .then(res => { if (mounted) { setHotels(res.data || []); setSelected((res.data || [])[0] || null); } })
      .catch(err => { if (mounted) setError(err?.response?.data?.message || err.message || 'Failed to load hotels'); })
      .finally(() => mounted && setLoadingHotels(false));
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hotels;
    return hotels.filter(h => (`${h.id}`.includes(q) || h.name.toLowerCase().includes(q)));
  }, [hotels, query]);

  function daysLeft(end) {
    if (!end) return null;
    const now = new Date();
    const e = new Date(end);
    const diff = Math.ceil((e - now) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function formatDate(d) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  }

  const openExtend = (hotel) => {
    setSelected(hotel);
    setExtendMonths(1);
    setShowExtend(true);
  };

  const handleExtendSave = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      // Compute new end date
      const currentEnd = selected.subscription_end ? new Date(selected.subscription_end) : new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + Number(extendMonths));
      // Call backend to extend
      await api.patch('/api/superadmin/subscription/update', { hotel_id: selected.id, extend_months: Number(extendMonths) });
      setHotels(prev => prev.map(h => h.id === selected.id ? { ...h, subscription_end: newEnd.toISOString().slice(0,10), status: 'active' } : h));
      setSelected(prev => ({ ...prev, subscription_end: newEnd.toISOString().slice(0,10), status: 'active' }));
      setShowExtend(false);
      showToast('success', 'Subscription extended successfully');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to extend subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = (hotelId) => {
    if (!window.confirm('Disable this hotel?')) return;
    (async () => {
      try {
        await api.patch('/api/superadmin/subscription/update', { hotel_id: hotelId, action: 'disable' });
        setHotels(prev => prev.map(h => h.id === hotelId ? { ...h, status: 'disabled' } : h));
        if (selected && selected.id === hotelId) setSelected(prev => ({ ...prev, status: 'disabled' }));
        showToast('success', 'Hotel disabled');
      } catch (err) {
        showToast('error', err?.response?.data?.message || err.message || 'Disable failed');
      }
    })();
  };

  const handleActivate = (hotelId) => {
    (async () => {
      try {
        await api.patch('/api/superadmin/subscription/update', { hotel_id: hotelId, action: 'activate' });
        setHotels(prev => prev.map(h => h.id === hotelId ? { ...h, status: 'active' } : h));
        if (selected && selected.id === hotelId) setSelected(prev => ({ ...prev, status: 'active' }));
        showToast('success', 'Hotel activated');
      } catch (err) {
        showToast('error', err?.response?.data?.message || err.message || 'Activate failed');
      }
    })();
  };

  const showToast = (type, message, timeout = 3000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), timeout);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
            <p className="text-sm text-gray-500">Search hotels and manage subscriptions</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row sm:items-center gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search hotel by name or id" className="flex-1 px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
          <div className="flex gap-2">
            <button onClick={() => { setQuery(''); }} className="px-3 py-2 bg-gray-100 rounded">Clear</button>
            <button onClick={() => { if (filtered[0]) setSelected(filtered[0]); }} className="px-3 py-2 bg-indigo-600 text-white rounded">Select first</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-sm font-semibold text-gray-800">Results</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(h => (
                  <button key={h.id} onClick={() => setSelected(h)} className="text-left bg-gray-50 hover:bg-gray-100 p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{h.name}</div>
                        <div className="text-xs text-gray-500">ID: {h.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatDate(h.subscription_end)}</div>
                        <div className="text-xs text-gray-500">{h.status}</div>
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <div className="text-sm text-gray-500">No hotels found.</div>}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            {selected ? (
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900">{selected.name}</h3>
                <div className="mt-2 text-sm text-gray-600">Start: {formatDate(selected.subscription_start)}</div>
                <div className="text-sm text-gray-600">End: {formatDate(selected.subscription_end)}</div>
                <div className="mt-2 text-sm">Days left: <strong>{daysLeft(selected.subscription_end)}</strong></div>
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs ${selected.status === 'active' ? 'bg-green-100 text-green-800' : selected.status === 'disabled' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{selected.status}</span>
                </div>

                <div className="mt-4 space-y-2">
                  <button onClick={() => openExtend(selected)} className="w-full px-3 py-2 rounded bg-indigo-600 text-white">Extend Subscription</button>
                  {selected.status !== 'disabled' ? (
                    <button onClick={() => handleDisable(selected.id)} className="w-full px-3 py-2 rounded bg-yellow-100 text-yellow-800">Disable Hotel</button>
                  ) : (
                    <button onClick={() => handleActivate(selected.id)} className="w-full px-3 py-2 rounded bg-green-100 text-green-800">Activate Hotel</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg shadow text-gray-500">Select a hotel to view details</div>
            )}
          </aside>
        </div>

        {/* Extend Modal */}
        {showExtend && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowExtend(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold">Extend Subscription for {selected.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Current end: {formatDate(selected.subscription_end)}</p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className={`p-3 border rounded cursor-pointer ${extendMonths === 1 ? 'bg-indigo-50 border-indigo-300' : 'bg-white'}`}>
                    <input type="radio" name="dur" checked={extendMonths === 1} onChange={() => setExtendMonths(1)} className="hidden" />
                    <div className="text-sm font-medium">1 month</div>
                  </label>
                  <label className={`p-3 border rounded cursor-pointer ${extendMonths === 3 ? 'bg-indigo-50 border-indigo-300' : 'bg-white'}`}>
                    <input type="radio" name="dur" checked={extendMonths === 3} onChange={() => setExtendMonths(3)} className="hidden" />
                    <div className="text-sm font-medium">3 months</div>
                  </label>
                  <label className={`p-3 border rounded cursor-pointer ${extendMonths === 6 ? 'bg-indigo-50 border-indigo-300' : 'bg-white'}`}>
                    <input type="radio" name="dur" checked={extendMonths === 6} onChange={() => setExtendMonths(6)} className="hidden" />
                    <div className="text-sm font-medium">6 months</div>
                  </label>
                  <label className={`p-3 border rounded cursor-pointer ${extendMonths === 12 ? 'bg-indigo-50 border-indigo-300' : 'bg-white'}`}>
                    <input type="radio" name="dur" checked={extendMonths === 12} onChange={() => setExtendMonths(12)} className="hidden" />
                    <div className="text-sm font-medium">1 year</div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <button onClick={() => setShowExtend(false)} className="px-3 py-2 rounded border">Cancel</button>
                  <button onClick={handleExtendSave} disabled={loading} className={`px-3 py-2 rounded text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>{toast.message}</div>
        )}
      </div>
    </div>
  );
}
