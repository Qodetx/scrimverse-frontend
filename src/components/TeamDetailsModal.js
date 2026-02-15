import React, { useState, useEffect } from 'react';
import { tournamentAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './RoundConfigModal.css';

const TeamDetailsModal = ({ isOpen, onClose, registration }) => {
  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && registration) {
      fetchTeamDetails();
    }
  }, [isOpen, registration]);

  const fetchTeamDetails = async () => {
    if (!registration) return;

    setLoading(true);
    try {
      // For solo registrations (scrims), create a mock team structure
      if (!registration.team || !registration.is_saved_team) {
        // Solo player registration - create team structure from registration data
        setTeamDetails({
          id: null,
          name: registration.team_name || registration.player?.user?.username || 'Solo Player',
          is_permanent: false,
          members: registration.player
            ? [
                {
                  id: registration.player.id,
                  username: registration.player.user?.username,
                  email: registration.player.user?.email,
                  user: registration.player.user,
                  is_captain: true,
                },
              ]
            : [],
        });
      } else {
        // Permanent team - fetch team details including members
        const response = await tournamentAPI.getTeamDetails(registration.team);
        setTeamDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      // Fallback to showing player info if API fails
      if (registration.player) {
        setTeamDetails({
          id: null,
          name: registration.team_name || registration.player?.user?.username || 'Solo Player',
          is_permanent: false,
          members: [
            {
              id: registration.player.id,
              username: registration.player.user?.username,
              email: registration.player.user?.email,
              user: registration.player.user,
              is_captain: true,
            },
          ],
        });
      } else {
        setTeamDetails(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = (playerId) => {
    navigate(`/player/profile/${playerId}`);
    onClose();
  };

  const handleTeamClick = (teamId) => {
    if (teamId) {
      navigate(`/teams/${teamId}`);
      onClose();
    }
  };

  if (!isOpen || !registration) return null;

  const isPermanentTeam = registration.is_saved_team || teamDetails?.is_permanent;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content round-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="gradient-text">{registration.team_name || 'Team Details'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading team details...</p>
            </div>
          ) : teamDetails ? (
            <>
              {/* Team Info */}
              <div className="mb-6 p-4 bg-dark-bg-primary rounded-lg border border-dark-bg-hover">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {(registration.team_name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{registration.team_name}</h3>
                    <div className="flex items-center gap-2">
                      {isPermanentTeam ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success/20 text-success border border-success/30">
                          ✓ Permanent Team
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-600/20 text-gray-400 border border-gray-600/30">
                          ⏳ Temporary Team
                        </span>
                      )}
                    </div>
                  </div>
                  {isPermanentTeam && registration.team && (
                    <button
                      onClick={() => handleTeamClick(registration.team)}
                      className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 transition-all"
                    >
                      View Team Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>👥</span> Team Members ({teamDetails.members?.length || 0})
                </h4>
                <div className="space-y-3">
                  {teamDetails.members && teamDetails.members.length > 0 ? (
                    teamDetails.members.map((member, index) => (
                      <div
                        key={member.id || index}
                        onClick={() => handlePlayerClick(member.id)}
                        className="p-4 bg-dark-bg-primary rounded-lg border border-dark-bg-hover hover:border-accent-blue cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-white font-bold shadow-lg">
                            {(member.username || member.user?.username || 'P')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-semibold group-hover:text-accent-blue transition-colors">
                                {member.username || member.user?.username || 'Unknown Player'}
                              </p>
                              {member.is_captain && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-accent-gold/20 text-accent-gold border border-accent-gold/30">
                                  ⭐ Captain
                                </span>
                              )}
                            </div>
                            {member.email && (
                              <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
                            )}
                          </div>
                          <div className="text-gray-400 group-hover:text-accent-blue transition-colors">
                            →
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No team members found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Info */}
              <div className="mt-6 p-4 bg-dark-bg-primary/50 rounded-lg border border-dark-bg-hover">
                <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Registration Info
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`ml-2 font-semibold ${
                        registration.status === 'confirmed'
                          ? 'text-success'
                          : registration.status === 'pending'
                            ? 'text-accent-gold'
                            : 'text-danger'
                      }`}
                    >
                      {registration.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Captain:</span>
                    <span className="ml-2 text-white font-semibold">
                      {registration.player?.user?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Unable to load team details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsModal;
