import axios from 'axios';
import { getAccessToken } from './authStorage';

const API = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const lookupService = {
  listInstitutions: async () => {
    const res = await client.get('/institutions/');
    return res.data;
  },

  // ✅ accepts optional params → ?institution_id=3
  listBatches: async (params = {}) => {
    const res = await client.get('/batches/', { params });
    return res.data;
  },

  // ✅ accepts optional params + keeps the name mapping
  listEducators: async (params = {}) => {
    const res = await client.get('/educators/', { params });
    return res.data.map((e) => ({
      id: e.id,
      name: e.name,
    }));
  },
};

export default lookupService;