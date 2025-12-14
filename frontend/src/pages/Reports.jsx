import React, { useState, useEffect } from 'react';
import api from '../api';
import './Reports.css';

const Reports = () => {
  const [dateRange, setDateRange] = useState('today');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [waiterPerformance, setWaiterPerformance] = useState([]);
  const [orderTrend, setOrderTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate date ranges
  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (range) {
      case 'today':
        return { start: today, end: endDate };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: new Date(yesterday.getTime() + 86400000 - 1) };
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return { start: sevenDaysAgo, end: endDate };
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return { start: thirtyDaysAgo, end: endDate };
      default:
        return { start: today, end: endDate };
    }
  };

  const dateRangeData = getDateRange(dateRange);

  // Live statistics state
  const [stats, setStats] = useState({ revenue: 0, orders: 0, avgOrderValue: 0, voids: 0 });

  // Fetch report data from backend
  const fetchReports = async () => {
    setLoading(true);
    try {
      const dr = getDateRange(dateRange);
      const startDate = dr.start.toISOString();
      const endDate = dr.end.toISOString();

      const [dashboardRes, topItemsRes, waitersRes, orderTrendRes, revenueTrendRes] = await Promise.all([
        api.get('/reports/dashboard', { params: { startDate, endDate } }).catch(e => null),
        api.get('/reports/top-selling-items', { params: { startDate, endDate } }).catch(e => null),
        api.get('/reports/waiter-performance', { params: { startDate, endDate } }).catch(e => null),
        api.get('/reports/order-trend', { params: { startDate, endDate } }).catch(e => null),
        api.get('/reports/revenue-trend', { params: { startDate, endDate } }).catch(e => null)
      ]);

      setTopSellingItems(topItemsRes?.data?.topSellingItems || []);
      setWaiterPerformance(waitersRes?.data?.waiters || []);
      setOrderTrend(orderTrendRes?.data?.trend || []);
      setRevenueTrend(revenueTrendRes?.data?.trend || []);

      // compute totals from trends if available
      const totalOrders = (orderTrendRes?.data?.trend || []).reduce((s, d) => s + (d.orders || 0), 0);
      const totalRevenue = (revenueTrendRes?.data?.trend || []).reduce((s, d) => s + (d.revenue || 0), 0);
      // prepare stats object
      const newStats = { revenue: 0, orders: 0, avgOrderValue: 0, voids: 0 };
      if (dashboardRes && dashboardRes.data) {
        newStats.revenue = dashboardRes.data.todaysSales || totalRevenue;
        newStats.orders = dashboardRes.data.activeOrders || totalOrders;
      } else {
        newStats.revenue = totalRevenue;
        newStats.orders = totalOrders;
      }
      newStats.avgOrderValue = totalOrders ? (totalRevenue / totalOrders) : 0;
      setStats(newStats);

    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // derive chart data from trends
  const chartData = orderTrend.map((d, idx) => ({
    day: d.date,
    orders: d.orders || 0,
    revenue: (revenueTrend[idx] && revenueTrend[idx].revenue) || 0
  }));

  const maxRevenue = chartData.length ? Math.max(...chartData.map(d => d.revenue)) : 0;
  const maxOrders = chartData.length ? Math.max(...chartData.map(d => d.orders)) : 0;

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data
  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Export handlers
  const handleExportCSV = () => {
    // TODO: Implement CSV export
    alert('CSV export functionality will be implemented');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export functionality will be implemented');
  };

  const sortedTopItems = getSortedData(topSellingItems);
  const sortedWaiters = getSortedData(waiterPerformance);

  return (
    <div className="reports-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="reports-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1>Reports</h1>
              <p>Analytics and performance insights</p>
            </div>
            <div className="reports-header-actions">
              <button
                onClick={handleExportCSV}
                className="reports-export-btn reports-export-btn-csv"
              >
                <svg className="reports-export-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="reports-export-btn reports-export-btn-pdf"
              >
                <svg className="reports-export-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4m5 4v6m5-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="reports-date-range">
          <div className="reports-date-buttons">
            <button
              onClick={() => setDateRange('today')}
              className={`reports-date-btn ${dateRange === 'today' ? 'active' : ''}`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('yesterday')}
              className={`reports-date-btn ${dateRange === 'yesterday' ? 'active' : ''}`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateRange('7days')}
              className={`reports-date-btn ${dateRange === '7days' ? 'active' : ''}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`reports-date-btn ${dateRange === '30days' ? 'active' : ''}`}
            >
              Last 30 Days
            </button>
          </div>
          <p className="reports-date-info">
            Showing data from {formatDate(dateRangeData.start)} to {formatDate(dateRangeData.end)}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="reports-stats-grid">
          {/* Revenue Card */}
          <div className="reports-stat-card revenue">
            <div className="reports-stat-header">
              <p className="reports-stat-label">Total Revenue</p>
              <div className="reports-stat-icon revenue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="reports-stat-value">₹{stats.revenue.toLocaleString()}</p>
            <p className="reports-stat-change positive">+12.5% from previous period</p>
          </div>

          {/* Orders Card */}
          <div className="reports-stat-card orders">
            <div className="reports-stat-header">
              <p className="reports-stat-label">Total Orders</p>
              <div className="reports-stat-icon orders">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="reports-stat-value">{stats.orders}</p>
            <p className="reports-stat-change positive">+8.3% from previous period</p>
          </div>

          {/* Avg Order Value Card */}
          <div className="reports-stat-card avg-order">
            <div className="reports-stat-header">
              <p className="reports-stat-label">Avg Order Value</p>
              <div className="reports-stat-icon avg-order">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="reports-stat-value">₹{stats.avgOrderValue.toFixed(2)}</p>
            <p className="reports-stat-change positive">+5.2% from previous period</p>
          </div>

          {/* Voids Card */}
          <div className="reports-stat-card voids">
            <div className="reports-stat-header">
              <p className="reports-stat-label">Voids</p>
              <div className="reports-stat-icon voids">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="reports-stat-value">{stats.voids}</p>
            <p className="reports-stat-change negative">-2 from previous period</p>
          </div>
        </div>

        {/* Charts */}
        <div className={dateRange === '30days' ? 'reports-charts-grid-30' : 'reports-charts-grid'}>
          {/* Revenue Chart */}
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Revenue Trend</h3>
            <div className="reports-chart-container">
              {chartData.map((data, index) => {
                const height = (data.revenue / maxRevenue) * 100;
                return (
                  <div key={index} className="reports-chart-bar-wrapper">
                    <div 
                      className="reports-chart-bar revenue" 
                      style={{ height: `${height}%` }}
                      title={`₹${data.revenue.toLocaleString()}`}
                    ></div>
                    <span className="reports-chart-label">{data.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="reports-chart-legend">
              <div className="reports-chart-legend-item">
                <div className="reports-chart-legend-dot revenue"></div>
                <span>Revenue</span>
              </div>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Orders Trend</h3>
            <div className="reports-chart-container">
              {chartData.map((data, index) => {
                const height = (data.orders / maxOrders) * 100;
                return (
                  <div key={index} className="reports-chart-bar-wrapper">
                    <div 
                      className="reports-chart-bar orders" 
                      style={{ height: `${height}%` }}
                      title={`${data.orders} orders`}
                    ></div>
                    <span className="reports-chart-label">{data.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="reports-chart-legend">
              <div className="reports-chart-legend-item">
                <div className="reports-chart-legend-dot orders"></div>
                <span>Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="reports-tables-grid">
          {/* Top Selling Items */}
          <div className="reports-table-card">
            <div className="reports-table-header">
              <h3 className="reports-table-title">Top Selling Items</h3>
            </div>
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th 
                      className={`sortable ${sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                      onClick={() => handleSort('name')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Item
                        {sortConfig.key === 'name' && (
                          <svg className="reports-table-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </span>
                    </th>
                    <th 
                      className={`sortable ${sortConfig.key === 'quantity' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                      onClick={() => handleSort('quantity')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Qty
                        {sortConfig.key === 'quantity' && (
                          <svg className="reports-table-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </span>
                    </th>
                    <th 
                      className={`sortable ${sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                      onClick={() => handleSort('revenue')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Revenue
                        {sortConfig.key === 'revenue' && (
                          <svg className="reports-table-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div>Loading...</div>
                      </td>
                    </tr>
                  ) : sortedTopItems.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div>No items found for the selected date range</div>
                      </td>
                    </tr>
                  ) : (
                    sortedTopItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="reports-table-item-name">{item.name}</div>
                        <div className="reports-table-item-category">{item.category}</div>
                      </td>
                      <td>
                        <span className="reports-table-number">{item.quantity}</span>
                      </td>
                      <td>
                          <span className="reports-table-value">₹{Math.round(item.revenue).toLocaleString()}</span>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Waiter Performance */}
          <div className="reports-table-card">
            <div className="reports-table-header">
              <h3 className="reports-table-title">Waiter Performance</h3>
            </div>
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th 
                      className={`sortable ${sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                      onClick={() => handleSort('name')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Waiter
                        {sortConfig.key === 'name' && (
                          <svg className="reports-table-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </span>
                    </th>
                    <th 
                      className={`sortable ${sortConfig.key === 'orders' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                      onClick={() => handleSort('orders')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Orders
                        {sortConfig.key === 'orders' && (
                          <svg className="reports-table-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </span>
                    </th>
                    <th 
                      className={`sortable ${sortConfig.key === 'revenue' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                      onClick={() => handleSort('revenue')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Revenue
                        {sortConfig.key === 'revenue' && (
                          <svg className="reports-table-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </span>
                    </th>
                    <th 
                      className={`sortable ${sortConfig.key === 'avgOrderValue' ? (sortConfig.direction === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`}
                      onClick={() => handleSort('avgOrderValue')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        Avg Value
                        {sortConfig.key === 'avgOrderValue' && (
                          <svg className="reports-table-sort-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWaiters.map((waiter) => (
                    <tr key={waiter.id}>
                      <td>
                        <span className="reports-table-item-name">{waiter.name}</span>
                      </td>
                      <td>
                        <span className="reports-table-number">{waiter.orders}</span>
                      </td>
                      <td>
                        <span className="reports-table-value">₹{waiter.revenue.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="reports-table-number">₹{waiter.avgOrderValue.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;


