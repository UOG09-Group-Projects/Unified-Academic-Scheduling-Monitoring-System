import axios from 'axios';

const API = 'http://localhost:8000/api';

const authService = {
  login: async (email, password) => {
    const res = await axios.post(`${API}/auth/login/`, { email, password });
    console.log('Full API response:', res.data);        // ← add this
    console.log('User object:', res.data.user);
    localStorage.setItem('access_token',  res.data.tokens.access);
    localStorage.setItem('refresh_token', res.data.tokens.refresh);
    localStorage.setItem('user',          JSON.stringify(res.data.user));
    return res.data.user;
  },

  logout: async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await axios.post(`${API}/auth/logout/`, { refresh });
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  getUser:       () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  getAccessToken:  () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  isLoggedIn:      () => !!localStorage.getItem('access_token'),
};

export default authService;