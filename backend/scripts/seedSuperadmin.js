require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  try {
    // Allow values from CLI args or environment variables for flexibility
    // Usage examples:
    //  node seedSuperadmin.js --email=you@example.com --password=Secret123 --name="Full Name"
    // or set env vars SUP_ADMIN_EMAIL, SUP_ADMIN_PASSWORD, SUP_ADMIN_NAME
    const argv = require('minimist')(process.argv.slice(2));
    const email = argv.email || process.env.SUP_ADMIN_EMAIL || 'rohitcs175@gmail.com';
    const rawPassword = argv.password || process.env.SUP_ADMIN_PASSWORD || 'Kali@8320191025';
    const name = argv.name || process.env.SUP_ADMIN_NAME || 'Rohit';

    // Create Supabase Auth user (admin)
    console.log('Creating Supabase Auth user...');
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: rawPassword,
      user_metadata: { role: 'superadmin' },
      email_confirm: true
    });
    if (authErr) {
      // If user already exists, warn and continue
      console.warn('Warning from supabase.auth.admin.createUser:', authErr.message || authErr);
    } else {
      console.log('Auth user created:', authData?.user?.id || authData);
    }

    // Hash password for app_users table
    const hashed = await bcrypt.hash(rawPassword, 10);

    // Ensure superadmins table has this account
    console.log('Checking superadmins table...');
    const { data: existingSuper, error: fetchSuperErr } = await supabase.from('superadmins').select('*').eq('email', email).maybeSingle();
    if (fetchSuperErr) {
      console.error('Failed to check superadmins:', fetchSuperErr.message || fetchSuperErr);
      process.exit(2);
    }
    if (existingSuper) {
      console.log('Existing superadmin found, updating...');
      const { data: updatedSuper, error: updateSuperErr } = await supabase.from('superadmins').update({
        name,
        hashed_password: hashed
      }).eq('id', existingSuper.id).select().single();
      if (updateSuperErr) {
        console.error('Failed to update superadmins:', updateSuperErr.message || updateSuperErr);
        process.exit(2);
      }
      console.log('Superadmin table updated:', updatedSuper.email);
    } else {
      console.log('Inserting into superadmins table...');
      const { data: insertedSuper, error: insertSuperErr } = await supabase.from('superadmins').insert([{ email, name, hashed_password: hashed }]).select().single();
      if (insertSuperErr) {
        console.error('Failed to insert into superadmins:', insertSuperErr.message || insertSuperErr);
        process.exit(2);
      }
      console.log('Inserted superadmin:', insertedSuper.email);
    }

    // Insert or update app_users row (check by email first)
    console.log('Checking existing app_users row...');
    const { data: existing, error: fetchErr } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
    if (fetchErr) {
      console.error('Failed to check existing app_users:', fetchErr.message || fetchErr);
      process.exit(2);
    }

    let data = null;
    if (existing) {
      console.log('Existing app_users row found, updating...');
      const { data: updated, error: updateErr } = await supabase.from('app_users').update({
        name,
        role: 'superadmin',
        hotel_id: null,
        hashed_password: hashed,
        enabled: true
      }).eq('id', existing.id).select().single();
      if (updateErr) {
        console.error('Failed to update app_users:', updateErr.message || updateErr);
        process.exit(2);
      }
      data = updated;
    } else {
      console.log('Inserting app_users row...');
      const { data: inserted, error: insertErr } = await supabase.from('app_users').insert([
        {
          email,
          name,
          role: 'superadmin',
          hotel_id: null,
          hashed_password: hashed,
          enabled: true
        }
      ]).select().single();
      if (insertErr) {
        console.error('Failed to insert app_users:', insertErr.message || insertErr);
        process.exit(2);
      }
      data = inserted;
    }

    console.log('Superadmin ready:', { id: data.id, email: data.email, role: data.role });
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message || err);
    process.exit(3);
  }
}

seed();
