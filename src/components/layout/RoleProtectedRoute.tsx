// components/layout/RoleProtectedRoute.tsx
import { ReactNode } from 'react';
import { useAppSelector } from '../../redux/hooks';
import { getCurrentUser } from '../../redux/services/authSlice';
import { Navigate, useLocation } from 'react-router-dom';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const user = useAppSelector(getCurrentUser);
  const location = useLocation();

  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace={true} />;
  }

  // If specific roles are required, check if user has one of them
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role.toUpperCase();
    const hasRequiredRole = allowedRoles.some(role => role.toUpperCase() === userRole);
    
    if (!hasRequiredRole) {
      return <Navigate to='/unauthorized' replace={true} />;
    }
  }

  return children;
};

export default RoleProtectedRoute;