import axios from 'axios';

const client = axios.create({ baseURL: 'http://localhost:8000/api' });

const studentService = {
  list: async (search = '', batchId = null) => {
    const params = { search };
    if (batchId) params.batch = batchId;
    const res = await client.get('/students/', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await client.get(`/students/${id}/`);
    return res.data;
  },

  create: async (payload) => {
    const res = await client.post('/students/', payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await client.put(`/students/${id}/`, payload);
    return res.data;
  },

  remove: async (id) => {
    const res = await client.delete(`/students/${id}/`);
    return res.data;
  },

  listGuardians: async () => {
    const res = await client.get('/guardians/');
    return res.data;
  },

  createGuardian: async (payload) => {
    const res = await client.post('/guardians/', payload);
    return res.data;
  },
};

export default studentService;