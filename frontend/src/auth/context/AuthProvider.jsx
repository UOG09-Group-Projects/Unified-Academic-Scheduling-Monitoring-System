import { useState } from "react";
import { AuthContext } from "./AuthContext";


export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {

    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;

  });


  const login = async (email, password) => {

    if (
      email === "admin@lightlearn.com" &&
      password === "admin123"
    ) {

      const fakeUser = {
        email: "admin@lightlearn.com",
        id: 1
      };


      setUser(fakeUser);

      localStorage.setItem(
        "user",
        JSON.stringify(fakeUser)
      );


      return fakeUser;

    }


    throw new Error("Invalid credentials");

  };


  const logout = () => {

    setUser(null);

    localStorage.removeItem("user");

  };


  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}