import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { tournamentAPI } from '../utils/api';
import { generateStandingsImage } from './standingsImageGenerator';
import './PointsTableModal.css';

// Helper function to get full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

const ScrimPointsTableModal = ({
  isOpen,
  onClose,
  tournament,
  currentRound,
  initialMatch = 1,
  onMatchChange,
}) => {
  const [selectedMatch, setSelectedMatch] = useState(initialMatch);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('match'); // 'match' or 'final'
  const [groupsData, setGroupsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const modalContentRef = useRef(null);

  useEffect(() => {
    if (isOpen && tournament) {
      setSelectedMatch(initialMatch);
      loadScrimData();
    }
  }, [isOpen, tournament]);

  useEffect(() => {
    if (onMatchChange) {
      onMatchChange(selectedMatch);
    }
  }, [selectedMatch, onMatchChange]);

  const loadScrimData = async () => {
    if (!tournament?.id) return;

    setLoading(true);
    try {
      const response = await tournamentAPI.getRoundGroups(tournament.id, 1); // Always round 1 for scrims
      const groups = response.data.groups || [];
      setGroupsData(groups);

      if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
    } catch (error) {
      console.error('Error loading scrim data:', error);
      setGroupsData([]);
    } finally {
      setLoading(false);
    }
  };

  const getMatchStandings = (group, matchNum) => {
    if (!group?.matches) return [];

    const specificMatch = group.matches.find((m) => m.match_number === matchNum);
    if (!specificMatch) return [];

    const scores = specificMatch.scores || specificMatch.match_scores || [];
    if (!scores || scores.length === 0) return [];

    const standings = scores.map((score) => ({
      team_id: score.team_id || score.team,
      team_name: score.team_name || score.name,
      profile_picture: score.profile_picture,
      wins: score.wins || 0,
      position_points: score.position_points || 0,
      kill_points: score.kill_points || 0,
      total_points: (score.position_points || 0) + (score.kill_points || 0),
    }));

    standings.sort((a, b) => b.total_points - a.total_points);
    return standings;
  };

  const getScrimFinalStandings = (group) => {
    if (!group?.matches) return [];

    const teamScores = {};

    group.matches.forEach((match) => {
      const scores = match.scores || match.match_scores || [];

      if (scores && scores.length > 0) {
        scores.forEach((score) => {
          const teamId = score.team_id || score.team;
          const teamName = score.team_name || score.name;

          if (!teamScores[teamId]) {
            teamScores[teamId] = {
              team_id: teamId,
              team_name: teamName,
              profile_picture: score.profile_picture,
              wins: 0,
              position_points: 0,
              kill_points: 0,
              total_points: 0,
            };
          }

          teamScores[teamId].wins += score.wins || 0;
          teamScores[teamId].position_points += score.position_points || 0;
          teamScores[teamId].kill_points += score.kill_points || 0;
          teamScores[teamId].total_points +=
            (score.position_points || 0) + (score.kill_points || 0);
        });
      }
    });

    const standings = Object.values(teamScores);
    standings.sort((a, b) => b.total_points - a.total_points);

    return standings;
  };

  const getMatchesCount = () => {
    if (selectedGroup) {
      return selectedGroup.matches_per_group || selectedGroup.matches?.length || 0;
    }
    if (groupsData.length > 0) {
      return groupsData[0].matches_per_group || groupsData[0].matches?.length || 0;
    }
    return 0;
  };

  const isMatchUnlocked = (matchNum) => {
    if (!selectedGroup?.matches) return false;
    if (matchNum === 1) return true;
    const previousMatch = selectedGroup.matches.find((m) => m.match_number === matchNum - 1);
    return previousMatch && previousMatch.status === 'completed';
  };

  const isScrimResultsUnlocked = () => {
    if (!groupsData || groupsData.length === 0) return false;
    return groupsData.every((group) => {
      if (!group.matches || group.matches.length === 0) return false;
      return group.matches.every((match) => match.status === 'completed');
    });
  };

  const getTotalTeams = () => {
    if (!groupsData || groupsData.length === 0) return 0;
    const allTeams = new Set();
    groupsData.forEach((group) => {
      if (group.teams) {
        group.teams.forEach((team) => allTeams.add(team.id || team.team_id));
      }
    });
    return allTeams.size;
  };

  const handleDownloadImage = async () => {
    if (downloading) return;

    setDownloading(true);
    try {
      // Get ALL standings data (not just visible)
      const allStandings =
        viewMode === 'match'
          ? getMatchStandings(selectedGroup, selectedMatch)
          : getScrimFinalStandings(selectedGroup);

      // Generate custom image with all teams
      const imageDataUrl = await generateStandingsImage({
        tournament,
        standings: allStandings,
        viewMode,
        selectedRound: 1,
        selectedMatch,
        selectedGroup,
        getRoundLabel: () => 'SCRIM',
      });

      // Download the image
      const link = document.createElement('a');
      const fileName = `${tournament?.title || 'Scrim'}_${viewMode === 'match' ? `Match${selectedMatch}` : 'Results'}_Standings.png`;
      link.download = fileName.replace(/[^a-z0-9_-]/gi, '_');
      link.href = imageDataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  const matchesCount = getMatchesCount();
  const standings =
    viewMode === 'match'
      ? getMatchStandings(selectedGroup, selectedMatch)
      : getScrimFinalStandings(selectedGroup);

  return ReactDOM.createPortal(
    <div className="compact-modal-overlay" onClick={onClose}>
      <div
        className="compact-points-modal"
        onClick={(e) => e.stopPropagation()}
        ref={modalContentRef}
      >
        {/* Header */}
        <div className="compact-modal-header">
          <div className="header-content">
            <div className="header-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className="text-xs font-black tracking-widest">STANDINGS</span>
            </div>
            <h2 className="text-base font-bold">{tournament?.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="compact-download-btn"
              onClick={handleDownloadImage}
              disabled={downloading}
              title="Download as Image"
            >
              {downloading ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="animate-spin"
                >
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    opacity="0.75"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
            </button>
            <button className="compact-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Match Navigation */}
        <div className="compact-match-nav">
          <button
            className="nav-arrow-compact"
            onClick={() => {
              if (viewMode === 'final') {
                setViewMode('match');
                setSelectedMatch(matchesCount);
              } else {
                setSelectedMatch(Math.max(1, selectedMatch - 1));
              }
            }}
            disabled={viewMode === 'match' && selectedMatch === 1}
          >
            ‹
          </button>

          <div className="compact-match-tabs">
            {Array.from({ length: matchesCount }, (_, i) => i + 1).map((matchNum) => {
              const unlocked = isMatchUnlocked(matchNum);
              return (
                <button
                  key={matchNum}
                  className={`compact-match-tab ${selectedMatch === matchNum && viewMode === 'match' ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                  onClick={() => {
                    if (unlocked) {
                      setViewMode('match');
                      setSelectedMatch(matchNum);
                    }
                  }}
                  disabled={!unlocked}
                >
                  M{matchNum}
                </button>
              );
            })}
            <button
              className={`compact-match-tab ${viewMode === 'final' ? 'active' : ''} ${!isScrimResultsUnlocked() ? 'locked' : ''}`}
              onClick={() => {
                if (isScrimResultsUnlocked()) {
                  setViewMode('final');
                }
              }}
              disabled={!isScrimResultsUnlocked()}
            >
              Results
            </button>
          </div>

          <button
            className="nav-arrow-compact"
            onClick={() => {
              if (viewMode === 'match') {
                const nextMatch = selectedMatch + 1;
                if (nextMatch <= matchesCount && isMatchUnlocked(nextMatch)) {
                  setSelectedMatch(nextMatch);
                } else if (isScrimResultsUnlocked()) {
                  setViewMode('final');
                }
              }
            }}
            disabled={viewMode === 'final'}
          >
            ›
          </button>
        </div>

        {/* Compact Table */}
        <div className="compact-table-container">
          {loading ? (
            <div className="compact-loading">Loading...</div>
          ) : (
            <table className="compact-standings-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>TEAM</th>
                  <th>Wins</th>
                  <th>Position PTS</th>
                  <th>Kill PTS</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => {
                  const rank = index + 1;
                  const medalClass =
                    rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';

                  return (
                    <tr key={team.team_id} className={medalClass}>
                      <td className="rank-col">
                        {rank <= 3 ? (
                          <div className="medal-badge">
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                          </div>
                        ) : (
                          <span className="rank-num">{rank}</span>
                        )}
                      </td>
                      <td className="team-col">
                        <div className="team-info">
                          <div className="team-icon">
                            {team.profile_picture ? (
                              <img src={getImageUrl(team.profile_picture)} alt="" />
                            ) : (
                              <div className="team-icon-fallback">
                                {team.team_name?.charAt(0).toUpperCase() || 'T'}
                              </div>
                            )}
                          </div>
                          <span className="team-name">{team.team_name}</span>
                        </div>
                      </td>
                      <td className="wins-col">{team.wins || 0}</td>
                      <td className="place-col">{team.position_points || 0}</td>
                      <td className="kills-col">{team.kill_points || 0}</td>
                      <td className="pts-col">
                        <span className="pts-badge">{team.total_points || 0}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {groupsData.length > 0 && selectedGroup && (
          <div className="compact-table-footer">
            <span>Scrim • {viewMode === 'match' ? `M${selectedMatch}` : 'Results'}</span>
            <span>{getTotalTeams()} Teams</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ScrimPointsTableModal;
