require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function disable(email) {
  try {
    console.log('Disabling superadmin and related app_user for:', email);

    // Delete from superadmins table (removes server-side login)
    const { data: deleted, error: delErr } = await supabase.from('superadmins').delete().eq('email', email).select();
    if (delErr) console.warn('Warning while deleting superadmins row:', delErr.message || delErr);
    else console.log('Deleted superadmins rows:', deleted.length || 0);

    // Set app_users.enabled = false for matching email
    const { data: updated, error: updErr } = await supabase.from('app_users').update({ enabled: false }).eq('email', email).select();
    if (updErr) console.warn('Warning while updating app_users:', updErr.message || updErr);
    else console.log('Updated app_users rows:', updated.length || 0);

    console.log('Done. The user should no longer be able to login as superadmin.');
    process.exit(0);
  } catch (err) {
    console.error('Error disabling superadmin:', err.message || err);
    process.exit(2);
  }
}

const email = process.argv[2] || 'rohitcs175@gmail.com';
disable(email);
