import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";

type Props = {
  children: React.ReactNode;
};

function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("session_token");

    if (!token) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(() => {
        setAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("session_token");
        setAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
