import React, { useState } from 'react';
import './RoundConfigModal.css';

const ScrimConfigModal = ({ isOpen, onClose, onSubmit, totalTeams, gameMode }) => {
  const [matchesPerGroup, setMatchesPerGroup] = useState(4);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      teams_per_group: totalTeams, // All teams in one group
      qualifying_per_group: 0, // No qualification in scrims
      matches_per_group: matchesPerGroup,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content round-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="gradient-text">Configure Scrim Matches</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="matchesPerGroup">How many matches? (Max 4)</label>
              <input
                id="matchesPerGroup"
                type="number"
                min="1"
                max="4"
                value={matchesPerGroup}
                onChange={(e) => setMatchesPerGroup(Number(e.target.value))}
                required
              />
              <p className="helper-text">Each match will be played by all teams in the group</p>
            </div>

            <div className="preview-section">
              <h4 className="preview-title">Session Overview</h4>
              <div className="preview-grid">
                <span className="preview-label">Total Teams:</span>
                <span className="preview-value">{totalTeams}</span>

                <span className="preview-label">Groups:</span>
                <span className="preview-value">1 (All teams together)</span>

                <span className="preview-label">Total Matches:</span>
                <span className="preview-value preview-accent">{matchesPerGroup}</span>

                <span className="preview-label">Format:</span>
                <span className="preview-value preview-green">{gameMode}</span>
              </div>
            </div>

            <button type="submit" className="btn-confirm">
              <svg
                className="check-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Start Scrim Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScrimConfigModal;
