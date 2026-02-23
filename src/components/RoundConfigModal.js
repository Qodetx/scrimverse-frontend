import React, { useState, useEffect } from 'react';
import './RoundConfigModal.css';
import Lobby5v5PreviewModal from './Lobby5v5PreviewModal';
import { tournamentAPI } from '../utils/api';

const RoundConfigModal = ({
  isOpen,
  onClose,
  onSubmit,
  roundNumber,
  totalTeams,
  isFinalRound = false,
  roundName, // Custom round name
  tournament, // Tournament object for round_names
}) => {
  const is5v5 = tournament?.is_5v5 || false;

  // For final round, force 1 group with all teams
  const [teamsPerGroup, setTeamsPerGroup] = useState(isFinalRound ? totalTeams : 25);
  const [qualifyingPerGroup, setQualifyingPerGroup] = useState(1);
  const [matchesPerGroup, setMatchesPerGroup] = useState(4);
  // 5v5 best-of selector
  const [bestOf, setBestOf] = useState(1);
  const [error, setError] = useState('');

  // Preview modal states
  const [showPreview, setShowPreview] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate preview values
  const numGroups = isFinalRound ? 1 : Math.ceil(totalTeams / teamsPerGroup);
  const totalQualifying = numGroups * qualifyingPerGroup;
  const totalMatches = numGroups * matchesPerGroup;

  useEffect(() => {
    // For final round, set teams per group to total teams
    if (isFinalRound) {
      setTeamsPerGroup(totalTeams);
      setQualifyingPerGroup(1);
    }
  }, [isFinalRound, totalTeams]);

  useEffect(() => {
    // Validate on change
    if (!isFinalRound) {
      if (teamsPerGroup > 25) {
        setError('Teams per group cannot exceed 25');
      } else if (qualifyingPerGroup > teamsPerGroup) {
        setError('Qualifying teams cannot exceed teams per group');
      } else if (totalQualifying > totalTeams) {
        setError('Total qualifying teams cannot exceed total teams');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [teamsPerGroup, qualifyingPerGroup, totalTeams, totalQualifying, isFinalRound]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error) {
      return;
    }

    if (is5v5) {
      // For 5v5, call API and show preview
      handleConfigureRound();
    } else {
      // For BR, use original onSubmit callback
      onSubmit({
        teams_per_group: isFinalRound ? totalTeams : teamsPerGroup,
        qualifying_per_group: isFinalRound ? 1 : qualifyingPerGroup,
        matches_per_group: matchesPerGroup,
      });
    }
  };

  const handleConfigureRound = async () => {
    setLoading(true);
    try {
      const response = await tournamentAPI.configureRound(tournament.id, roundNumber, {
        teams_per_group: 2,
        qualifying_per_group: 1,
        matches_per_group: bestOf,
      });

      const groups = response.data?.groups;
      if (groups && groups.length > 0) {
        // Show lobby preview before finalizing
        setLobbies(groups);
        setShowPreview(true);
      } else {
        // No preview data – round configured, just close and refresh
        onSubmit({ _alreadyConfigured: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to configure round';
      setError(msg);
      console.error('Error configuring round:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewConfirm = () => {
    // Round already created by handleConfigureRound – signal parent to refresh only
    setShowPreview(false);
    onClose();
    onSubmit({ _alreadyConfigured: true });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content round-config-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="gradient-text">
              Configure{' '}
              {roundName ||
                tournament?.round_names?.[String(roundNumber)] ||
                `Round ${roundNumber}`}
            </h2>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {is5v5 ? (
                /* ======== 5v5 MODE ======== */
                <>
                  <div
                    className="final-round-disclaimer"
                    style={{
                      borderColor: 'hsl(280 60% 55% / 0.3)',
                      background: 'hsl(280 60% 55% / 0.08)',
                    }}
                  >
                    <div className="disclaimer-icon">⚔️</div>
                    <div className="disclaimer-text">
                      <strong>5v5 Lobby Configuration</strong>
                      <p>
                        Teams will be paired into head-to-head lobbies (2 teams each).
                        {totalTeams % 2 !== 0 && ' One team will get a bye (odd count).'}
                      </p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Best Of (matches per lobby)</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      {[1, 2, 3, 4].map((bo) => (
                        <button
                          key={bo}
                          type="button"
                          onClick={() => setBestOf(bo)}
                          style={{
                            flex: 1,
                            padding: '14px 0',
                            borderRadius: '12px',
                            border:
                              bestOf === bo
                                ? '2px solid hsl(280 60% 55%)'
                                : '1px solid hsl(0 0% 100% / 0.15)',
                            background:
                              bestOf === bo ? 'hsl(280 60% 55% / 0.2)' : 'hsl(0 0% 100% / 0.05)',
                            color: bestOf === bo ? '#fff' : 'hsl(0 0% 60%)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          BO{bo}
                        </button>
                      ))}
                    </div>
                    <p className="helper-text" style={{ marginTop: '8px' }}>
                      Each lobby plays {bestOf} match{bestOf > 1 ? 'es' : ''}, winner advances
                    </p>
                  </div>

                  <div className="preview-section">
                    <h4 className="preview-title">Preview</h4>
                    <div className="preview-grid">
                      <span className="preview-label">Total Teams:</span>
                      <span className="preview-value">{totalTeams}</span>

                      <span className="preview-label">Lobbies:</span>
                      <span className="preview-value">{Math.floor(totalTeams / 2)}</span>

                      <span className="preview-label">Teams per Lobby:</span>
                      <span className="preview-value">2</span>

                      <span className="preview-label">Matches per Lobby:</span>
                      <span className="preview-value preview-accent">BO{bestOf}</span>

                      {totalTeams % 2 !== 0 && (
                        <>
                          <span className="preview-label">Bye Team:</span>
                          <span className="preview-value preview-green">1 team advances free</span>
                        </>
                      )}
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
                    Confirm & Create Lobbies
                  </button>
                </>
              ) : (
                /* ======== BATTLE ROYALE MODE ======== */
                <>
                  <div className="final-round-disclaimer">
                    <div className="disclaimer-icon">🏆</div>
                    <div className="disclaimer-text">
                      <strong>Final Round Configuration</strong>
                      <p>
                        All remaining teams will compete in a single group. Only the number of
                        matches can be configured.
                      </p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="teamsPerGroup">How many teams per group?</label>
                    <input
                      id="teamsPerGroup"
                      type="number"
                      min="1"
                      max="25"
                      value={teamsPerGroup}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setTeamsPerGroup('');
                        } else {
                          const numValue = Number(value);
                          // Only allow values between 1 and 25
                          if (numValue >= 1 && numValue <= 25) {
                            setTeamsPerGroup(numValue);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                      disabled={isFinalRound}
                      required
                    />
                    <p className="helper-text">
                      {isFinalRound
                        ? `Final round: All ${totalTeams} teams in 1 group`
                        : `With ${totalTeams} teams, this will create ${numGroups} groups`}
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="teamsQualify">How many teams qualify per group?</label>
                    <input
                      id="teamsQualify"
                      type="number"
                      min="1"
                      max={teamsPerGroup}
                      value={qualifyingPerGroup}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setQualifyingPerGroup('');
                        } else {
                          const numValue = Number(value);
                          const maxAllowed = teamsPerGroup || 25;
                          // Only allow values between 1 and teamsPerGroup
                          if (numValue >= 1 && numValue <= maxAllowed) {
                            setQualifyingPerGroup(numValue);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                      disabled={isFinalRound}
                      required
                    />
                    <p className="helper-text">
                      {totalQualifying} teams will advance to the next round
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="matchesPerGroup">How many matches per group?</label>
                    <input
                      id="matchesPerGroup"
                      type="text"
                      inputMode="numeric"
                      pattern="[1-4]"
                      value={matchesPerGroup}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers 1-4
                        if (value === '' || /^[1-4]$/.test(value)) {
                          setMatchesPerGroup(value === '' ? '' : Number(value));
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevent arrow keys from changing value
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                        }
                      }}
                      required
                    />
                    <p className="helper-text">
                      Each group will play {matchesPerGroup} match
                      {matchesPerGroup !== 1 ? 'es' : ''} in this round
                    </p>
                    <p className="helper-text" style={{ color: '#f59e0b', marginTop: '4px' }}>
                      ⚠️ Maximum 4 matches allowed per group
                    </p>
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <div className="preview-section">
                    <h4 className="preview-title">Preview</h4>
                    <div className="preview-grid">
                      <span className="preview-label">Total Teams:</span>
                      <span className="preview-value">{totalTeams}</span>

                      <span className="preview-label">Groups:</span>
                      <span className="preview-value">{numGroups}</span>

                      <span className="preview-label">Teams per Group:</span>
                      <span className="preview-value">{teamsPerGroup}</span>

                      <span className="preview-label">Matches per Group:</span>
                      <span className="preview-value preview-accent">{matchesPerGroup}</span>

                      <span className="preview-label">Qualifying Teams:</span>
                      <span className="preview-value preview-green">{totalQualifying}</span>
                    </div>
                  </div>

                  <button type="submit" className="btn-confirm" disabled={!!error}>
                    <svg
                      className="check-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Confirm & Start Round
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      <Lobby5v5PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handlePreviewConfirm}
        lobbies={lobbies}
        bestOf={bestOf}
        totalTeams={totalTeams}
        loading={loading}
      />
    </>
  );
};

export default RoundConfigModal;
