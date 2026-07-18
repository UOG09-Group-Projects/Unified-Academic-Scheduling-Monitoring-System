import axios from 'axios';
import { getAccessToken } from './authStorage';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const batchService = {

  getAll: async (params = {}) => {
    const res = await client.get('/batches/', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await client.get(`/batches/${id}/`);
    return res.data;
  },

  create: async (data) => {
    const res = await client.post('/batches/', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await client.put(`/batches/${id}/`, data);
    return res.data;
  },

  delete: async (id) => {
    await client.delete(`/batches/${id}/`);
  },
};

export default batchService;