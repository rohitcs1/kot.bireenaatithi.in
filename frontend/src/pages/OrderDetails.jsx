import React, { useState, useEffect, useRef } from 'react';
import './OrderDetails.css';

const OrderDetails = ({ orderId, isOpen, onClose }) => {
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [itemToVoid, setItemToVoid] = useState(null);
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Mock order data - TODO: Replace with API call
  // const fetchOrderDetails = async (orderId) => {
  //   const response = await fetch(`/api/orders/${orderId}`);
  //   return response.json();
  // };

  const [order, setOrder] = useState({
    id: 1,
    kotNumber: 'KOT-123456',
    tableNumber: 'T-05',
    waiter: 'John Doe',
    createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    status: 'Active',
    items: [
      {
        id: 1,
        name: 'Chicken Biryani',
        quantity: 2,
        price: 350,
        notes: 'Extra spicy',
        prepStatus: 'Preparing',
        voided: false
      },
      {
        id: 2,
        name: 'Butter Chicken',
        quantity: 1,
        price: 380,
        notes: '',
        prepStatus: 'Ready',
        voided: false
      },
      {
        id: 3,
        name: 'Dal Makhani',
        quantity: 1,
        price: 200,
        notes: 'No onions',
        prepStatus: 'Pending',
        voided: false
      },
      {
        id: 4,
        name: 'Butter Naan',
        quantity: 3,
        price: 50,
        notes: '',
        prepStatus: 'Ready',
        voided: false
      }
    ],
    auditTrail: [
      {
        id: 1,
        action: 'Order Created',
        user: 'John Doe',
        timestamp: new Date(Date.now() - 15 * 60000),
        details: 'Order placed via POS'
      },
      {
        id: 2,
        action: 'Item Status Updated',
        user: 'Kitchen Staff',
        timestamp: new Date(Date.now() - 10 * 60000),
        details: 'Chicken Biryani marked as Preparing'
      },
      {
        id: 3,
        action: 'Item Status Updated',
        user: 'Kitchen Staff',
        timestamp: new Date(Date.now() - 5 * 60000),
        details: 'Butter Chicken marked as Ready'
      }
    ]
  });

  // Calculate totals
  const subtotal = order.items
    .filter(item => !item.voided)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  // Get prep status color
  const getPrepStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Handle Add Item
  const handleAddItem = () => {
    // TODO: Open add item modal or navigate to menu
    alert('Add item functionality - Open menu selector');
  };

  // Handle Mark Item Prepared
  const handleMarkPrepared = (itemId) => {
    // TODO: Replace with actual API call
    // await updateItemStatus(itemId, 'Ready');
    setOrder({
      ...order,
      items: order.items.map(item =>
        item.id === itemId
          ? { ...item, prepStatus: 'Ready' }
          : item
      ),
      auditTrail: [
        ...order.auditTrail,
        {
          id: order.auditTrail.length + 1,
          action: 'Item Status Updated',
          user: 'Current User',
          timestamp: new Date(),
          details: `${order.items.find(i => i.id === itemId)?.name} marked as Ready`
        }
      ]
    });
  };

  // Handle Void Item
  const handleVoidItem = (item) => {
    setItemToVoid(item);
    setShowVoidModal(true);
  };

  const handleConfirmVoid = () => {
    if (!voidReason.trim()) {
      alert('Please provide a reason for voiding this item');
      return;
    }

    // TODO: Replace with actual API call
    // await voidOrderItem(itemToVoid.id, voidReason);
    setOrder({
      ...order,
      items: order.items.map(item =>
        item.id === itemToVoid.id
          ? { ...item, voided: true, voidReason }
          : item
      ),
      auditTrail: [
        ...order.auditTrail,
        {
          id: order.auditTrail.length + 1,
          action: 'Item Voided',
          user: 'Current User',
          timestamp: new Date(),
          details: `${itemToVoid.name} voided - Reason: ${voidReason}`
        }
      ]
    });

    setShowVoidModal(false);
    setVoidReason('');
    setItemToVoid(null);
  };

  // Handle Reprint KOT
  const handleReprintKOT = () => {
    // TODO: Implement print functionality
    window.print();
  };

  // Format date/time
  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time ago
  const getTimeAgo = (date) => {
    const minutes = Math.floor((Date.now() - date) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  // Focus trap and Esc key handling
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstFocusableRef.current = firstElement;
    lastFocusableRef.current = lastElement;

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Handle Tab key
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Handle Esc key
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !showVoidModal) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, showVoidModal, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="order-details-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Modal */}
      <div
        ref={modalRef}
        className="order-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
      >
        <div className="order-details-modal-content">
          {/* Header */}
          <div className="order-details-header">
            <div className="order-details-header-top">
              <div>
                <h2 id="order-details-title" className="order-details-title">
                  Order Details
                </h2>
                <div className="order-details-info-grid">
                  <div className="order-details-info-item">
                    <span className="order-details-info-label">KOT Number</span>
                    <span className="order-details-info-value">{order.kotNumber}</span>
                  </div>
                  <div className="order-details-info-item">
                    <span className="order-details-info-label">Table</span>
                    <span className="order-details-info-value">{order.tableNumber}</span>
                  </div>
                  <div className="order-details-info-item">
                    <span className="order-details-info-label">Waiter</span>
                    <span className="order-details-info-value">{order.waiter}</span>
                  </div>
                  <div className="order-details-info-item">
                    <span className="order-details-info-label">Created</span>
                    <span className="order-details-info-value">
                      {formatDateTime(order.createdAt)} ({getTimeAgo(order.createdAt)})
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="order-details-close-btn"
                aria-label="Close modal"
              >
                <svg className="order-details-close-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="order-details-header-actions">
              <button
                onClick={handleAddItem}
                className="order-details-header-btn order-details-header-btn-add"
              >
                <svg className="order-details-header-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
              <button
                onClick={handleReprintKOT}
                className="order-details-header-btn order-details-header-btn-reprint"
              >
                <svg className="order-details-header-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Reprint KOT
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="order-details-content">
            {/* Order Items */}
            <div className="order-details-items-section">
              <h3 className="order-details-section-title">Order Items</h3>
              <div className="order-details-items-list">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={`order-details-item-card ${item.voided ? 'voided' : ''}`}
                  >
                    <div className="order-details-item-content">
                      <div className="order-details-item-info">
                        <div className="order-details-item-header">
                          <h4 className="order-details-item-name">
                            {item.name}
                            {item.voided && (
                              <span className="order-details-item-voided-badge">VOIDED</span>
                            )}
                          </h4>
                          <span className={`order-details-item-prep-badge ${item.prepStatus.toLowerCase()}`}>
                            {item.prepStatus}
                          </span>
                        </div>
                        <div className="order-details-item-details">
                          <span>
                            <span className="order-details-item-detail-label">Qty:</span>
                            <span className="order-details-item-detail-value"> {item.quantity}</span>
                          </span>
                          <span>
                            <span className="order-details-item-detail-label">₹{item.price}</span>
                            <span className="order-details-item-detail-value"> each</span>
                          </span>
                          <span>
                            <span className="order-details-item-detail-label">Total:</span>
                            <span className="order-details-item-detail-value"> ₹{item.price * item.quantity}</span>
                          </span>
                        </div>
                        {item.notes && (
                          <p className="order-details-item-notes">
                            Note: {item.notes}
                          </p>
                        )}
                        {item.voided && item.voidReason && (
                          <p className="order-details-item-void-reason">
                            <span className="order-details-item-void-reason-label">Void Reason:</span> {item.voidReason}
                          </p>
                        )}
                      </div>
                      <div className="order-details-item-actions">
                        {!item.voided && item.prepStatus !== 'Ready' && (
                          <button
                            onClick={() => handleMarkPrepared(item.id)}
                            className="order-details-item-btn order-details-item-btn-prepared"
                          >
                            Mark Prepared
                          </button>
                        )}
                        {!item.voided && (
                          <button
                            onClick={() => handleVoidItem(item)}
                            className="order-details-item-btn order-details-item-btn-void"
                          >
                            Void Item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-details-summary">
              <h3 className="order-details-section-title">Order Summary</h3>
              <div>
                <div className="order-details-summary-row">
                  <span className="order-details-summary-label">Subtotal</span>
                  <span className="order-details-summary-value">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="order-details-summary-row">
                  <span className="order-details-summary-label">GST (18%)</span>
                  <span className="order-details-summary-value">₹{gst.toFixed(2)}</span>
                </div>
                <div className="order-details-summary-row order-details-summary-total">
                  <span>Total</span>
                  <span className="order-details-summary-total-value">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="order-details-audit-section">
              <h3 className="order-details-section-title">Audit Trail</h3>
              <div className="order-details-audit-list">
                {order.auditTrail.map((entry) => (
                  <div key={entry.id} className="order-details-audit-card">
                    <div className="order-details-audit-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="order-details-audit-content">
                      <div className="order-details-audit-header">
                        <span className="order-details-audit-action">{entry.action}</span>
                        <span className="order-details-audit-time">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="order-details-audit-details">{entry.details}</p>
                      <p className="order-details-audit-user">
                        <span className="order-details-audit-user-label">By:</span> {entry.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="order-details-footer">
            <button
              onClick={onClose}
              className="order-details-footer-btn"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Void Item Modal */}
      {showVoidModal && (
        <>
          <div className="order-details-void-backdrop" onClick={() => setShowVoidModal(false)} />
          <div className="order-details-void-modal">
            <div className="order-details-void-content">
              <h3 className="order-details-void-title">Void Item</h3>
              <p className="order-details-void-text">
                Are you sure you want to void <strong>{itemToVoid?.name}</strong>?
              </p>
              <div className="order-details-void-form-group">
                <label className="order-details-void-label">
                  Reason for voiding <span className="order-details-void-label-required">*</span>
                </label>
                <textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  rows={3}
                  className="order-details-void-textarea"
                  placeholder="Enter reason for voiding this item..."
                  autoFocus
                />
              </div>
              <div className="order-details-void-actions">
                <button
                  onClick={() => {
                    setShowVoidModal(false);
                    setVoidReason('');
                    setItemToVoid(null);
                  }}
                  className="order-details-void-btn order-details-void-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmVoid}
                  className="order-details-void-btn order-details-void-btn-confirm"
                >
                  Confirm Void
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OrderDetails;


