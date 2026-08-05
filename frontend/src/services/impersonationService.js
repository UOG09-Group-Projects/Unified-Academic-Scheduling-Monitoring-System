import { authHeader } from './authStorage';
import { API_BASE_URL } from './apiConfig';

const BASE_URL = `${API_BASE_URL}/api/institutions/impersonate`;

const impersonationService = {
  start: async (email) => {
    const res = await fetch(`${BASE_URL}/start/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not start impersonation.');
    return data;
  },

  // Best-effort — just logs the audit trail entry server-side. Called with
  // whatever token is currently active (the impersonation token if a
  // session is live), so it must stay reachable even though it's a POST —
  // see institutions/access.py::IMPERSONATION_WRITE_EXEMPT_PATHS.
  stop: async () => {
    const res = await fetch(`${BASE_URL}/stop/`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...authHeader() },
    });
    return res.json().catch(() => ({}));
  },
};

export default impersonationService;
