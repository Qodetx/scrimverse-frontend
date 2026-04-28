import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';

// Redirects authenticated players to /player/setup if their phone is not verified.
// Applies to all player-only routes. Does not block unauthenticated users (other guards handle that).
const PhoneSetupGuard = ({ children }) => {
  const { isAuthenticated, isPlayer, user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;
  if (!isAuthenticated() || !isPlayer()) return children;
  if (!user?.user?.phone_verified)
    return (
      <Navigate to="/player/setup" state={{ next: location.pathname + location.search }} replace />
    );

  return children;
};

export default PhoneSetupGuard;
