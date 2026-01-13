// components/layout/ProtectRoute.tsx
import { ReactNode, useEffect } from 'react';
import { useAppSelector } from '../../redux/hooks';
import { getCurrentUser, getCurrentToken } from '../../redux/services/authSlice';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectRoute = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector(getCurrentUser);
  const token = useAppSelector(getCurrentToken);
  const location = useLocation();

  // Check if token is expired
  const isTokenValid = (user: any): boolean => {
    if (!user || !user.exp) return false;
    const expirationTime = user.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    return expirationTime > currentTime;
  };

  if (!user || !token || !isTokenValid(user)) {
    return <Navigate to='/login' state={{ from: location }} replace={true} />;
  }

  return children;
};

export default ProtectRoute;