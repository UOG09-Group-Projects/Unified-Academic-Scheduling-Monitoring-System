import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from "../../auth/context/AuthProvider";
import authService from "../../auth/services/authService";
import LoginPage from "../LoginPage";
import ProtectedRoute from '../../auth/ProtectedRoute';

// ── Axios interceptors ──────────────────────────────────────────
// Auto-attach access token to every request
axios.interceptors.request.use((config) => {
  const token = authService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401, retry original request once
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = authService.getRefreshToken();
        const res = await axios.post(
          'http://localhost:8000/api/auth/refresh/',
          { refresh }
        );
        localStorage.setItem('access_token', res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return axios(original);
      } catch {
        // Refresh also failed — force logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
// ────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"       element={<Navigate to="/login" replace />} />
          <Route path="/login"  element={<LoginPage />} />

          <Route path="/unauthorized" element={
            <div className="flex items-center justify-center h-screen text-gray-500">
              You don't have permission to view this page.
            </div>
          } />

          {/* Dashboards — placeholders until we build each one */}
          <Route path="/dashboard/super-admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <div className="p-8 text-gray-500">Super Admin Dashboard — coming soon</div>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/manager" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
              <div className="p-8 text-gray-500">Manager Dashboard — coming soon</div>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/educator" element={
            <ProtectedRoute allowedRoles={['EDUCATOR']}>
              <div className="p-8 text-gray-500">Educator Dashboard — coming soon</div>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/student" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <div className="p-8 text-gray-500">Student Dashboard — coming soon</div>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/parent" element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <div className="p-8 text-gray-500">Parent Dashboard — coming soon</div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);