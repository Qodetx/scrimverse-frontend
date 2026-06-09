import React, { useState, useEffect } from 'react';
import './MatchConfigModal.css';

/**
 * MatchConfigModal — matches Lovable LobbyTournamentManagement "Start Match" dialog exactly
 *
 * mode="start"  — "Cancel" + "Start Match" buttons
 * mode="edit"   — "Cancel" + "Save Credentials" buttons (match already ongoing)
 *
 * Schedule Release (mode="start" only):
 *   When the toggle is ON, the host picks a date+time and credentials are hidden
 *   from players until that moment. credential_release_time is included in onSubmit payload.
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
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  const [releaseTime, setReleaseTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMatchId(initialMatchId || '');
      setMatchPassword(initialMatchPassword || '');
      setScheduleEnabled(false);
      setReleaseDate('');
      setReleaseTime('');
    }
  }, [isOpen, initialMatchId, initialMatchPassword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!matchId.trim()) return;

    let credentialReleaseTime = null;
    if (mode === 'start' && scheduleEnabled && releaseDate && releaseTime) {
      // Combine date + time into ISO string (local time, backend will interpret as IST)
      credentialReleaseTime = new Date(`${releaseDate}T${releaseTime}:00`).toISOString();
    }

    if (mode === 'edit') {
      if (onSaveOnly) onSaveOnly({ match_id: matchId, match_password: matchPassword });
    } else {
      onSubmit({
        match_number: matchNumber,
        match_id: matchId,
        match_password: matchPassword,
        ...(credentialReleaseTime ? { credential_release_time: credentialReleaseTime } : {}),
      });
    }
  };

  if (!isOpen) return null;

  const descText = requiresPassword
    ? 'Enter Room ID and Password. All players will see these credentials.'
    : 'Enter Room ID. All players will see these credentials.';

  // Min datetime for the schedule picker: now + 1 minute
  const minDatetime = (() => {
    const d = new Date(Date.now() + 60000);
    return {
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
    };
  })();

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

            {/* Schedule Release — only in start mode */}
            {mode === 'start' && (
              <div className="mcm-field mcm-field-mt">
                <div className="mcm-schedule-toggle-row">
                  <label className="mcm-label mcm-label-inline">Schedule Release</label>
                  <button
                    type="button"
                    className={`mcm-toggle${scheduleEnabled ? ' mcm-toggle-on' : ''}`}
                    onClick={() => setScheduleEnabled((v) => !v)}
                    aria-pressed={scheduleEnabled}
                  >
                    <span className="mcm-toggle-thumb" />
                  </button>
                </div>
                {scheduleEnabled && (
                  <div className="mcm-schedule-pickers">
                    <div className="mcm-schedule-hint">
                      Credentials will be hidden from players until the scheduled time.
                    </div>
                    <div className="mcm-schedule-row">
                      <div className="mcm-schedule-field">
                        <label className="mcm-label-sm">Date</label>
                        <input
                          type="date"
                          className="mcm-input mcm-input-sm"
                          value={releaseDate}
                          min={minDatetime.date}
                          onChange={(e) => setReleaseDate(e.target.value)}
                          required={scheduleEnabled}
                        />
                      </div>
                      <div className="mcm-schedule-field">
                        <label className="mcm-label-sm">Time</label>
                        <input
                          type="time"
                          className="mcm-input mcm-input-sm"
                          value={releaseTime}
                          onChange={(e) => setReleaseTime(e.target.value)}
                          required={scheduleEnabled}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mcm-footer">
              <button type="button" className="mcm-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="mcm-btn-start"
                disabled={!matchId.trim() || (scheduleEnabled && (!releaseDate || !releaseTime))}
              >
                <svg className="mcm-btn-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {mode === 'edit'
                  ? 'Save Credentials'
                  : scheduleEnabled
                    ? 'Schedule & Start'
                    : 'Start Match'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MatchConfigModal;
