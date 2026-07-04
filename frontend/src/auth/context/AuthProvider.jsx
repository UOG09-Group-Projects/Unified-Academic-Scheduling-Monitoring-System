// src/auth/context/AuthProvider.jsx
import { useState } from "react";
import { AuthContext } from "./AuthContext";
import authService from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = authService.getAccessToken();
    const storedUser = authService.getUser();

    // Only restore session if BOTH token and user exist
    if (!token || !storedUser) {
      authService.logout(); // wipe any partial/stale state
      return null;
    }
    return storedUser;
  });

  const login = async (email, password) => {
    const user = await authService.login(email, password);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}