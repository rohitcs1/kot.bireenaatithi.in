import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateHotel() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pin_code: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    subscription_start: '',
    subscription_end: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Hotel name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.owner_name.trim()) e.owner_name = 'Owner name is required';
    if (!form.owner_email.trim()) e.owner_email = 'Owner email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.owner_email)) e.owner_email = 'Owner email is invalid';
    if (!form.owner_phone.trim()) e.owner_phone = 'Owner phone is required';
    else if (!/^\+?[0-9\-\s]{6,20}$/.test(form.owner_phone)) e.owner_phone = 'Owner phone is invalid';
    if (!form.subscription_start) e.subscription_start = 'Subscription start is required';
    if (!form.subscription_end) e.subscription_end = 'Subscription end is required';
    if (form.subscription_start && form.subscription_end && new Date(form.subscription_end) < new Date(form.subscription_start)) e.subscription_end = 'End must be after start';
    if (!form.admin_email.trim()) e.admin_email = 'Admin email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email)) e.admin_email = 'Admin email is invalid';
    if (!form.admin_password) e.admin_password = 'Admin password is required';
    else if (form.admin_password.length < 8) e.admin_password = 'Password must be at least 8 characters';
    if (!form.admin_password_confirm) e.admin_password_confirm = 'Please confirm password';
    else if (form.admin_password !== form.admin_password_confirm) e.admin_password_confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showToast = (type, message, timeout = 3500) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), timeout);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const computeDuration = () => {
    if (!form.subscription_start || !form.subscription_end) return '';
    const a = new Date(form.subscription_start);
    const b = new Date(form.subscription_end);
    if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) return '';
    const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
    return `${diff} day(s)`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        pin_code: form.pin_code,
        owner_name: form.owner_name,
        owner_phone: form.owner_phone,
        owner_email: form.owner_email,
        subscription_start: form.subscription_start,
        subscription_end: form.subscription_end,
        admin: { email: form.admin_email, password: form.admin_password }
      };

      // Call backend superadmin create hotel endpoint
      // `api` baseURL already includes `/api`, so use the route relative to that base.
      const res = await api.post('/superadmin/hotels', payload);
      // backend returns { hotel, admin }
      const createdHotel = res.data?.hotel || res.hotel || null;
      if (createdHotel) {
        showToast('success', 'Hotel created successfully');
        // Redirect to hotels list which will fetch fresh data from backend
        setTimeout(() => navigate('/superadmin/hotels'), 800);
      } else {
        showToast('error', res.data?.message || 'Create hotel failed');
      }
    } catch (err) {
      console.error(err);
      showToast('error', err?.response?.data?.message || 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800">Create Hotel</h2>
          <p className="text-sm text-gray-500 mt-1">Add a new hotel and its admin credentials (superadmin only).</p>

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-4">
              <div className="pb-2 border-b">
                <h4 className="text-sm font-semibold text-gray-700">Hotel Details</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hotel Name</label>
                <input name="name" value={form.name} onChange={handleChange} className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={3} className={`mt-1 block w-full rounded-md border ${errors.address ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input name="city" value={form.city} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input name="state" value={form.state} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PIN Code</label>
                  <input name="pin_code" value={form.pin_code} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-semibold text-gray-700">Owner Details</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                <input name="owner_name" value={form.owner_name} onChange={handleChange} className={`mt-1 block w-full rounded-md border ${errors.owner_name ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.owner_name && <p className="text-xs text-red-600 mt-1">{errors.owner_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Email</label>
                <input name="owner_email" value={form.owner_email} onChange={handleChange} type="email" className={`mt-1 block w-full rounded-md border ${errors.owner_email ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.owner_email && <p className="text-xs text-red-600 mt-1">{errors.owner_email}</p>}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Phone</label>
                <input name="owner_phone" value={form.owner_phone} onChange={handleChange} className={`mt-1 block w-full rounded-md border ${errors.owner_phone ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.owner_phone && <p className="text-xs text-red-600 mt-1">{errors.owner_phone}</p>}
              </div>

              <div className="pb-2 border-b">
                <h4 className="text-sm font-semibold text-gray-700">Subscription</h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscription Start</label>
                  <input name="subscription_start" value={form.subscription_start} onChange={handleChange} type="date" className={`mt-1 block w-full rounded-md border ${errors.subscription_start ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                  {errors.subscription_start && <p className="text-xs text-red-600 mt-1">{errors.subscription_start}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscription End</label>
                  <input name="subscription_end" value={form.subscription_end} onChange={handleChange} type="date" className={`mt-1 block w-full rounded-md border ${errors.subscription_end ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                  {errors.subscription_end && <p className="text-xs text-red-600 mt-1">{errors.subscription_end}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (auto display only)</label>
                <div className="mt-1 text-sm text-gray-700">{computeDuration() || '—'}</div>
              </div>

              <div className="pb-2 border-b">
                <h4 className="text-sm font-semibold text-gray-700">Hotel Admin Login</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                <input name="admin_email" value={form.admin_email} onChange={handleChange} type="email" className={`mt-1 block w-full rounded-md border ${errors.admin_email ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.admin_email && <p className="text-xs text-red-600 mt-1">{errors.admin_email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Password</label>
                <input name="admin_password" value={form.admin_password} onChange={handleChange} type="password" className={`mt-1 block w-full rounded-md border ${errors.admin_password ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.admin_password && <p className="text-xs text-red-600 mt-1">{errors.admin_password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input name="admin_password_confirm" value={form.admin_password_confirm} onChange={handleChange} type="password" className={`mt-1 block w-full rounded-md border ${errors.admin_password_confirm ? 'border-red-500' : 'border-gray-300'} px-3 py-2`} />
                {errors.admin_password_confirm && <p className="text-xs text-red-600 mt-1">{errors.admin_password_confirm}</p>}
              </div>
            </div>

            {/* Full width submit */}
            <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
              <button type="button" onClick={() => navigate('/superadmin/hotels')} className="px-4 py-2 rounded-md bg-white border text-sm">Cancel</button>
              <button type="submit" disabled={loading} className={`px-4 py-2 rounded-md text-white text-sm ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {loading ? (
                  <svg className="animate-spin w-5 h-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                ) : 'Create Hotel'}
              </button>
            </div>
          </form>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
