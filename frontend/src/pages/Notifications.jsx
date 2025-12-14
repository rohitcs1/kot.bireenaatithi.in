import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications (targeted to this user or role)
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (!mounted) return;
        const data = (res.data && res.data.notifications) ? res.data.notifications : [];
        setNotifications(data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000); // Poll every 2 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle serve - mark order as completed and mark notification read
  const handleServeOrder = async (orderId, notifId) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'completed' });
      if (notifId) await api.put(`/notifications/${notifId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Failed to serve order', err);
      alert('Failed to mark order as served');
    }
  };

  // Count of notifications that are tied to orders (ready orders)
  const readyCount = notifications.filter(n => !!n.order_id).length;

  return (
    <div className="notifications-page-container">
      <div className="notifications-main">
        {/* Header */}
        <div className="notifications-page-header">
          <div className="header-left">
            <h1 className="page-title">Ready Orders</h1>
            <p className="page-subtitle">Orders ready for pickup and delivery</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="back-button"
          >
            ← Back
          </button>
        </div>

        {/* Content */}
        {loading && notifications.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-container">
            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="empty-text">No notifications at the moment</p>
          </div>
        ) : (
          <div className="orders-grid">
            {notifications.map((notif) => (
              <div key={notif.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-info">
                    <p className="order-kot">{notif.message}</p>
                    <p className="order-table">Time: <strong>{new Date(notif.created_at).toLocaleTimeString()}</strong></p>
                  </div>
                </div>

                <div style={{marginTop:8}}>
                  {notif.order_id ? (
                    <button
                      onClick={() => handleServeOrder(notif.order_id, notif.id)}
                      className="serve-button"
                    >
                      Serve Order
                    </button>
                  ) : (
                    <button className="serve-button" onClick={() => api.put(`/notifications/${notif.id}/read`).then(()=>setNotifications(prev=>prev.filter(n=>n.id!==notif.id)))}>
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {readyCount > 0 && (
          <div className="notifications-footer">
            <p className="total-count">Total Ready Orders: <strong>{readyCount}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
