import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './MatchPointsModal.css';

const MatchPointsModal = ({
  isOpen,
  onClose,
  onSubmit,
  match,
  teams,
  is5v5Game = false,
  readOnly = false,
}) => {
  const [scores, setScores] = useState([]);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (isOpen && teams) {
      if (readOnly && match?.scores?.length) {
        // Pre-populate from submitted scores
        const preloaded = teams.map((team) => {
          const saved = match.scores.find((s) => s.team_id === team.id || s.team === team.id);
          return {
            team_id: team.id,
            team_name: team.team_name,
            wins: saved?.wins ?? 0,
            position_points: saved?.position_points ?? 0,
            kill_points: saved?.kill_points ?? 0,
          };
        });
        setScores(preloaded);
      } else {
        const initialScores = teams.map((team) => ({
          team_id: team.id,
          team_name: team.team_name,
          wins: '',
          position_points: '',
          kill_points: '',
        }));
        setScores(initialScores);
      }
      setWinner(null);
    }
  }, [isOpen, teams, readOnly, match?.scores]);

  const handleScoreChange = (teamId, field, value) => {
    setScores((prev) =>
      prev.map((score) =>
        score.team_id === teamId ? { ...score, [field]: value === '' ? '' : Number(value) } : score
      )
    );
  };

  const handleScoreIncrement = (teamId, delta) => {
    setScores((prev) =>
      prev.map((score) => {
        if (score.team_id !== teamId) return score;
        const current = score.position_points === '' ? 0 : Number(score.position_points);
        const newVal = Math.max(0, current + delta);
        return { ...score, position_points: newVal };
      })
    );
  };

  const calculateTotal = (score) => {
    const positionPts = score.position_points === '' ? 0 : Number(score.position_points);
    const killPts = score.kill_points === '' ? 0 : Number(score.kill_points);
    return positionPts + killPts;
  };

  const getScoreBasedWinner = () => {
    if (scores.length !== 2) return null;
    const s0 = scores[0].position_points === '' ? 0 : Number(scores[0].position_points);
    const s1 = scores[1].position_points === '' ? 0 : Number(scores[1].position_points);
    if (s0 > s1) return scores[0].team_id;
    if (s1 > s0) return scores[1].team_id;
    return null;
  };

  const effectiveWinner = winner || getScoreBasedWinner();
  const winnerName = scores.find((s) => s.team_id === effectiveWinner)?.team_name;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (is5v5Game) {
      if (!effectiveWinner) {
        alert('Please select a winner or enter scores');
        return;
      }
      const processedScores = scores.map((score) => ({
        ...score,
        wins: score.team_id === effectiveWinner ? 1 : 0,
        position_points: score.position_points === '' ? 0 : Number(score.position_points),
        kill_points: 0,
      }));
      onSubmit({ scores: processedScores });
    } else {
      const processedScores = scores.map((score) => ({
        ...score,
        wins: score.wins === '' ? 0 : Number(score.wins),
        position_points: score.position_points === '' ? 0 : Number(score.position_points),
        kill_points: score.kill_points === '' ? 0 : Number(score.kill_points),
      }));
      onSubmit({ scores: processedScores });
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="mpm-overlay" onClick={onClose}>
      <div
        className={`mpm-dialog ${is5v5Game ? 'mpm-dialog-5v5' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mpm-header">
          <div className="mpm-header-left">
            <div className="mpm-header-icon">
              <svg className="mpm-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="mpm-title">
                {readOnly
                  ? `Points - Match ${match?.match_number}`
                  : is5v5Game
                    ? 'Select Winner'
                    : `Enter Points - Match ${match?.match_number}`}
              </h2>
              {!is5v5Game && !readOnly && (
                <p className="mpm-subtitle">
                  Enter points for each team. Total = Placement + Kill Points
                </p>
              )}
            </div>
          </div>
          <button className="mpm-close" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
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
        <form
          onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <div className="mpm-body">
            {is5v5Game ? (
              /* ── 5v5 WINNER SELECTION ── */
              <div className="mpm-5v5-container">
                <p className="mpm-5v5-subtitle">Enter scores or simply select the winning team</p>

                <p className="mpm-section-label">Quick Select Winner</p>
                <div className="mpm-winner-grid">
                  {scores.map((score) => (
                    <button
                      key={score.team_id}
                      type="button"
                      className={`mpm-winner-card ${effectiveWinner === score.team_id ? 'mpm-winner-card--selected' : ''}`}
                      onClick={() => setWinner(score.team_id)}
                    >
                      <div className="mpm-winner-abbr">
                        {score.team_name?.substring(0, 3).toUpperCase()}
                      </div>
                      <div className="mpm-winner-name">{score.team_name}</div>
                      {effectiveWinner === score.team_id && (
                        <div className="mpm-winner-crown">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mpm-divider">
                  <span>OR ENTER SCORES</span>
                </div>

                <div className="mpm-stepper-row">
                  {scores.map((score) => (
                    <div key={score.team_id} className="mpm-stepper-col">
                      <div className="mpm-stepper-label">{score.team_name}</div>
                      <div className="mpm-stepper">
                        <button
                          type="button"
                          className="mpm-stepper-btn"
                          onClick={() => handleScoreIncrement(score.team_id, -1)}
                        >
                          —
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={score.position_points === '' ? 0 : score.position_points}
                          onChange={(e) =>
                            handleScoreChange(score.team_id, 'position_points', e.target.value)
                          }
                          className="mpm-stepper-input"
                        />
                        <button
                          type="button"
                          className="mpm-stepper-btn"
                          onClick={() => handleScoreIncrement(score.team_id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {effectiveWinner && (
                  <div className="mpm-winner-banner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                    </svg>
                    <span>
                      <strong>{winnerName}</strong> wins!
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* ── BR STANDARD LAYOUT ── */
              <>
                <div className="mpm-note">
                  <svg
                    className="mpm-note-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    <strong>Note:</strong> Wins are for display only. Total Points = Position Points
                    + Kill Points
                  </span>
                </div>

                <div className="mpm-table-wrap">
                  <table className="mpm-table">
                    <thead>
                      <tr>
                        <th className="mpm-th mpm-th-team">Team Name</th>
                        <th className="mpm-th mpm-th-score">Wins</th>
                        <th className="mpm-th mpm-th-score">Placement Pts</th>
                        <th className="mpm-th mpm-th-score">Kill Pts</th>
                        <th className="mpm-th mpm-th-total">Total Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((score, idx) => (
                        <tr key={score.team_id} className="mpm-row">
                          <td className="mpm-td mpm-td-team">
                            <div className="mpm-team-cell">
                              <span className="mpm-team-num">{idx + 1}</span>
                              <div className="mpm-team-avatar">
                                <svg
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  className="mpm-avatar-icon"
                                >
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                              </div>
                              <span className="mpm-team-name">{score.team_name}</span>
                            </div>
                          </td>
                          <td className="mpm-td mpm-td-score">
                            {readOnly ? (
                              <span className="mpm-total">{score.wins ?? 0}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max="1"
                                value={score.wins}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '1' || val === '' || val === '0') {
                                    handleScoreChange(score.team_id, 'wins', val);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
                                    e.preventDefault();
                                }}
                                disabled={
                                  scores.some((s) => s.wins === 1 || s.wins === '1') &&
                                  score.wins !== 1 &&
                                  score.wins !== '1'
                                }
                                className={`mpm-input ${scores.some((s) => s.wins === 1 || s.wins === '1') && score.wins !== 1 && score.wins !== '1' ? 'mpm-input--disabled' : ''}`}
                              />
                            )}
                          </td>
                          <td className="mpm-td mpm-td-score">
                            {readOnly ? (
                              <span className="mpm-total">{score.position_points ?? 0}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={score.position_points}
                                onChange={(e) =>
                                  handleScoreChange(
                                    score.team_id,
                                    'position_points',
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
                                    e.preventDefault();
                                }}
                                className="mpm-input"
                              />
                            )}
                          </td>
                          <td className="mpm-td mpm-td-score">
                            {readOnly ? (
                              <span className="mpm-total">{score.kill_points ?? 0}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={score.kill_points}
                                onChange={(e) =>
                                  handleScoreChange(score.team_id, 'kill_points', e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
                                    e.preventDefault();
                                }}
                                className="mpm-input"
                              />
                            )}
                          </td>
                          <td className="mpm-td mpm-td-total">
                            <span className="mpm-total">{calculateTotal(score)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          <div className="mpm-footer">
            {readOnly ? (
              <button type="button" className="mpm-btn-submit" onClick={onClose}>
                Close
              </button>
            ) : (
              <>
                <button type="button" className="mpm-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mpm-btn-submit"
                  disabled={is5v5Game && !effectiveWinner}
                >
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    className="mpm-btn-icon"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {is5v5Game ? 'Confirm Winner' : 'Submit Points'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MatchPointsModal;
