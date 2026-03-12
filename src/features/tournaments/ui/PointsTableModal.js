import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { tournamentAPI } from '../../../utils/api';
import { generateStandingsImage, generate5v5Image } from './standingsImageGenerator';
import './PointsTableModal.css';

// Helper function to get full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

const PointsTableModal = ({
  isOpen,
  onClose,
  tournament,
  currentRound,
  initialMatch = 1,
  onMatchChange,
}) => {
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(initialMatch);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('match'); // 'match' or 'results'
  const [groupsData, setGroupsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const modalContentRef = useRef(null);

  const is5v5 =
    tournament?.game_mode === '5v5' ||
    ['COD', 'Call of Duty', 'Valorant'].includes(tournament?.game_name);

  useEffect(() => {
    if (isOpen && currentRound && tournament) {
      setSelectedRound(currentRound);
      setSelectedMatch(initialMatch);
      loadRoundData(currentRound);
    }
  }, [isOpen, currentRound, tournament]);

  useEffect(() => {
    if (isOpen && selectedRound && tournament) {
      loadRoundData(selectedRound);
    }
  }, [selectedRound]);

  useEffect(() => {
    if (onMatchChange) {
      onMatchChange(selectedMatch);
    }
  }, [selectedMatch, onMatchChange]);

  const loadRoundData = async (roundNum) => {
    if (!tournament?.id) return;

    setLoading(true);
    try {
      const response = await tournamentAPI.getRoundGroups(tournament.id, roundNum);
      const groups = response.data.groups || [];
      setGroupsData(groups);

      if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
    } catch (error) {
      console.error('Error loading round data:', error);
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

    standings.sort(
      (a, b) =>
        b.total_points - a.total_points || b.wins - a.wins || b.position_points - a.position_points
    );
    return standings;
  };

  const getGroupCumulativeStandings = (group) => {
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
    standings.sort(
      (a, b) =>
        b.total_points - a.total_points || b.wins - a.wins || b.position_points - a.position_points
    );

    return standings;
  };

  // 5v5: Get lobby results for a specific match number across all groups
  const get5v5LobbyResults = (matchNum) => {
    if (!groupsData || groupsData.length === 0) return [];

    return groupsData.map((group, idx) => {
      const match = group.matches?.find((m) => m.match_number === matchNum);
      const scores = match?.scores || match?.match_scores || [];

      // Use scores array directly (it always has team_name and team_id from backend)
      const teamScores = scores.map((s) => ({
        team_id: s.team_id || s.team,
        team_name: s.team_name || s.name,
        score: (s.position_points || 0) + (s.kill_points || 0),
        wins: s.wins || 0,
      }));

      // Determine winner from wins field
      let winnerId = null;
      const w = teamScores.find((t) => t.wins > 0);
      if (w) winnerId = w.team_id;

      return {
        lobby_number: idx + 1,
        group_name: group.group_name,
        map_name: match?.map_name || null,
        status: match?.status || 'waiting',
        teams: teamScores,
        winner_id: winnerId,
        has_scores:
          match?.scores_submitted ||
          scores.some((s) => (s.position_points || 0) + (s.kill_points || 0) > 0),
      };
    });
  };

  // 5v5: Get cumulative lobby results across all matches
  const get5v5CumulativeResults = () => {
    if (!groupsData || groupsData.length === 0) return [];

    return groupsData.map((group, idx) => {
      const allMatches = group.matches || [];

      // Aggregate scores by team_id across all matches using scores array directly
      const teamMap = {};
      allMatches.forEach((match) => {
        const scores = match.scores || match.match_scores || [];
        scores.forEach((s) => {
          const teamId = s.team_id || s.team;
          if (!teamMap[teamId]) {
            teamMap[teamId] = {
              team_id: teamId,
              team_name: s.team_name || s.name,
              score: 0,
              wins: 0,
            };
          }
          teamMap[teamId].score += (s.position_points || 0) + (s.kill_points || 0);
          teamMap[teamId].wins += s.wins || 0;
        });
      });

      const teamTotals = Object.values(teamMap);

      // Winner is the team with more wins
      let winnerId = null;
      if (teamTotals.length === 2) {
        if (teamTotals[0].wins > teamTotals[1].wins) winnerId = teamTotals[0].team_id;
        else if (teamTotals[1].wins > teamTotals[0].wins) winnerId = teamTotals[1].team_id;
      }

      return {
        lobby_number: idx + 1,
        group_name: group.group_name,
        teams: teamTotals,
        winner_id: winnerId,
      };
    });
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

  const isRoundUnlocked = (roundNum) => {
    if (tournament?.status === 'completed') return true;
    return roundNum <= currentRound;
  };

  const isMatchUnlocked = (matchNum) => {
    if (is5v5) {
      // For 5v5, check across all groups
      if (matchNum === 1) return true;
      return groupsData.some((group) => {
        const prev = group.matches?.find((m) => m.match_number === matchNum - 1);
        return prev && prev.status === 'completed';
      });
    }
    if (!selectedGroup?.matches) return false;
    if (matchNum === 1) return true;
    const previousMatch = selectedGroup.matches.find((m) => m.match_number === matchNum - 1);
    return previousMatch && previousMatch.status === 'completed';
  };

  const isRoundResultsUnlocked = () => {
    if (!groupsData || groupsData.length === 0) return false;
    return groupsData.every((group) => {
      if (!group.matches || group.matches.length === 0) return false;
      return group.matches.every((match) => match.status === 'completed');
    });
  };

  const getRoundLabel = (roundNum) => {
    // Check for custom round name first
    if (tournament?.round_names && tournament.round_names[String(roundNum)]) {
      return tournament.round_names[String(roundNum)];
    }
    // Fallback to default logic
    if (!tournament?.rounds) return `R${roundNum}`;
    const totalRounds = tournament.rounds.length;
    if (roundNum === totalRounds && totalRounds > 1) {
      return 'Finals';
    }
    return `R${roundNum}`;
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
      let imageDataUrl;

      if (is5v5) {
        // 5v5 mode: generate lobby-based image with all lobbies
        const lobbies =
          viewMode === 'match' ? get5v5LobbyResults(selectedMatch) : get5v5CumulativeResults();

        imageDataUrl = await generate5v5Image({
          tournament,
          lobbies,
          viewMode,
          selectedRound,
          selectedMatch,
          getRoundLabel,
        });
      } else {
        // BR mode: generate table-based standings image
        const allStandings =
          viewMode === 'match'
            ? getMatchStandings(selectedGroup, selectedMatch)
            : getGroupCumulativeStandings(selectedGroup);

        imageDataUrl = await generateStandingsImage({
          tournament,
          standings: allStandings,
          viewMode,
          selectedRound,
          selectedMatch,
          selectedGroup,
          getRoundLabel,
        });
      }

      // Download the image — use Blob for better mobile compatibility
      const fileName =
        `${tournament?.title || 'Tournament'}_${getRoundLabel(selectedRound)}_${viewMode === 'match' ? `Match${selectedMatch}` : 'Results'}_${selectedGroup?.group_name || 'Standings'}.png`.replace(
          /[^a-z0-9_.-]/gi,
          '_'
        );

      // Convert data URL to Blob for cross-browser/mobile support
      const byteString = atob(imageDataUrl.split(',')[1]);
      const mimeType = 'image/png';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      // Check if mobile (touch device) — try share API first, then fallback
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && navigator.share && navigator.canShare) {
        // Use Web Share API on mobile for native share sheet
        const file = new File([blob], fileName, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          URL.revokeObjectURL(blobUrl);
          setDownloading(false);
          return;
        }
      }

      // Fallback: standard link download (works on desktop and most Android Chrome)
      const link = document.createElement('a');
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
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
      : getGroupCumulativeStandings(selectedGroup);

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
              {is5v5 ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M14.5 17.5L3 6V3h3l11.5 11.5M13 7l4-4 4 4-4 4M7 13l-4 4 4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              )}
              <span className="text-xs font-black tracking-widest">
                {is5v5 ? '5V5 RESULTS' : 'STANDINGS'}
              </span>
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

        {/* Round Tabs */}
        {tournament?.rounds && tournament.rounds.length > 1 && (
          <div className="compact-round-tabs">
            {tournament.rounds.map((round) => (
              <button
                key={round.round}
                className={`compact-round-tab ${selectedRound === round.round ? 'active' : ''} ${!isRoundUnlocked(round.round) ? 'locked' : ''}`}
                onClick={() => {
                  if (isRoundUnlocked(round.round)) {
                    setSelectedRound(round.round);
                    setSelectedMatch(1);
                    setViewMode('match');
                  }
                }}
                disabled={!isRoundUnlocked(round.round)}
              >
                {getRoundLabel(round.round)}
              </button>
            ))}
          </div>
        )}

        {/* Match Navigation */}
        <div className="compact-match-nav">
          <button
            className="nav-arrow-compact"
            onClick={() => {
              if (viewMode === 'results') {
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
              className={`compact-match-tab ${viewMode === 'results' ? 'active' : ''} ${!isRoundResultsUnlocked() ? 'locked' : ''}`}
              onClick={() => {
                if (isRoundResultsUnlocked()) {
                  setViewMode('results');
                }
              }}
              disabled={!isRoundResultsUnlocked()}
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
                } else if (isRoundResultsUnlocked()) {
                  setViewMode('results');
                }
              }
            }}
            disabled={viewMode === 'results'}
          >
            ›
          </button>
        </div>

        {is5v5 ? (
          <>
            {/* 5v5 Lobby Cards */}
            <div className="compact-table-container">
              {loading ? (
                <div className="compact-loading">Loading...</div>
              ) : (
                <div className="lobby-cards-container">
                  {(viewMode === 'match'
                    ? get5v5LobbyResults(selectedMatch)
                    : get5v5CumulativeResults()
                  ).map((lobby) => {
                    const teamA = lobby.teams[0];
                    const teamB = lobby.teams[1];
                    const aIsWinner = lobby.winner_id && teamA && lobby.winner_id === teamA.team_id;
                    const bIsWinner = lobby.winner_id && teamB && lobby.winner_id === teamB.team_id;

                    return (
                      <div key={lobby.lobby_number} className="lobby-card">
                        <div className="lobby-card-header">
                          <span className="lobby-label">Lobby {lobby.lobby_number}</span>
                          {lobby.map_name && <span className="lobby-map">{lobby.map_name}</span>}
                        </div>
                        <div className="lobby-matchup">
                          <div className={`lobby-team ${aIsWinner ? 'winner' : ''}`}>
                            {aIsWinner && (
                              <svg
                                className="lobby-crown"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                              </svg>
                            )}
                            <span className="lobby-team-name">{teamA?.team_name || 'TBD'}</span>
                          </div>
                          <div className="lobby-scores">
                            <span className={`lobby-score ${aIsWinner ? 'winner' : ''}`}>
                              {lobby.has_scores || viewMode === 'results'
                                ? (teamA?.score ?? 0)
                                : '—'}
                            </span>
                            <span className="lobby-dash">–</span>
                            <span className={`lobby-score ${bIsWinner ? 'winner' : ''}`}>
                              {lobby.has_scores || viewMode === 'results'
                                ? (teamB?.score ?? 0)
                                : '—'}
                            </span>
                          </div>
                          <div className={`lobby-team right ${bIsWinner ? 'winner' : ''}`}>
                            <span className="lobby-team-name">{teamB?.team_name || 'TBD'}</span>
                            {bIsWinner && (
                              <svg
                                className="lobby-crown"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5v5 Footer */}
            <div className="compact-table-footer">
              <span>
                {getRoundLabel(selectedRound)} • {groupsData.length} Lobbies
              </span>
              <span className="footer-5v5-badge">5v5 Format</span>
            </div>
          </>
        ) : (
          <>
            {/* Group Tabs (BR only) */}
            {groupsData.length > 1 && (
              <div className="compact-group-tabs">
                {groupsData.map((group) => (
                  <button
                    key={group.id}
                    className={`compact-group-tab ${selectedGroup?.id === group.id ? 'active' : ''}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    {group.group_name}
                  </button>
                ))}
              </div>
            )}

            {/* BR Compact Table */}
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

            {/* BR Footer */}
            {groupsData.length > 0 && selectedGroup && (
              <div className="compact-table-footer">
                <span>
                  {getRoundLabel(selectedRound)} •{' '}
                  {viewMode === 'match' ? `M${selectedMatch}` : 'Results'} •{' '}
                  {selectedGroup?.group_name}
                </span>
                <span>{getTotalTeams()} Teams</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PointsTableModal;
