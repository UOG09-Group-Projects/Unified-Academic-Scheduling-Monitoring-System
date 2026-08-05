import axios from 'axios';
import { getAccessToken } from './authStorage';
import { API_BASE_URL } from './apiConfig';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/institutions`,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const announcementService = {
  list: async (batchId = null) => {
    const params = batchId ? { batch_id: batchId } : {};
    const res = await client.get('/announcements/', { params });
    return res.data;
  },

  create: async (payload) => {
    const res = await client.post('/announcements/', payload);
    return res.data;
  },

  remove: async (id) => {
    const res = await client.delete(`/announcements/${id}/`);
    return res.data;
  },
};

export default announcementService;
