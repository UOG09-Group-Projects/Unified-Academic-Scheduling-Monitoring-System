import axios from 'axios';
import { setSession, clearSession, getStoredUser } from '../../services/authStorage';

const API = 'http://localhost:8000/api';

const authService = {
  login: async (email, password) => {
    const res = await axios.post(
      `${API}/auth/login/`,
      { email, password },
      { withCredentials: true }  // browser stores the httpOnly cookie
    );

    setSession({ user: res.data.user, access: res.data.access, refresh: res.data.refresh });

    return res.data.user;
  },

  studentSignup: async ({ name, email, password, joinCode }) => {
    // No session is created here — the account can't log in until the
    // student verifies their email OTP and the institution approves them.
    const res = await axios.post(`${API}/students/signup/`, {
      name, email, password, join_code: joinCode,
    });
    return res.data;
  },

  verifyStudentOtp: async ({ email, code }) => {
    const res = await axios.post(
      `${API}/students/verify-otp/`,
      { email, code },
      { withCredentials: true }  // browser stores the httpOnly cookie
    );

    setSession({ user: res.data.user, access: res.data.access, refresh: res.data.refresh });

    return res.data.user;
  },

  resendStudentOtp: async (email) => {
    const res = await axios.post(`${API}/students/resend-otp/`, { email });
    return res.data;
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
      clearSession();
      window.location.href = '/login';
    }
  },

  getUser:    () => getStoredUser(),

  isLoggedIn: () => !!getStoredUser(),
};

export default authService;
