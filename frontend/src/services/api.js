import axios from "axios";
import { getAccessToken, clearSession } from "./authStorage";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

// Attach token automatically to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Session expired or invalid — clear local state and send the user back to login
// instead of leaving every page silently failing with 401s.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
