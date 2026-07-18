// Tab-scoped auth storage. Uses sessionStorage (not localStorage) so that
// each browser tab can hold a different logged-in user independently —
// localStorage is shared across every tab of the same origin, which made a
// second login in another tab silently overwrite the first tab's session.

const USER_KEY    = 'user';
const ACCESS_KEY  = 'access_token';
const REFRESH_KEY = 'refresh_token';

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)) ?? null; }
  catch { return null; }
}

export function setStoredUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setSession({ user, access, refresh }) {
  if (user) setStoredUser(user);
  if (access) sessionStorage.setItem(ACCESS_KEY, access);
  if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
}

export function clearSession() {
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function authHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
