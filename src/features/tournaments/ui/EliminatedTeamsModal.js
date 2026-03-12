import './EliminatedTeamsModal.css';

const EliminatedTeamsModal = ({ isOpen, onClose, onProceed, roundData, tournament }) => {
  if (!isOpen || !roundData) return null;

  const is5v5 =
    roundData.format === '5v5_head_to_head' ||
    tournament?.game_mode === '5v5' ||
    ['COD', 'Call of Duty', 'Valorant'].includes(tournament?.game_name);

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
            roundData.groups.map((group) => {
              const groupIs5v5 = group.format === '5v5_head_to_head' || is5v5;

              return (
                <div key={group.group_name} className="group-section">
                  <h3 className="group-title">{group.group_name}</h3>
                  <div className="group-stats">
                    <span className="qualified">✓ {group.qualified_count} Qualified</span>
                    <span className="eliminated">✕ {group.eliminated_count} Eliminated</span>
                  </div>

                  {/* Combined Results Table */}
                  <div className="teams-table-wrapper">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th className="col-rank">RANK</th>
                          <th className="col-team">TEAM NAME</th>
                          <th className="col-points">TOTAL POINTS</th>
                          <th className="col-wins">{groupIs5v5 ? 'MATCH WINS' : 'WINS'}</th>
                          {!groupIs5v5 && <th className="col-extra">POSITION PTS</th>}
                          {groupIs5v5 && <th className="col-extra">KILLS</th>}
                          <th className="col-status">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Qualified Teams */}
                        {group.qualified_teams &&
                          group.qualified_teams.map((team, index) => (
                            <tr key={team.team_id} className="result-row qualified-row">
                              <td className="col-rank">
                                <span className="rank-number">{team.rank || index + 1}</span>
                              </td>
                              <td className="col-team">
                                <span className="team-name-text">{team.team_name}</span>
                              </td>
                              <td className="col-points">
                                <span className="points-value">{team.total_points || 0}</span>
                              </td>
                              <td className="col-wins">
                                {groupIs5v5 ? team.match_wins || 0 : team.wins || 0}
                              </td>
                              {!groupIs5v5 && (
                                <td className="col-extra">{team.position_points || 0}</td>
                              )}
                              {groupIs5v5 && <td className="col-extra">{team.total_kills || 0}</td>}
                              <td className="col-status">
                                <span className="status-tag status-qualified">QUALIFIED</span>
                              </td>
                            </tr>
                          ))}

                        {/* Eliminated Teams */}
                        {group.eliminated_teams &&
                          group.eliminated_teams.map((team, index) => {
                            const qualifiedCount = group.qualified_teams?.length || 0;
                            return (
                              <tr key={team.team_id} className="result-row eliminated-row">
                                <td className="col-rank">
                                  <span className="rank-number eliminated-rank">
                                    {team.rank || qualifiedCount + index + 1}
                                  </span>
                                </td>
                                <td className="col-team">
                                  <span className="team-name-text eliminated-name">
                                    {team.team_name}
                                  </span>
                                </td>
                                <td className="col-points">
                                  <span className="points-value eliminated-points">
                                    {team.total_points || 0}
                                  </span>
                                </td>
                                <td className="col-wins eliminated-text">
                                  {groupIs5v5 ? team.match_wins || 0 : team.wins || 0}
                                </td>
                                {!groupIs5v5 && (
                                  <td className="col-extra eliminated-text">
                                    {team.position_points || 0}
                                  </td>
                                )}
                                {groupIs5v5 && (
                                  <td className="col-extra eliminated-text">
                                    {team.total_kills || 0}
                                  </td>
                                )}
                                <td className="col-status">
                                  <span className="status-tag status-eliminated">ELIMINATED</span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

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
