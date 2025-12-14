import React, { useState, useMemo, useEffect } from 'react';
import api from '../api';

// All Users (Superadmin)
// GET /api/users

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/users')
      .then(res => {
        if (!mounted) return;
        // backend returns { users: [...] } or a raw array
        const payload = res.data;
        const list = Array.isArray(payload) ? payload : (payload?.users || []);
        setUsers(list || []);
      })
      .catch(err => { if (mounted) setError(err?.response?.data?.error || err?.response?.data?.message || err.message || 'Failed to load users'); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // determine whether to show the User ID column — only show for superadmin
  const currentUser = (() => {
    try {
      const s = localStorage.getItem('kot-user') || sessionStorage.getItem('kot-user');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  })();
  const showUserId = (currentUser && String(currentUser.role).toLowerCase() === 'superadmin');

  const hotels = useMemo(() => {
    const set = new Set(users.map(u => u.hotel_id));
    return Array.from(set).sort((a,b)=>a-b);
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (hotelFilter !== 'all' && String(u.hotel_id) !== String(hotelFilter)) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone||'').toLowerCase().includes(q) || String(u.id).includes(q);
    });
  }, [users, query, roleFilter, hotelFilter, statusFilter]);

  function downloadCSV(rows) {
    if (!rows || !rows.length) return;
    const headers = showUserId ? ['User ID','Name','Email','Phone','Role','Hotel ID','Status','Created At'] : ['Name','Email','Phone','Role','Hotel ID','Status','Created At'];
    const csv = [headers.join(',')].concat(rows.map(r => {
      const row = showUserId ? [r.id, `"${r.name}"`, r.email, (r.phone||''), r.role, r.hotel_id, r.status, r.created_at] : [`"${r.name}"`, r.email, (r.phone||''), r.role, r.hotel_id, r.status, r.created_at];
      return row.join(',');
    })).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  const toggleUser = async (userId, enable) => {
    try {
      await api.patch(`/api/users/${userId}/${enable ? 'enable' : 'disable'}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: enable ? 'active' : 'disabled' } : u));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Action failed');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete user?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
            <p className="text-sm text-gray-500">List of all staff across hotels</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => downloadCSV(filtered)} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Export CSV</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, email or id" className="px-3 py-2 border rounded" />
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="px-3 py-2 border rounded">
              <option value="all">All roles</option>
              <option value="superadmin">superadmin</option>
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="waiter">waiter</option>
              <option value="kitchen">kitchen</option>
            </select>
            <div className="flex gap-3">
              <select value={hotelFilter} onChange={e=>setHotelFilter(e.target.value)} className="px-3 py-2 border rounded flex-1">
                <option value="all">All hotels</option>
                {hotels.map(h => <option key={h} value={h}>Hotel {h}</option>)}
              </select>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option value="all">All status</option>
                <option value="active">active</option>
                <option value="expired">expired</option>
                <option value="disabled">disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showUserId && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User ID</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Hotel ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created At</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  {showUserId && <td className="px-4 py-3 text-sm text-gray-700">{u.id}</td>}
                  <td className="px-4 py-3 text-sm text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{u.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{u.hotel_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {u.status === 'active' && <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">active</span>}
                    {u.status === 'expired' && <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">expired</span>}
                    {u.status === 'disabled' && <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">disabled</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {u.status !== 'active' ? (
                      <button onClick={() => toggleUser(u.id, true)} className="px-2 py-1 text-xs bg-green-50 border rounded text-green-800">Enable</button>
                    ) : (
                      <button onClick={() => toggleUser(u.id, false)} className="px-2 py-1 text-xs bg-yellow-50 border rounded text-yellow-800">Disable</button>
                    )}
                    <button onClick={() => deleteUser(u.id)} className="ml-2 px-2 py-1 text-xs bg-red-50 border rounded text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
