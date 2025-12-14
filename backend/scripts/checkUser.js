require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check(email) {
  try {
    console.log('Checking superadmins and app_users for:', email);
    const { data: superRows, error: superErr } = await supabase.from('superadmins').select('*').eq('email', email);
    if (superErr) console.error('superadmins error:', superErr.message || superErr);
    else console.log('superadmins rows:', superRows);

    const { data: appRows, error: appErr } = await supabase.from('app_users').select('*').eq('email', email);
    if (appErr) console.error('app_users error:', appErr.message || appErr);
    else console.log('app_users rows:', appRows);

    process.exit(0);
  } catch (err) {
    console.error('check error:', err.message || err);
    process.exit(2);
  }
}

const email = process.argv[2] || 'rohitcs175@gmail.com';
check(email);
