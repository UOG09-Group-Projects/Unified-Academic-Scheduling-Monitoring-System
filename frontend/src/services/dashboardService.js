// src/services/dashboardService.js
import axios from 'axios';
import { getAccessToken, clearSession } from './authStorage';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // sends httpOnly cookie automatically on every request
});

// Attach the per-tab bearer token so this client also works correctly when
// multiple tabs of the same browser are logged in as different users.
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Session expired or invalid — clear local state and send the user back to login.
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      clearSession();
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

  getParentMonthlyReport: (studentId, year, month) =>
    client.get('/dashboard/parent/report/', {
      params: { student_id: studentId, year, month },
    }).then(r => r.data),
};

export default dashboardService;