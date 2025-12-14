const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Health check and simple DB connectivity
router.get('/status', async (req, res) => {
  try {
    // simple ping: fetch 1 user count and return env info (non-sensitive)
    const { data: users, error } = await supabase.from('app_users').select('id').limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true, dbConnected: Array.isArray(users) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Optional: fetch a single user by email to help debug login issues
router.get('/user', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email query param required' });
  try {
    const { data, error } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'user not found' });
    // do not return hashed_password in production; include only for debugging
    const safe = { ...data };
    if (safe.hashed_password) safe.hashed_password_present = true;
    delete safe.hashed_password;
    return res.json({ user: safe });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
