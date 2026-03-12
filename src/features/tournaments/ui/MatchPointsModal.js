import React, { useState, useEffect } from 'react';
import './MatchPointsModal.css';

const MatchPointsModal = ({ isOpen, onClose, onSubmit, match, teams, is5v5Game = false }) => {
  const [scores, setScores] = useState([]);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (isOpen && teams) {
      const initialScores = teams.map((team) => ({
        team_id: team.id,
        team_name: team.team_name,
        wins: '',
        position_points: '',
        kill_points: '',
      }));
      setScores(initialScores);
      setWinner(null);
    }
  }, [isOpen, teams]);

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

  // Auto-detect winner from scores (higher score wins)
  const getScoreBasedWinner = () => {
    if (scores.length !== 2) return null;
    const s0 = scores[0].position_points === '' ? 0 : Number(scores[0].position_points);
    const s1 = scores[1].position_points === '' ? 0 : Number(scores[1].position_points);
    if (s0 > s1) return scores[0].team_id;
    if (s1 > s0) return scores[1].team_id;
    return null;
  };

  // Effective winner: manual selection or auto from scores
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content match-points-modal ${is5v5Game ? 'match-points-modal-5v5' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className={is5v5Game ? '' : 'gradient-text'}>
            {is5v5Game ? 'Select Winner' : `Enter Points - Match ${match?.match_number}`}
          </h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {is5v5Game ? (
              // 5v5 WINNER SELECTION LAYOUT
              <div className="points-5v5-container">
                <p className="select-winner-subtitle">
                  Enter scores or simply select the winning team
                </p>

                <p className="quick-select-label">Quick Select Winner</p>
                <div className="winner-selection-grid">
                  {scores.map((score) => (
                    <button
                      key={score.team_id}
                      type="button"
                      className={`winner-card ${effectiveWinner === score.team_id ? 'selected' : ''}`}
                      onClick={() => setWinner(score.team_id)}
                    >
                      <div className="winner-card-abbr">
                        {score.team_name?.substring(0, 3).toUpperCase()}
                      </div>
                      <div className="winner-card-name">{score.team_name}</div>
                      {effectiveWinner === score.team_id && (
                        <div className="winner-crown">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="score-divider">
                  <span>OR ENTER SCORES</span>
                </div>

                <div className="score-inputs-row-5v5">
                  {scores.map((score) => (
                    <div key={score.team_id} className="score-column-5v5">
                      <div className="score-team-label">{score.team_name}</div>
                      <div className="score-stepper">
                        <button
                          type="button"
                          className="stepper-btn"
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
                          className="score-stepper-input"
                        />
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => handleScoreIncrement(score.team_id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {effectiveWinner && (
                  <div className="winner-banner">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                    </svg>
                    <span>
                      <strong>{winnerName}</strong> wins!
                    </span>
                  </div>
                )}

                <div className="modal-actions-5v5">
                  <button type="button" className="btn-cancel-5v5" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-confirm-winner" disabled={!effectiveWinner}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Confirm Winner
                  </button>
                </div>
              </div>
            ) : (
              // BR STANDARD LAYOUT
              <>
                <div className="info-box">
                  <p>
                    <strong>Note:</strong> Wins are for display only. Total Points = Position Points
                    + Kill Points
                  </p>
                </div>

                <div className="points-table-wrapper">
                  <table className="points-table">
                    <thead>
                      <tr>
                        <th className="team-name-cell">Team Name</th>
                        <th className="score-input-cell">Wins</th>
                        <th className="score-input-cell">Position Pts</th>
                        <th className="score-input-cell">Kill Pts</th>
                        <th className="total-points-cell">Total Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((score) => (
                        <tr key={score.team_id}>
                          <td className="team-name-cell">
                            <div className="team-name-wrapper">
                              <div className="team-avatar-mini">
                                <svg
                                  className="w-4 h-4 text-white/50"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                              </div>
                              <span className="team-name-text">{score.team_name}</span>
                            </div>
                          </td>
                          <td className="score-input-cell">
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
                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                  e.preventDefault();
                                }
                              }}
                              disabled={
                                scores.some((s) => s.wins === 1 || s.wins === '1') &&
                                score.wins !== 1 &&
                                score.wins !== '1'
                              }
                              placeholder=""
                              className={`score-input ${scores.some((s) => s.wins === 1 || s.wins === '1') && score.wins !== 1 && score.wins !== '1' ? 'opacity-20 cursor-not-allowed' : ''}`}
                            />
                          </td>
                          <td className="score-input-cell">
                            <input
                              type="number"
                              min="0"
                              value={score.position_points}
                              onChange={(e) =>
                                handleScoreChange(score.team_id, 'position_points', e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                  e.preventDefault();
                                }
                              }}
                              placeholder=""
                              className="score-input"
                            />
                          </td>
                          <td className="score-input-cell">
                            <input
                              type="number"
                              min="0"
                              value={score.kill_points}
                              onChange={(e) =>
                                handleScoreChange(score.team_id, 'kill_points', e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                  e.preventDefault();
                                }
                              }}
                              placeholder=""
                              className="score-input"
                            />
                          </td>
                          <td className="total-points-cell">
                            <span className="total-points">{calculateTotal(score)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!is5v5Game && (
              <button type="submit" className="btn-submit-points">
                <svg
                  className="check-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Submit Points
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchPointsModal;
