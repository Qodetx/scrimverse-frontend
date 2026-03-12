import React, { useState, useEffect } from 'react';
import './MatchConfigModal.css';

const MatchConfigModal = ({
  isOpen,
  onClose,
  onSubmit,
  matchNumber,
  groupName,
  initialMatchId = '',
  initialMatchPassword = '',
  is5v5Game = false,
  teamA = null,
  teamB = null,
}) => {
  const [matchId, setMatchId] = useState('');
  const [matchPassword, setMatchPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      match_number: matchNumber,
      match_id: matchId,
      match_password: matchPassword,
    });
  };

  useEffect(() => {
    if (isOpen) {
      setMatchId(initialMatchId || '');
      setMatchPassword(initialMatchPassword || '');
    }
  }, [isOpen, initialMatchId, initialMatchPassword]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content match-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {is5v5Game && teamA && teamB ? (
            <div className="match-header-5v5">
              <div className="team-matchup-header">
                <span className="team-name-header">{teamA?.team_name || 'Team A'}</span>
                <span className="vs-text">VS</span>
                <span className="team-name-header">{teamB?.team_name || 'Team B'}</span>
              </div>
              <h2 className="gradient-text">
                Match {matchNumber} - {groupName}
              </h2>
            </div>
          ) : (
            <h2 className="gradient-text">
              Start Match {matchNumber} - {groupName}
            </h2>
          )}
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-box">
              <p className="info-text">
                <strong>Note:</strong> These credentials will be visible to all players in this
                group
              </p>
            </div>

            <div className="form-group">
              <label>Match ID (Room ID)</label>
              <input
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="e.g., ROOM-ABC-123"
                required
              />
            </div>

            <div className="form-group">
              <label>Match Password</label>
              <input
                type="text"
                value={matchPassword}
                onChange={(e) => setMatchPassword(e.target.value)}
                placeholder="e.g., pass123"
                required
              />
            </div>

            <button type="submit" className="btn-start-match">
              <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchConfigModal;
