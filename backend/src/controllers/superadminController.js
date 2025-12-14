const supabase = require('../supabaseClient');
const bcrypt = require('bcrypt');

async function createHotel(req, res) {
  /* Expected body:
    { name, address, subscription_start, subscription_end, admin: { email, password, name } }
  */
  const { name, address, city, state, pin_code, subscription_start, subscription_end, owner_name, owner_email, owner_phone, admin } = req.body;
  if (!name || !admin || !admin.email || !admin.password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const { data: hotelData, error: hotelError } = await supabase.from('hotels').insert([
      {
        name,
        address,
        owner_name: owner_name || null,
        owner_phone: owner_phone || null,
        owner_email: owner_email || null,
        city: city || null,
        state: state || null,
        pincode: pin_code || null,
        subscription_start,
        subscription_end,
        status: 'active'
      }
    ]).select().single();
    if (hotelError) throw hotelError;

    const hashed = await bcrypt.hash(admin.password, 10);
    const { data: userData, error: userError } = await supabase.from('app_users').insert([
      { hotel_id: hotelData.id, role: 'admin', email: admin.email, name: admin.name || null, hashed_password: hashed, created_by: req.user ? req.user.user_id : null, enabled: true }
    ]).select().single();
    if (userError) throw userError;

    return res.json({ hotel: hotelData, admin: { id: userData.id, email: userData.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || err });
  }
}

async function listHotels(req, res) {
  try {
    const { data: hotels, error: hotelsErr } = await supabase.from('hotels').select('*');
    if (hotelsErr) throw hotelsErr;

    // Fetch admin/owner users for these hotels in one query
    const hotelIds = hotels.map(h => h.id).filter(Boolean);
    let owners = [];
    if (hotelIds.length > 0) {
      const { data: ownersData, error: ownersErr } = await supabase.from('app_users').select('id, hotel_id, name, email, role').in('hotel_id', hotelIds).eq('role', 'admin');
      if (ownersErr) throw ownersErr;
      owners = ownersData || [];
    }

    // Map owner name into hotel objects and compute status properly
    const now = new Date();
    const enriched = hotels.map(h => {
      const owner = owners.find(o => o.hotel_id === h.id);
      let computedStatus = h.status;
      // If status isn't disabled and subscription_end is past, mark as expired
      if (computedStatus !== 'disabled' && h.subscription_end) {
        const end = new Date(h.subscription_end);
        if (!isNaN(end.getTime()) && end < now) computedStatus = 'expired';
      }
      if (!computedStatus) computedStatus = 'active';
      return {
        ...h,
        status: computedStatus,
        // prefer explicit hotel.owner_name (saved on create) otherwise fall back to admin user name/email
        owner_name: h.owner_name || (owner ? (owner.name || owner.email) : null)
      };
    });

    return res.json({ hotels: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function toggleHotelStatus(req, res) {
  const { hotelId } = req.params;
  // Accept either { enabled: boolean } or { status: 'active'|'disabled' }
  const { enabled, status } = req.body;
  try {
    let newStatus;
    if (typeof enabled === 'boolean') newStatus = enabled ? 'active' : 'disabled';
    else if (typeof status === 'string') newStatus = status;
    else return res.status(400).json({ error: 'Missing status or enabled flag' });

    const { data, error } = await supabase.from('hotels').update({ status: newStatus }).eq('id', hotelId).select().single();
    if (error) throw error;

    // When disabling a hotel, disable all app users for that hotel so managers stop working
    if (newStatus === 'disabled') {
      const { error: uErr } = await supabase.from('app_users').update({ enabled: false }).eq('hotel_id', hotelId);
      if (uErr) console.warn('Failed to disable app_users for hotel', hotelId, uErr.message || uErr);
    }

    // When enabling, do NOT automatically re-enable users (admin can decide), but we leave this open.

    return res.json({ hotel: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteHotel(req, res) {
  const { hotelId } = req.params;
  try {
    // soft delete could be implemented; here we'll delete rows for brevity
    const { error } = await supabase.from('hotels').delete().eq('id', hotelId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listStaff(req, res) {
  const { hotelId } = req.params;
  try {
    const { data, error } = await supabase.from('app_users').select('id, email, name, role, enabled, created_by').eq('hotel_id', hotelId);
    if (error) throw error;
    return res.json({ staff: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function toggleUser(req, res) {
  const { userId } = req.params;
  const { enabled } = req.body;
  try {
    const { data, error } = await supabase.from('app_users').update({ enabled }).eq('id', userId).select().single();
    if (error) throw error;
    return res.json({ user: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteUser(req, res) {
  const { userId } = req.params;
  try {
    const { error } = await supabase.from('app_users').delete().eq('id', userId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function overview(req, res) {
  try {
    // fetch hotels and minimal fields
    const { data: hotels = [], error: hotelsErr } = await require('../supabaseClient').from('hotels').select('id, status, subscription_end, created_at');
    if (hotelsErr) throw hotelsErr;

    const now = new Date();

    // compute total and status counts (compute expired when subscription_end passed)
    let total = hotels.length;
    let active = 0, expired = 0, disabled = 0;
    hotels.forEach(h => {
      let s = h.status;
      if (s !== 'disabled' && h.subscription_end) {
        const end = new Date(h.subscription_end);
        if (!isNaN(end.getTime()) && end < now) s = 'expired';
      }
      if (!s) s = 'active';
      if (s === 'active') active++;
      else if (s === 'expired') expired++;
      else if (s === 'disabled') disabled++;
    });

    // subscription expiry trend - last 30 days
    const days = 30;
    const expiryTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      expiryTrend.push({ date: key, count: 0 });
    }
    const expiryIndex = expiryTrend.reduce((acc, item, idx) => (acc[item.date] = idx, acc), {});
    hotels.forEach(h => {
      if (!h.subscription_end) return;
      const key = new Date(h.subscription_end).toISOString().slice(0, 10);
      if (key in expiryIndex) expiryTrend[expiryIndex[key]].count++;
    });

    // hotels growth trend - last 6 months
    const months = 6;
    const growthTrend = [];
    const monthKeys = [];
    const nowMonth = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const m = new Date(nowMonth.getFullYear(), nowMonth.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(key);
      growthTrend.push({ month: key, count: 0 });
    }
    hotels.forEach(h => {
      if (!h.created_at) return;
      const d = new Date(h.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = monthKeys.indexOf(key);
      if (idx !== -1) growthTrend[idx].count++;
    });

    // total staff count (simple count)
    const { data: users = [], error: usersErr } = await require('../supabaseClient').from('app_users').select('id');
    if (usersErr) console.warn('Failed to fetch users count', usersErr.message || usersErr);
    const staffCount = users.length;

    return res.json({ overview: { total, active, expired, disabled, staffCount, expiryTrend, growthTrend } });
  } catch (err) {
    console.error('overview error', err);
    return res.status(500).json({ error: err.message || err });
  }
}

module.exports = { createHotel, listHotels, toggleHotelStatus, deleteHotel, listStaff, toggleUser, deleteUser, overview };
