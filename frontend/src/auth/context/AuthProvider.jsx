// src/auth/context/AuthProvider.jsx
import { useState } from "react";
import { AuthContext } from "./AuthContext";
import authService from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return authService.getUser();
  });

  const login = async (email, password) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
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