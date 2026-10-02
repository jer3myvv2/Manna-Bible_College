import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../api/client';

/** Redirects to the admin login page when there is no valid (unexpired) token. */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
