import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SuperadminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setLoading(true);
    try {
      // Backend login route is mounted under /api/auth
      // `api` baseURL already includes `/api`, so avoid duplicating it here.
      const res = await api.post('/auth/superadmin/login', { email, password });
      if (res.data && res.data.token) {
        // store token under the shared key used across the app
        localStorage.setItem('kot-token', res.data.token);
        // also save user payload if provided
        if (res.data.user) localStorage.setItem('kot-user', JSON.stringify(res.data.user));
        // debug: log successful login and stored keys in browser console
        console.log('[auth] superadmin login successful, stored kot-token and kot-user');
        navigate('/superadmin/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img className="mx-auto h-12 w-auto" src="/logo192.png" alt="Logo" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Superadmin Sign in</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Enter your superadmin credentials to access the system.</p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow" onSubmit={handleSubmit} noValidate>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="you@company.com"
                disabled={loading}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: '' })); }}
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Password"
                disabled={loading}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              ) : ('Sign in')}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">Superadmin Access Only</div>
        </form>

        {/* Footer small note */}
        <p className="text-center text-xs text-gray-400">© {new Date().getFullYear()} SaaS Restaurant Platform</p>

        {/* Error */}
        {error && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-md shadow-lg bg-red-500 text-white" role="alert">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">{error}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
