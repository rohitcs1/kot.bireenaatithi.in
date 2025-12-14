import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import './Sidebar.css';

const Sidebar = ({ activeItem, onItemClick, isOpen, onClose, collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
    { id: 'tables', label: 'Tables', icon: 'table', path: '/tables' },
    { id: 'menu', label: 'Menu', icon: 'menu', path: '/menu' },
    { id: 'pos', label: 'POS', icon: 'pos', path: '/pos' },
    { id: 'kitchen', label: 'Kitchen', icon: 'kitchen', path: '/kds' },
    { id: 'billing', label: 'Billing', icon: 'billing', path: '/billing' },
    { id: 'reports', label: 'Reports', icon: 'reports', path: '/reports' },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const getIcon = (iconName) => {
    const icons = {
      home: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      table: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      menu: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      pos: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      kitchen: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21v-6m10 6v-6M5 9h14M7 3h10a2 2 0 012 2v4H5V5a2 2 0 012-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13v-4M12 13v-4M15 13v-4" />
        </svg>
      ),
      billing: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
      reports: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      settings: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    };
    return icons[iconName] || icons.home;
  };

  const handleClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      navigate(item.path);
    }
    if (onClose) {
      onClose();
    }
  };

  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user);
  const role = authUser && authUser.role ? String(authUser.role).toLowerCase() : null;
  const handleLogout = () => {
    try {
      dispatch(logout());
    } catch (err) {
      // ignore - fallback to clearing local storage
    }
    localStorage.removeItem('kot-user');
    localStorage.removeItem('kot-token');
    if (onClose) onClose();
    navigate('/login');
  };

  const currentActiveItem = activeItem || (location.pathname.startsWith('/') ? location.pathname.split('/')[1] : '');

  const sidebarContent = (
    <aside className={`sidebar ${isOpen ? '' : 'closed'} ${collapsed ? 'collapsed' : ''} ${role === 'kitchen' ? 'kitchen-dark' : ''}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          {onClose && (
            <div className="sidebar-close-btn">
              <button
                onClick={onClose}
                className="close-btn"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="sidebar-collapse-btn"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter(item => {
              // If user is kitchen, only show the Kitchen item
              if (role === 'kitchen') return item.id === 'kitchen';
              // If user is waiter, show only Tables, POS, Notifications
              if (role === 'waiter') return ['tables', 'pos', 'notifications'].includes(item.id);
              // otherwise show everything
              return true;
            })
            .map((item) => {
              const isActive = currentActiveItem === item.id || location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon">{getIcon(item.icon)}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </button>
              );
            })}
        </nav>
        {/* Mobile-only footer logout placed at the bottom */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-item">
            <svg className="h-5 w-5 logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8" />
            </svg>
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {onClose && isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
      {sidebarContent}
    </>
  );
};

export default Sidebar;
