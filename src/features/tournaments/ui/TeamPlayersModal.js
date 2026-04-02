import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../../utils/api';
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
        const response = await tournamentAPI.getTeamPlayers(tournamentId, team.id);
        setTeamDetails(response.data);
      } catch (err) {
        setError(`Failed to load team players: ${err.response?.status || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamDetails();
  }, [isOpen, team, tournamentId]);

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
      <div className="modal-content team-players-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-accent"
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
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {team.team_name}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Team Roster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-secondary/30 hover:bg-secondary/60 border border-border/30 flex items-center justify-center transition-all"
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
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
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                Loading Roster...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-400"
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
              <p className="text-sm text-red-400 font-semibold">{error}</p>
            </div>
          ) : teamDetails?.players && teamDetails.players.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {teamDetails.players.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handlePlayerClick(member)}
                  className="group relative cursor-pointer rounded-xl bg-secondary/20 border border-border/30 hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 p-3 overflow-hidden"
                >
                  {/* Content */}
                  <div className="flex flex-col items-center text-center gap-2">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-secondary/50 border border-border/40 group-hover:border-accent/40 flex items-center justify-center overflow-hidden transition-all">
                        {member.profile_picture ? (
                          <img
                            src={member.profile_picture}
                            alt={member.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg
                            className="w-7 h-7 text-muted-foreground/50"
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
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 border-2 border-background flex items-center justify-center">
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

                    {/* Info */}
                    <div>
                      <p className="text-sm font-bold text-foreground truncate max-w-full">
                        {member.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                        {member.is_captain ? 'Captain' : 'Member'}
                      </p>
                    </div>

                    {/* Hover hint */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold uppercase tracking-widest text-accent flex items-center gap-0.5">
                      View Profile
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/30 border border-border/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-muted-foreground/40"
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
              <div className="text-center">
                <p className="text-sm font-semibold text-muted-foreground">No Players Found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  This team has no registered players yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TeamPlayersModal;
