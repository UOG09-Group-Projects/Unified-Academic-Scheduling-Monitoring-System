const API_BASE = 'http://localhost:8000/api';

export const batchService = {

  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/batches/?${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch batches');
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE}/batches/${id}/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch batch');
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE}/batches/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create batch');
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE}/batches/${id}/`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update batch');
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE}/batches/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete batch');
  },
};

export default batchService;