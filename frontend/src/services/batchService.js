import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
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