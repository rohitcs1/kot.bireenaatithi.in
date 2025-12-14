import React, { useState } from 'react';
import api from '../api';

// Thermal bill print component (58mm / 280px width)
// Props: { hotel, bill, orderItems, waiter, onPrintComplete, onCancel }
export default function BillPrint({ hotel = {}, bill = {}, orderItems = [], waiter = {}, onPrintComplete = null, onCancel = null }) {
  const [updating, setUpdating] = useState(false);

  const styles = {
    wrapper: {
      width: '280px',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '12px',
      color: '#000',
      padding: '8px',
      boxSizing: 'border-box',
      background: '#fff'
    },
    header: { textAlign: 'center', marginBottom: '6px' },
    hotelName: { fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' },
    small: { fontSize: '11px' },
    metaRow: { display: 'flex', justifyContent: 'space-between', margin: '4px 0' },
    badgeBase: { display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#fff' },
    tableHeader: { display: 'flex', fontWeight: 700, borderBottom: '1px dashed #000', paddingBottom: '4px', marginTop: '6px' },
    row: { display: 'flex', padding: '4px 0', alignItems: 'center' },
    colName: { width: '48%', textAlign: 'left', wordBreak: 'break-word' },
    colQty: { width: '12%', textAlign: 'center' },
    colRate: { width: '20%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },
    divider: { borderTop: '1px dashed #000', margin: '6px 0' },
    totalsRow: { display: 'flex', justifyContent: 'space-between', marginTop: '4px' },
    grandTotal: { display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontWeight: 800, fontSize: '15px' },
    footer: { textAlign: 'center', marginTop: '10px', fontSize: '11px' },
    qr: { display: 'block', margin: '8px auto', maxWidth: '120px', width: '120px' },
    printBtn: { marginTop: '10px', display: 'inline-block', padding: '8px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    closeBtn: { marginLeft: '8px', background: '#ef4444' }
  };

  const fmt = (v) => '₹' + (Number(v || 0)).toFixed(2);

  const pad2 = (v) => (String(v).length === 1 ? '0' + v : String(v));
  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const DD = pad2(dt.getDate());
    const MM = pad2(dt.getMonth() + 1);
    const YYYY = dt.getFullYear();
    let hours = dt.getHours();
    const minutes = pad2(dt.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const HH = pad2(hours);
    return `${DD}/${MM}/${YYYY} | ${HH}:${minutes} ${ampm}`;
  };

  const getStatus = () => (bill?.status || bill?.state || '').toString().toLowerCase();

  const statusBadge = () => {
    const s = getStatus();
    if (s === 'draft') return { bg: '#f59e0b', label: 'DRAFT' };
    if (s === 'paid') return { bg: '#10b981', label: 'PAID ✅' };
    if (s === 'cancelled') return { bg: '#ef4444', label: 'CANCELLED' };
    return { bg: '#6b7280', label: (bill?.status || 'UNKNOWN').toString().toUpperCase() };
  };

  const handleOpenPreview = () => {
    // No longer used; bill is shown directly
  };

  const handleClosePreview = () => {
    if (onCancel) onCancel();
  };

  // When user clicks Print button, print then optionally update server
  const handlePrintAndMark = async () => {
    try {
      // Trigger print dialog
      window.print();
    } catch (e) {
      console.warn('print failed', e);
    }

    // After print dialog completes, update server if appropriate
    try {
      const s = getStatus();
      if (!bill?.id) return;
      if (s === 'paid') {
        try { alert('Bill already marked PAID'); } catch (e) {}
        if (onPrintComplete) onPrintComplete();
        return;
      }
      if (s === 'cancelled') {
        try { alert('Cancelled bills cannot be marked PAID'); } catch (e) {}
        if (onPrintComplete) onPrintComplete();
        return;
      }

      const confirmMark = window.confirm('Mark this bill as PAID in the system after printing?');
      if (!confirmMark) { if (onCancel) onCancel(); return; }

      setUpdating(true);
      // use backend pay endpoint for proper business logic
      await api.post(`/bills/${bill.id}/pay`, { payment_mode: bill.payment_method || 'UPI', amount: bill.grand_total || bill.total || bill.amount || 0 });
      // Trigger instant table status update by dispatching a custom event
      window.dispatchEvent(new CustomEvent('billPaid', { detail: { orderId: bill.order_id } }));
      try { alert('Bill marked as PAID'); } catch (e) {}
    } catch (err) {
      console.error('Failed to update bill status', err);
      try { alert('Failed to mark bill as PAID'); } catch (e) {}
    } finally {
      setUpdating(false);
      if (onPrintComplete) onPrintComplete();
    }
  };

  // data picks
  const hotelName = hotel?.name || '';
  const address = hotel?.address || '';
  const city = hotel?.city || '';
  const state = hotel?.state || '';
  const pincode = hotel?.pincode || hotel?.pin_code || '';
  const phone = hotel?.phone || hotel?.owner_phone || hotel?.contact || '';
  const email = hotel?.email || '';
  const gstin = hotel?.gstin || hotel?.gst || hotel?.gstin_number || '';
  const qr = hotel?.logo_url || '';

  const billNo = bill?.bill_number || bill?.billNo || bill?.id || '';
  const orderId = bill?.order_id || bill?.raw_order_id || '';
  const kotNo = (bill?.order && bill.order.kot_number) || bill?.kot_number || '';
  const orderType = (bill?.order_type || (bill?.order && bill.order.order_type) || 'TABLE').toString().toUpperCase();
  const tableNum = (bill?.table_number || (bill?.order && (bill.order.tables?.table_number || bill.order.table_id)) || 'N/A');
  const waiterName = (waiter?.name || waiter?.full_name || waiter?.staff_name || bill?.waiter_name || 'Staff');
  const waiterCode = waiter?.staff_code || waiter?.code || '';
  const billDate = bill?.created_at || bill?.createdAt || new Date().toISOString();

  // pricing
  const subtotal = bill?.subtotal ?? orderItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);
  let discount = 0;
  let discountLabel = '';
  if (bill?.discount_mode && bill?.total_discount !== undefined) {
    if ((bill.discount_mode || '').toString().toUpperCase() === 'PERCENT') {
      discount = (subtotal * Number(bill.total_discount || 0)) / 100;
      discountLabel = `${Number(bill.total_discount || 0)}%`;
    } else {
      discount = Number(bill.total_discount || 0);
      discountLabel = 'FLAT';
    }
  } else if (bill?.total_discount !== undefined) {
    discount = Number(bill.total_discount || 0);
    discountLabel = 'FLAT';
  }
  const taxable = Math.max(0, subtotal - discount);
  const gst = Number(bill?.gst ?? bill?.gst_amount ?? 0);
  const service = bill?.service_charge ?? bill?.service ?? 0;
  const grandTotal = bill?.grand_total ?? bill?.total ?? (taxable + Number(gst) + Number(service));

  return (
    <div style={{ position: 'relative', zIndex: 10000 }}>
      {/* Bill Preview - shown directly in modal */}
      <div id="bill-print" style={styles.wrapper}>
        <div style={styles.header}>
          <div style={styles.hotelName}>{hotelName}</div>
          <div style={styles.small}>{address}</div>
          <div style={styles.small}>{city}{city && (state || pincode) ? ', ' : ''}{state} {pincode}</div>
          {phone && <div style={styles.small}>Phone: {phone}</div>}
          {email && <div style={styles.small}>Email: {email}</div>}
          {gstin && <div style={{ ...styles.small, marginTop: 4 }}>GSTIN: {gstin}</div>}
        </div>

        <div style={{ ...styles.metaRow, marginTop: 4 }}>
          <div style={{ fontSize: '12px' }}><strong>Bill No:</strong> {billNo}</div>
          <div>
            {(() => {
              const sb = statusBadge();
              return <span style={{ ...styles.badgeBase, background: sb.bg }}>{sb.label}</span>;
            })()}
          </div>
        </div>

        <div style={styles.metaRow}><div style={styles.small}><strong>Order ID:</strong> {orderId}</div><div style={styles.small}><strong>KOT No:</strong> {kotNo}</div></div>
        <div style={styles.metaRow}><div style={styles.small}><strong>Order Type:</strong> {orderType}</div><div style={styles.small}><strong>Table:</strong> {tableNum}</div></div>
        <div style={styles.metaRow}><div style={styles.small}><strong>Waiter:</strong> {waiterName} {waiterCode ? `(${waiterCode})` : ''}</div><div style={styles.small}><strong>Time:</strong> {formatDate(billDate)}</div></div>

        <div style={styles.tableHeader}><div style={styles.colName}>Item</div><div style={styles.colQty}>Qty</div><div style={styles.colRate}>Rate</div><div style={styles.colTotal}>Total</div></div>

        <div>
          {orderItems.map((it, idx) => (
            <div key={idx} style={styles.row}>
              <div style={styles.colName}>{it.name}{it.notes ? ` - ${it.notes}` : ''}</div>
              <div style={styles.colQty}>{it.qty}</div>
              <div style={styles.colRate}>{fmt(it.price)}</div>
              <div style={styles.colTotal}>{fmt(Number(it.price || 0) * Number(it.qty || 1))}</div>
            </div>
          ))}
        </div>

        <div style={styles.divider}></div>

        <div style={styles.totalsRow}><div>Subtotal</div><div>{fmt(subtotal)}</div></div>
        {discount > 0 && <div style={styles.totalsRow}><div>Discount ({discountLabel})</div><div>- {fmt(discount)}</div></div>}
        <div style={styles.totalsRow}><div>GST</div><div>{fmt(gst)}</div></div>
        <div style={styles.totalsRow}><div>Service Charge</div><div>{fmt(service)}</div></div>

        <div style={styles.grandTotal}><div>Grand Total</div><div>{fmt(grandTotal)}</div></div>

        <div style={{ ...styles.totalsRow, marginTop: 8 }}><div>Payment Method</div><div>{bill?.payment_method || bill?.paymentMethod || 'UPI'}</div></div>

        <div style={styles.footer}>
          <div>Thank you for dining with us 😊</div>
          <div style={{ marginTop: 6 }}>Scan QR for feedback & UPI payment</div>
          {qr ? <img src={qr} alt="Pay QR" style={styles.qr} /> : null}
        </div>

        {/* Print and Cancel buttons at bottom */}
        <div style={{ textAlign: 'center', marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button 
            style={styles.printBtn} 
            onClick={handlePrintAndMark}
            disabled={updating}
          >
            {updating ? '⏳ Processing...' : '🖨️ Print'}
          </button>
          <button 
            style={{ ...styles.printBtn, ...styles.closeBtn }} 
            onClick={handleClosePreview}
            disabled={updating}
          >
            ✖️ Cancel
          </button>
        </div>
      </div>

      {/* print styles: hide overlay/button when printing and set page size */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #bill-print, #bill-print * { visibility: visible; }
          #bill-print { position: absolute; left: 0; top: 0; width: 280px; }
        }
      `}</style>
    </div>
  );
}
