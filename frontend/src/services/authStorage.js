// Tab-scoped auth storage. Uses sessionStorage (not localStorage) so that
// each browser tab can hold a different logged-in user independently —
// localStorage is shared across every tab of the same origin, which made a
// second login in another tab silently overwrite the first tab's session.

const USER_KEY    = 'user';
const ACCESS_KEY  = 'access_token';
const REFRESH_KEY = 'refresh_token';

// SUPER_ADMIN impersonation ("view as") — see PermissionsContext.jsx and
// backend institutions/views.py::ImpersonateStartView. The admin's own
// access/refresh/user are backed up under separate keys while an
// impersonation token is active, so "Exit impersonation" can restore them
// without a fresh login.
const IMPERSONATION_ACCESS_KEY  = 'impersonation_access_token';
const IMPERSONATION_EXPIRES_KEY = 'impersonation_expires_at';
const ADMIN_ACCESS_BACKUP_KEY   = 'admin_access_token_backup';
const ADMIN_REFRESH_BACKUP_KEY  = 'admin_refresh_token_backup';
const ADMIN_USER_BACKUP_KEY     = 'admin_user_backup';

export function isImpersonating() {
  return Boolean(sessionStorage.getItem(IMPERSONATION_ACCESS_KEY));
}

export function getImpersonationExpiry() {
  const v = sessionStorage.getItem(IMPERSONATION_EXPIRES_KEY);
  return v ? new Date(v) : null;
}

// Backs up the admin's current session, then switches every service (they
// all read the access token exclusively through getAccessToken() below) to
// the impersonation token — a single choke point, so no service file needs
// to know impersonation exists.
export function startImpersonation({ user, access, expiresAt }) {
  sessionStorage.setItem(ADMIN_ACCESS_BACKUP_KEY, sessionStorage.getItem(ACCESS_KEY) || '');
  sessionStorage.setItem(ADMIN_REFRESH_BACKUP_KEY, sessionStorage.getItem(REFRESH_KEY) || '');
  sessionStorage.setItem(ADMIN_USER_BACKUP_KEY, sessionStorage.getItem(USER_KEY) || '');

  sessionStorage.setItem(IMPERSONATION_ACCESS_KEY, access);
  sessionStorage.setItem(IMPERSONATION_EXPIRES_KEY, expiresAt);
  setStoredUser(user);
}

export function stopImpersonation() {
  const adminAccess  = sessionStorage.getItem(ADMIN_ACCESS_BACKUP_KEY);
  const adminRefresh = sessionStorage.getItem(ADMIN_REFRESH_BACKUP_KEY);
  const adminUser    = sessionStorage.getItem(ADMIN_USER_BACKUP_KEY);

  sessionStorage.removeItem(IMPERSONATION_ACCESS_KEY);
  sessionStorage.removeItem(IMPERSONATION_EXPIRES_KEY);
  sessionStorage.removeItem(ADMIN_ACCESS_BACKUP_KEY);
  sessionStorage.removeItem(ADMIN_REFRESH_BACKUP_KEY);
  sessionStorage.removeItem(ADMIN_USER_BACKUP_KEY);

  if (adminAccess) sessionStorage.setItem(ACCESS_KEY, adminAccess);
  if (adminRefresh) sessionStorage.setItem(REFRESH_KEY, adminRefresh);
  if (adminUser) sessionStorage.setItem(USER_KEY, adminUser);
}

export function getAccessToken() {
  const impersonationToken = sessionStorage.getItem(IMPERSONATION_ACCESS_KEY);
  return impersonationToken || sessionStorage.getItem(ACCESS_KEY);
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
  sessionStorage.removeItem(IMPERSONATION_ACCESS_KEY);
  sessionStorage.removeItem(IMPERSONATION_EXPIRES_KEY);
  sessionStorage.removeItem(ADMIN_ACCESS_BACKUP_KEY);
  sessionStorage.removeItem(ADMIN_REFRESH_BACKUP_KEY);
  sessionStorage.removeItem(ADMIN_USER_BACKUP_KEY);
}

export function authHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
