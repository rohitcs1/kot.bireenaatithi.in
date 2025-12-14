import React from 'react';
import { Navigate } from 'react-router-dom';

function decodeTokenPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch (e) {
    return null;
  }
}

export default function SuperadminProtectedRoute({ children }) {
  // Read the token from the shared keys used elsewhere in the app
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('kot-token') || localStorage.getItem('token') || sessionStorage.getItem('kot-token') || sessionStorage.getItem('token'))
    : null;
  if (!token) return <Navigate to="/superadmin/login" replace />;
  const payload = decodeTokenPayload(token);
  if (!payload || String(payload.role).toLowerCase() !== 'superadmin') return <Navigate to="/superadmin/login" replace />;
  return children;
}
