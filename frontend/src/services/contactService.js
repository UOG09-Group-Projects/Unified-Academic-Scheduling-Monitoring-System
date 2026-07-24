import api from './api';

const contactService = {
  submit:   (payload) => api.post('/contact/', payload).then(r => r.data),
  list:     (params) => api.get('/contact/inquiries/', { params }).then(r => r.data),
  markStatus: (id, status) => api.patch(`/contact/inquiries/${id}/`, { status }).then(r => r.data),
  getStats: () => api.get('/contact/inquiries/stats/').then(r => r.data),
};

export default contactService;
