/**
 * API configuration for connecting to Cloudflare Worker backend
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flostfound-api.tbybsmoke171216.workers.dev';

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token');

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Đã xảy ra lỗi');
  }

  return data;
}

export { API_BASE_URL, apiRequest };
