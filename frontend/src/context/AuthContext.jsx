import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * AuthContext Provider
 * 
 * Manages user authentication state, login, logout, and role management.
 * Persists user data in localStorage.
 * 
 * @example
 * // Wrap your app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * @example
 * // Use in components
 * const { user, login, logout, isAuthenticated } = useAuth();
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('kot-user');
      const storedToken = localStorage.getItem('kot-token');
      
      // Prefer localStorage (persistent). Fallback to sessionStorage for older sessions.
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      } else {
        const sUser = sessionStorage.getItem('kot-user');
        const sToken = sessionStorage.getItem('kot-token');
        if (sUser && sToken) setUser(JSON.parse(sUser));
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('kot-user');
      localStorage.removeItem('kot-token');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login function
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (Waiter, Kitchen, Admin)
   * @param {boolean} rememberMe - Whether to remember user
   * @returns {Promise<object>} - User data
   */
  const login = async (email, password, role, rememberMe = false) => {
    try {
      // Call backend auth endpoint to obtain a server JWT and user payload
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      if (!data || !data.token) throw new Error('Invalid login response from server');

      const userPayload = data.user;
      const token = data.token;

      setUser(userPayload);

      try {
        if (rememberMe) {
          localStorage.setItem('kot-user', JSON.stringify(userPayload));
          localStorage.setItem('kot-token', token);
        } else {
          sessionStorage.setItem('kot-user', JSON.stringify(userPayload));
          sessionStorage.setItem('kot-token', token);
        }
      } catch (e) {
        console.warn('Failed to persist user to storage', e);
      }

      return userPayload;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Logout function
   * Clears user data from state and storage
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('kot-user');
    localStorage.removeItem('kot-token');
    sessionStorage.removeItem('kot-user');
    sessionStorage.removeItem('kot-token');

    // TODO: Call logout API endpoint
    // fetch('/api/auth/logout', { method: 'POST' });
  };

  /**
   * Update user data
   * @param {object} updates - Partial user data to update
   */
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Update localStorage
    const storedUser = localStorage.getItem('kot-user');
    if (storedUser) {
      localStorage.setItem('kot-user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateUser,
    role: user?.role || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use AuthContext
 * @returns {object} - Auth context value
 * @throws {Error} - If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

