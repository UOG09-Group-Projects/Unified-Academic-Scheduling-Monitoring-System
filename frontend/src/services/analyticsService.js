import { authHeader } from './authStorage';
import { API_BASE_URL } from './apiConfig';

const BASE_URL = `${API_BASE_URL}/api/institutions/analytics`;

const analyticsService = {
  getTrends: async () => {
    const res = await fetch(`${BASE_URL}/trends/`, {
      credentials: 'include',
      headers: { ...authHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load analytics trends.');
    return data;
  },
};

export default analyticsService;
