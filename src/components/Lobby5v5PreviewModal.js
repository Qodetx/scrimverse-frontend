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
}) => {
  if (!isOpen) return null;

  const hasByeTeam = totalTeams % 2 !== 0;
  const byeTeam = lobbies.find((lobby) => lobby.teams.length === 1);

  return (
    <div className="lobby-preview-overlay" onClick={onClose}>
      <div className="lobby-preview-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lobby-preview-header">
          <div className="header-left">
            <svg
              className="header-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <h2 className="lobby-preview-title">5v5 Lobbies Ready</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="lobby-preview-body">
          {/* Summary Banner */}
          <div className="summary-banner">
            <div className="summary-item">
              <span className="summary-label">Total Teams:</span>
              <span className="summary-value">{totalTeams}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Lobbies:</span>
              <span className="summary-value">{lobbies.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Format:</span>
              <span className="summary-value">BO{bestOf}</span>
            </div>
            {hasByeTeam && (
              <div className="summary-item bye-item">
                <span className="summary-label">Bye Team:</span>
                <span className="summary-value">Advances free</span>
              </div>
            )}
          </div>

          {/* Lobbies Grid */}
          <div className="lobbies-container">
            {lobbies.length === 0 ? (
              <div className="empty-state">
                <p>No lobbies generated yet. Confirm configuration to create lobbies.</p>
              </div>
            ) : (
              lobbies.map((lobby, idx) => (
                <div key={lobby.id || idx} className="lobby-card">
                  <div className="lobby-header">
                    <span className="lobby-number">Lobby {idx + 1}</span>
                    {lobby.teams.length === 1 && <span className="bye-badge">BYE</span>}
                  </div>

                  <div className="matchup-container">
                    {lobby.teams.length === 2 ? (
                      <>
                        {/* Team A */}
                        <div className="team-box team-a">
                          <div className="team-label">Team A</div>
                          <div className="team-name">
                            {lobby.teams[0]?.name || `Team ${lobby.teams[0]?.id}`}
                          </div>
                          {lobby.teams[0]?.logo && (
                            <img src={lobby.teams[0].logo} alt="Team A" className="team-logo" />
                          )}
                        </div>

                        {/* VS */}
                        <div className="vs-badge">
                          <span>VS</span>
                        </div>

                        {/* Team B */}
                        <div className="team-box team-b">
                          <div className="team-label">Team B</div>
                          <div className="team-name">
                            {lobby.teams[1]?.name || `Team ${lobby.teams[1]?.id}`}
                          </div>
                          {lobby.teams[1]?.logo && (
                            <img src={lobby.teams[1].logo} alt="Team B" className="team-logo" />
                          )}
                        </div>
                      </>
                    ) : (
                      /* Bye Team Display */
                      <div className="bye-team-box">
                        <div className="bye-icon">🎫</div>
                        <div className="bye-text">
                          {lobby.teams[0]?.name || `Team ${lobby.teams[0]?.id}`}
                        </div>
                        <div className="bye-notice">Advances to next round</div>
                      </div>
                    )}
                  </div>

                  {/* Match Info */}
                  {lobby.teams.length === 2 && (
                    <div className="match-info">
                      <span className="match-count">
                        {bestOf} match{bestOf > 1 ? 'es' : ''}
                      </span>
                      <span className="series-type">Best of {bestOf}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Info Section */}
          <div className="info-section">
            <div className="info-box">
              <svg
                className="info-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div>
                <p className="info-title">How it works</p>
                <p className="info-text">
                  Each lobby plays BO{bestOf} matches. Winner advances to the next round. Match
                  schedules and times can be set via bulk scheduling.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lobby-preview-footer">
          <button type="button" onClick={onClose} className="btn-back" disabled={loading}>
            Back to Config
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-start"
            disabled={loading || lobbies.length === 0}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              <>
                <svg
                  className="btn-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Start Round Matches
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby5v5PreviewModal;
