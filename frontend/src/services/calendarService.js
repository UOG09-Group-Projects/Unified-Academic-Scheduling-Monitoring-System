import api from './api';

const calendarService = {
  listEvents: async (year, month) => {
    const res = await api.get('/calendar/events/', { params: { year, month } });
    return res.data;
  },

  createEvent: async (payload) => {
    const res = await api.post('/calendar/events/', payload);
    return res.data;
  },

  updateEvent: async (id, payload) => {
    const res = await api.put(`/calendar/events/${id}/`, payload);
    return res.data;
  },

  deleteEvent: async (id) => {
    const res = await api.delete(`/calendar/events/${id}/`);
    return res.data;
  },

  listMyCourses: async () => {
    const res = await api.get('/calendar/my-courses/');
    return res.data;
  },
};

export default calendarService;
