import axios from 'axios';
import { getAccessToken } from './authStorage';
import { API_BASE_URL } from './apiConfig';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/timetable`,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const timetableService = {
  list: async (batchId = null) => {
    const params = batchId ? { batch: batchId } : {};
    const res = await client.get('/slots/', { params });
    return res.data;
  },

  create: async (payload) => {
    const res = await client.post('/slots/', payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await client.put(`/slots/${id}/`, payload);
    return res.data;
  },

  remove: async (id) => {
    const res = await client.delete(`/slots/${id}/`);
    return res.data;
  },
};

export default timetableService;
