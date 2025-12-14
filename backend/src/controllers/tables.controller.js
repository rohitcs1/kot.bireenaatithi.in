const supabase = require('../config/supabase');

async function listTables(req, res) {
  const hotelId = req.user.hotel_id;
  try {
    const { data, error } = await supabase.from('tables').select('*').eq('hotel_id', hotelId);
    if (error) throw error;
    return res.json({ tables: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createTable(req, res) {
  const hotelId = req.user.hotel_id;
  const { table_number, seats = 4, status } = req.body;
  if (table_number == null) return res.status(400).json({ error: 'Missing table_number' });
  try {
    const insertObj = { hotel_id: hotelId, table_number, seats };
    if (status) insertObj.status = status;
    const { data, error } = await supabase.from('tables').insert([insertObj]).select().single();
    if (error) throw error;
    return res.json({ table: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateTable(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  const payload = req.body;
  try {
    const { data, error } = await supabase.from('tables').update(payload).eq('id', id).eq('hotel_id', hotelId).select().single();
    if (error) throw error;
    return res.json({ table: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteTable(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  try {
    const { error } = await supabase.from('tables').delete().eq('id', id).eq('hotel_id', hotelId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listTables, createTable, updateTable, deleteTable };
