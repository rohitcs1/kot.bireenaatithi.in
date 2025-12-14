const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

// Create user: creates Supabase Auth user (admin.createUser) and app_users row
async function createUser(req, res) {
  const requester = req.user;
  const { name, email, password, role, hotel_id, phone } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

  // Determine target hotel
  const targetHotelId = requester.role === 'superadmin' ? (hotel_id || null) : requester.hotel_id;
  if (!targetHotelId) return res.status(400).json({ error: 'Missing hotel_id' });

  // Permission rules
  if (role === 'admin' && requester.role !== 'superadmin') return res.status(403).json({ error: 'Only superadmin can create admin' });
  if (['waiter', 'kitchen'].includes(role) && !['admin', 'manager', 'superadmin'].includes(requester.role)) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Create Supabase Auth user (server side)
    const { data: createdAuth, error: createErr } = await supabase.auth.admin.createUser({ email, password, user_metadata: { hotel_id: targetHotelId, role, phone } });
    if (createErr) console.warn('supabase admin.createUser warning', createErr.message);

    const hashed = await bcrypt.hash(password, 10);

    // generate a short staff_code for tracking (e.g., W-<short-uuid>)
    let staff_code = `W-${randomUUID().split('-')[0]}`;
    // include staff_code in the inserted row
    const insertRow = {
      hotel_id: targetHotelId,
      role,
      email,
      name: name || null,
      hashed_password: hashed,
      created_by: requester.id,
      phone: phone || null,
      staff_code
    };

    const { data, error } = await supabase.from('app_users').insert([insertRow]).select().single();
    if (error) throw error;
    return res.json({ user: { id: data.id, name: data.name, email: data.email, role: data.role, hotel_id: data.hotel_id, phone: data.phone, staff_code: data.staff_code } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function listUsers(req, res) {
  const requester = req.user;
  try {
    let query = supabase.from('app_users').select('id, staff_code, name, email, role, enabled, hotel_id, phone, created_at, created_by');
    // If requester is not superadmin, restrict to their hotel
    if (requester.role !== 'superadmin') {
      query = query.eq('hotel_id', requester.hotel_id);
    } else {
      // optionally support ?hotel_id= for superadmin to filter by hotel
      if (req.query && req.query.hotel_id) query = query.eq('hotel_id', req.query.hotel_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // normalize enabled -> status
    const users = (data || []).map(u => ({
      id: u.id,
      staff_code: u.staff_code || null,
      name: u.name,
      email: u.email,
      role: u.role,
      hotel_id: u.hotel_id,
      status: u.enabled ? 'active' : 'disabled',
      created_at: u.created_at,
      created_by: u.created_by
    }));

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function toggleUser(req, res) {
  const requester = req.user;
  const { id } = req.params;
  const { enabled } = req.body;
  try {
    // Only superadmin or admin of the same hotel can toggle
    const { data: userRow, error: fetchErr } = await supabase.from('app_users').select('*').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!userRow) return res.status(404).json({ error: 'User not found' });
    if (requester.role !== 'superadmin' && requester.hotel_id !== userRow.hotel_id) return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabase.from('app_users').update({ enabled }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ user: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createUser, listUsers, toggleUser };

async function deleteUser(req, res) {
  const requester = req.user;
  const { id } = req.params;
  try {
    const { data: userRow, error: fetchErr } = await supabase.from('app_users').select('*').eq('id', id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!userRow) return res.status(404).json({ error: 'User not found' });
    // Only superadmin or admin of same hotel can delete
    if (requester.role !== 'superadmin' && requester.hotel_id !== userRow.hotel_id) return res.status(403).json({ error: 'Forbidden' });

    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { createUser, listUsers, toggleUser, deleteUser };
