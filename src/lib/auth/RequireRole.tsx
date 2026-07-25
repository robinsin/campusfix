import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { RoleName } from '../../types';

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
}

export const RequireRole: React.FC<RequireRoleProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-worn-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-ink/70">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role_id)) {
    // Redirect wrong role to their dedicated dashboard
    if (currentUser.role_id === 'officer') {
      return <Navigate to="/app/officer" replace />;
    }
    if (currentUser.role_id === 'admin') {
      return <Navigate to="/app/admin" replace />;
    }
    return <Navigate to="/app/requests" replace />;
  }

  return <>{children}</>;
};
