import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';

export const DashboardRedirectPage: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-worn-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role_id === 'admin') {
    return <Navigate to="/app/admin" replace />;
  }

  if (currentUser.role_id === 'officer') {
    return <Navigate to="/app/officer" replace />;
  }

  return <Navigate to="/app/requests" replace />;
};
