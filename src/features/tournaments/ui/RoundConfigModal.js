import React, { useState, useEffect } from 'react';
import './RoundConfigModal.css';
import { tournamentAPI } from '../../../utils/api';

const RoundConfigModal = ({
  isOpen,
  onClose,
  onSubmit,
  onReset, // optional handler to reset an already-configured round
  isRoundConfigured = false, // whether the round already has groups configured
  roundNumber,
  totalTeams,
  isFinalRound = false,
  roundName, // Custom round name
  tournament, // Tournament object for round_names
  teamList = [], // list of team objects for 5v5 lobby preview
}) => {
  const is5v5 = tournament?.is_5v5 || false;

  // For final round, force 1 group with all teams
  const [teamsPerGroup, setTeamsPerGroup] = useState(
    isFinalRound ? totalTeams : Math.min(totalTeams, 4)
  );
  const [qualifyingPerGroup, setQualifyingPerGroup] = useState(1);
  const [matchesPerGroup, setMatchesPerGroup] = useState(4);
  // 5v5 best-of selector
  const [bestOf, setBestOf] = useState(1);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  // Calculate preview values
  const numGroups = isFinalRound ? 1 : Math.ceil(totalTeams / teamsPerGroup);
  const totalQualifying = numGroups * qualifyingPerGroup;
  const totalMatches = numGroups * matchesPerGroup; // eslint-disable-line no-unused-vars

  useEffect(() => {
    if (isFinalRound) {
      setTeamsPerGroup(totalTeams);
      setQualifyingPerGroup(1);
    }
  }, [isFinalRound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // 5v5 mode: qualifying is per round (1 winner per lobby), no cross-validation needed
    if (is5v5) {
      setError('');
      return;
    }
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
  }, [is5v5, teamsPerGroup, qualifyingPerGroup, totalTeams, totalQualifying, isFinalRound]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error) return;

    if (is5v5) {
      handleConfigureRound();
    } else {
      onSubmit({
        teams_per_group: isFinalRound ? totalTeams : teamsPerGroup,
        qualifying_per_group: isFinalRound ? 1 : qualifyingPerGroup,
        matches_per_group: matchesPerGroup,
      });
    }
  };

  // Generate lobby pairings client-side for preview
  const generateLobbyPairs = () => {
    const teams = teamList.length > 0 ? teamList : [];
    const pairs = [];
    for (let i = 0; i < teams.length - 1; i += 2) {
      pairs.push({
        id: `lobby-${i / 2 + 1}`,
        teams: [teams[i], teams[i + 1]],
      });
    }
    if (teams.length % 2 !== 0) {
      pairs.push({ id: `lobby-bye`, teams: [teams[teams.length - 1]] });
    }
    return pairs;
  };

  const handleConfigureRound = () => {
    // Pass preview data up to ManageTournament to render inline
    const pairs = generateLobbyPairs();
    onClose();
    onSubmit({
      _5v5Preview: true,
      lobbies: pairs,
      bestOf,
      qualifyingPerGroup,
      roundNumber,
    });
  };

  const handleResetClick = async () => {
    if (!onReset) return;
    // eslint-disable-next-line no-restricted-globals
    const ok = window.confirm(
      'Reset this round configuration? This will delete groups and matches so you can reconfigure.'
    );
    if (!ok) return;
    setLoading(true);
    try {
      await onReset();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to reset round';
      setError(msg);
      console.error('Error resetting round:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="rcm-overlay" onClick={onClose}>
        <div className="rcm-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="rcm-header">
            <h2>
              {is5v5 ? (
                <span className="rcm-header-title-row">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="rcm-header-icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Tournament Configuration
                </span>
              ) : (
                <>
                  Configure{' '}
                  {roundName ||
                    tournament?.round_names?.[String(roundNumber)] ||
                    `Round ${roundNumber}`}
                </>
              )}
            </h2>
            <button type="button" className="rcm-close-btn" onClick={onClose}>
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ width: '1rem', height: '1rem' }}
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

          <form onSubmit={handleSubmit}>
            <div className="rcm-body">
              {is5v5 ? (
                /* ======== 5v5 MODE — Lovable "Tournament Configuration" layout ======== */
                <>
                  {/* 4-column config grid */}
                  <div className="rcm-5v5-grid">
                    {/* Total Teams */}
                    <div className="rcm-field">
                      <label htmlFor="totalTeamsDisplay">Total Teams</label>
                      <input
                        id="totalTeamsDisplay"
                        type="number"
                        value={totalTeams}
                        disabled
                        readOnly
                      />
                      <span className="rcm-5v5-hint">{Math.floor(totalTeams / 2)} lobbies</span>
                    </div>

                    {/* Matches / Lobby (Best Of) */}
                    <div className="rcm-field">
                      <label htmlFor="bestOf">Matches/Lobby</label>
                      <select
                        id="bestOf"
                        className="rcm-select"
                        value={bestOf}
                        onChange={(e) => setBestOf(Number(e.target.value))}
                      >
                        <option value={1}>BO1</option>
                        <option value={2}>BO2</option>
                        <option value={3}>BO3</option>
                        <option value={5}>BO5</option>
                      </select>
                      <span className="rcm-5v5-hint">All lobbies</span>
                    </div>

                    {/* Qualifying per Round */}
                    <div className="rcm-field">
                      <label htmlFor="qualifyingPerRound">Qualifying/Round</label>
                      <input
                        id="qualifyingPerRound"
                        type="number"
                        min="1"
                        max={Math.floor(totalTeams / 2)}
                        value={qualifyingPerGroup}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || raw === '-') {
                            setQualifyingPerGroup(raw);
                            return;
                          }
                          const v = Number(raw);
                          if (!isNaN(v)) setQualifyingPerGroup(v);
                        }}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          const max = Math.floor(totalTeams / 2);
                          if (isNaN(v) || v < 1) setQualifyingPerGroup(1);
                          else if (v > max) setQualifyingPerGroup(max);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                        }}
                      />
                      <span className="rcm-5v5-hint">
                        {qualifyingPerGroup}/{totalTeams} advance
                      </span>
                    </div>

                    {/* Total Rounds (read-only from tournament) */}
                    <div className="rcm-field">
                      <label>Total Rounds</label>
                      <input
                        type="number"
                        value={tournament?.rounds?.length || roundNumber}
                        disabled
                        readOnly
                      />
                      <span className="rcm-5v5-hint">
                        Round {tournament?.rounds?.length || roundNumber} = Finals
                      </span>
                    </div>
                  </div>

                  {/* How It Works info box */}
                  <div className="rcm-how-it-works">
                    <div className="rcm-how-title">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="rcm-how-icon"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      How It Works
                    </div>
                    <ul className="rcm-how-list">
                      <li>
                        {totalTeams} teams → {Math.floor(totalTeams / 2)} lobbies across{' '}
                        {tournament?.rounds?.length || roundNumber} rounds
                      </li>
                      <li>
                        {qualifyingPerGroup} teams qualify per round,{' '}
                        {Math.floor(totalTeams / 2) - qualifyingPerGroup} eliminated
                      </li>
                      <li>Each lobby plays BO{bestOf}</li>
                      <li>Winners advance — click any round tab to view progress</li>
                    </ul>
                  </div>

                  {error && <div className="rcm-error">{error}</div>}

                  <button type="submit" className="rcm-btn-confirm" disabled={!!error || loading}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="rcm-check-icon"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {loading ? 'Starting...' : 'Configure & Preview Lobbies'}
                  </button>
                  {isRoundConfigured && (
                    <button
                      type="button"
                      className="rcm-btn-destruct"
                      onClick={handleResetClick}
                      disabled={loading}
                    >
                      Reconfigure Round
                    </button>
                  )}
                </>
              ) : (
                /* ======== BATTLE ROYALE MODE ======== */
                <>
                  {isFinalRound && (
                    <div className="rcm-disclaimer">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="rcm-disclaimer-icon-svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 3h14M5 3a2 2 0 00-2 2v1c0 5.25 3.5 9.5 8 11 4.5-1.5 8-5.75 8-11V5a2 2 0 00-2-2M5 3H3m16 0h2"
                        />
                      </svg>
                      <div className="rcm-disclaimer-text">
                        <strong>Final Round Configuration</strong>
                        <p>
                          All remaining teams will compete in a single group. Only the number of
                          matches can be configured.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Row 1: Total Teams + Matches per Group */}
                  <div className="rcm-grid-2">
                    <div className="rcm-field">
                      <label htmlFor="totalTeamsDisplay">Total Teams</label>
                      <input
                        id="totalTeamsDisplay"
                        type="number"
                        value={totalTeams}
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="rcm-field">
                      <label htmlFor="matchesPerGroup">Matches per Group</label>
                      <input
                        id="matchesPerGroup"
                        type="number"
                        min="1"
                        max="10"
                        value={matchesPerGroup}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setMatchesPerGroup('');
                          } else {
                            const numValue = Number(value);
                            if (numValue >= 1) setMatchesPerGroup(numValue);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Teams per Group + Teams Qualify — with live pills */}
                  <div className="rcm-grid-2">
                    <div className="rcm-field">
                      <label htmlFor="teamsPerGroup">Teams per Group</label>
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
                            if (numValue >= 1 && numValue <= 25) setTeamsPerGroup(numValue);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                        }}
                        disabled={isFinalRound}
                        required
                      />
                      <div className="rcm-pill rcm-pill-red">
                        <svg
                          className="rcm-pill-icon"
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
                        Creates {numGroups} group{numGroups !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="rcm-field">
                      <label htmlFor="teamsQualify">Teams Qualify</label>
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
                            if (numValue >= 1 && numValue <= maxAllowed)
                              setQualifyingPerGroup(numValue);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                        }}
                        disabled={isFinalRound}
                        required
                      />
                      <div className="rcm-pill rcm-pill-red">
                        <svg
                          className="rcm-pill-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {teamsPerGroup - qualifyingPerGroup} teams eliminated per group
                      </div>
                    </div>
                  </div>

                  {error && <div className="rcm-error">{error}</div>}

                  {/* Round Summary card */}
                  <div className="rcm-summary">
                    <h4 className="rcm-summary-title">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="rcm-summary-icon"
                      >
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                      </svg>
                      Round Summary
                    </h4>
                    <div className="rcm-summary-grid">
                      <div className="rcm-summary-cell">
                        <span className="rcm-summary-cell-label">Total Teams:</span>
                        <span className="rcm-summary-cell-value rcm-accent">{totalTeams}</span>
                      </div>
                      <div className="rcm-summary-cell">
                        <span className="rcm-summary-cell-label">Groups:</span>
                        <span className="rcm-summary-cell-value">{numGroups}</span>
                      </div>
                      <div className="rcm-summary-cell">
                        <span className="rcm-summary-cell-label">Per Group:</span>
                        <span className="rcm-summary-cell-value">{teamsPerGroup} teams</span>
                      </div>
                      <div className="rcm-summary-cell">
                        <span className="rcm-summary-cell-label">Matches/Group:</span>
                        <span className="rcm-summary-cell-value rcm-accent">{matchesPerGroup}</span>
                      </div>
                    </div>
                    <div className="rcm-summary-footer">
                      <span>Advancing to Next Round:</span>
                      <span className="rcm-summary-advance">{totalQualifying} teams</span>
                    </div>
                  </div>

                  <button type="submit" className="rcm-btn-confirm" disabled={!!error || loading}>
                    <svg
                      className="rcm-check-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {loading ? 'Starting...' : 'Confirm & Start Round'}
                  </button>
                  {isRoundConfigured && (
                    <button
                      type="button"
                      className="rcm-btn-destruct"
                      onClick={handleResetClick}
                      disabled={loading}
                    >
                      Reconfigure Round
                    </button>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RoundConfigModal;
