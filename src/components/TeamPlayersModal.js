import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';
import './TeamPlayersModal.css';

const TeamPlayersModal = ({ isOpen, onClose, team, tournamentId }) => {
  const navigate = useNavigate();
  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!isOpen || !team || !tournamentId) {
        setTeamDetails(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(
          `🔍 Fetching team players: tournamentId=${tournamentId}, registrationId=${team.id}`
        );
        const response = await tournamentAPI.getTeamPlayers(tournamentId, team.id);
        console.log('✅ Team players loaded:', response.data);
        setTeamDetails(response.data);
      } catch (err) {
        console.error('❌ Error fetching team players:', err);
        console.error(
          '   URL attempted:',
          `/tournaments/${tournamentId}/teams/${team.id}/players/`
        );
        console.error('   Status:', err.response?.status);
        console.error('   Data:', err.response?.data);
        setError(`Failed to load team players: ${err.response?.status || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [isOpen, team, tournamentId]);

  // Cleanup: Reset body overflow when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !team) return null;

  const handlePlayerClick = (member) => {
    navigate(`/player/profile/${member.user_id}`);
    onClose();
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-content team-players-modal cyber-card"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 0, maxWidth: '900px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10"
              style={{ borderRadius: 0 }}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{team.team_name}</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Team Roster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 group border border-white/10"
            style={{ borderRadius: 0 }}
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <div className="text-center py-20">
              <div
                className="w-12 h-12 border-4 border-white/10 border-t-white animate-spin mx-auto mb-4"
                style={{ borderRadius: 0 }}
              ></div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                Loading Team Roster...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20"
                style={{ borderRadius: 0 }}
              >
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-black text-red-500 mb-2">Error Loading Team</h3>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
          ) : teamDetails?.players && teamDetails.players.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {teamDetails.players.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handlePlayerClick(member)}
                  className="cyber-card group cursor-pointer relative overflow-hidden bg-[#0a0a0c] border border-white/5 hover:border-white/20 transition-all duration-300 p-3"
                  style={{ borderRadius: 0 }}
                >
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Avatar */}
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <div
                          className="w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-white/30 transition-all duration-300"
                          style={{ borderRadius: 0 }}
                        >
                          {member.profile_picture ? (
                            <img
                              src={member.profile_picture}
                              alt={member.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              className="w-7 h-7 text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        {/* Captain Badge */}
                        {member.is_captain && (
                          <div
                            className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-[#0a0a0c] flex items-center justify-center"
                            style={{ borderRadius: 0 }}
                          >
                            <svg
                              className="w-2.5 h-2.5 text-black"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="text-center mb-2">
                      <h3 className="text-sm font-black text-white mb-0.5 group-hover:text-white transition-colors truncate">
                        {member.username}
                      </h3>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                        {member.is_captain ? 'Captain' : 'Member'}
                      </p>
                    </div>

                    {/* View Profile Indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest text-white">
                        <span>View</span>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10"
                style={{ borderRadius: 0 }}
              >
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-500 mb-2">No Players Found</h3>
              <p className="text-gray-600 text-sm">
                This team doesn't have any registered players yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TeamPlayersModal;
