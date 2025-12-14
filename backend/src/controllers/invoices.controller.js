const supabase = require('../config/supabase');

async function createInvoice(req, res) {
  const hotelId = req.user.hotel_id;
  const { order_id, payment_method } = req.body;
  if (!order_id) return res.status(400).json({ error: 'Missing order_id' });
  try {
    const { data: order, error: orderErr } = await supabase.from('orders').select('*').eq('id', order_id).eq('hotel_id', hotelId).maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { data, error } = await supabase.from('invoices').insert([{ hotel_id: hotelId, order_id, amount: order.total, payment_method }]).select().single();
    if (error) throw error;
    return res.json({ invoice: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createInvoice };
