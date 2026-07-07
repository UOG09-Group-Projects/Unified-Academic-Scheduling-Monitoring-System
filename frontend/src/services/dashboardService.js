// src/services/dashboardService.js
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // sends httpOnly cookie automatically on every request
});

// Redirect to login on 401
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const dashboardService = {
  getManagerDashboard:    () => client.get('/dashboard/manager/').then(r => r.data),
  getSuperAdminDashboard: () => client.get('/dashboard/super-admin/').then(r => r.data),
  getEducatorDashboard:   () => client.get('/dashboard/educator/').then(r => r.data),
  getStudentDashboard:    () => client.get('/dashboard/student/').then(r => r.data),
  getParentDashboard:     () => client.get('/dashboard/parent/').then(r => r.data),

  getEducatorDetail: (educatorId) =>
    client.get(`/educators/${educatorId}/`).then(r => r.data),

  getCalendarEvents: (year, month) =>
    client.get('/calendar/events/', {
      params: { year, month },
    }).then(r => r.data),
};

export default dashboardService;