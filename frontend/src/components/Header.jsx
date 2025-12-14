import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import api from '../api';
import './Header.css';
import { APP_NAME } from '../utils/constants';

const Header = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const notifications = useSelector((state) => state.orders.orders) || [];
  const role = user && user.role ? String(user.role).toLowerCase() : null;
  const [readyOrdersCount, setReadyOrdersCount] = useState(0);

  // Fetch ready orders count only (for badge)
  useEffect(() => {
    if (role !== 'waiter' && role !== 'manager' && role !== 'admin') return;
    
    let mounted = true;
    const fetchReadyOrdersCount = async () => {
      try {
        const res = await api.get('/orders?status=ready');
        if (!mounted) return;
        const ready = (res.data && res.data.orders) ? res.data.orders : [];
        setReadyOrdersCount(ready.length);
      } catch (err) {
        console.warn('Failed to fetch ready orders', err);
      }
    };
    
    fetchReadyOrdersCount();
    const interval = setInterval(fetchReadyOrdersCount, 3000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [role]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('kot-user');
    localStorage.removeItem('kot-token');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className={`header-nav ${role === 'kitchen' ? 'kitchen-dark' : ''}`}>
      <div className="header-container">
        <div className="header-content">
            <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="header-logo">{user?.hotel_name || APP_NAME}</h1>
          </div>

          <div className="header-actions">
            {(role === 'waiter' || role === 'manager' || role === 'admin') && (
              <button
                onClick={() => navigate('/notifications')}
                className="header-btn"
                style={{ position: 'relative' }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {readyOrdersCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>{readyOrdersCount}</span>
                )}
              </button>
            )}
            {role !== 'kitchen' && role !== 'waiter' && (
              <>
                <button
                  onClick={() => navigate('/settings')}
                  className="header-btn"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </>
            )}

            <div className="header-user">
              <div className="user-avatar">
                {(user?.name || user?.owner_name || 'U').charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <p className="user-name">{user?.name || user?.owner_name || 'User'}</p>
                <p className="user-role">{user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Role'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;

