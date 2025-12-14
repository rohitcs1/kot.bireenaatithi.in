const supabase = require('../config/supabase');

async function listMenu(req, res) {
  const hotelId = req.user.hotel_id;
  try {
    const { data, error } = await supabase.from('menus').select('*').eq('hotel_id', hotelId);
    if (error) throw error;
    // Debug: log hotelId and number of menu items returned
    console.log(`[menu] listMenu called for hotel_id=${hotelId} -> rows=${Array.isArray(data) ? data.length : 0}`);
    return res.json({ menu: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createMenu(req, res) {
  const hotelId = req.user.hotel_id;
  const { name, price, category_id, description, veg = false, available = true, prep_time = 0, tags = null, image_url = null } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Missing fields' });
  try {
    // Log incoming data for debugging
    console.log('createMenu payload:', { name, price, category_id, description, veg, available, prep_time, tags, image_url });
    
    const insertObj = {
      hotel_id: hotelId,
      name,
      price,
      category_id: category_id || null,
      description: description || null,
      veg,
      available,
      prep_time: prep_time || 0,
      tags: (tags && tags.length > 0) ? tags : null,
      image_url: image_url && image_url.trim() ? image_url : null
    };
    
    console.log('insertObj before insert:', insertObj);
    const { data, error } = await supabase.from('menus').insert([insertObj]).select().single();
    if (error) throw error;
    console.log('inserted menu data:', data);
    return res.json({ menu: data });
  } catch (err) {
    console.error('createMenu error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateMenu(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  const payload = req.body;
  try {
    const { data, error } = await supabase.from('menus').update(payload).eq('id', id).eq('hotel_id', hotelId).select().single();
    if (error) throw error;
    return res.json({ menu: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteMenu(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  try {
    const { error } = await supabase.from('menus').delete().eq('id', id).eq('hotel_id', hotelId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listMenu, createMenu, updateMenu, deleteMenu };
