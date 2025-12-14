import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Kitchen.css';

const Kitchen = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [compactMode, setCompactMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Initialize with empty array - will be populated from API
  const [orders, setOrders] = useState([]);

  // Filter orders by station and sort by newest first
  // Only show Pending and Preparing orders - Ready/Completed orders are handled by waiters
  // Note: some orders may not have a `station` assigned yet. Show those pending/preparing orders
  // in the selected station view so kitchen staff can see unassigned orders as well.
  const filteredOrders = orders
    .filter(order => {
      const statusOk = ['Pending', 'Preparing'].includes(order.status);
      if (!statusOk) return false;
      // If no station selected, include all pending/preparing orders
      if (!selectedStation) return true;
      // Show orders that belong to the selected station OR do not have a station assigned yet
      return order.station === selectedStation || !order.station;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  // Calculate time since created
  const getTimeSince = (date) => {
    const minutes = Math.floor((Date.now() - date) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  // Check if order is overdue (more than 15 minutes)
  const isOverdue = (date) => {
    const minutes = Math.floor((Date.now() - date) / 60000);
    return minutes > 15;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Update order status by calling backend API
  const [updatingIds, setUpdatingIds] = useState([]);
  const handleStatusChange = async (orderId, newStatus) => {
    // Prevent duplicate updates
    if (updatingIds.includes(orderId)) return;
    setUpdatingIds(prev => [...prev, orderId]);
    try {
      // send lowercase status to backend (backend expects 'pending','preparing','ready',...)
      const statusPayload = (newStatus || '').toString().toLowerCase();
      await api.put(`/orders/${orderId}/status`, { status: statusPayload });

      // update local UI after successful server update
      setOrders(prev => prev.map(order => (order.id === orderId ? { ...order, status: (newStatus || '') } : order)));
    } catch (err) {
      console.error('Failed to update order status', err);
      // Optionally show an alert
      try { alert('Failed to update order status. Please try again.'); } catch (e) {}
    } finally {
      setUpdatingIds(prev => prev.filter(id => id !== orderId));
    }
  };

  // Get next status
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'Pending': 'Preparing',
      'Preparing': 'Ready',
      'Ready': 'Completed'
    };
    return statusFlow[currentStatus] || 'Pending';
  };

  const bellRef = useRef(null);
  const [flashNewOrder, setFlashNewOrder] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('kitchenSoundEnabled') === 'true'; } catch (e) { return false; }
  });
  const audioCtxRef = useRef(null);

  const createOrResumeAudioContext = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      return true;
    } catch (e) {
      console.warn('AudioContext creation/resume failed', e);
      return false;
    }
  };

  const playBell = async () => {
    if (!soundEnabled) return;
    try {
      // ensure there is an AudioContext and it's resumed (must be unlocked by user gesture)
      const ok = await createOrResumeAudioContext();
      if (!ok) return;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();

      o1.type = 'sine';
      o2.type = 'triangle';

      o1.frequency.setValueAtTime(1500, now);
      o2.frequency.setValueAtTime(900, now);

      g1.gain.setValueAtTime(0.0001, now);
      g1.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      g1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      g2.gain.setValueAtTime(0.0001, now);
      g2.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      o1.connect(g1); g1.connect(ctx.destination);
      o2.connect(g2); g2.connect(ctx.destination);

      o1.frequency.exponentialRampToValueAtTime(400, now + 1.2);
      o2.frequency.exponentialRampToValueAtTime(300, now + 1.2);

      o1.start(now); o2.start(now);
      // stop oscillators after sound finishes; do not close context so it stays unlocked
      setTimeout(() => { try { o1.stop(); o2.stop(); } catch(e){} }, 1400);
    } catch (e) {
      // fallback: try a short HTMLAudio beep
      try {
        const a = new Audio();
        const ctx = document.createElement('audio');
        // cannot easily synthesize; try short base64-encoded beep if available
        a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YRAAAAAA';
        a.play().catch(() => {});
      } catch (ee) {
        // ignore
      }
    }
  };

  const handleEnableSound = async () => {
    const ok = await createOrResumeAudioContext();
    if (ok) {
      setSoundEnabled(true);
      try { localStorage.setItem('kitchenSoundEnabled', 'true'); } catch (e) {}
      // small test sound to confirm
      playBell();
    } else {
      setSoundEnabled(false);
      try { localStorage.setItem('kitchenSoundEnabled', 'false'); } catch (e) {}
    }
  };
  
  // Attempt to resume/create AudioContext automatically when preference says sound is enabled.
  // Note: many browsers still require a user gesture to fully unlock audio; this will
  // resume when possible so subsequent automatic play on new orders works.
  useEffect(() => {
    if (soundEnabled) {
      createOrResumeAudioContext().catch(() => {});
    }
    return () => {
      // do not close AudioContext here; keep it to avoid needing gesture again
    };
  }, [soundEnabled]);
  
  // Fetch kitchen stations (user-configured) and set selected station
  useEffect(() => {
    let mounted = true;
    const fetchStations = async () => {
      try {
        const res = await api.get('/stations');
        if (!mounted) return;
        const data = Array.isArray(res.data?.stations) ? res.data.stations : [];
        const list = data.filter(s => s && s.enabled !== false).map(s => s.name).filter(Boolean);
        setStations(list);
        if (!selectedStation && list.length > 0) setSelectedStation(list[0]);
      } catch (err) {
        console.warn('Failed to fetch kitchen stations', err);
        setStations([]);
      }
    };

    fetchStations();
    return () => { mounted = false; };
  }, []);
  const authUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) return;
    // Allow kitchen, admin, and manager to access KDS. Redirect waiters to POS, others to dashboard.
    if (authUser.role) {
      const r = String(authUser.role).toLowerCase();
      if (r === 'waiter') navigate('/pos');
      else if (!['kitchen', 'admin', 'manager'].includes(r)) navigate('/dashboard');
    }
  }, [authUser, navigate]);

  // Auto-refresh orders with real API polling and bell sound on new orders
  useEffect(() => {
    let mounted = true;
    const prevOrderIdsRef = { current: new Set() };

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        if (!mounted) return;
        const raw = (res.data && res.data.orders) ? res.data.orders : [];

        // map backend fields into UI-friendly shape
        const fetched = raw.map(o => {
          // Get table number - backend now includes table_number directly
          let tableNumber = 'N/A';
          if (o.table_number) {
            tableNumber = `T-${o.table_number}`;
          } else if (o.tables && o.tables.table_number) {
            tableNumber = `T-${o.tables.table_number}`;
          } else if (o.table_id) {
            // Fallback to table_id if table_number not available
            tableNumber = `T-${o.table_id}`;
          }

          // Map items - backend now returns items array
          const items = (o.items || []).map(item => ({
            name: item.name || 'Unknown Item',
            quantity: item.quantity || item.qty || 1,
            notes: item.notes || ''
          }));

          return {
            id: o.id,
            kotNumber: o.kot_number || `KOT-${o.id}`,
            tableNumber: tableNumber,
          station: o.station || o.kitchen_station || '',
            status: (o.status || 'pending').toString().charAt(0).toUpperCase() + (o.status || 'pending').toString().slice(1),
            createdAt: o.created_at ? new Date(o.created_at) : new Date(),
            items: items
          };
        });

        // detect new orders compared to previous fetch
        const prevIds = prevOrderIdsRef.current;
        const fetchedIds = new Set(fetched.map(o => o.id));
        const newOnes = fetched.filter(o => !prevIds.has(o.id));
        if (newOnes.length > 0) {
          // attempt to play bell for new orders (will only actually play if user previously
          // enabled sound / unlocked AudioContext due to browser autoplay policies)
          playBell();
          setFlashNewOrder(true);
          setTimeout(() => setFlashNewOrder(false), 1200);
        }

        // update state and previous ids
        setOrders(fetched);
        prevOrderIdsRef.current = fetchedIds;
      } catch (err) {
        console.warn('Failed to fetch kitchen orders', err);
      }
    };

    // initial fetch
    fetchOrders();

    const interval = setInterval(() => {
      // Always fetch orders to detect new ones even if the tab is in background.
      fetchOrders();
    }, 5000);

    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="kitchen-page">
      {/* Header */}
      <div className="kitchen-header">
        <div className="kitchen-header-content">
          <div className="kitchen-sound-controls">
            <button
              title="New order alert"
              className={`new-order-bell ${flashNewOrder ? 'ring' : ''}`}
              onClick={() => {
                // If sound not enabled yet, try to enable (user gesture). Otherwise play test bell.
                if (!soundEnabled) handleEnableSound();
                else { playBell(); setFlashNewOrder(false); }
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            <button
              onClick={handleEnableSound}
              className={`kitchen-sound-toggle ${soundEnabled ? 'enabled' : ''}`}
              title={soundEnabled ? 'Sound enabled' : 'Enable sound for new orders'}
            >
              {soundEnabled ? 'Sound: On' : 'Enable Sound'}
            </button>
          </div>
          <div>
            <h1 className="kitchen-header-title">Kitchen Display System</h1>
            <p className="kitchen-header-subtitle">Real-time order management</p>
          </div>

          {/* Controls */}
          <div className="kitchen-header-controls">
            {/* View Mode Toggle */}
            <div className="kitchen-view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`kitchen-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                <svg className="kitchen-view-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`kitchen-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <svg className="kitchen-view-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Compact Mode Toggle */}
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`kitchen-compact-toggle ${compactMode ? 'active' : ''}`}
            >
              <svg className="kitchen-compact-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Station Tabs */}
      <div className="kitchen-station-tabs">
        <div className="kitchen-station-tabs-container">
          {!soundEnabled && (
            <div className="kitchen-sound-banner">
              <strong>Enable sound:</strong> Click "Enable Sound" in the header to hear new-order alerts automatically.
            </div>
          )}
          {stations.length === 0 ? (
            <div style={{ padding: '0.75rem 1rem', color: '#9ca3af' }}>
              No kitchen stations configured. Add stations in Settings → Kitchen Stations.
            </div>
          ) : (
            stations.map((station) => (
            <button
              key={station}
              onClick={() => setSelectedStation(station)}
              className={`kitchen-station-tab ${selectedStation === station ? 'active' : ''}`}
            >
              {station}
              <span className="kitchen-station-badge">
                {orders.filter(o => o.station === station && o.status !== 'Completed').length}
              </span>
            </button>
            ))
          )}
        </div>
      </div>

      {/* Orders Display */}
      <div className="kitchen-orders-container">
        {viewMode === 'grid' ? (
          <div className={`kitchen-orders-grid ${compactMode ? 'compact' : ''}`}>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`kitchen-order-card ${compactMode ? 'compact' : ''} ${isOverdue(order.createdAt) ? 'overdue' : ''}`}
              >
                {/* Order Header */}
                <div className="kitchen-order-header">
                  <div className="kitchen-order-info">
                    <div className={`kitchen-order-kot ${compactMode ? 'compact' : ''}`}>
                      <h3 className="kitchen-order-kot-number">{order.kotNumber}</h3>
                      {isOverdue(order.createdAt) && (
                        <span className="kitchen-order-overdue-badge">OVERDUE</span>
                      )}
                    </div>
                    <p className="kitchen-order-table">Table {order.tableNumber}</p>
                  </div>
                  <span className={`kitchen-order-status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                {/* Time */}
                <div className={`kitchen-order-timer ${isOverdue(order.createdAt) ? 'overdue' : ''}`}>
                  <svg className="kitchen-order-timer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="kitchen-order-timer-text">{getTimeSince(order.createdAt)}</span>
                </div>

                {/* Items List */}
                <div className={`kitchen-order-items ${compactMode ? 'compact' : ''}`}>
                  {order.items.map((item, idx) => (
                    <div key={idx} className={`kitchen-order-item ${compactMode ? 'compact' : ''}`}>
                      <div className="kitchen-order-item-header">
                        <span className="kitchen-order-item-name">{item.name}</span>
                        <span className="kitchen-order-item-quantity">{item.quantity}x</span>
                      </div>
                      {item.notes && (
                        <p className="kitchen-order-item-notes">Note: {item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className={`kitchen-order-actions ${compactMode ? 'compact' : ''}`}>
                  {order.status === 'Pending' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'Preparing')}
                      className={`kitchen-action-btn accept ${compactMode ? 'compact' : ''}`}
                      disabled={updatingIds.includes(order.id)}
                    >
                      {updatingIds.includes(order.id) ? 'Updating...' : 'Accept'}
                    </button>
                  )}
                  {order.status === 'Preparing' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'Ready')}
                      className={`kitchen-action-btn ready ${compactMode ? 'compact' : ''}`}
                      disabled={updatingIds.includes(order.id)}
                    >
                      {updatingIds.includes(order.id) ? 'Updating...' : 'Make Ready'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`kitchen-orders-list ${compactMode ? 'compact' : ''}`}>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`kitchen-order-list-item ${isOverdue(order.createdAt) ? 'overdue' : ''}`}
              >
                <div className="kitchen-order-list-content">
                  {/* Left: Order Info */}
                  <div className="kitchen-order-list-info">
                    <div className="kitchen-order-list-header">
                      <h3 className="kitchen-order-list-kot">{order.kotNumber}</h3>
                      <span className="kitchen-order-list-table">Table {order.tableNumber}</span>
                      {isOverdue(order.createdAt) && (
                        <span className="kitchen-order-overdue-badge">OVERDUE</span>
                      )}
                      <span className={`kitchen-order-status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className={`kitchen-order-timer ${isOverdue(order.createdAt) ? 'overdue' : ''}`}>
                      <svg className="kitchen-order-timer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="kitchen-order-timer-text">{getTimeSince(order.createdAt)}</span>
                    </div>
                    <div className="kitchen-order-list-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="kitchen-order-list-item-badge">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          {item.notes && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              ({item.notes})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="kitchen-order-list-actions">
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Preparing')}
                        className="kitchen-action-btn accept"
                        disabled={updatingIds.includes(order.id)}
                      >
                        {updatingIds.includes(order.id) ? 'Updating...' : 'Accept'}
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Ready')}
                        className="kitchen-action-btn ready"
                        disabled={updatingIds.includes(order.id)}
                      >
                        {updatingIds.includes(order.id) ? 'Updating...' : 'Make As Ready'}
                      </button>
                    )}
                    {order.status === 'Ready' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Completed')}
                        className="kitchen-action-btn completed"
                      >
                        Complete
                      </button>
                    )}
                    {order.status !== 'Pending' && order.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(order.id, getNextStatus(order.status))}
                        className="kitchen-action-btn next"
                      >
                        Next: {getNextStatus(order.status)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="kitchen-empty-state">
            <svg className="kitchen-empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="kitchen-empty-state-title">No orders for {selectedStation} station</h3>
            <p className="kitchen-empty-state-text">New orders will appear here automatically</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Kitchen;


