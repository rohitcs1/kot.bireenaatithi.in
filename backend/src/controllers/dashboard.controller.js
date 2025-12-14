const supabase = require('../config/supabase');

async function getStats(req, res) {
  const hotelId = req.user.hotel_id;
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);

    // Orders created today
    const { data: ordersToday, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('created_at', startOfDay.toISOString());
    if (ordersErr) throw ordersErr;

    const totalSalesToday = (ordersToday || []).reduce((s, o) => s + (o.total || 0), 0);

    // Pending orders count (status = pending)
    const pendingRes = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('hotel_id', hotelId)
      .eq('status', 'pending');
    const pendingCount = pendingRes.count || 0;

    // Active tables (not available)
    const occupiedRes = await supabase
      .from('tables')
      .select('id', { count: 'exact' })
      .eq('hotel_id', hotelId)
      .neq('status', 'available');
    const occupiedCount = occupiedRes.count || 0;

    // Total tables
    const totalTablesRes = await supabase
      .from('tables')
      .select('id', { count: 'exact' })
      .eq('hotel_id', hotelId);
    const totalTables = totalTablesRes.count || 0;

    // Avg kitchen time (minutes) for completed orders in last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const { data: completedOrders, error: compErr } = await supabase
      .from('orders')
      .select('created_at, updated_at')
      .eq('hotel_id', hotelId)
      .eq('status', 'completed')
      .gte('updated_at', since.toISOString());
    if (compErr) throw compErr;

    let avgKitchenTime = null;
    if (completedOrders && completedOrders.length) {
      const totalMs = completedOrders.reduce((acc, o) => {
        const c = new Date(o.created_at).getTime();
        const u = new Date(o.updated_at || o.created_at).getTime();
        return acc + Math.max(0, u - c);
      }, 0);
      avgKitchenTime = Math.round((totalMs / completedOrders.length) / 60000); // minutes
    }

    return res.json({
      totalSalesToday,
      pendingOrders: pendingCount || 0,
      activeTables: occupiedCount || 0,
      totalTables: totalTables || 0,
      avgKitchenTime
    });
  } catch (err) {
    console.error('dashboard stats error', err);
    return res.status(500).json({ error: err.message });
  }
}

async function getSalesTrend(req, res) {
  const hotelId = req.user.hotel_id;
  try {
    // Get last 7 days of sales data
    const days = 7;
    const salesByDay = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Fetch orders for this day
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total')
        .eq('hotel_id', hotelId)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());
      
      if (error) throw error;
      
      const daySales = (orders || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      
      salesByDay.push({
        day: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `Day ${days - i}`,
        date: date.toISOString().split('T')[0],
        sales: Math.round(daySales)
      });
    }
    
    return res.json({ salesTrend: salesByDay });
  } catch (err) {
    console.error('sales trend error', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getStats, getSalesTrend };
