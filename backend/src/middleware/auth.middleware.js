const supabase = require('../config/supabase');
const jwtUtil = require('../utils/jwt');

// Accepts Authorization: Bearer <supabase_access_token> or server-issued JWT for superadmin
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = authHeader.split(' ')[1];

  // Try server-issued JWT first (superadmin)
  try {
    const payload = jwtUtil.verify(token);
    // server JWT contains role and user_id
    req.user = { id: payload.user_id, role: payload.role || 'superadmin', hotel_id: payload.hotel_id || null, auth_user_id: null };
    return next();
  } catch (e) {
    // not a server JWT, continue to check supabase token
  }

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData || !userData.user) return res.status(401).json({ error: 'Invalid Supabase token' });
    const authUser = userData.user;
    const email = authUser.email;

    // Find app_users entry by email. Because schema doesn't store auth_user_id, we match email + hotel context later.
    const { data: appUser, error: appErr } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
    if (appErr) return res.status(500).json({ error: appErr.message });
    if (!appUser) return res.status(403).json({ error: 'No application user found for this account' });
    if (!appUser.enabled) return res.status(403).json({ error: 'User disabled' });

    req.user = { id: appUser.id, role: appUser.role, hotel_id: appUser.hotel_id, auth_user_id: authUser.id };
    return next();
  } catch (err) {
    console.error('Auth error', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authenticate };
