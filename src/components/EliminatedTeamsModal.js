import React from 'react';
import './EliminatedTeamsModal.css';

const EliminatedTeamsModal = ({ isOpen, onClose, onProceed, roundData, tournament }) => {
  if (!isOpen || !roundData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content eliminated-teams-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="gradient-text">
            {tournament?.round_names?.[String(roundData.current_round)] ||
              `Round ${roundData.current_round}`}{' '}
            Complete - Results
          </h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="summary-box">
            <p>
              <strong>{roundData.total_qualified} teams</strong> have qualified for{' '}
              {tournament?.round_names?.[String(roundData.next_round)] ||
                `Round ${roundData.next_round}`}
            </p>
            <p className="eliminated-count">
              <strong>{roundData.total_eliminated} teams</strong> have been eliminated
            </p>
          </div>

          {roundData.groups &&
            roundData.groups.map((group) => (
              <div key={group.group_name} className="group-section">
                <h3 className="group-title">{group.group_name}</h3>
                <div className="group-stats">
                  <span className="qualified">✓ {group.qualified_count} Qualified</span>
                  <span className="eliminated">✕ {group.eliminated_count} Eliminated</span>
                </div>

                {/* Qualified Teams Section */}
                {group.qualified_teams && group.qualified_teams.length > 0 && (
                  <div className="teams-section qualified-section">
                    <h4 className="section-title qualified-title">
                      <svg
                        className="section-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Qualified Teams
                    </h4>
                    <div className="teams-table-wrapper">
                      <table className="teams-table qualified-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Team Name</th>
                            <th>Total Points</th>
                            <th>Wins</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.qualified_teams.map((team) => (
                            <tr key={team.team_id} className="qualified-row">
                              <td className="rank">#{team.rank}</td>
                              <td className="team-name">{team.team_name}</td>
                              <td className="points">{team.total_points}</td>
                              <td className="wins">{team.wins}</td>
                              <td className="status">
                                <span className="status-badge qualified-badge">✓ Qualified</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Eliminated Teams Section */}
                {group.eliminated_teams && group.eliminated_teams.length > 0 && (
                  <div className="teams-section eliminated-section">
                    <h4 className="section-title eliminated-title">
                      <svg
                        className="section-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Eliminated Teams
                    </h4>
                    <div className="teams-table-wrapper">
                      <table className="teams-table eliminated-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Team Name</th>
                            <th>Total Points</th>
                            <th>Wins</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.eliminated_teams.map((team) => (
                            <tr key={team.team_id} className="eliminated-row">
                              <td className="rank">#{team.rank}</td>
                              <td className="team-name">{team.team_name}</td>
                              <td className="points">{team.total_points}</td>
                              <td className="wins">{team.wins}</td>
                              <td className="status">
                                <span className="status-badge eliminated-badge">✕ Eliminated</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}

          <button type="button" className="btn-proceed" onClick={onProceed}>
            <svg
              className="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Proceed to Configure{' '}
            {tournament?.round_names?.[String(roundData.next_round)] ||
              `Round ${roundData.next_round}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EliminatedTeamsModal;
