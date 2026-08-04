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

const educatorService = {
  bulkImport: async (file, { institutionId } = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    if (institutionId) fd.append('institution_id', institutionId);
    const res = await client.post('/educators/bulk-import/', fd);
    return res.data;
  },
};

export default educatorService;
