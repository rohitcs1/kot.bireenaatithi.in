const supabase = require('../config/supabase');

async function listCategories(req, res) {
  const hotelId = req.user.hotel_id;
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name');
    if (error) throw error;
    return res.json({ categories: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createCategory(req, res) {
  const hotelId = req.user.hotel_id;
  const { name } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert([{ hotel_id: hotelId, name: name.trim() }])
      .select()
      .single();
    if (error) throw error;
    return res.json({ category: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateCategory(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('hotel_id', hotelId)
      .select()
      .single();
    if (error) throw error;
    return res.json({ category: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteCategory(req, res) {
  const hotelId = req.user.hotel_id;
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id)
      .eq('hotel_id', hotelId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
