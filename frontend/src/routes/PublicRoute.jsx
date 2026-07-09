import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/hooks/useAuth";

export default function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
        return <Navigate to="/dashboard/super-admin" replace />;
        //return <Navigate to="/dashboard/manager" replace />;
        //return <Navigate to="/dashboard/educator" replace />;
        //return <Navigate to="/dashboard/student" replace />;
        //return <Navigate to="/dashboard/parent" replace />;
        //return <Navigate to="/login" replace />;
 }

  return children;
}