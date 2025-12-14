const supabase = require('../config/supabase');

async function dashboard(req, res) {
  const hotelId = req.user.hotel_id;
  const { startDate, endDate } = req.query;
  try {
    // Determine date range: default to today if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0,0,0,0));

    // Fetch counts using head=true to get exact counts without pulling rows
    const [{ count: tablesCount, error: tErr }, { count: activeOrdersCount, error: oErr }] = await Promise.all([
      supabase.from('tables').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).neq('status', 'completed')
    ]);
    if (tErr) throw tErr;
    if (oErr) throw oErr;

    // Sum sales from completed orders within date range
    const { data: salesOrders, error: salesErr } = await supabase
      .from('orders')
      .select('total')
      .eq('hotel_id', hotelId)
      .eq('status', 'completed')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    if (salesErr) throw salesErr;

    const todaysSales = (salesOrders || []).reduce((s, r) => s + parseFloat(r.total || 0), 0);

    return res.json({ totalTables: tablesCount || 0, activeOrders: activeOrdersCount || 0, todaysSales });
  } catch (err) {
    console.error('reports.dashboard error', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

async function getTopSellingItems(req, res) {
  const hotelId = req.user.hotel_id;
  const { startDate, endDate } = req.query;
  
  try {
    // Build date filter
    let ordersQuery = supabase
      .from('orders')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('status', 'completed');
    
    if (startDate) {
      ordersQuery = ordersQuery.gte('created_at', startDate);
    }
    if (endDate) {
      ordersQuery = ordersQuery.lte('created_at', endDate);
    }
    
    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;
    
    if (!orders || orders.length === 0) {
      return res.json({ topSellingItems: [] });
    }
    
    const orderIds = orders.map(o => o.id);
    
    // Fetch order items with menu details
    // Request related menu and its category (menu_categories) correctly
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('menu_id, qty, price, menus(name, category_id, menu_categories(name))')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('reports.getTopSellingItems - order_items query error', itemsError);
    }
    
    if (itemsError) throw itemsError;
    
    // Aggregate by menu item
    const itemMap = {};
    (orderItems || []).forEach(item => {
      const menuId = item.menu_id;
      if (!menuId) return;
      
      const menuName = item.menus?.name || 'Unknown Item';
      const categoryName = item.menus?.categories?.name || 'Uncategorized';
      const quantity = item.qty || 1;
      const price = parseFloat(item.price || 0);
      const revenue = quantity * price;
      
      if (!itemMap[menuId]) {
        itemMap[menuId] = {
          id: menuId,
          name: menuName,
          category: categoryName,
          quantity: 0,
          revenue: 0
        };
      }
      
      itemMap[menuId].quantity += quantity;
      itemMap[menuId].revenue += revenue;
    });
    
    // Convert to array and sort by revenue (descending)
    const topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20); // Top 20 items
    
    return res.json({ topSellingItems });
  } catch (err) {
    console.error('getTopSellingItems error', err);
    return res.status(500).json({ error: err.message });
  }
}

async function getWaiterPerformance(req, res) {
  const hotelId = req.user.hotel_id;
  const { startDate, endDate } = req.query;
  try {
    // Fetch completed orders in date range
    let q = supabase.from('orders').select('id, waiter_id, total, created_at').eq('hotel_id', hotelId).eq('status', 'completed');
    if (startDate) q = q.gte('created_at', startDate);
    if (endDate) q = q.lte('created_at', endDate);
    const { data: orders, error: ordersError } = await q;
    if (ordersError) throw ordersError;

    // Aggregate by waiter_id
    const map = {};
    (orders || []).forEach(o => {
      const wid = o.waiter_id || 0;
      if (!map[wid]) map[wid] = { waiter_id: wid, orders: 0, revenue: 0 };
      map[wid].orders += 1;
      map[wid].revenue += parseFloat(o.total || 0);
    });

    const waiterIds = Object.keys(map).filter(id => Number(id) > 0).map(id => Number(id));
    let users = [];
    if (waiterIds.length > 0) {
      const { data: udata, error: uerr } = await supabase.from('app_users').select('id,name,email').in('id', waiterIds);
      if (uerr) console.warn('getWaiterPerformance: could not fetch user names', uerr.message || uerr);
      users = udata || [];
    }

    const result = Object.values(map).map(w => {
      const user = users.find(u => u.id === w.waiter_id) || {};
      return {
        id: w.waiter_id,
        name: user.name || user.email || `Waiter ${w.waiter_id}`,
        orders: w.orders,
        revenue: w.revenue,
        avgOrderValue: w.orders ? (w.revenue / w.orders) : 0
      };
    }).sort((a,b) => b.revenue - a.revenue);

    return res.json({ waiters: result });
  } catch (err) {
    console.error('getWaiterPerformance error', err);
    return res.status(500).json({ error: err.message });
  }
}

// Return order counts per day within range (defaults to last 7 days)
async function getOrderTrend(req, res) {
  const hotelId = req.user.hotel_id;
  let { startDate, endDate } = req.query;
  try {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);

    const { data: orders, error } = await supabase.from('orders').select('id, created_at').eq('hotel_id', hotelId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).eq('status','completed');
    if (error) throw error;

    // Initialize date buckets
    const buckets = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0,10);
      buckets[key] = 0;
    }

    (orders || []).forEach(o => {
      const key = (new Date(o.created_at)).toISOString().slice(0,10);
      if (buckets[key] !== undefined) buckets[key] += 1;
    });

    const trend = Object.keys(buckets).map(k => ({ date: k, orders: buckets[k] }));
    return res.json({ trend });
  } catch (err) {
    console.error('getOrderTrend error', err);
    return res.status(500).json({ error: err.message });
  }
}

// Return revenue per day within range (defaults to last 7 days)
async function getRevenueTrend(req, res) {
  const hotelId = req.user.hotel_id;
  let { startDate, endDate } = req.query;
  try {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);

    const { data: orders, error } = await supabase.from('orders').select('id, created_at, total').eq('hotel_id', hotelId).gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).eq('status','completed');
    if (error) throw error;

    const buckets = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0,10);
      buckets[key] = 0;
    }

    (orders || []).forEach(o => {
      const key = (new Date(o.created_at)).toISOString().slice(0,10);
      const amt = parseFloat(o.total || 0);
      if (buckets[key] !== undefined) buckets[key] += amt;
    });

    const trend = Object.keys(buckets).map(k => ({ date: k, revenue: buckets[k] }));
    return res.json({ trend });
  } catch (err) {
    console.error('getRevenueTrend error', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { dashboard, getTopSellingItems, getWaiterPerformance, getOrderTrend, getRevenueTrend };

