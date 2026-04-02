import React from 'react';
import './GroupConfirmModal.css';

/**
 * GroupConfirmModal — shown after RoundConfigModal, before the API call.
 * Displays a preview of how teams will be split into groups.
 *
 * Props:
 *   isOpen         — bool
 *   onClose        — fn (also "Back" button)
 *   onConfirm      — fn — triggers actual API call
 *   roundName      — string e.g. "Round 1" / "Qualifiers"
 *   groups         — string[][] — array of groups, each group is array of team names
 *   teamsPerGroup  — number
 *   qualifying     — number (teams qualifying per group)
 *   matches        — number (matches per group)
 *   loading        — bool
 */
const GroupConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  roundName = 'Round',
  groups = [],
  teamsPerGroup,
  qualifying,
  matches,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gcm-header">
          <div className="gcm-header-title">
            <svg
              className="gcm-header-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Confirm Groups — {roundName}</span>
          </div>
          <button className="gcm-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Summary stats */}
        <div className="gcm-stats">
          <div className="gcm-stat">
            <span className="gcm-stat-value gcm-accent">{groups.length}</span>
            <span className="gcm-stat-label">Groups</span>
          </div>
          <div className="gcm-stat">
            <span className="gcm-stat-value">{teamsPerGroup}</span>
            <span className="gcm-stat-label">Teams/Group</span>
          </div>
          <div className="gcm-stat">
            <span className="gcm-stat-value gcm-green">{qualifying}</span>
            <span className="gcm-stat-label">Qualifying</span>
          </div>
          <div className="gcm-stat">
            <span className="gcm-stat-value">{matches}</span>
            <span className="gcm-stat-label">Matches</span>
          </div>
        </div>

        {/* Groups list */}
        <div className="gcm-scroll-area">
          {groups.map((group, gi) => (
            <div key={gi} className="gcm-group">
              <div className="gcm-group-header">
                <span className="gcm-group-badge">Group {String.fromCharCode(65 + gi)}</span>
                <span className="gcm-group-count">{group.length} teams</span>
              </div>
              <div className="gcm-team-list">
                {group.map((teamName, ti) => (
                  <div key={ti} className="gcm-team-row">
                    <div className="gcm-team-left">
                      <span className="gcm-team-num">#{ti + 1}</span>
                      <span className="gcm-team-name">{teamName}</span>
                    </div>
                    <span className="gcm-participant-badge">Participant</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Review message */}
        <div className="gcm-review-msg">
          Review groups above. Press confirm to start managing matches.
        </div>

        {/* Footer buttons */}
        <div className="gcm-footer">
          <button className="gcm-btn-back" onClick={onClose} disabled={loading}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="gcm-btn-icon"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <button className="gcm-btn-confirm" onClick={onConfirm} disabled={loading}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="gcm-btn-icon"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {loading ? 'Starting...' : 'Confirm & Start'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupConfirmModal;
