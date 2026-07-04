import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/hooks/useAuth";

export default function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    switch (user.role) {
      case "SUPER_ADMIN":
        return <Navigate to="/dashboard/super-admin" replace />;
      case "OWNER":
      case "MANAGER":
        return <Navigate to="/dashboard/manager" replace />;
      case "EDUCATOR":
        return <Navigate to="/dashboard/educator" replace />;
      case "STUDENT":
        return <Navigate to="/dashboard/student" replace />;
      case "PARENT":
        return <Navigate to="/dashboard/parent" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}