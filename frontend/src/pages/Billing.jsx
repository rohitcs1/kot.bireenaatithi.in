// src/pages/BillingDashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import api from '../api';
import "./Billing.css";
import Confetti from '../components/Confetti';
import BillPrint from '../components/BillPrint';

const INITIAL_ORDERS = [];

export default function BillingDashboard() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState("TABLE"); // TABLE | ROOM | TAKEAWAY
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [billDiscountMode, setBillDiscountMode] = useState('PERCENT'); // 'PERCENT' | 'FLAT'
  const [billDiscountValue, setBillDiscountValue] = useState(0); // value used according to mode
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [showConfetti, setShowConfetti] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printPayload, setPrintPayload] = useState(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = o.type === activeTab;
      const text = search.toLowerCase();
      const matchesSearch =
        o.label.toLowerCase().includes(text) ||
        o.id.toLowerCase().includes(text) ||
        o.customer.toLowerCase().includes(text);
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, search]);

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) || (orders.length > 0 ? orders[0] : null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await api.get('/bills');
        const bills = res.data?.bills || [];

        // Map to the UI-friendly orders shape
        const mapped = bills.map(({ bill, order, waiter }) => {
          const type = order?.order_type || 'TABLE';
          const tableLabel = order?.tables?.table_number ? `Table #${order.tables.table_number}` : (order?.table_id ? `Table #${order.table_id}` : 'Unknown');
          const customer = type === 'ROOM' ? `Room ${order.table_id}` : (type === 'TAKEAWAY' ? 'Takeaway' : tableLabel);

          const items = (order?.order_items || []).map((it, idx) => ({
            id: it.id || idx,
            name: it.menus?.name || 'Item',
            qty: it.qty || it.quantity || 1,
            price: parseFloat(it.price || it.menus?.price || 0),
            itemDiscount: 0,
            itemDiscountMode: 'PERCENT'
          }));

          return {
            id: order?.kot_number || `KOT-${order?.id}`,
            rawOrderId: order?.id,
            billId: bill?.id,
            type: type.toUpperCase(),
            label: tableLabel,
            customer: customer,
            status: 'Order Delivered',
            gstRate: 0.05,
            serviceRate: 0.0,
            // include authoritative totals if available
            subtotal: bill?.subtotal || order?.subtotal || items.reduce((s,i)=>s+(i.price*i.qty),0),
            gst: bill?.gst || order?.gst || 0,
            service_charge: bill?.service_charge || order?.service_charge || 0,
            total: bill?.grand_total || order?.total || 0,
            rawBill: bill || null,
            rawOrder: order || null,
            items
          };
        });

        setOrders(mapped);
        if (mapped.length > 0) setSelectedOrderId(mapped[0].id);
        else setSelectedOrderId(null);
      } catch (err) {
        console.error('Failed to fetch bills for billing dashboard', err);
      }
    };

    fetchBills();
  }, []);

  // --- calculations ---
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let afterItemDiscount = 0;

  if (selectedOrder) {
    // Always compute totals from items so discounts in UI apply correctly,
    // even when the bill was created server-side. We still display server
    // totals elsewhere, but calculations reflect current item discounts.
    selectedOrder.items.forEach((item) => {
      const line = Number(item.qty || 0) * Number(item.price || 0);
      const mode = item.itemDiscountMode || 'PERCENT';
      const discVal = Number(item.itemDiscount) || 0;
      let itemDisc = 0;
      if (mode === 'PERCENT') {
        itemDisc = (line * discVal) / 100;
      } else {
        itemDisc = discVal;
      }
      if (itemDisc > line) itemDisc = line;
      const lineTotal = line - itemDisc;
      subtotal += line;
      itemDiscountTotal += itemDisc;
      afterItemDiscount += lineTotal;
    });
  }

  // Total bill discount: single mode (percent OR flat) + value
  let billDiscountAmount = 0;
  const billVal = Number(billDiscountValue) || 0;
  if (billDiscountMode === 'PERCENT') {
    billDiscountAmount = (afterItemDiscount * billVal) / 100;
  } else {
    billDiscountAmount = billVal;
  }
  if (billDiscountAmount > afterItemDiscount) {
    billDiscountAmount = afterItemDiscount;
  }

  const taxable = Math.max(afterItemDiscount - billDiscountAmount, 0);
  // prefer stored bill totals where available
  const gst = selectedOrder ? (selectedOrder.rawBill?.gst || selectedOrder.rawOrder?.gst || taxable * (selectedOrder.gstRate || 0)) : 0;
  const service = selectedOrder ? (selectedOrder.rawBill?.service_charge || selectedOrder.rawOrder?.service_charge || taxable * (selectedOrder.serviceRate || 0)) : 0;
  const grandTotal = selectedOrder ? (selectedOrder.total || taxable + gst + service) : taxable + gst + service;

  // label for UI showing which discount is applied on total (single mode)
  const discountLabel = billDiscountMode === 'PERCENT'
    ? `${Number(billDiscountValue) || 0}%`
    : billDiscountMode === 'FLAT'
      ? `₹${Number(billDiscountValue) || 0}`
      : '';

  // --- handlers ---
  const updateItemDiscount = (orderId, itemId, value, mode) => {
    const newOrders = orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        items: o.items.map((it) =>
          it.id === itemId
            ? { ...it, itemDiscount: value, itemDiscountMode: mode || it.itemDiscountMode }
            : it
        ),
      };
    });
    setOrders(newOrders);
  };

  // Initialize discount controls when selected order changes (use server bill defaults if present)
  useEffect(() => {
    if (!selectedOrder) return;
    const serverBill = selectedOrder.rawBill;
    if (serverBill) {
      const mode = (serverBill.discount_mode || 'FLAT').toUpperCase();
      setBillDiscountMode(mode === 'PERCENT' ? 'PERCENT' : 'FLAT');
      setBillDiscountValue(Number(serverBill.total_discount || 0));
    } else {
      setBillDiscountMode('PERCENT');
      setBillDiscountValue(0);
    }
  }, [selectedOrder?.billId, selectedOrder?.rawBill]);

  const handleConfirmPayment = async () => {
    if (!selectedOrder || !selectedOrder.billId) {
      alert('No bill selected');
      return;
    }
    // Show confetti and open print preview
    setShowConfetti(true);
    try {
      const resp = await api.get(`/bills/${selectedOrder.billId}`);
      const serverBill = resp.data?.bill || selectedOrder.rawBill || null;
      const serverOrder = resp.data?.order || selectedOrder.rawOrder || null;
      const serverWaiter = resp.data?.waiter || null;
      const serverHotel = resp.data?.hotel || null;
      const items = (serverOrder?.order_items || selectedOrder.items || []).map(it => ({
        name: it.menus?.name || it.name || 'Item',
        qty: it.qty || it.quantity || 1,
        price: parseFloat(it.price || it.menus?.price || 0) || 0,
        notes: it.notes || ''
      }));
      setPrintPayload({ hotel: serverHotel, bill: serverBill, orderItems: items, waiter: serverWaiter });
      setPrintOpen(true);
    } catch (err) {
      console.error('Failed to fetch bill for printing', err);
      alert('Failed to fetch bill details for printing');
    }
  };

  const handlePrint = async () => {
    // Open modal and fetch authoritative bill details for printing
    if (!selectedOrder) return alert('Select an order first');
    if (!selectedOrder.billId) return alert('No billId available for this order');
    try {
      const resp = await api.get(`/bills/${selectedOrder.billId}`);
      const serverBill = resp.data?.bill || selectedOrder.rawBill || null;
      const serverOrder = resp.data?.order || selectedOrder.rawOrder || null;
      const serverWaiter = resp.data?.waiter || null;
      const serverHotel = resp.data?.hotel || null;
      const items = (serverOrder?.order_items || selectedOrder.items || []).map(it => ({
        name: it.menus?.name || it.name || 'Item',
        qty: it.qty || it.quantity || 1,
        price: parseFloat(it.price || it.menus?.price || 0) || 0,
        notes: it.notes || ''
      }));
      setPrintPayload({ hotel: serverHotel, bill: serverBill, orderItems: items, waiter: serverWaiter });
      setPrintOpen(true);
    } catch (err) {
      console.error('Failed to fetch bill for printing', err);
      alert('Failed to fetch bill details for printing');
    }
  };

  return (
    <div className="billing-page">
      {/* Header */}
      <header className="billing-header">
        <div>
          <h1 className="billing-title">Billing Dashboard</h1>
          <p className="billing-subtitle">
            Create bills for tables, rooms and takeaway customers.
          </p>
        </div>
        <div className="billing-header-right">
          <div className="billing-search">
            <span className="billing-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by Table, Room, Invoice, Customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn primary"
            onClick={() => alert("New bill flow (front-end only demo)")}
          >
            ＋ New Bill
          </button>
        </div>
      </header>

      <main className="billing-main">
        {/* LEFT PANEL */}
        <section className="panel orders-panel">
          <div className="panel-header">
            <h2>Orders Ready for Billing</h2>
          </div>

          <div className="tabs">
            <button
              className={activeTab === "TABLE" ? "tab active" : "tab"}
              onClick={() => setActiveTab("TABLE")}
            >
              Tables
            </button>
            <button
              className={activeTab === "ROOM" ? "tab active" : "tab"}
              onClick={() => setActiveTab("ROOM")}
            >
              Rooms
            </button>
            <button
              className={activeTab === "TAKEAWAY" ? "tab active" : "tab"}
              onClick={() => setActiveTab("TAKEAWAY")}
            >
              Takeaway
            </button>
          </div>

          <div className="orders-list">
            {filteredOrders.length === 0 && (
              <p className="empty-text">No orders found for this filter.</p>
            )}

            {filteredOrders.map((order) => (
              <div
                key={order.id + '-' + (order.billId || '')}
                className={
                  order.id === selectedOrderId
                    ? "order-card active"
                    : "order-card"
                }
                onClick={() => setSelectedOrderId(order.id)}
              >
                <div className="order-card-main">
                  <div className="order-label">{order.label}</div>
                  <div className="order-sub">
                    <span>Customer: {order.customer}</span>
                    <span className="order-kot">{order.id}</span>
                  </div>
                  <span className="status-badge">{order.status}</span>
                </div>
                <button
                  className="btn small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderId(order.id);
                  }}
                >
                  Create Bill
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="panel preview-panel">
          {selectedOrder ? (
            <>
              <div className="panel-header">
                <h2>Billing Preview</h2>
              </div>

              {/* Order info */}
                <div className="order-info">
                <div>
                  <span className="label">KOT Number</span>
                  <div className="value bold">{selectedOrder.id}</div>
                </div>
                <div>
                  <span className="label">Source</span>
                  <div className="value">
                    {selectedOrder.type === "TABLE" && selectedOrder.label}
                    {selectedOrder.type === "ROOM" && selectedOrder.label}
                    {selectedOrder.type === "TAKEAWAY" && "Takeaway / Parcel"}
                  </div>
                </div>
                <div>
                  <span className="label">Customer</span>
                  <div className="value">{selectedOrder.customer}</div>
                </div>
              </div>

              {/* Item table */}
                <div className="items-table">
                <div className="items-header-row">
                  <span className="col-item">Item</span>
                  <span className="col-qty">Qty</span>
                  <span className="col-price">Amount</span>
                  <span className="col-discount">Item Disc</span>
                </div>
                {selectedOrder.items.map((item) => {
                  const line = item.qty * item.price;
                  // calculation uses item-specific mode
                  const mode = item.itemDiscountMode || 'PERCENT';
                  const discVal = Number(item.itemDiscount) || 0;
                  const itemDisc = mode === 'PERCENT' ? (line * discVal) / 100 : discVal;
                  const lineTotal = Math.max(0, line - itemDisc);
                  return (
                    <div className="items-row" key={item.id}>
                      <span className="col-item">{item.name}</span>
                      <span className="col-qty">{item.qty}</span>
                      <span className="col-price">₹{lineTotal.toFixed(2)}</span>
                      <span className="col-discount">
                        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                          <input
                            type="number"
                            min="0"
                            value={item.itemDiscount}
                            onChange={(e) =>
                              updateItemDiscount(
                                selectedOrder.id,
                                item.id,
                                Math.max(0, parseFloat(e.target.value) || 0),
                                item.itemDiscountMode || 'PERCENT'
                              )
                            }
                            style={{width:'70px'}}
                          />
                          <div className="toggle-group" style={{display:'inline-flex'}}>
                            <button
                              type="button"
                              className={item.itemDiscountMode === 'PERCENT' ? 'toggle active' : 'toggle'}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateItemDiscount(selectedOrder.id, item.id, item.itemDiscount, 'PERCENT');
                              }}
                            >
                              %
                            </button>
                            <button
                              type="button"
                              className={item.itemDiscountMode === 'FLAT' ? 'toggle active' : 'toggle'}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateItemDiscount(selectedOrder.id, item.id, item.itemDiscount, 'FLAT');
                              }}
                            >
                              ₹
                            </button>
                          </div>
                        </div>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Discount controls */}
              <div className="discount-section">
                <h3>Discount Controls</h3>
                <div className="discount-options">
                  <div className="discount-mode">
                    <span className="label">Total Bill Discount</span>
                    <div className="discount-inputs">
                      <input
                        type="number"
                        min="0"
                        value={billDiscountValue}
                        onChange={(e) => setBillDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                      />
                      <div className="toggle-group">
                        <button
                          type="button"
                          className={billDiscountMode === 'PERCENT' ? 'toggle active' : 'toggle'}
                          onClick={() => setBillDiscountMode('PERCENT')}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          className={billDiscountMode === 'FLAT' ? 'toggle active' : 'toggle'}
                          onClick={() => setBillDiscountMode('FLAT')}
                        >
                          ₹
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="discount-mode">
                    <span className="label">Payment Mode</span>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                    </select>
                  </div>
                </div>
                <p className="discount-help">Choose percent or flat rupee discount for the total bill.</p>
              </div>

              {/* Totals */}
                <div className="totals-section">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>₹{Number(subtotal||0).toFixed(2)}</span>
                </div>
                <div className="totals-row small">
                  <span>Item-wise Discount</span>
                  <span>- ₹{itemDiscountTotal.toFixed(2)}</span>
                </div>
                <div className="totals-row small">
                  <span>
                    Bill Discount {discountLabel ? `(${discountLabel})` : ""}
                  </span>
                  <span>- ₹{billDiscountAmount.toFixed(2)}</span>
                </div>
                <div className="totals-row small">
                  <span>GST</span>
                  <span>₹{Number(gst||0).toFixed(2)}</span>
                </div>
                {selectedOrder.serviceRate > 0 && (
                  <div className="totals-row small">
                    <span>
                      Service Charge (
                      {(selectedOrder.serviceRate * 100).toFixed(0)}%)
                    </span>
                    <span>₹{service.toFixed(2)}</span>
                  </div>
                )}
                <div className="totals-row grand">
                  <span>Grand Total</span>
                  <span>₹{Number(grandTotal||0).toFixed(2)}</span>
                </div>
              </div>
              <div className="actions">
                <button
                  className="btn primary"
                  onClick={() => handleConfirmPayment()}
                >
                  ✅ Confirm Payment
                </button>
              </div>
              {showConfetti && <Confetti />}
              {printOpen && printPayload && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BillPrint 
                    hotel={printPayload.hotel} 
                    bill={printPayload.bill} 
                    orderItems={printPayload.orderItems} 
                    waiter={printPayload.waiter}
                    onPrintComplete={() => {
                      const updated = orders.filter(o => o.billId !== selectedOrder.billId);
                      setOrders(updated);
                      setSelectedOrderId(updated.length ? updated[0].id : null);
                      setPrintOpen(false);
                    }}
                    onCancel={() => {
                      setPrintOpen(false);
                      setShowConfetti(false);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="empty-text">
              Select an order from the left panel to start billing.
            </p>
          )}
        </section>
      </main>

      <footer className="billing-footer">
        <div className="footer-nav">
          <span>💳 Payment</span>
          <span>📋 Orders</span>
          <span>📜 History</span>
        </div>
        <span className="footer-brand">
          Powered by <strong>Smart KOT Billing</strong>
        </span>
      </footer>
    </div>
  );
}
