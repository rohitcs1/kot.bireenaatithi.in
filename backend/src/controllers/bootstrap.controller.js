const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_CREATION_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createSuperadmin(req, res) {
  try {
    const providedSecret = req.header('x-admin-secret');
    if (!ADMIN_SECRET || providedSecret !== ADMIN_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email,name,password required' });

    // Create Supabase Auth user (admin)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: 'superadmin' },
      email_confirm: true
    });
    if (authErr) {
      // If there's an error, log and return partial failure
      console.warn('Warning from supabase.auth.admin.createUser:', authErr.message || authErr);
    }

    // Hash password for app_users table
    const hashed = await bcrypt.hash(password, 10);

    // Upsert into superadmins table
    const { data: existingSuper, error: fetchSuperErr } = await supabase.from('superadmins').select('*').eq('email', email).maybeSingle();
    if (fetchSuperErr) {
      console.error('Failed to check superadmins:', fetchSuperErr.message || fetchSuperErr);
      return res.status(500).json({ error: 'DB lookup failed' });
    }
    if (existingSuper) {
      const { data: updatedSuper, error: updateSuperErr } = await supabase.from('superadmins').update({ name, hashed_password: hashed }).eq('id', existingSuper.id).select().single();
      if (updateSuperErr) {
        console.error('Failed to update superadmins:', updateSuperErr.message || updateSuperErr);
        return res.status(500).json({ error: 'Failed to update superadmin' });
      }
    } else {
      const { data: insertedSuper, error: insertSuperErr } = await supabase.from('superadmins').insert([{ email, name, hashed_password: hashed }]).select().single();
      if (insertSuperErr) {
        console.error('Failed to insert into superadmins:', insertSuperErr.message || insertSuperErr);
        return res.status(500).json({ error: 'Failed to insert superadmins' });
      }
    }

    // Upsert into app_users
    const { data: existingUser, error: fetchUserErr } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
    if (fetchUserErr) {
      console.error('Failed to check app_users:', fetchUserErr.message || fetchUserErr);
      return res.status(500).json({ error: 'DB lookup failed' });
    }

    if (existingUser) {
      const { data: updated, error: updateErr } = await supabase.from('app_users').update({
        name,
        role: 'superadmin',
        hotel_id: null,
        hashed_password: hashed,
        enabled: true
      }).eq('id', existingUser.id).select().single();
      if (updateErr) {
        console.error('Failed to update app_users:', updateErr.message || updateErr);
        return res.status(500).json({ error: 'Failed to update app_users' });
      }
      return res.json({ message: 'Superadmin updated', user: updated });
    } else {
      const { data: inserted, error: insertErr } = await supabase.from('app_users').insert([{ email, name, role: 'superadmin', hotel_id: null, hashed_password: hashed, enabled: true }]).select().single();
      if (insertErr) {
        console.error('Failed to insert app_users:', insertErr.message || insertErr);
        return res.status(500).json({ error: 'Failed to insert app_users' });
      }
      return res.json({ message: 'Superadmin created', user: inserted });
    }
  } catch (err) {
    console.error('Bootstrap error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createSuperadmin
};
