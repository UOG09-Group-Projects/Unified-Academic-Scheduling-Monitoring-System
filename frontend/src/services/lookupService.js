import axios from 'axios';

const API = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API,
  withCredentials: true, // sends httpOnly cookie on every request
});

const lookupService = {
  listInstitutions: async () => {
    const res = await client.get('/institutions/');
    return res.data;
  },

  listBatches: async () => {
    const res = await client.get('/batches/');
    return res.data;
  },

  listEducators: async () => {
    const res = await client.get('/educators/');
    return res.data.map((e) => ({
      id: e.id,
      name: e.name,
    }));
  },
};

export default lookupService;