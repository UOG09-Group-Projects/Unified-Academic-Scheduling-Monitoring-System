import axios from 'axios';

const API = 'http://localhost:8000/api';

const authService = {
  login: async (email, password) => {
    const res = await axios.post(
      `${API}/auth/login/`,
      { email, password },
      { withCredentials: true }  // browser stores the httpOnly cookie
    );

    localStorage.setItem('user', JSON.stringify(res.data.user));
    if (res.data.access) localStorage.setItem('access_token', res.data.access);
    if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);

    return res.data.user;
  },

  studentSignup: async ({ name, email, password, institutionId }) => {
    const res = await axios.post(
      `${API}/students/signup/`,
      { name, email, password, institution_id: institutionId },
      { withCredentials: true }  // browser stores the httpOnly cookie
    );

    localStorage.setItem('user', JSON.stringify(res.data.user));
    if (res.data.access) localStorage.setItem('access_token', res.data.access);
    if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);

    return res.data.user;
  },

  listPublicInstitutions: async () => {
    const res = await axios.get(`${API}/institutions/public/`);
    return res.data;
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
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
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