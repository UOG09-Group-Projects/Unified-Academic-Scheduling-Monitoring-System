// src/services/dashboardService.js
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // sends httpOnly cookie automatically on every request
});

// Redirect to login on 401 only for real backend-auth flows.
// The temporary frontend-only demo login does not have a backend session,
// so skip the redirect to keep the dashboard usable locally.
client.interceptors.response.use(
  response => response,
  error => {
    const isDemoLogin = localStorage.getItem('user')?.includes('demo@lightlearn.com');
    if (error.response?.status === 401 && !isDemoLogin) {
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
  getOwnerDashboard:      () => client.get('/dashboard/owner/').then(r => r.data),

  getEducatorDetail: (educatorId) =>
    client.get(`/educators/${educatorId}/`).then(r => r.data),

  getCalendarEvents: (year, month) =>
    client.get('/calendar/events/', {
      params: { year, month },
    }).then(r => r.data),
};

export default dashboardService;