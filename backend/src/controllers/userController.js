const supabase = require('../supabaseClient');
const bcrypt = require('bcrypt');
const jwtUtil = require('../utils/jwt');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  console.log('[auth] login attempt:', { email });
  try {
    const { data, error } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(401).json({ error: 'Invalid credentials' });

    // fetch hotel info if available (we need hotel status to decide login eligibility)
    let hotelInfo = null;
    if (data.hotel_id) {
      const { data: hData, error: hErr } = await supabase.from('hotels').select('id, name, owner_name, status').eq('id', data.hotel_id).maybeSingle();
      if (!hErr && hData) hotelInfo = hData;
    }

    // Deny login when user is explicitly disabled
    if (data.enabled === false) return res.status(403).json({ error: 'User disabled' });

    // Password verification: if hashed_password exists, verify it. If not present but hotel is active, allow login.
    if (data.hashed_password) {
      const ok = await bcrypt.compare(password, data.hashed_password || '');
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    } else {
      // No hashed password stored. If hotel is active, permit login (legacy/sync case), otherwise deny.
      if (!hotelActive) return res.status(401).json({ error: 'Invalid credentials' });
      console.warn('[login] app_user has no hashed_password, allowing login due to active hotel:', data.email);
    }

    const token = jwtUtil.sign({ user_id: data.id, role: data.role, hotel_id: data.hotel_id });
    console.log('[auth] login success:', { user_id: data.id, role: data.role });

    const userPayload = {
      id: data.id,
      email: data.email,
      role: data.role,
      hotel_id: data.hotel_id,
      name: data.name || null,
      hotel_name: hotelInfo ? hotelInfo.name : null,
      owner_name: hotelInfo ? hotelInfo.owner_name : null,
    };

    return res.json({ token, user: userPayload });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function superadminLogin(req, res) {
  // superadmins are stored in table `superadmins`
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    console.log('[auth] superadmin login attempt:', { email });
    const { data, error } = await supabase.from('superadmins').select('*').eq('email', email).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, data.hashed_password || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwtUtil.sign({ user_id: data.id, role: 'superadmin', hotel_id: null });
    console.log('[auth] superadmin login success:', { superadmin_id: data.id, email: data.email });
    return res.json({ token, user: { id: data.id, email: data.email, role: 'superadmin' } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createUser(req, res) {
  /* body: { hotel_id, role, email, password, name }
     role allowed: manager, waiter, kitchen, admin (only superadmin or admin can create admin depending on rules)
  */
  const requester = req.user;
  const { hotel_id, role, email, password, name } = req.body;
  if (!hotel_id || !role || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  // Authorization rules enforced before calling this controller in routes, but double-check
  if (role === 'admin' && requester.role !== 'superadmin') return res.status(403).json({ error: 'Only superadmin can create admin' });
  if (requester.role === 'manager' && role === 'admin') return res.status(403).json({ error: 'Manager cannot create admin' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('app_users').insert([
      { hotel_id, role, email, name: name || null, hashed_password: hashed, created_by: requester.user_id || null, enabled: true }
    ]).select().single();
    if (error) throw error;
    return res.json({ user: { id: data.id, email: data.email, role: data.role } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { login, superadminLogin, createUser };
