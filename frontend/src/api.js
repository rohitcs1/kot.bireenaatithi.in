import axios from 'axios';

// Build a normalized BASE_URL that always ends with '/api'
const rawEnvUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : null;

let BASE_URL;
if (rawEnvUrl) {
  const trimmed = rawEnvUrl.replace(/\/+$/, '');
  BASE_URL = trimmed.endsWith('/api') ? trimmed : (trimmed + '/api');
} else {
  BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Debug: show final baseURL in console to help diagnose incorrect env settings
if (typeof window !== 'undefined' && window.console && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.info('[api] baseURL =', BASE_URL);
}

// Attach token from localStorage at request time
api.interceptors.request.use((config) => {
  try {
    // read the same token key used by AuthContext
    const token = localStorage.getItem('kot-token') || sessionStorage.getItem('kot-token');
    if (token) config.headers.Authorization = 'Bearer ' + token;
  } catch (err) {
    // ignore
  }
  return config;
});

// Global response handler: on 401 remove stored auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const status = error && error.response && error.response.status;
      if (status === 401) {
        // clear potential stale tokens
        try {
          localStorage.removeItem('kot-token');
          localStorage.removeItem('kot-user');
          localStorage.removeItem('token');
          sessionStorage.removeItem('kot-token');
          sessionStorage.removeItem('kot-user');
        } catch (e) {
          // ignore storage errors
        }
        // Log helpful debug message
        // eslint-disable-next-line no-console
        console.warn('[api] Received 401 from server — cleared stored auth and redirecting to /login');
        if (typeof window !== 'undefined') {
          // redirect the user to login so they can re-authenticate
          window.location.pathname = '/login';
        }
      }
    } catch (e) {
      // swallow
    }
    return Promise.reject(error);
  }
);

export default api;
