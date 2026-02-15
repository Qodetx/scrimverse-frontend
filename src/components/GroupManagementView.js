import React, { useState, useEffect } from 'react';
import './GroupManagementView.css';

const GroupManagementView = ({
  group,
  onStartMatch,
  onEndMatch,
  onEnterPoints,
  initialMatchIndex = 0,
  onMatchIndexChange,
  onTeamClick,
  roundNumber,
  qualifyingTeams,
  tournamentId,
  is5v5Game = false,
}) => {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(initialMatchIndex);

  // Sync state with props when they change
  useEffect(() => {
    setCurrentMatchIndex(initialMatchIndex);
  }, [initialMatchIndex]);

  const getStatusBadge = (status) => {
    const badges = {
      waiting: { class: 'badge-waiting', text: 'WAITING' },
      ongoing: { class: 'badge-ongoing', text: 'ONGOING' },
      completed: { class: 'badge-completed', text: 'COMPLETED' },
    };
    return badges[status] || badges.waiting;
  };

  // Check if a match can be started
  const canStartMatch = (match) => {
    if (match.match_number === 1) return true;
    const previousMatch = group.matches?.find((m) => m.match_number === match.match_number - 1);
    if (!previousMatch) return false;
    return previousMatch.status === 'completed' && previousMatch.scores_submitted;
  };

  const totalMatches = group.matches?.length || 0;
  const currentMatch = group.matches?.[currentMatchIndex];

  return (
    <div className="group-management-inline animate-in fade-in zoom-in duration-500">
      {/* Header with Group Badge and Match Pagination */}
      <div className="inline-header group">
        <div className="header-left">
          <div className="group-badge-inline">{group.group_name}</div>
        </div>

        {/* Match Pagination */}
        <div className="match-pagination-inline">
          {group.matches?.map((match, index) => (
            <button
              key={match.id}
              onClick={() => {
                setCurrentMatchIndex(index);
                if (onMatchIndexChange) onMatchIndexChange(index);
              }}
              className={`match-page-btn-inline ${index === currentMatchIndex ? 'active' : ''} ${match.status === 'completed' ? 'completed' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current Match Card */}
      {currentMatch && (
        <div className="current-match-card-inline group">
          <div className="match-card-header-inline">
            <div className="match-status-badge-inline">
              <span
                className={`status-indicator-inline ${getStatusBadge(currentMatch.status).class} shadow-sm border border-white/5`}
              >
                {getStatusBadge(currentMatch.status).text}
              </span>
            </div>
            <div className="match-info-text-inline">
              <h3 className="flex items-center gap-3">
                {currentMatch.match_number}
                <span className="text-gray-600 text-xs font-black uppercase tracking-widest mt-1">
                  / {totalMatches} total
                </span>
              </h3>
            </div>
          </div>

          {/* Match Room Details */}
          {(currentMatch.match_id || currentMatch.status === 'waiting') && (
            <div className="match-credentials-box-inline relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] -rotate-12 translate-x-4">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                </svg>
              </div>
              <div className="room-display-row-inline relative z-10">
                <div className="credential-item-inline">
                  <span className="credential-label-inline">Room ID</span>
                  <span className="credential-value-inline">
                    {currentMatch.match_id || 'AWAITING INTEL'}
                  </span>
                </div>
                <div className="credential-item-inline">
                  <span className="credential-label-inline">Room Password</span>
                  <span className="credential-value-inline">
                    {currentMatch.match_password || 'AWAITING INTEL'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="match-actions-row-inline">
            {currentMatch.status === 'waiting' && (
              <button
                className="action-btn-inline primary group/btn"
                onClick={() => onStartMatch(currentMatch)}
                disabled={!canStartMatch(currentMatch)}
              >
                <div className="w-5 h-5 bg-black/20 rounded-lg flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                Start Match
              </button>
            )}

            {currentMatch.status === 'ongoing' && (
              <button
                className="action-btn-inline danger group/btn"
                onClick={() => onEndMatch(currentMatch)}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                End Match
              </button>
            )}

            {currentMatch.status === 'completed' && !currentMatch.scores_submitted && (
              <button
                className="action-btn-inline success group/btn"
                onClick={() => onEnterPoints(currentMatch)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Enter Points
              </button>
            )}

            {currentMatch.scores_submitted && (
              <div className="scores-locked-indicator-inline flex items-center gap-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Battle Records Finalized
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teams Section - 5v5 Head-to-Head or Standard BR Layout */}
      {is5v5Game ? (
        // 5v5 HEAD-TO-HEAD LAYOUT
        <div className="teams-section-5v5 group">
          <div className="teams-header-5v5">
            <h3 className="flex items-center gap-3">
              <span className="text-xl">⚔️</span>
              Head-to-Head Matchup: Lobby {group.group_name}
            </h3>
          </div>

          <div className="lobby-matchup-container">
            {/* Team A (Left) */}
            <div className="team-side-box team-side-a">
              <div className="team-side-header">Team A</div>
              {group.teams && group.teams.length > 0 ? (
                <div
                  className="team-card-5v5 cursor-pointer hover:scale-[1.05] transition-transform"
                  onClick={() => {
                    if (onTeamClick) {
                      onTeamClick(group.teams[0]);
                    }
                  }}
                >
                  <div className="team-icon-box">👥</div>
                  <div className="team-name-5v5">{group.teams[0]?.team_name || 'TBD'}</div>
                  <div className="team-members-count">5 Players</div>
                </div>
              ) : (
                <div className="team-card-5v5 empty">TBD</div>
              )}
            </div>

            {/* VS Badge */}
            <div className="vs-badge-large">VS</div>

            {/* Team B (Right) */}
            <div className="team-side-box team-side-b">
              <div className="team-side-header">Team B</div>
              {group.teams && group.teams.length > 1 ? (
                <div
                  className="team-card-5v5 cursor-pointer hover:scale-[1.05] transition-transform"
                  onClick={() => {
                    if (onTeamClick) {
                      onTeamClick(group.teams[1]);
                    }
                  }}
                >
                  <div className="team-icon-box">👥</div>
                  <div className="team-name-5v5">{group.teams[1]?.team_name || 'TBD'}</div>
                  <div className="team-members-count">5 Players</div>
                </div>
              ) : (
                <div className="team-card-5v5 empty">TBD</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // STANDARD BR LAYOUT (Multiple Teams)
        <div className="teams-section-inline group">
          <div className="teams-header-inline">
            <h3 className="flex items-center gap-3">
              <span className="text-xl">⚔️</span>
              Combatants in Sector {group.group_name}
            </h3>
            {qualifyingTeams > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-success rounded-full"></div>
                <span className="qualifying-badge">{qualifyingTeams} Units Advancing</span>
              </div>
            )}
          </div>

          <div className="teams-grid-inline">
            {group.teams?.map((team) => (
              <div
                key={team.id}
                className="team-card-inline hover:scale-[1.03] active:scale-95 cursor-pointer"
                onClick={() => {
                  if (onTeamClick) {
                    onTeamClick(team);
                  }
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-600 font-black mb-1">TEAM</span>
                  <span className="truncate w-full">{team.team_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagementView;
