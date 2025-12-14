const supabase = require('../config/supabase');

async function checkSubscription(req, res, next) {
  // superadmin bypass
  if (req.user && req.user.role === 'superadmin') return next();
  const hotelId = req.user && req.user.hotel_id;
  if (!hotelId) return res.status(400).json({ error: 'Missing hotel context' });
  try {
    const { data: hotel, error } = await supabase.from('hotels').select('id, subscription_end, status').eq('id', hotelId).maybeSingle();
    if (error) throw error;
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    const now = new Date();
    if (hotel.status !== 'active') return res.status(403).json({ error: 'Subscription inactive/disabled' });
    if (hotel.subscription_end && new Date(hotel.subscription_end) < now) return res.status(403).json({ error: 'Subscription inactive/expired' });
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { checkSubscription };
