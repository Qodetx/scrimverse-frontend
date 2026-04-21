import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import EditPlayerProfileModal from '../../players/ui/EditPlayerProfileModal';

const PlayerSetup = () => {
  const { user, fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();

  const handlePhoneVerified = async () => {
    await fetchUserData();
    navigate('/player/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center mb-2 px-4 relative z-0">
        <h1 className="text-2xl font-bold text-foreground">Welcome to Scrimverse!</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Verify your phone number below to access your dashboard
        </p>
      </div>
      {/* Modal renders as a fixed overlay covering the page */}
      <EditPlayerProfileModal
        isOpen={true}
        onClose={() => {}}
        player={{ ...user?.user, player_profile: user?.profile }}
        onSuccess={() => {}}
        requirePhone={true}
        onPhoneVerified={handlePhoneVerified}
        initialTab="profile"
      />
    </div>
  );
};

export default PlayerSetup;
