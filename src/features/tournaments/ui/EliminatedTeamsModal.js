import { createPortal } from 'react-dom';
import './EliminatedTeamsModal.css';
import arenaBg from '../../../assets/esports-arena-bg.jpg';

const EliminatedTeamsModal = ({ isOpen, onClose, onProceed, onRevert, roundData, tournament }) => {
  if (!isOpen || !roundData) return null;

  const is5v5 =
    roundData.format === '5v5_head_to_head' ||
    tournament?.game_mode === '5v5' ||
    ['COD', 'Call of Duty', 'Valorant'].includes(tournament?.game_name);

  const roundName =
    tournament?.round_names?.[String(roundData.current_round)] ||
    `Round ${roundData.current_round}`;
  const nextRoundName =
    tournament?.round_names?.[String(roundData.next_round)] || `Round ${roundData.next_round}`;

  const tournamentName = tournament?.title || tournament?.name || 'Tournament';

  // Total matches per group (for X/X format display)
  const totalMatches =
    roundData.matches_per_group ||
    roundData.num_matches ||
    roundData.groups?.[0]?.num_matches ||
    roundData.groups?.[0]?.matches_count ||
    null;

  // Flatten all teams across groups
  const qualifiedTeams = [];
  const eliminatedTeams = [];
  roundData.groups?.forEach((group) => {
    group.qualified_teams?.forEach((team) => {
      qualifiedTeams.push({ ...team, group_name: group.group_name, status: 'qualified' });
    });
    group.eliminated_teams?.forEach((team) => {
      eliminatedTeams.push({ ...team, group_name: group.group_name, status: 'eliminated' });
    });
  });
  // Sort each group by points descending, then concat: qualified on top, eliminated at bottom
  qualifiedTeams.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  eliminatedTeams.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  const allTeams = [...qualifiedTeams, ...eliminatedTeams];

  const qualifiedCount = qualifiedTeams.length;
  const eliminatedCount = eliminatedTeams.length;

  const getInitials = (name) =>
    name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '??';

  const getRankStyle = (rank, isEliminated) => {
    if (isEliminated) return 'etm-row-eliminated';
    if (rank === 1) return 'etm-row-rank1';
    if (rank === 2) return 'etm-row-rank2';
    if (rank === 3) return 'etm-row-rank3';
    return 'etm-row-qualified';
  };

  const getRankIcon = (rank, isQualified) => {
    if (!isQualified) {
      return <span className="etm-rank-num etm-muted">{String(rank).padStart(2, '0')}</span>;
    }
    if (rank === 1) {
      return (
        <span className="etm-rank-icon etm-rank-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="etm-crown">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
          </svg>
        </span>
      );
    }
    if (rank === 2 || rank === 3) {
      return (
        <span className={`etm-rank-icon etm-rank-${rank}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="etm-shield"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
      );
    }
    return <span className="etm-rank-num">{String(rank).padStart(2, '0')}</span>;
  };

  const content = (
    <div className="etm-overlay" onClick={onClose}>
      <div
        className="etm-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: `url(${arenaBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient overlay like Lovable */}
        <div className="etm-bg-overlay" />
        {/* Grid pattern overlay */}
        <div className="etm-grid-overlay" />

        {/* All content sits above the overlays */}
        <div className="etm-content">
          {/* Close button */}
          <button className="etm-close-abs" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Centered Header */}
          <div className="etm-header-centered">
            <div className="etm-tournament-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" className="etm-badge-icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{tournamentName.toUpperCase()}</span>
            </div>
            <h2 className="etm-title-large">{roundName.toUpperCase()} RESULTS</h2>
            <p className="etm-subtitle-center">
              Overall standings after {totalMatches ? `${totalMatches} matches` : 'all matches'}
            </p>
          </div>

          {/* Table */}
          <div className="etm-body">
            <div className="etm-table-wrap">
              <table className="etm-table">
                <thead>
                  <tr>
                    <th className="etm-th etm-th-rank">RANK</th>
                    <th className="etm-th etm-th-team">TEAM</th>
                    {!is5v5 && (
                      <th className="etm-th etm-th-num">
                        <span className="etm-th-icon-wrap">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="etm-th-icon">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          WWCD
                        </span>
                      </th>
                    )}
                    <th className="etm-th etm-th-num">MATCHES</th>
                    {!is5v5 && <th className="etm-th etm-th-num">PLACE</th>}
                    {is5v5 && <th className="etm-th etm-th-num">WINS</th>}
                    <th className="etm-th etm-th-num">
                      <span className="etm-th-icon-wrap">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="etm-th-icon"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                          />
                        </svg>
                        KILLS
                      </span>
                    </th>
                    <th className="etm-th etm-th-num">TOTAL</th>
                    <th className="etm-th etm-th-status">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {allTeams.map((team, index) => {
                    const isQualified = team.status === 'qualified';
                    const rank = index + 1; // always use sorted position as overall rank
                    const isTop3 = rank <= 3 && isQualified;
                    const matchesPlayed = team.matches_played || '—';
                    const matchesDisplay =
                      totalMatches && matchesPlayed !== '—'
                        ? `${matchesPlayed}/${totalMatches}`
                        : matchesPlayed;

                    return (
                      <tr
                        key={`${team.team_id}-${team.group_name}`}
                        className={`etm-row ${getRankStyle(rank, !isQualified)}`}
                      >
                        {/* Rank */}
                        <td className="etm-td etm-td-rank">{getRankIcon(rank, isQualified)}</td>

                        {/* Team */}
                        <td className="etm-td etm-td-team">
                          <div className="etm-team-cell">
                            <div
                              className={`etm-avatar ${isTop3 ? `etm-avatar-top${rank}` : ''} ${!isQualified ? 'etm-avatar-elim' : ''}`}
                            >
                              {getInitials(team.team_name)}
                            </div>
                            <div>
                              <div
                                className={`etm-team-name ${!isQualified ? 'etm-strikethrough' : ''}`}
                              >
                                {team.team_name}
                              </div>
                              <div className="etm-team-sub">Team #{rank}</div>
                            </div>
                          </div>
                        </td>

                        {/* WWCD */}
                        {!is5v5 && (
                          <td className="etm-td etm-td-num">
                            <span
                              className={`etm-wins-badge ${(team.wins || 0) > 0 ? 'etm-wins-badge--active' : ''} ${!isQualified ? 'etm-muted' : ''}`}
                            >
                              {team.wins || 0}
                            </span>
                          </td>
                        )}

                        {/* Matches */}
                        <td
                          className={`etm-td etm-td-num etm-mono ${!isQualified ? 'etm-muted' : ''}`}
                        >
                          {matchesDisplay}
                        </td>

                        {/* Place pts / wins */}
                        {!is5v5 && (
                          <td
                            className={`etm-td etm-td-num etm-pts-large ${!isQualified ? 'etm-pts-elim' : 'etm-pts-place'}`}
                          >
                            {team.position_points || 0}
                          </td>
                        )}
                        {is5v5 && (
                          <td className={`etm-td etm-td-num ${!isQualified ? 'etm-muted' : ''}`}>
                            {team.match_wins || 0}
                          </td>
                        )}

                        {/* Kills */}
                        <td
                          className={`etm-td etm-td-num etm-pts-large ${isQualified ? 'etm-pts-kills' : 'etm-pts-elim'}`}
                        >
                          {team.total_kills || team.kill_points || 0}
                        </td>

                        {/* Total */}
                        <td className="etm-td etm-td-num">
                          <span
                            className={`etm-total-badge ${!isQualified ? 'etm-total-badge--elim' : rank <= 3 ? 'etm-total-badge--top3' : ''}`}
                          >
                            {team.total_points || 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="etm-td etm-td-status">
                          {isQualified ? (
                            <span className="etm-status etm-status-qualified">Qualified</span>
                          ) : (
                            <span className="etm-status etm-status-eliminated">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="etm-status-icon"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              Eliminated
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="etm-footer">
            <div className="etm-footer-left">
              {onRevert && (
                <button type="button" className="etm-btn-revert" onClick={onRevert}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="etm-btn-icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  Revert &amp; Edit Round
                </button>
              )}
              <span className="etm-footer-badge etm-footer-badge-green">
                Top {qualifiedCount} Qualify
              </span>
              <span className="etm-footer-badge etm-footer-badge-red">
                {eliminatedCount} Eliminated
              </span>
            </div>
            <div className="etm-footer-actions">
              <button type="button" className="etm-btn-cancel" onClick={onClose}>
                Close
              </button>
              {onProceed && (
                <button type="button" className="etm-btn-proceed" onClick={onProceed}>
                  Proceed to {nextRoundName}
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="etm-btn-icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* end etm-content */}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default EliminatedTeamsModal;
