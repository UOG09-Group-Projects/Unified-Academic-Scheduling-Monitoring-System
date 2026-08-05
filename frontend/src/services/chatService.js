import axios from 'axios';
import { getAccessToken } from './authStorage';
import { API_BASE_URL } from './apiConfig';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/chat`,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const chatService = {
  list: async (before = null) => {
    const params = before ? { before } : {};
    const res = await client.get('/batch/messages/', { params });
    return res.data;
  },

  send: async (body) => {
    const res = await client.post('/batch/messages/', { body });
    return res.data;
  },

  // Student <-> educator direct messages
  listContacts: async () => {
    const res = await client.get('/dm/contacts/');
    return res.data;
  },

  listDmMessages: async (peerId) => {
    const res = await client.get(`/dm/${peerId}/messages/`);
    return res.data;
  },

  sendDm: async (peerId, body) => {
    const res = await client.post(`/dm/${peerId}/messages/`, { body });
    return res.data;
  },

  // OWNER/MANAGER read-only oversight
  listOversightConversations: async () => {
    const res = await client.get('/dm/oversight/');
    return res.data;
  },

  listOversightMessages: async (conversationId) => {
    const res = await client.get(`/dm/oversight/${conversationId}/messages/`);
    return res.data;
  },
};

export default chatService;
