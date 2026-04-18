import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface Props {
  children: React.ReactNode;
  roles?: Array<'donor' | 'caretaker' | 'admin'>;
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-page">{'\u2003'}Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
