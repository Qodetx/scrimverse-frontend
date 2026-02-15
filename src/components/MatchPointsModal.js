import React, { useState, useEffect } from 'react';
import './MatchPointsModal.css';

const MatchPointsModal = ({ isOpen, onClose, onSubmit, match, teams, is5v5Game = false }) => {
  const [scores, setScores] = useState([]);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (isOpen && teams) {
      // Initialize scores for all teams with empty strings
      const initialScores = teams.map((team) => ({
        team_id: team.id,
        team_name: team.team_name,
        wins: '',
        position_points: '',
        kill_points: '',
      }));
      setScores(initialScores);
    }
  }, [isOpen, teams]);

  const handleScoreChange = (teamId, field, value) => {
    setScores((prev) =>
      prev.map((score) =>
        score.team_id === teamId ? { ...score, [field]: value === '' ? '' : Number(value) } : score
      )
    );
  };

  const calculateTotal = (score) => {
    // Total = Position Points + Kill Points (wins NOT counted)
    // Handle empty strings by treating them as 0
    const positionPts = score.position_points === '' ? 0 : Number(score.position_points);
    const killPts = score.kill_points === '' ? 0 : Number(score.kill_points);
    return positionPts + killPts;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (is5v5Game) {
      // For 5v5: Simple winner selection
      if (!winner) {
        alert('Please select a winner');
        return;
      }
      const processedScores = scores.map((score) => ({
        ...score,
        wins: score.team_id === winner ? 1 : 0,
        position_points: score.position_points === '' ? 0 : Number(score.position_points),
        kill_points: score.kill_points === '' ? 0 : Number(score.kill_points),
      }));
      onSubmit({ scores: processedScores });
    } else {
      // For BR: Standard multiple team scoring
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
      <div className="modal-content match-points-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="gradient-text">Enter Points - Match {match?.match_number}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {is5v5Game ? (
              // 5v5 WINNER SELECTION LAYOUT
              <div className="points-5v5-container">
                <div className="info-box">
                  <p>
                    <strong>Match Result:</strong> Select the winning team for this head-to-head
                    match.
                  </p>
                </div>

                <div className="winner-selection-grid">
                  {scores.map((score, index) => (
                    <button
                      key={score.team_id}
                      type="button"
                      className={`winner-card ${winner === score.team_id ? 'selected' : ''}`}
                      onClick={() => setWinner(score.team_id)}
                    >
                      <div className="winner-card-icon">{index === 0 ? '🅰️' : '🅱️'}</div>
                      <div className="winner-card-name">{score.team_name}</div>
                      <div className="winner-indicator">
                        {winner === score.team_id && (
                          <svg className="checkmark" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="points-section-5v5">
                  <h3>Match Details</h3>
                  <div className="points-inputs-5v5">
                    {scores.map((score) => (
                      <div key={score.team_id} className="team-points-entry">
                        <div className="team-label">{score.team_name}</div>
                        <div className="points-inputs-row">
                          <div className="points-field">
                            <label>Position Pts</label>
                            <input
                              type="number"
                              min="0"
                              value={score.position_points}
                              onChange={(e) =>
                                handleScoreChange(score.team_id, 'position_points', e.target.value)
                              }
                              placeholder="0"
                              className="score-input-5v5"
                            />
                          </div>
                          <div className="points-field">
                            <label>Kill Pts</label>
                            <input
                              type="number"
                              min="0"
                              value={score.kill_points}
                              onChange={(e) =>
                                handleScoreChange(score.team_id, 'kill_points', e.target.value)
                              }
                              placeholder="0"
                              className="score-input-5v5"
                            />
                          </div>
                          <div className="points-field total">
                            <label>Total</label>
                            <div className="total-display">{calculateTotal(score)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

            <button
              type="submit"
              className="btn-submit-points"
              style={
                is5v5Game && !winner
                  ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }
                  : {}
              }
            >
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchPointsModal;
