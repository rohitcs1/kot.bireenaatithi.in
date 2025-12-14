const supabase = require('../src/supabaseClient');
const bcrypt = require('bcrypt');

async function setHashedPassword(email, password, enable = true) {
  if (!email || !password) {
    console.error('Usage: node scripts/set_hashed_password.js <email> <password> [enable:true|false]');
    process.exit(1);
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    if (!data) {
      console.error('No app_user found with email', email);
      process.exit(2);
    }

    const { data: updated, error: upErr } = await supabase.from('app_users').update({ hashed_password: hashed, enabled: enable }).eq('id', data.id).select().single();
    if (upErr) throw upErr;
    console.log('Updated user', updated.email, 'id', updated.id);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(3);
  }
}

const [,, email, password, enableFlag] = process.argv;
const enable = typeof enableFlag === 'undefined' ? true : (String(enableFlag).toLowerCase() === 'true');
setHashedPassword(email, password, enable);
