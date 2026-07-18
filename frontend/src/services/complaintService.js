import api from './api';

const complaintService = {
  list:    (params) => api.get('/complaints/', { params }).then(r => r.data),
  create:  (payload) => api.post('/complaints/', payload).then(r => r.data),
  respond: (id, payload) => api.put(`/complaints/${id}/`, payload).then(r => r.data),
  getStats: () => api.get('/complaints/stats/').then(r => r.data),
};

export default complaintService;
