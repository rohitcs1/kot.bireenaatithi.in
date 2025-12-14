import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Create Notification Context
const NotificationContext = createContext(null);

/**
 * NotificationContext Provider
 * 
 * Manages application-wide notifications.
 * Provides methods to add, mark as read, and clear notifications.
 * 
 * @example
 * // Wrap your app with NotificationProvider
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 * 
 * @example
 * // Use in components
 * const { notifications, addNotification, markRead, clearAll } = useNotifications();
 * 
 * // Add notification
 * addNotification({
 *   type: 'Order Ready',
 *   title: 'Order Ready',
 *   message: 'KOT-001 is ready for pickup'
 * });
 */
export const NotificationProvider = ({ children }) => {
  // Mock default notifications
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'Order Ready',
      title: 'Order Ready for Pickup',
      message: 'KOT-123456 for Table T-05 is ready',
      timestamp: new Date(Date.now() - 2 * 60000),
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'Printer Error',
      title: 'Printer Connection Lost',
      message: 'Kitchen Printer 1 is disconnected',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: false,
      priority: 'high'
    }
  ]);

  /**
   * Add notification
   * @param {object} notification - Notification object
   * @param {string} notification.type - Notification type (Order Ready, Printer Error, Low Stock, etc.)
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {string} notification.priority - Priority level (high, medium, low)
   * @returns {string} - Notification ID
   */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      message: notification.message || '',
      timestamp: notification.timestamp || new Date(),
      read: false,
      priority: notification.priority || 'medium',
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // TODO: Persist to backend if needed
    // fetch('/api/notifications', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newNotification),
    // });

    // Auto-remove after 5 seconds for low priority notifications
    if (newNotification.priority === 'low') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }

    return newNotification.id;
  }, []);

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   */
  const markRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );

    // TODO: Update in backend
    // fetch(`/api/notifications/${id}/read`, {
    //   method: 'PUT',
    // });
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );

    // TODO: Update in backend
    // fetch('/api/notifications/read-all', {
    //   method: 'PUT',
    // });
  }, []);

  /**
   * Remove notification
   * @param {string} id - Notification ID
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));

    // TODO: Delete from backend
    // fetch(`/api/notifications/${id}`, {
    //   method: 'DELETE',
    // });
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);

    // TODO: Clear in backend
    // fetch('/api/notifications/clear', {
    //   method: 'DELETE',
    // });
  }, []);

  /**
   * Clear all read notifications
   */
  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(notif => !notif.read));
  }, []);

  // Calculated values
  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(notif => !notif.read);
  }, [notifications]);

  const value = {
    // State
    notifications,
    
    // Actions
    addNotification,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
    clearRead,
    
    // Calculated values
    unreadCount,
    unreadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to use NotificationContext
 * @returns {object} - Notification context value
 * @throws {Error} - If used outside NotificationProvider
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;

