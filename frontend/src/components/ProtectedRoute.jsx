import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from './Loader';

/**
 * ProtectedRoute Component
 * Protects routes that require authentication using Redux auth state
 * Also ensures kitchen users only access the KDS route.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = (user && user.role) ? String(user.role).toLowerCase() : null;
  const path = location.pathname || '';

  // If the logged-in user is a waiter, only allow access to tables/pos/notifications routes
  if (role === 'waiter' && !path.match(/^\/(tables|pos|notifications)/)) {
    return <Navigate to="/pos" replace />;
  }

  // If the logged-in user is a kitchen role, only allow access to the KDS route
  if (role === 'kitchen' && !path.startsWith('/kds')) {
    return <Navigate to="/kds" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

