import React, { useState, useEffect } from 'react';
import './MatchConfigModal.css';

/**
 * MatchConfigModal — matches Lovable LobbyTournamentManagement "Start Match" dialog exactly
 *
 * mode="start"  — "Cancel" + "Start Match" buttons
 * mode="edit"   — "Cancel" + "Save Credentials" buttons (match already ongoing)
 */
const MatchConfigModal = ({
  isOpen,
  onClose,
  onSubmit,
  onSaveOnly,
  matchNumber,
  groupName,
  initialMatchId = '',
  initialMatchPassword = '',
  is5v5Game = false,
  requiresPassword = true, // false for Valorant (backend field)
  teamA = null,
  teamB = null,
  mode = 'start',
}) => {
  const [matchId, setMatchId] = useState('');
  const [matchPassword, setMatchPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMatchId(initialMatchId || '');
      setMatchPassword(initialMatchPassword || '');
    }
  }, [isOpen, initialMatchId, initialMatchPassword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!matchId.trim()) return;
    if (mode === 'edit') {
      if (onSaveOnly) onSaveOnly({ match_id: matchId, match_password: matchPassword });
    } else {
      onSubmit({ match_number: matchNumber, match_id: matchId, match_password: matchPassword });
    }
  };

  if (!isOpen) return null;

  const descText = requiresPassword
    ? 'Enter Room ID and Password. All players will see these credentials.'
    : 'Enter Room ID. All players will see these credentials.';

  return (
    <div className="mcm-overlay" onClick={onClose}>
      <div className="mcm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mcm-header">
          <div className="mcm-header-left">
            <div className="mcm-title-row">
              <svg className="mcm-play-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="mcm-title">
                {mode === 'edit' ? 'Edit Credentials' : 'Start Match'}
              </span>
            </div>
          </div>
          <button className="mcm-close" type="button" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="mcm-body">
          <form onSubmit={handleSubmit}>
            <div className="mcm-field">
              <label className="mcm-label">Room ID</label>
              <input
                type="text"
                className="mcm-input"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="Enter Room ID"
                autoFocus
                required
              />
            </div>

            {requiresPassword && (
              <div className="mcm-field mcm-field-mt">
                <label className="mcm-label">Password</label>
                <input
                  type="text"
                  className="mcm-input"
                  value={matchPassword}
                  onChange={(e) => setMatchPassword(e.target.value)}
                  placeholder="Enter Password"
                />
              </div>
            )}

            <div className="mcm-footer">
              <button type="button" className="mcm-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="mcm-btn-start" disabled={!matchId.trim()}>
                <svg className="mcm-btn-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {mode === 'edit' ? 'Save Credentials' : 'Start Match'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MatchConfigModal;
