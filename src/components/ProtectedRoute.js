import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * ProtectedRoute component that checks authentication and authorization
 * Supports different protection levels:
 * - requireAuth: User must be logged in
 * - requireHost: User must be a host
 * - requirePlayer: User must be a player
 * - requireVerifiedHost: User must be an approved host
 */
const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireHost = false,
  requirePlayer = false,
  requireVerifiedHost = false,
}) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    // Redirect to home page if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if host role is required
  if (requireHost && user?.user?.user_type !== 'host') {
    return <Navigate to="/" replace />;
  }

  // Check if player role is required
  if (requirePlayer && user?.user?.user_type !== 'player') {
    return <Navigate to="/" replace />;
  }

  // Check if verified host is required
  if (requireVerifiedHost && user?.user?.user_type === 'host') {
    const verificationStatus = user?.profile?.verification_status;

    // If not approved, redirect to verification pending page
    if (verificationStatus !== 'approved') {
      return <Navigate to="/host/verification-pending" replace />;
    }
  }

  // All checks passed, render the protected component
  return children;
};

export default ProtectedRoute;
