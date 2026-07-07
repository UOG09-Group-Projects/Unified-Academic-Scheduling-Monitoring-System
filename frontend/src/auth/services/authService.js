import axios from 'axios';

const API = 'http://localhost:8000/api';

const authService = {
  login: async (email, password) => {
    const res = await axios.post(
      `${API}/auth/login/`,
      { email, password },
      { withCredentials: true }  // browser stores the httpOnly cookie
    );
    // Only store user info for UI — token lives in the cookie now
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data.user;
  },

  logout: async () => {
    try {
      await axios.post(
        `${API}/auth/logout/`,
        {},
        { withCredentials: true }  // server deletes the cookie
      );
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  getUser:    () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  isLoggedIn: () => !!localStorage.getItem('user'),
};

export default authService;