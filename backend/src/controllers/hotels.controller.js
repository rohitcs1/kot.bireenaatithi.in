const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

// Create hotel and optionally create admin user via Supabase Admin API
async function createHotel(req, res) {
  const { name, address, owner_name, owner_phone, owner_email, subscription_duration_months = 12, admin_password } = req.body;
  if (!name || !owner_email) return res.status(400).json({ error: 'Missing fields' });
  try {
    const subscription_start = new Date();
    const subscription_end = new Date(subscription_start);
    subscription_end.setMonth(subscription_end.getMonth() + Number(subscription_duration_months));

    const { data: hotel, error: hotelErr } = await supabase.from('hotels').insert([
      { name, address, owner_name, owner_phone, owner_email, subscription_start, subscription_end, status: 'active' }
    ]).select().single();
    if (hotelErr) throw hotelErr;

    // Create admin app_user and Supabase Auth user if admin_password provided
    let adminUser = null;
    if (owner_email && admin_password) {
      // Create Supabase Auth user via admin API
      const { data: createdAuth, error: createErr } = await supabase.auth.admin.createUser({ email: owner_email, password: admin_password, user_metadata: { hotel_id: hotel.id, role: 'admin' } });
      if (createErr) console.warn('Supabase admin.createUser error', createErr.message);

      const hashed = await bcrypt.hash(admin_password, 10);
      const { data: appUser, error: appErr } = await supabase.from('app_users').insert([
        { hotel_id: hotel.id, role: 'admin', email: owner_email, name: owner_name || null, hashed_password: hashed, created_by: req.user ? req.user.id : null }
      ]).select().single();
      if (appErr) console.warn('app_users creation warning', appErr.message);
      adminUser = appUser;
    }

    return res.json({ hotel, admin: adminUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function listHotels(req, res) {
  try {
    const { data, error } = await supabase.from('hotels').select('*');
    if (error) throw error;
    const results = data.map(h => {
      const subscription_end = h.subscription_end;
      const daysRemaining = subscription_end ? Math.ceil((new Date(subscription_end) - new Date()) / (1000 * 60 * 60 * 24)) : null;
      return { ...h, daysRemaining };
    });
    return res.json({ hotels: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function toggleHotel(req, res) {
  const { id } = req.params;
  const { action } = req.body; // 'enable' | 'disable' | 'delete'
  try {
    if (action === 'delete') {
      const { error } = await supabase.from('hotels').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }
    const status = action === 'enable' ? 'active' : 'disabled';
    const { data, error } = await supabase.from('hotels').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ hotel: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createHotel, listHotels, toggleHotel };
