import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

// Hotel Details & Staff Management Page
// TODO: GET /superadmin/hotel/:id/users
// TODO: POST /superadmin/users/create

export default function HotelDetails() {
  const { id } = useParams();

  // Mock hotel info
  const [hotel, setHotel] = useState({
    id: id || 101,
    name: 'The Seaview',
    address: '123 Ocean Ave, Beach City',
    subscription_start: '2024-01-01',
    subscription_end: '2025-01-01',
    status: 'active'
  });

  // Mock staff
  const [staff, setStaff] = useState([
    { id: 1, name: 'Alice Admin', email: 'alice@hotel.com', role: 'admin', enabled: true },
    { id: 2, name: 'Mark Manager', email: 'mark@hotel.com', role: 'manager', enabled: true },
    { id: 3, name: 'Wendy Waiter', email: 'wendy@hotel.com', role: 'waiter', enabled: true },
    { id: 4, name: 'Ken Kitchen', email: 'ken@hotel.com', role: 'kitchen', enabled: false }
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'waiter', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [hRes, uRes] = await Promise.all([
          api.get(`/hotels/${id}`),
          api.get(`/users?hotel_id=${id}`)
        ]);
        if (!mounted) return;
        setHotel(hRes.data || null);
        setStaff(uRes.data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to load' });
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const grouped = {
    admin: staff.filter(s => s.role === 'admin'),
    manager: staff.filter(s => s.role === 'manager'),
    waiter: staff.filter(s => s.role === 'waiter'),
    kitchen: staff.filter(s => s.role === 'kitchen')
  };

  const showToastMessage = (type, message, timeout = 3000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), timeout);
  };

  const handleToggle = (userId, enable) => {
    // Call backend to enable/disable
    (async () => {
      try {
        await api.patch(`/users/${userId}/${enable ? 'enable' : 'disable'}`);
        setStaff(prev => prev.map(s => s.id === userId ? { ...s, enabled: enable } : s));
        showToastMessage('success', enable ? 'User enabled' : 'User disabled');
      } catch (err) {
        console.error(err);
        showToastMessage('error', err?.response?.data?.message || err.message || 'Action failed');
      }
    })();
  };

  const handleDelete = (userId) => {
    if (!window.confirm('Delete staff member?')) return;
    (async () => {
      try {
        await api.delete(`/users/${userId}`);
        setStaff(prev => prev.filter(s => s.id !== userId));
        showToastMessage('success', 'User deleted');
      } catch (err) {
        console.error(err);
        showToastMessage('error', err?.response?.data?.message || err.message || 'Delete failed');
      }
    })();
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.email.trim()) e.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 8) e.password = 'Password must be 8+ chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role, hotel_id: id };
      const res = await api.post('/users', payload);
      // On success append returned user or fallback
      const created = res.data || { id: Date.now(), name: form.name, email: form.email, role: form.role, enabled: true };
      setStaff(prev => [...prev, created]);
      setShowAdd(false);
      setForm({ name: '', email: '', role: 'waiter', password: '' });
      showToastMessage('success', 'Staff created');
    } catch (err) {
      console.error(err);
      showToastMessage('error', 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hotel Details</h1>
            <p className="text-sm text-gray-500">Manage hotel information and staff</p>
          </div>
        </div>

        {/* Hotel Info Card */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">Hotel Name</div>
              <div className="text-lg font-semibold text-gray-800">{hotel.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Address</div>
              <div className="text-sm text-gray-700">{hotel.address}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Subscription</div>
              <div className="text-sm text-gray-700">{hotel.subscription_start} → {hotel.subscription_end}</div>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs ${hotel.status === 'active' ? 'bg-green-100 text-green-800' : hotel.status === 'disabled' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{hotel.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Admins */}
            <Section title="Admins">
              {grouped.admin.map(u => (
                <UserCard key={u.id} user={u} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </Section>

            {/* Managers */}
            <Section title="Managers">
              {grouped.manager.map(u => (
                <UserCard key={u.id} user={u} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </Section>

            {/* Waiters */}
            <Section title="Waiters">
              {grouped.waiter.map(u => (
                <UserCard key={u.id} user={u} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </Section>

            {/* Kitchen */}
            <Section title="Kitchen Staff">
              {grouped.kitchen.map(u => (
                <UserCard key={u.id} user={u} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </Section>
          </div>

          {/* Sidebar: actions */}
          <aside className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
              <p className="text-xs text-gray-500 mt-2">Manage staff for this hotel</p>
              <div className="mt-4">
                <button onClick={() => setShowAdd(true)} className="w-full px-3 py-2 bg-indigo-600 text-white rounded">Add New Staff</button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-500">
              <div className="font-medium text-gray-700">Hotel ID</div>
              <div className="mt-1">{hotel.id}</div>
            </div>
          </aside>
        </div>

        {/* Add Staff Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold">Add New Staff</h3>
              <form className="mt-4 space-y-3" onSubmit={handleAdd}>
                <div>
                  <label className="text-xs text-gray-600">Name</label>
                  <input value={form.name} name="name" onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className={`mt-1 block w-full rounded border ${errors.name ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600">Email</label>
                  <input value={form.email} name="email" onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className={`mt-1 block w-full rounded border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600">Role</label>
                  <select value={form.role} onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Password</label>
                  <input value={form.password} name="password" type="password" onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} className={`mt-1 block w-full rounded border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                  {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 rounded border">Cancel</button>
                  <button type="submit" disabled={loading} className={`px-3 py-2 rounded text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{loading ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
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

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function UserCard({ user, onToggle, onDelete }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <div>
        <div className="text-sm font-medium text-gray-800">{user.name}</div>
        <div className="text-xs text-gray-500">{user.email} • <span className="capitalize">{user.role}</span></div>
      </div>
      <div className="flex items-center gap-2">
        <div>
          {user.enabled ? <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">Enabled</span> : <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Disabled</span>}
        </div>
        <button onClick={() => onToggle(user.id, !user.enabled)} className="px-2 py-1 text-xs border rounded">{user.enabled ? 'Disable' : 'Enable'}</button>
        <button onClick={() => onDelete(user.id)} className="px-2 py-1 text-xs border rounded text-red-600">Delete</button>
      </div>
    </div>
  );
}
