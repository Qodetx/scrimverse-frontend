import React from 'react';
import './Lobby5v5PreviewModal.css';

const Lobby5v5PreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  lobbies = [],
  bestOf = 1,
  totalTeams = 0,
  loading = false,
  roundNumber = 1,
}) => {
  if (!isOpen) return null;

  const numLobbies = lobbies.filter((l) => l.teams.length >= 1).length;

  const getTeamName = (team) => team?.team_name || team?.name || `Team ${team?.id || '?'}`;

  const mapNames = [
    'Bind',
    'Haven',
    'Split',
    'Ascent',
    'Icebox',
    'Breeze',
    'Fracture',
    'Pearl',
    'Lotus',
    'Sunset',
    'Abyss',
  ];

  return (
    <div className="lpv-wrapper">
      {/* Back to Config link */}
      <div className="lpv-back-row">
        <button type="button" className="lpv-btn-back-top" onClick={onClose} disabled={loading}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="lpv-back-icon"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Config
        </button>
      </div>

      {/* Card */}
      <div className="lpv-card">
        <div className="lpv-card-header">
          <h2 className="lpv-title-row">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="lpv-header-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Confirm Lobby Setup — Round {roundNumber}
          </h2>
        </div>

        <div className="lpv-card-body">
          {/* 4 stats */}
          <div className="lpv-stats">
            <div className="lpv-stat">
              <span className="lpv-stat-num">{totalTeams}</span>
              <span className="lpv-stat-label">Teams</span>
            </div>
            <div className="lpv-stat">
              <span className="lpv-stat-num">{numLobbies}</span>
              <span className="lpv-stat-label">Lobbies</span>
            </div>
            <div className="lpv-stat">
              <span className="lpv-stat-num">5v5</span>
              <span className="lpv-stat-label">Format</span>
            </div>
            <div className="lpv-stat">
              <span className="lpv-stat-num">BO{bestOf}</span>
              <span className="lpv-stat-label">Per Lobby</span>
            </div>
          </div>

          {/* Lobby grid — 2 columns */}
          <div className="lpv-lobbies-grid">
            {lobbies.map((lobby, idx) => {
              const isBye = lobby.teams.length === 1;
              const mapName = mapNames[idx % mapNames.length];

              return (
                <div key={lobby.id || idx} className="lpv-lobby-row">
                  <div className="lpv-lobby-row-top">
                    <span className="lpv-lobby-badge">Lobby {idx + 1}</span>
                    {!isBye && (
                      <span className="lpv-map">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="lpv-map-icon"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        {mapName}
                      </span>
                    )}
                  </div>
                  {!isBye ? (
                    <div className="lpv-matchup">
                      <span className="lpv-team-a">{getTeamName(lobby.teams[0])}</span>
                      <span className="lpv-vs">vs</span>
                      <span className="lpv-team-b">{getTeamName(lobby.teams[1])}</span>
                    </div>
                  ) : (
                    <div className="lpv-matchup">
                      <span className="lpv-team-a">{getTeamName(lobby.teams[0])}</span>
                      <span className="lpv-bye-text">BYE</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="lpv-footer">
            <button type="button" className="lpv-btn-back" onClick={onClose} disabled={loading}>
              Back to Edit
            </button>

            <button
              type="button"
              className="lpv-btn-start"
              onClick={onConfirm}
              disabled={loading || lobbies.length === 0}
            >
              {loading ? (
                <>
                  <span className="lpv-spinner" />
                  Starting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="lpv-btn-icon">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Start Round {roundNumber}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby5v5PreviewModal;
