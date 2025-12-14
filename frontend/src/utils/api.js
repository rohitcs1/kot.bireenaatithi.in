/**
 * API Helper Utilities
 * 
 * Provides base URL configuration and helper functions for API calls
 * Supports GET, POST, PUT, DELETE methods with error handling
 */

// Base API URL
// TODO: Replace with actual API URL from environment variables
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Mock mode for development
export const MOCK_MODE = process.env.NODE_ENV === 'development' && !process.env.REACT_APP_USE_REAL_API;

/**
 * Get authentication token
 * TODO: Implement token handling from AuthContext or localStorage
 * @returns {string|null} - Auth token or null
 */
const getAuthToken = () => {
  // TODO: Get token from AuthContext or localStorage
  // const token = localStorage.getItem('kot-token');
  // return token;
  return localStorage.getItem('kot-token') || null;
};

/**
 * Get default headers for API requests
 * @param {object} customHeaders - Additional headers to include
 * @returns {object} - Headers object
 */
const getHeaders = (customHeaders = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  // TODO: Add Authorization header when token is available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API response
 * @param {Response} response - Fetch response object
 * @returns {Promise} - Parsed JSON or error
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
};

/**
 * Mock API response generator
 * TODO: Remove when backend is ready
 * @param {string} url - API endpoint
 * @param {object} options - Request options
 * @returns {Promise} - Mock response
 */
const getMockResponse = async (url, options = {}) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const method = options.method || 'GET';
  const endpoint = url.replace(API_BASE_URL, '');

  // Mock GET responses
  if (method === 'GET') {
    if (endpoint.includes('/orders')) {
      return [
        { id: 1, kotNumber: 'KOT-001', table: 'T-01', status: 'Active', total: 1250 },
        { id: 2, kotNumber: 'KOT-002', table: 'T-02', status: 'Ready', total: 2890 }
      ];
    }
    if (endpoint.includes('/menu')) {
      return [
        { id: 1, name: 'Chicken Biryani', price: 350, category: 'Main', isVeg: false },
        { id: 2, name: 'Paneer Tikka', price: 250, category: 'Starters', isVeg: true }
      ];
    }
    if (endpoint.includes('/tables')) {
      return [
        { id: 1, number: 'T-01', seats: 4, status: 'Available' },
        { id: 2, number: 'T-02', seats: 2, status: 'Occupied' }
      ];
    }
    if (endpoint.includes('/dashboard/stats')) {
      return {
        totalSalesToday: 45230,
        activeTables: 12,
        pendingOrders: 8,
        avgKitchenTime: 18
      };
    }
    return { message: 'Mock GET response', endpoint };
  }

  // Mock POST responses
  if (method === 'POST') {
    const body = options.body ? JSON.parse(options.body) : {};
    return {
      id: Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString(),
      status: 'success'
    };
  }

  // Mock PUT responses
  if (method === 'PUT') {
    const body = options.body ? JSON.parse(options.body) : {};
    return {
      ...body,
      updatedAt: new Date().toISOString(),
      status: 'success'
    };
  }

  // Mock DELETE responses
  if (method === 'DELETE') {
    return {
      message: 'Deleted successfully',
      status: 'success'
    };
  }

  return { message: 'Mock response', method, endpoint };
};

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {object} options - Fetch options
 * @returns {Promise} - API response
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Use mock response in development mode
  if (MOCK_MODE) {
    return getMockResponse(url, options);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: getHeaders(options.headers)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise} - API response
 * 
 * @example
 * const orders = await api.get('/orders');
 * const order = await api.get('/orders/123');
 * const filtered = await api.get('/orders', { status: 'active' });
 */
export const api = {
  get: async (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return apiRequest(url, { method: 'GET' });
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @returns {Promise} - API response
   * 
   * @example
   * const newOrder = await api.post('/orders', { table: 'T-01', items: [...] });
   */
  post: async (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @returns {Promise} - API response
   * 
   * @example
   * const updated = await api.put('/orders/123', { status: 'completed' });
   */
  put: async (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} - API response
   * 
   * @example
   * await api.delete('/orders/123');
   */
  delete: async (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' });
  }
};

export default api;

