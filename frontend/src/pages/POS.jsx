import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './POS.css';

const POS = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [kotNumber, setKOTNumber] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posTables, setPosTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Fetch categories and menu items from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, itemsRes, tablesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/menu'),
          api.get('/tables')
        ]);
        const cats = catsRes.data.categories || [];
        setCategories([{ id: 'all', name: 'All' }, ...cats.map(c => ({ id: c.id, name: c.name }))]);
        const items = itemsRes.data.menu || [];
        setMenuItems(items);

        const remoteTables = tablesRes.data.tables || [];
        const mapped = remoteTables.map(t => {
          const rawStatus = (t.status || t.table_status || 'available').toString();
          const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
          return {
            id: t.id,
            label: `T-${t.table_number}`,
            number: t.table_number,
            seats: t.seats,
            status
          };
        });
        setPosTables(mapped);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter menu items by availability, category and optional search term (name/description/tags)
  let filteredMenuItems = menuItems.filter(item => item.available);
  if (selectedCategory !== 'all') {
    filteredMenuItems = filteredMenuItems.filter(item => String(item.category_id) === String(selectedCategory));
  }
  const menuSearchLower = (menuSearch || '').trim().toLowerCase();
  if (menuSearchLower) {
    filteredMenuItems = filteredMenuItems.filter(item => {
      const name = (item.name || '').toString().toLowerCase();
      const desc = (item.description || '').toString().toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : (item.tags || '').toString().toLowerCase();
      return name.includes(menuSearchLower) || desc.includes(menuSearchLower) || tags.includes(menuSearchLower);
    });
  }

  const filteredTables = posTables
    .map(t => t.label)
    .filter(table => table.toLowerCase().includes(tableSearch.toLowerCase()));

  // Generate KOT number
  const generateKOTNumber = () => {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    return `KOT-${timestamp}`;
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.18; // 18% GST
  const discountAmount = discount;
  const total = subtotal + gst - discountAmount;

  // Add item to order
  const handleAddItem = (item) => {
    const existingItem = orderItems.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setOrderItems(orderItems.map(orderItem =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setOrderItems([...orderItems, {
        ...item,
        quantity: 1,
        notes: ''
      }]);
    }
  };

  // Update quantity
  const handleQuantityChange = (itemId, change) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return null;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  // Update item notes
  const handleNotesChange = (itemId, notes) => {
    setOrderItems(orderItems.map(item =>
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  // Remove item
  const handleRemoveItem = (itemId) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  // Save KOT
  const handleSaveKOT = () => {
    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    (async () => {
      try {
        // find selected table id from posTables
        const sel = posTables.find(t => t.label === selectedTable);
        if (!sel) {
          alert('Selected table not found. Please re-select the table.');
          return;
        }

        // Map orderItems -> items expected by backend
        const itemsPayload = orderItems.map(it => ({
          menu_id: it.id,
          qty: it.quantity || 1,
          price: it.price || 0,
          notes: it.notes || null
        }));

        const payload = { table_id: sel.id, items: itemsPayload, waiter_id: user?.id || null };
        const res = await api.post('/orders', payload);
        const created = res.data.order;

        // clear cart and show success popup (no KOT preview card)
        setOrderItems([]);
        setDiscount(0);
        setShowOrderSuccess(true);
      } catch (err) {
        console.error('Error saving order', err);
        alert(err.response?.data?.error || 'Error saving order');
      }
    })();
  };

  // Clear order
  const handleClearOrder = () => {
    if (window.confirm('Are you sure you want to clear the order?')) {
      setOrderItems([]);
      setDiscount(0);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('table-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="pos-page" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div className="pos-header">
        <div className="pos-header-content">
          <div>
            <h1 className="pos-header-title">POS - Order Taking</h1>
            <p className="pos-header-subtitle">Quick order entry system</p>
          </div>
          
          {/* Table Selector */}
          <div className="pos-header-controls">
            <div className="table-selector-wrapper">
              <input
                id="table-search"
                type="text"
                placeholder="Search table (Press '/' to focus)"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="table-selector-input"
              />
              <svg className="table-selector-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="table-dropdown"
            >
              <option value="">Select Table</option>
              {filteredTables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
            {selectedTable && (
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                {selectedTable}
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="keyboard-hint">
          <kbd>/</kbd>
          <span>Search table</span>
        </div>
      </div>

      <div className="pos-layout">
        {/* Left Side - Categories & Menu */}
        <div className="pos-main">
          {/* Table Selector Card */}
          <div className="table-selector-card">
            <label className="table-selector-label">Select Table</label>
            <div className="table-grid">
              {filteredTables.map(table => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`table-btn ${selectedTable === table ? 'active' : ''}`}
                >
                  {table}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Section */}
          <div className="menu-section">
            {/* Categories */}
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`category-tab ${selectedCategory === String(cat.id) ? 'active' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="menu-items-grid">
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="menu-item-btn"
                >
                  {/* Item Image */}
                  <div className="menu-item-image-container">
                    {(item.image_url || item.imageUrl) ? (
                      <img src={item.image_url || item.imageUrl} alt={item.name} className="menu-item-image" />
                    ) : (
                      <div className="menu-item-placeholder">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="item-name">{item.name}</p>
                  <p className="item-price">₹{item.price}</p>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">Loading menu items...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredMenuItems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items available</h3>
                <p className="mt-1 text-sm text-gray-500">Try selecting a different category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Order Cart */}
        <div className="cart-section">
          <h2 className="cart-header">Order Cart</h2>

          {/* Order Items */}
          {orderItems.length === 0 ? (
            <div className="empty-cart">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3>Cart is empty</h3>
              <p>Add items from the menu to get started</p>
            </div>
          ) : (
            <div className="cart-items">
              {orderItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <p className="item-name-cart">{item.name}</p>
                    <p className="item-price-cart">₹{item.price} each</p>
                    
                    {/* Quantity Controls */}
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="qty-btn"
                        title="Decrease Quantity"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="qty-btn"
                        title="Increase Quantity"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Item Notes */}
                    <input
                      type="text"
                      placeholder="Add notes..."
                      value={item.notes}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      className="item-notes-input"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="remove-item-btn"
                    title="Remove Item"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Order Summary */}
          {orderItems.length > 0 && (
            <div className="cart-summary">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">GST (18%):</span>
                <span className="summary-value">₹{gst.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Discount:</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal + gst}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="discount-input"
                  placeholder="0"
                />
              </div>
              <div className="summary-row total">
                <span className="summary-label">Total:</span>
                <span className="summary-value">₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Save KOT Button */}
          {orderItems.length > 0 && (
            <button
              onClick={handleSaveKOT}
              disabled={!selectedTable}
              className="save-kot-btn"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Save KOT
            </button>
          )}

          {/* Keyboard Shortcut Hint */}
          {orderItems.length > 0 && (
            <div className="keyboard-hint">
              <span className="font-semibold">Shortcut:</span>
              <kbd>S</kbd>
              <span>to Save KOT</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Success Message */}
      {showOrderSuccess && (
        <div className="success-message-overlay" onClick={() => setShowOrderSuccess(false)}>
          <div className="success-message-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="success-title">Order Submitted Successfully!</h3>
            <p className="success-text">Your KOT has been saved.</p>
              <button
                onClick={() => {
                  setShowOrderSuccess(false);
                  setSelectedTable('');
                }}
              className="success-ok-btn"
              >
                OK
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;


