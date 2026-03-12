import { apiRequest } from './api';

/**
 * Get current user profile from API
 */
export const getUserProfile = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const data = await apiRequest('/api/auth/me');
    return data.user;
  } catch {
    // Token invalid or expired
    localStorage.removeItem('auth_token');
    return null;
  }
};

/**
 * Login user
 */
export const loginUser = async (username, password) => {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (data.token) {
    localStorage.setItem('auth_token', data.token);
  }

  return data;
};

/**
 * Register user
 */
export const registerUser = async (username, email, password) => {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore errors on logout
  }
  localStorage.removeItem('auth_token');
};

/**
 * Update user profile
 */
export const updateProfile = async (data) => {
  return apiRequest('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({
      full_name: data.name || data.full_name,
      email: data.email,
      phone: data.phone || data.phone_number,
      about: data.about || data.about_me,
      avatar_url: data.avatar_url,
    }),
  });
};

/**
 * Change password
 */
export const changePassword = async (oldPassword, newPassword, confirmPassword) => {
  return apiRequest('/api/profile/password', {
    method: 'PUT',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
};
