import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Enrollment APIs
export const enrollmentAPI = {
  getAll: () => api.get("/enrollments/"),
  getById: (id) => api.get(`/enrollments/${id}/`),
  create: (data) => api.post("/enrollments/", data),
  update: (id, data) => api.put(`/enrollments/${id}/`, data),
  delete: (id) => api.delete(`/enrollments/${id}/`),
  getDropdownData: () => api.get("/enrollments/dropdown-data/"),
};

export default api;