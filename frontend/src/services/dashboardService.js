// src/services/dashboardService.js
import axios from 'axios';

const client = axios.create({ baseURL: 'http://localhost:8000/api' });

// ✅ Attach token to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Auto-refresh or redirect on 401
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const dashboardService = {
  // ── Existing ─────────────────────────────────────────────
  getManagerDashboard:    () => client.get('/dashboard/manager/').then(r => r.data),
  getSuperAdminDashboard: () => client.get('/dashboard/super-admin/').then(r => r.data),
  getEducatorDashboard:   () => client.get('/dashboard/educator/').then(r => r.data),
  getStudentDashboard:    () => client.get('/dashboard/student/').then(r => r.data),
  getParentDashboard:     () => client.get('/dashboard/parent/').then(r => r.data),

  // ── NEW: Inline educator detail ───────────────────────────
  getEducatorDetail: (educatorId) =>
    client.get(`/educators/${educatorId}/`).then(r => r.data),

  // ── NEW: Calendar events ──────────────────────────────────
  getCalendarEvents: (year, month) =>
    client.get('/calendar/events/', {
      params: { year, month },
    }).then(r => r.data),
};

export default dashboardService;