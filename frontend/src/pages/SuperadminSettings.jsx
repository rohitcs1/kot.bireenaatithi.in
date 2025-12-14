import React, { useState } from 'react';
import api from '../api';

// Superadmin System Settings Page
// Tabs: General, API Keys, Logs, Security

export default function SuperadminSettings() {
  const [tab, setTab] = useState('general');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  let initialEmail = '';
  try {
    if (token) initialEmail = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email || '';
  } catch (e) { initialEmail = ''; }

  const [general, setGeneral] = useState({ name: 'Superadmin', email: initialEmail });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showKeys, setShowKeys] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  function mask(key) {
    if (!key) return '';
    const keep = 6;
    if (key.length <= keep) return '*'.repeat(key.length);
    return key.slice(0, keep) + '·'.repeat(Math.max(6, key.length - keep - 6)) + key.slice(-6);
  }

  function copyToClipboard(val) {
    navigator.clipboard.writeText(val).then(() => showToast('success', 'Copied to clipboard')).catch(() => showToast('error', 'Copy failed'));
  }

  function showToast(type, message, timeout = 3000) {
    setToast({ type, message });
    setTimeout(() => setToast(null), timeout);
  }

  async function handleGeneralSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/superadmin/me', general);
      showToast('success', 'Profile saved');
    } catch (err) {
      showToast('error', err?.response?.data?.message || err.message || 'Save failed');
    } finally { setLoading(false); }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!passwords.newPass || passwords.newPass !== passwords.confirm) return showToast('error', 'Passwords must match');
    setLoading(true);
    try {
      await api.post('/superadmin/change-password', { current: passwords.current, new_password: passwords.newPass });
      setPasswords({ current: '', newPass: '', confirm: '' });
      showToast('success', 'Password changed');
    } catch (err) {
      showToast('error', err?.response?.data?.message || err.message || 'Change failed');
    } finally { setLoading(false); }
  }

  // Mock keys and logs — server should provide keys/logs if needed (server-only keys must never be exposed)
  const keys = { SUPABASE_URL: 'https://your-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: '' };
  const logs = [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
              <p className="text-sm text-gray-500">Manage global system settings for the SaaS platform</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <nav className="col-span-1 bg-gray-50 p-3 rounded">
              <ul className="space-y-1">
                <li>
                  <button onClick={() => setTab('general')} className={`w-full text-left px-3 py-2 rounded ${tab==='general' ? 'bg-white shadow' : 'hover:bg-white'}`}>General</button>
                </li>
                <li>
                  <button onClick={() => setTab('keys')} className={`w-full text-left px-3 py-2 rounded ${tab==='keys' ? 'bg-white shadow' : 'hover:bg-white'}`}>API Keys</button>
                </li>
                <li>
                  <button onClick={() => setTab('logs')} className={`w-full text-left px-3 py-2 rounded ${tab==='logs' ? 'bg-white shadow' : 'hover:bg-white'}`}>Logs</button>
                </li>
                <li>
                  <button onClick={() => setTab('security')} className={`w-full text-left px-3 py-2 rounded ${tab==='security' ? 'bg-white shadow' : 'hover:bg-white'}`}>Security</button>
                </li>
              </ul>
            </nav>

            <section className="col-span-3">
              {tab === 'general' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="text-lg font-semibold mb-3">General</h2>
                  <form onSubmit={handleGeneralSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <input value={general.name} onChange={(e)=>setGeneral(prev=>({...prev,name:e.target.value}))} className="mt-1 block w-full border rounded px-3 py-2" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <input value={general.email} onChange={(e)=>setGeneral(prev=>({...prev,email:e.target.value}))} className="mt-1 block w-full border rounded px-3 py-2" />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>

                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-sm font-medium">Change Superadmin Password</h3>
                    <form onSubmit={handleChangePassword} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="password" placeholder="Current password" value={passwords.current} onChange={(e)=>setPasswords(p=>({...p,current:e.target.value}))} className="px-3 py-2 border rounded" />
                      <input type="password" placeholder="New password" value={passwords.newPass} onChange={(e)=>setPasswords(p=>({...p,newPass:e.target.value}))} className="px-3 py-2 border rounded" />
                      <input type="password" placeholder="Confirm new" value={passwords.confirm} onChange={(e)=>setPasswords(p=>({...p,confirm:e.target.value}))} className="px-3 py-2 border rounded" />
                      <div className="md:col-span-3 flex justify-end">
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? 'Saving...' : 'Change password'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {tab === 'keys' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="text-lg font-semibold mb-3">API Keys</h2>
                  <p className="text-sm text-gray-500 mb-4">Server-side keys are sensitive. Service role key must never be exposed to clients.</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="text-xs text-gray-500">Supabase URL</div>
                        <div className="font-mono text-sm">{mask(keys.SUPABASE_URL)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>copyToClipboard(keys.SUPABASE_URL)} className="px-3 py-1 border rounded text-sm">Copy</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'logs' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="text-lg font-semibold mb-3">Logs</h2>
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Timestamp</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Actor</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Action</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {logs.map(l=> (
                          <tr key={l.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{l.ts}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{l.actor}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{l.action}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{l.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'security' && (
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="text-lg font-semibold mb-3">Security</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500 mt-2">2FA is not configured. This is a placeholder UI for enabling 2FA.</p>
                      <div className="mt-4">
                        <button className="px-3 py-2 bg-indigo-600 text-white rounded">Configure 2FA</button>
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <h3 className="text-sm font-medium">Session Timeout</h3>
                      <p className="text-sm text-gray-500 mt-2">Choose how long sessions remain active before requiring re-login.</p>
                      <div className="mt-3">
                        <select value={sessionTimeout} onChange={(e)=>setSessionTimeout(Number(e.target.value))} className="px-3 py-2 border rounded">
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={240}>4 hours</option>
                        </select>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">Current: {sessionTimeout} minutes</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>{toast.message}</div>
        )}
      </div>
    </div>
  );
}
