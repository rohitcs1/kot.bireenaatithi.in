import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// TODO: GET /superadmin/hotels

export default function HotelsManagement() {
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | expired | disabled
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [selected, setSelected] = useState(null); // hotel selected for drawer/modal
  const [confirmingDisable, setConfirmingDisable] = useState(null); // hotel object being confirmed for disable
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search + filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hotels.filter(h => {
      if (filter !== 'all' && h.status !== filter) return false;
      if (!q) return true;
      return (`${h.id}`.includes(q) || h.name.toLowerCase().includes(q) || (h.owner_name || '').toLowerCase().includes(q));
    });
  }, [hotels, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Actions
  // Show an in-page confirmation modal before disabling
  const handleDisableClick = (hotel) => {
    setConfirmingDisable(hotel);
  };

  const performDisable = async (id) => {
    try {
      setLoading(true);
      await api.patch(`/superadmin/hotels/${id}/status`, { enabled: false });
      await fetchHotels();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to disable');
    } finally { setLoading(false); setConfirmingDisable(null); }
  };

  const cancelDisable = () => setConfirmingDisable(null);

  const handleEnable = async (id) => {
    try {
      setLoading(true);
      const res = await api.patch(`/superadmin/hotels/${id}/status`, { enabled: true });
      const updated = res.data?.hotel || res.data;
      await fetchHotels();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to enable');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hotel? This is permanent.')) return;
    try {
      setLoading(true);
      await api.delete(`/superadmin/hotels/${id}`);
      setSelected(null);
      await fetchHotels();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to delete');
    } finally { setLoading(false); }
  };

  const openDetails = (hotel) => setSelected(hotel);
  const closeDetails = () => setSelected(null);

  // Fetch hotels (call when mounted and when filter changes to ensure fresh DB state)
  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/superadmin/hotels');
      const hotelsData = res.data?.hotels || res.data || [];
      const norm = hotelsData.map(h => ({
        ...h,
        status: h.status || (h.subscription_end && new Date(h.subscription_end) < new Date() ? 'expired' : 'active'),
        owner_name: h.owner_name || h.owner || null
      }));
      setHotels(norm);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hotels Management</h1>
            <p className="text-sm text-gray-500">View and manage all registered hotels</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/superadmin/hotels/create')} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700">Create Hotel</button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-2/3">
              <div className="relative w-full">
                <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by ID, name or owner" className="block w-full rounded-md border-gray-200 shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => { setFilter('all'); setPage(1); }} className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
                <button onClick={() => { setFilter('active'); setPage(1); }} className={`px-3 py-1 rounded-md text-sm ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Active</button>
                <button onClick={() => { setFilter('expired'); setPage(1); }} className={`px-3 py-1 rounded-md text-sm ${filter === 'expired' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Expired</button>
                <button onClick={() => { setFilter('disabled'); setPage(1); }} className={`px-3 py-1 rounded-md text-sm ${filter === 'disabled' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'}`}>Disabled</button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">Showing <strong>{filtered.length}</strong> result(s)</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Hotel ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Hotel Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Subscription</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paged.map(h => (
                <tr key={h.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm text-gray-700" onClick={() => openDetails(h)}>{h.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900" onClick={() => openDetails(h)}>{h.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700" onClick={() => openDetails(h)}>{h.owner_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700" onClick={() => openDetails(h)}>
                    <div className="text-xs text-gray-500">{h.subscription_start}</div>
                    <div className="text-xs text-gray-500">{h.subscription_end}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {h.status === 'active' && <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>}
                    {h.status === 'expired' && <span className="inline-flex px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Expired</span>}
                    {h.status === 'disabled' && <span className="inline-flex px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Disabled</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm space-x-2">
                    <button onClick={() => openDetails(h)} className="px-2 py-1 text-sm bg-white border rounded text-gray-700">View</button>
                    {h.status !== 'disabled' ? (
                      <button onClick={() => handleDisableClick(h)} className="px-2 py-1 text-sm bg-yellow-50 border rounded text-yellow-800">Disable</button>
                    ) : (
                      <button onClick={() => handleEnable(h.id)} className="px-2 py-1 text-sm bg-green-50 border rounded text-green-800">Enable</button>
                    )}
                    <button onClick={() => handleDelete(h.id)} className="px-2 py-1 text-sm bg-red-50 border rounded text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No hotels found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-white border rounded">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-white border rounded">Next</button>
          </div>
        </div>

        {/* Details Drawer / Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeDetails} />
            <div className="relative bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selected.name}</h3>
                  <p className="text-sm text-gray-500">Hotel ID: {selected.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { closeDetails(); handleDelete(selected.id); }} className="px-3 py-1 text-sm bg-red-50 border rounded text-red-700">Delete</button>
                  <button onClick={closeDetails} className="px-3 py-1 text-sm bg-gray-100 border rounded">Close</button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Owner</div>
                  <div className="text-sm font-medium">{selected.owner_name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Subscription</div>
                  <div className="text-sm">{selected.subscription_start} → {selected.subscription_end}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-sm font-medium">{selected.status}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>

    {/* Confirm Disable Modal */}
    {confirmingDisable && (
      <div className="fixed inset-0 z-60 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={cancelDisable} />
        <div className="relative bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Disable hotel</h3>
          <p className="text-sm text-gray-600 mt-2">Are you sure you want to disable <strong>{confirmingDisable.name}</strong>? This will disable staff accounts for this hotel.</p>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={cancelDisable} className="px-3 py-2 bg-gray-100 rounded border">Cancel</button>
            <button onClick={() => performDisable(confirmingDisable.id)} className="px-3 py-2 bg-yellow-600 text-white rounded">Disable</button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
