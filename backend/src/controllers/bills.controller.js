const supabase = require('../config/supabase');

async function getBill(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  try {
    const { data: bill, error: billErr } = await supabase.from('bills').select('*').eq('id', id).eq('hotel_id', hotelId).maybeSingle();
    if (billErr) throw billErr;
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    // fetch order and items
    const { data: order, error: orderErr } = await supabase.from('orders').select('*, order_items(*, menus(name, price)), tables(table_number)').eq('id', bill.order_id).maybeSingle();
    if (orderErr) throw orderErr;

    // fetch waiter info if present
    let waiter = null;
    if (order && order.waiter_id) {
      const { data: usr } = await supabase.from('app_users').select('id,name,phone,email').eq('id', order.waiter_id).maybeSingle();
      waiter = usr || null;
    }

    // fetch hotel info (name, address, phone, gstin, logo_url) to assist printing
    let hotel = null;
    try {
      const { data: h } = await supabase.from('hotels').select('id,name,address,owner_phone as phone,gstin,logo_url').eq('id', hotelId).maybeSingle();
      hotel = h || null;
    } catch (hErr) {
      console.warn('getBill: failed to fetch hotel info', hErr && (hErr.message || hErr));
    }

    return res.json({ bill, order, waiter, hotel });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function listDraftBills(req, res) {
  const hotelId = req.user.hotel_id;
  try {
    const { data: bills, error: billsErr } = await supabase.from('bills').select('*').eq('hotel_id', hotelId).eq('status', 'DRAFT');
    if (billsErr) throw billsErr;

    // Fetch order details for each bill
    const detailed = await Promise.all((bills || []).map(async (b) => {
      const { data: order, error: orderErr } = await supabase.from('orders').select('*, order_items(*, menus(name, price)), tables(table_number)').eq('id', b.order_id).maybeSingle();
      if (orderErr) {
        console.warn('listDraftBills: order fetch error for order_id=', b.order_id, orderErr.message || orderErr);
      }
      let waiter = null;
      if (order && order.waiter_id) {
        const { data: usr } = await supabase.from('app_users').select('id,name,email').eq('id', order.waiter_id).maybeSingle();
        waiter = usr || null;
      }
      return { bill: b, order, waiter };
    }));

    return res.json({ bills: detailed });
  } catch (err) {
    console.error('listDraftBills error', err);
    return res.status(500).json({ error: err.message });
  }
}

async function payBill(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  const { payment_mode, amount } = req.body;
  try {
    // update bill status to PAID and store payment info
    // Note: DB columns are `payment_method` and `grand_total` (see schema). Normalize inputs to satisfy check constraints.
    const updates = { status: 'PAID' };
    if (payment_mode) {
      const pm = String(payment_mode || '').toUpperCase();
      const allowed = ['CASH', 'CARD', 'UPI'];
      updates.payment_method = allowed.includes(pm) ? pm : 'CASH';
    }
    if (amount !== undefined) updates.grand_total = Number(amount) || 0;

    const { data: bill, error: updErr } = await supabase.from('bills')
      .update(updates)
      .eq('id', id)
      .eq('hotel_id', hotelId)
      .select()
      .maybeSingle();
    if (updErr) throw updErr;
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    // After marking bill as PAID, create an invoice record for accounting/printing
    let invoice = null;
    try {
      const invPayload = {
        hotel_id: hotelId,
        order_id: bill.order_id || null,
        amount: Number(updates.grand_total ?? bill.grand_total ?? 0) || 0,
        payment_method: updates.payment_method || bill.payment_method || 'CASH'
      };
      const { data: invData, error: invErr } = await supabase.from('invoices').insert([invPayload]).select().maybeSingle();
      if (invErr) {
        console.warn('payBill: failed to create invoice', invErr.message || invErr);
      } else {
        invoice = invData;
      }
    } catch (ie) {
      console.warn('payBill: invoice insert exception', ie && ie.message ? ie.message : ie);
    }

    // Also mark related order as completed and free the table (set table status to 'available')
    try {
      if (bill && bill.order_id) {
        // update order status and billed_at
        const { error: orderUpdErr } = await supabase.from('orders')
          .update({ status: 'completed', billed_at: new Date().toISOString() })
          .eq('id', bill.order_id)
          .eq('hotel_id', hotelId);
        if (orderUpdErr) console.warn('payBill: order update warning', orderUpdErr.message || orderUpdErr);

        // fetch the order to get table_id
        const { data: orderRow, error: orderFetchErr } = await supabase.from('orders').select('table_id').eq('id', bill.order_id).maybeSingle();
        if (!orderFetchErr && orderRow && orderRow.table_id) {
          const { error: tableUpdErr } = await supabase.from('tables')
            .update({ status: 'available' })
            .eq('id', orderRow.table_id)
            .eq('hotel_id', hotelId);
          if (tableUpdErr) console.warn('payBill: table update warning', tableUpdErr.message || tableUpdErr);
        }
      }
    } catch (e2) {
      console.warn('payBill: post-payment cleanup error', e2 && e2.message ? e2.message : e2);
    }

    return res.json({ bill, invoice });
  } catch (err) {
    console.error('payBill error', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getBill, listDraftBills, payBill };
