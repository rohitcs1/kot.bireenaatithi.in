import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import api from '../api';
import './Login.css';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mock API call
  // TODO: Replace with actual API call to /api/auth
  // const loginUser = async (email, password, role) => {
  //   const response = await fetch('/api/auth', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ email, password, role }),
  //   });
  //   return response.json();
  // };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      dispatch(loginStart());
      // Call backend auth endpoint
      const payload = { email: formData.email, password: formData.password };
      const response = await api.post('/auth/login', payload);
      const data = response.data || {};
      const token = data.token;
      const user = data.user;
      if (!token || !user) throw new Error('Invalid response from server');

      // Normalize role strings (frontend select uses lowercase)
      const selectedRole = (formData.role || '').toLowerCase();
      const userRole = (user.role || '').toLowerCase();
      if (selectedRole && selectedRole !== userRole) {
        // role mismatch
        dispatch(loginFailure('Role mismatch'));
        setErrors({ submit: `Logged in user role is "${user.role}" — select the correct role.` });
        setLoading(false);
        return;
      }

      // Save token and user to keys used across the app
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('kot-token', token);
        // persist user so session remains until explicit logout
        localStorage.setItem('kot-user', JSON.stringify(user));
      } catch (e) {
        console.warn('Failed to persist login data', e);
      }

      dispatch(loginSuccess(user));

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);

      // Redirect based on role
      const getRoleRedirect = (role) => {
        switch ((role || '').toLowerCase()) {
          case 'admin':
            return '/dashboard';
          case 'waiter':
            return '/pos';
          case 'kitchen':
            return '/kds';
          case 'manager':
            return '/dashboard';
          default:
            return '/dashboard';
        }
      };

      setTimeout(() => navigate(getRoleRedirect(user.role)), 800);

    } catch (error) {
      console.error('Login error:', error);
      dispatch(loginFailure(error.message));
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Forgot password functionality - Redirect to password reset page');
    // In a real app: navigate('/forgot-password')
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/3 -left-1/3 w-2/3 h-2/3 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Toast/Snackbar */}
      {showToast && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center gap-3 sm:gap-4 min-w-[280px] sm:min-w-[320px] max-w-[calc(100vw-2rem)] animate-toast-slide-in border border-white/20 backdrop-blur-sm">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm sm:text-base mb-0.5">Login successful!</p>
            <p className="text-xs sm:text-sm opacity-95 font-medium">Redirecting to dashboard...</p>
          </div>
          <button 
            onClick={() => setShowToast(false)} 
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-all duration-200 hover:rotate-90 active:scale-95"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl sm:rounded-2xl shadow-2xl border-0 p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg mb-2 sm:mb-3 mx-auto animate-float">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1 tracking-tight">
            KOT System
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Login to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 transition-colors duration-200 ${errors.email ? 'text-red-500' : 'text-gray-400 group-focus-within:text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-20 ${
                  errors.email 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-blue-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-2 text-xs sm:text-sm text-red-600 font-medium animate-shake">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 tracking-wide">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 transition-colors duration-200 ${errors.password ? 'text-red-500' : 'text-gray-400 group-focus-within:text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-20 ${
                  errors.password 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-blue-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            {errors.password && (
              <p className="flex items-center gap-2 text-xs sm:text-sm text-red-600 font-medium animate-shake">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>

          {/* Role Dropdown */}
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 tracking-wide">
              Select Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 transition-colors duration-200 ${errors.role ? 'text-red-500' : 'text-gray-400 group-focus-within:text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-sm sm:text-base border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-20 appearance-none cursor-pointer ${
                  errors.role 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-blue-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={loading}
              >
                <option value="">Select a role</option>
                <option value="waiter">Waiter</option>
                <option value="kitchen">Kitchen</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 transition-colors duration-200 ${errors.role ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.role && (
              <p className="flex items-center gap-2 text-xs sm:text-sm text-red-600 font-medium animate-shake">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.role}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer group hover:translate-x-0.5 transition-transform duration-200">
              <div className="relative">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-5 h-5 sm:w-5 sm:h-5 rounded-lg border-2 border-gray-300 bg-white appearance-none cursor-pointer transition-all duration-200 checked:bg-gradient-to-br checked:from-blue-500 checked:to-cyan-600 checked:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none hover:border-blue-400 checked:hover:scale-110"
                  disabled={loading}
                />
                {formData.rememberMe && (
                  <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm sm:text-base font-medium text-gray-700 select-none">Remember me</span>
            </label>
            <a
              href="#"
              onClick={handleForgotPassword}
              className="text-sm sm:text-base font-semibold text-blue-600 hover:text-cyan-600 transition-colors duration-200 relative group"
            >
              Forgot password?
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
            </a>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 animate-shake">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base font-medium">{errors.submit}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 relative overflow-hidden group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="login-footer relative z-10 text-center py-4 text-sm sm:text-base text-white/90 font-medium w-full">
        © 2024 KOT System. All rights reserved.
      </p>
    </div>
  );
};

export default Login;

