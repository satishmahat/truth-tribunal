import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user || (role && user.role !== role)) {
    return <Navigate to="/" />;
  }
  return children;
} 