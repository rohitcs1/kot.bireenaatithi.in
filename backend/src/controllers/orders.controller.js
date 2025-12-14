const supabase = require('../config/supabase');
const { generateKOT } = require('../utils/kot.generator');
const { calcTaxesAndTotal } = require('../utils/billing');

async function createOrder(req, res) {
  const hotelId = req.user.hotel_id;
  const { table_id, items = [], waiter_id: bodyWaiterId } = req.body;
  const waiter_id = bodyWaiterId || req.user?.id || null;
  if (!items.length) return res.status(400).json({ error: 'No items' });
  try {
    const kot_number = generateKOT();
    const billing = calcTaxesAndTotal(items, { gstPercent: 5, serviceChargePercent: 0 });

    const { data: order, error: orderErr } = await supabase.from('orders').insert([
      { hotel_id: hotelId, table_id, waiter_id, kot_number, status: 'pending', subtotal: billing.subtotal, gst: billing.gst, service_charge: billing.service_charge, discount: billing.discount, total: billing.total }
    ]).select().single();
    if (orderErr) throw orderErr;

    // insert items
    const itemsToInsert = items.map(it => ({ order_id: order.id, menu_id: it.menu_id, qty: it.qty || 1, price: it.price || 0, notes: it.notes || null }));
    const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsErr) console.warn('order_items insert warning', itemsErr.message);

    // notify kitchen
    await supabase.from('notifications').insert([{ hotel_id: hotelId, role_target: 'kitchen', message: `New order ${order.id}`, order_id: order.id }]);

    return res.json({ order: { id: order.id, kot_number: order.kot_number, status: order.status, total: order.total, created_at: order.created_at } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function listOrders(req, res) {
  const hotelId = req.user.hotel_id;
  const { status } = req.query;
  try {
    let qb = supabase.from('orders')
      .select('*, order_items(*, menus(name)), tables(table_number)')
      .eq('hotel_id', hotelId);
    if (status) qb = qb.eq('status', status);
    const { data, error } = await qb.order('created_at', { ascending: false });
    if (error) throw error;
    
    // Transform the data to include items in a simpler format
    const ordersWithItems = (data || []).map(order => {
      const items = (order.order_items || []).map(item => ({
        name: item.menus?.name || 'Unknown Item',
        quantity: item.qty || 1,
        notes: item.notes || ''
      }));
      
      // Get table number
      const tableNumber = order.tables?.table_number || null;
      
      return {
        ...order,
        table_number: tableNumber,
        items: items
      };
    });
    
    return res.json({ orders: ordersWithItems });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateOrderStatus(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  const { status } = req.body;
  // debug: who is updating status
  console.log(`[orders] updateOrderStatus called by user_id=${req.user?.id} role=${req.user?.role} order_id=${id} -> status=${status}`);
  if (!['pending','preparing','ready','completed','cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    // update order status and fetch order
    const { data: order, error } = await supabase.from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .eq('hotel_id', hotelId)
      .select()
      .single();
    if (error) throw error;

    // when ready, notify waiter
    if (status === 'ready') {
      // Try to notify the waiter who created the order (if present)
      const waiterId = order?.waiter_id || null;
      const note = { hotel_id: hotelId, role_target: 'waiter', message: `Order ${id} is ready`, order_id: id };
      if (waiterId) note.target_user_id = waiterId;
      await supabase.from('notifications').insert([note]);
    }

    // when completed (served), create a draft bill so billing dashboard can pick it up
    if (status === 'completed') {
      try {
        // Build a simple bill payload from order totals
        const billNumber = `BIL-${Date.now().toString().slice(-6)}`;
        const billPayload = {
          hotel_id: hotelId,
          order_id: order.id,
          bill_number: billNumber,
          subtotal: order.subtotal || 0,
          gst: order.gst || 0,
          service_charge: order.service_charge || 0,
          grand_total: order.total || 0,
          total_discount: order.discount || 0,
          discount_mode: 'FLAT',
          payment_method: 'CASH',
          status: 'DRAFT'
        };
        await supabase.from('bills').insert([billPayload]);
      } catch (billErr) {
        console.warn('Could not create bill record for completed order', billErr.message || billErr);
      }
    }
    return res.json({ order });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createOrder, listOrders, updateOrderStatus };
