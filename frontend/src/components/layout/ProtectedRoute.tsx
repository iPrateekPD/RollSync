import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (!user || user.role !== 'TEACHER') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
