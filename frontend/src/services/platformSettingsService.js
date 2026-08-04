import { authHeader } from './authStorage';

const BASE_URL = 'http://localhost:8000/api/institutions/settings';

const platformSettingsService = {
  get: async () => {
    const res = await fetch(`${BASE_URL}/`, {
      credentials: 'include',
      headers: { ...authHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load settings.');
    return data;
  },

  update: async (payload) => {
    const res = await fetch(`${BASE_URL}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings.');
    return data;
  },

  reset: async () => {
    const res = await fetch(`${BASE_URL}/reset/`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...authHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset settings.');
    return data;
  },

  // Public, unauthenticated — safe to call before login.
  getPublic: async () => {
    const res = await fetch(`${BASE_URL}/public/`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load platform info.');
    return data;
  },
};

export default platformSettingsService;
