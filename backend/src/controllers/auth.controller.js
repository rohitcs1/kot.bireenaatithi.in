const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwtUtil = require('../utils/jwt');

// Note: recommended flow: frontend uses Supabase Auth to sign in and sends access_token to backend.
// This endpoint supports server-side superadmin login (email/password) and returns a server JWT.

async function superadminLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const { data, error } = await supabase.from('superadmins').select('*').eq('email', email).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, data.hashed_password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwtUtil.sign({ user_id: data.id, role: 'superadmin' });
    return res.json({ token, user: { id: data.id, role: 'superadmin', email: data.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// Optional endpoint: backend verifies a frontend Supabase token and returns application user info
async function verifySupabaseToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) return res.status(401).json({ error: 'Invalid token' });
    const authUser = data.user;
    const { data: appUser } = await supabase.from('app_users').select('*').eq('email', authUser.email).maybeSingle();
    if (!appUser) return res.status(404).json({ error: 'App user not found' });
    // Check if user is enabled
    if (!appUser.enabled) {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact your administrator.' });
    }
    
    return res.json({ user: { id: appUser.id, role: appUser.role, hotel_id: appUser.hotel_id, email: appUser.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { superadminLogin, verifySupabaseToken };
