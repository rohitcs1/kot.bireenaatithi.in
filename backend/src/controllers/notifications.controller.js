const supabase = require('../config/supabase');

async function listNotifications(req, res) {
  const hotelId = req.user.hotel_id;
  const role = req.user.role;
  const userId = req.user.id;
  try {
    // Fetch unread notifications that are either targeted to this specific user OR role-based (or null)
    // Build query: hotel_id = hotelId AND is_read = false AND (target_user_id = userId OR role_target = role OR role_target IS NULL)
    const { data, error } = await supabase.from('notifications')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('is_read', false)
      .or(`target_user_id.eq.${userId},role_target.eq.${role},role_target.is.null`);
    if (error) throw error;
    return res.json({ notifications: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function markRead(req, res) {
  const { id } = req.params;
  try {
    const requester = req.user;
    // Only allow updating notifications that belong to the requester's hotel, unless superadmin
    let qb = supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (requester.role !== 'superadmin') qb = qb.eq('hotel_id', requester.hotel_id);
    const { data, error } = await qb.select().single();
    if (error) throw error;
    return res.json({ notification: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listNotifications, markRead };
