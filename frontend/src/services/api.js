import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/**
 * Logout callback registered by AuthContext so that api.js
 * can trigger a proper React-state logout without importing AuthContext
 * (which would create a circular dependency).
 */
let _logoutCallback = null;

export function registerLogoutCallback(fn) {
  _logoutCallback = fn;
}

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yohanan_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (_logoutCallback) {
        // Trigger proper React-state logout (clears localStorage + state)
        _logoutCallback();
      } else {
        // Fallback if callback not registered yet
        localStorage.removeItem('yohanan_token');
        localStorage.removeItem('yohanan_user');
      }
      // Navigate to login only if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
