import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for API calls (GET/POST)
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {boolean} immediate - Whether to fetch immediately on mount
 * @returns {object} { data, loading, error, refetch, execute }
 * 
 * @example
 * // GET request
 * const { data, loading, error } = useFetch('/api/orders');
 * 
 * @example
 * // POST request with immediate execution
 * const { data, loading, error, execute } = useFetch('/api/orders', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ table: 'T-01' })
 * }, false);
 * 
 * // Execute later
 * execute();
 */
const useFetch = (url, options = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // TODO: Replace with actual API base URL
  // const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  // const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const execute = useCallback(async (customUrl = null, customOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Mock API for development - TODO: Remove when backend is ready
      if (process.env.NODE_ENV === 'development' && url.includes('/api/')) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock responses based on endpoint
        const mockData = getMockResponse(customUrl || url, customOptions);
        setData(mockData);
        setLoading(false);
        return { data: mockData, error: null };
      }

      // Actual API call
      const fetchUrl = customUrl || url;
      const fetchOptions = { ...options, ...customOptions };
      
      const response = await fetch(fetchUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
      setLoading(false);
      return { data: jsonData, error: null };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while fetching data';
      setError(errorMessage);
      setLoading(false);
      setData(null);
      return { data: null, error: errorMessage };
    }
  }, [url, options]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, refetch, execute };
};

/**
 * Mock response generator for development
 * TODO: Remove when backend API is ready
 */
const getMockResponse = (url, options = {}) => {
  // Mock GET responses
  if (options.method === 'GET' || !options.method) {
    if (url.includes('/api/orders')) {
      return [
        { id: 1, kotNumber: 'KOT-001', table: 'T-01', status: 'Active' },
        { id: 2, kotNumber: 'KOT-002', table: 'T-02', status: 'Ready' }
      ];
    }
    if (url.includes('/api/menu')) {
      return [
        { id: 1, name: 'Chicken Biryani', price: 350, category: 'Main' },
        { id: 2, name: 'Paneer Tikka', price: 250, category: 'Starters' }
      ];
    }
    if (url.includes('/api/tables')) {
      return [
        { id: 1, number: 'T-01', seats: 4, status: 'Available' },
        { id: 2, number: 'T-02', seats: 2, status: 'Occupied' }
      ];
    }
    return { message: 'Mock data', url };
  }

  // Mock POST responses
  if (options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body) : {};
    return {
      id: Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString(),
      status: 'success'
    };
  }

  return { message: 'Mock response', method: options.method };
};

export default useFetch;

