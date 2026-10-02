/**
 * Shared Axios instance, admin token storage and error helpers.
 *
 * The admin JWT is kept in memory and mirrored to sessionStorage so it
 * survives a page refresh but is cleared when the browser tab is closed.
 */
import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const TOKEN_KEY = 'manna_admin_token';
let memoryToken = null;

try {
  memoryToken = window.sessionStorage.getItem(TOKEN_KEY);
} catch {
  memoryToken = null; // sessionStorage can be unavailable (privacy mode); memory still works
}

/** Decode a JWT payload without verifying it (only used to check expiry). */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(payload));
  } catch {
    return null;
  }
}

export function getToken() {
  if (!memoryToken) return null;
  const payload = decodeJwt(memoryToken);
  if (!payload || (payload.exp && payload.exp * 1000 <= Date.now())) {
    clearToken();
    return null;
  }
  return memoryToken;
}

export function getAdminName() {
  const payload = memoryToken ? decodeJwt(memoryToken) : null;
  return payload?.username || 'Admin';
}

export function setToken(token) {
  memoryToken = token;
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore storage errors */
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

const isAdminUrl = (url = '') => url.startsWith('/admin');
let redirectingToLogin = false; // several requests can fail at once; redirect only once

// Attach the admin token to admin requests only.
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token && isAdminUrl(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or invalid token on an admin call sends the user back to the login page.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && isAdminUrl(url) && !url.startsWith('/admin/login')) {
      clearToken();
      if (!redirectingToLogin && !window.location.pathname.startsWith('/admin/login')) {
        redirectingToLogin = true;
        window.location.assign('/admin/login?expired=1');
      }
    }
    return Promise.reject(error);
  },
);

/** Human-friendly message for any Axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.status === 429) return 'Too many requests. Please wait a few minutes and try again.';
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and try again.';
  if (error?.request && !error.response) {
    return 'Could not reach the server. Please check your internet connection and try again.';
  }
  return fallback;
}

/** Field-level validation errors returned by the API ({fields: {name: message}}). */
export function getFieldErrors(error) {
  return error?.response?.data?.fields || {};
}

export default client;
