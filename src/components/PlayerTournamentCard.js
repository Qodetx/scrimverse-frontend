import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';
import PointsTableModal from './PointsTableModal';
import Toast from './Toast';
import './PlayerTournamentCard.css';

const PlayerTournamentCard = ({ registration }) => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [copied, setCopied] = useState({ id: false, password: false });
  const [timeRemaining, setTimeRemaining] = useState('');
  const [fullTournament, setFullTournament] = useState(null); // Store full tournament with rounds
  const [toast, setToast] = useState(null);
  const [matchSchedule, setMatchSchedule] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const tournament = registration.tournament || registration.tournament_details;
  const status = tournament?.status;

  // Fetch current match details for ongoing tournaments
  useEffect(() => {
    if (!tournament || status !== 'ongoing') {
      return;
    }

    const fetchCurrentMatch = async () => {
      try {
        // Use registration ID, not team ID - groups contain TournamentRegistration IDs
        const registrationId = registration.id;

        // If current_round is not available, fetch full tournament details
        let currentRound = tournament.current_round;
        if (!currentRound) {
          try {
            const tournamentResponse = await tournamentAPI.getTournament(tournament.id);
            currentRound = tournamentResponse.data.current_round;
          } catch (err) {
            console.error('Failed to fetch full tournament details:', err);
            return;
          }
        }

        if (!currentRound || currentRound <= 0) {
          return;
        }

        const response = await tournamentAPI.getRoundGroups(tournament.id, currentRound);
        const groups = response.data.groups || [];

        // Find the group this player is in using registration ID
        const playerGroup = groups.find((group) =>
          group.teams?.some((team) => team.id === registrationId)
        );

        if (playerGroup?.matches) {
          // Find the current ongoing or most recent match
          const ongoingMatch = playerGroup.matches.find((m) => m.status === 'ongoing');
          const latestMatch =
            ongoingMatch ||
            playerGroup.matches
              .filter((m) => m.status !== 'waiting')
              .sort((a, b) => b.match_number - a.match_number)[0];

          setCurrentMatch(latestMatch);
        }
      } catch (error) {
        console.error('Error fetching match details:', error);
      }
    };

    fetchCurrentMatch();
    // Refresh every 30 seconds for ongoing tournaments
    const interval = setInterval(fetchCurrentMatch, 30000);
    return () => clearInterval(interval);
  }, [tournament?.id, tournament?.current_round, status, registration.id, tournament]);

  // Countdown timer for upcoming tournaments
  useEffect(() => {
    if (!tournament || status !== 'upcoming') {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const start = new Date(tournament.tournament_start).getTime();
      const distance = start - now;

      if (distance < 0) {
        setTimeRemaining('Starting soon...');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, tournament?.tournament_start, tournament]);

  // Fetch match schedule for display
  useEffect(() => {
    if (!tournament) return;

    const fetchSchedule = async () => {
      try {
        // Try to get rounds - use current_round or round 1
        const rounds = tournament.rounds || [];
        const allMatches = [];

        for (const roundConfig of rounds) {
          try {
            const response = await tournamentAPI.getRoundGroups(tournament.id, roundConfig.round);
            const groups = response.data.groups || [];
            groups.forEach((group) => {
              (group.matches || []).forEach((match) => {
                allMatches.push({
                  ...match,
                  group_name: group.group_name,
                  round_number: roundConfig.round,
                });
              });
            });
          } catch (err) {
            // Round not configured yet
          }
        }

        // If no rounds config, try round 1
        if (rounds.length === 0 && tournament.current_round > 0) {
          try {
            const response = await tournamentAPI.getRoundGroups(
              tournament.id,
              tournament.current_round
            );
            const groups = response.data.groups || [];
            groups.forEach((group) => {
              (group.matches || []).forEach((match) => {
                allMatches.push({
                  ...match,
                  group_name: group.group_name,
                  round_number: tournament.current_round,
                });
              });
            });
          } catch (err) {
            // No groups available
          }
        }

        setMatchSchedule(allMatches);
      } catch (error) {
        console.error('Error fetching match schedule:', error);
      }
    };

    fetchSchedule();
    // Poll every 60 seconds
    const interval = setInterval(fetchSchedule, 60000);
    return () => clearInterval(interval);
  }, [tournament?.id, tournament?.current_round, tournament]);

  // Early return AFTER all hooks
  if (!tournament) {
    console.error('PlayerTournamentCard: No tournament data found in registration', registration);
    return null;
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });

    // Show toast notification
    const label = type === 'id' ? 'Match ID' : 'Password';
    setToast({ message: `${label} copied to clipboard!`, type: 'success' });

    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  const getStatusBadge = () => {
    const badges = {
      upcoming: { text: 'Upcoming', class: 'status-upcoming' },
      ongoing: { text: 'Live', class: 'status-live' },
      completed: { text: 'Completed', class: 'status-completed' },
    };
    const badge = badges[status] || badges.upcoming;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getRankDisplay = () => {
    // This would need to be populated from backend with actual rank
    // For now, showing placeholder based on round
    if (status === 'ongoing' && tournament.current_round > 0) {
      const totalRounds = tournament.rounds?.length || 0;
      return `#${tournament.current_round} of ${totalRounds}`;
    }
    return null;
  };

  const getStageDisplay = () => {
    if (status === 'completed') return 'Finished';
    if (status === 'ongoing') {
      const roundConfig = tournament.rounds?.find((r) => r.round === tournament.current_round);
      if (roundConfig) {
        const isFinal = tournament.current_round === tournament.rounds.length;
        return isFinal ? 'Finals' : 'Group Stage';
      }
    }
    return 'Registered';
  };

  return (
    <>
      <Link
        to={
          (tournament.event_mode || '').toUpperCase() === 'SCRIM'
            ? `/scrims/${tournament.id}`
            : `/tournaments/${tournament.id}`
        }
        className="player-tournament-card"
        onClick={(e) => {
          // Prevent navigation when clicking on interactive elements
          if (e.target.closest('.copy-btn') || e.target.closest('.points-table-btn')) {
            e.preventDefault();
          }
        }}
      >
        <div className="card-header">
          <div className="tournament-icon">
            <svg
              className="icon-trophy"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="tournament-info">
            <h3 className="tournament-title">{tournament.title}</h3>
            <div className="tournament-meta">
              <span className="game-mode-badge">{tournament.game_mode}</span>
              {getStatusBadge()}
            </div>
          </div>
          {getRankDisplay() && (
            <div className="rank-display">
              <span className="rank-text">{getRankDisplay()}</span>
              <span className="stage-text">{getStageDisplay()}</span>
            </div>
          )}
        </div>

        <div className="card-details">
          <div className="detail-item">
            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="detail-text">
              {status === 'upcoming' ? 'Starts' : 'Started'}:{' '}
              {new Date(tournament.tournament_start).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="detail-item">
            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="detail-text">{tournament.current_participants} Teams</span>
          </div>
        </div>

        {/* Match Credentials - Only for ongoing tournaments */}
        {status === 'ongoing' &&
          currentMatch &&
          (currentMatch.match_id || currentMatch.match_password) && (
            <div className="match-credentials">
              <div className="credentials-header">
                <svg className="key-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <span className="credentials-title">Match Credentials</span>
              </div>
              <div className="credentials-grid">
                {currentMatch.match_id && (
                  <div className="credential-item">
                    <label className="credential-label">Match ID</label>
                    <div className="credential-value-wrapper">
                      <span className="credential-value">{currentMatch.match_id}</span>
                      <button
                        className="copy-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyToClipboard(currentMatch.match_id, 'id');
                        }}
                        title="Copy Match ID"
                      >
                        {copied.id ? (
                          <svg className="copy-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="copy-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {currentMatch.match_password && (
                  <div className="credential-item">
                    <label className="credential-label">Password</label>
                    <div className="credential-value-wrapper">
                      <span className="credential-value">{currentMatch.match_password}</span>
                      <button
                        className="copy-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyToClipboard(currentMatch.match_password, 'password');
                        }}
                        title="Copy Password"
                      >
                        {copied.password ? (
                          <svg className="copy-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="copy-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Action Buttons — Points Table + Time (like scrimverse.space) */}
        <div className="card-action" style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <button
            className="points-table-btn"
            style={{ flex: 1 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPointsTable(true);
            }}
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Points Table
          </button>
          <button
            className="time-toggle-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSchedule(!showSchedule);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#e5e7eb',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Time
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                transform: showSchedule ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </Link>

      {/* Match Schedule Display (toggled by Time button) */}
      {showSchedule && matchSchedule.length > 0 && (
        <div
          className="match-schedule-section"
          style={{
            marginTop: '12px',
            padding: '16px',
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Match Schedule ({matchSchedule.length} matches)
          </h4>
          <div className="schedule-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th
                    style={{ padding: '8px', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}
                  >
                    Match
                  </th>
                  <th
                    style={{ padding: '8px', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}
                  >
                    Group
                  </th>
                  <th
                    style={{ padding: '8px', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}
                  >
                    Map
                  </th>
                  <th
                    style={{ padding: '8px', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}
                  >
                    Date
                  </th>
                  <th
                    style={{ padding: '8px', color: '#9ca3af', textAlign: 'left', fontWeight: 600 }}
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {matchSchedule
                  .sort((a, b) => {
                    if (a.round_number !== b.round_number) return a.round_number - b.round_number;
                    if (a.group_name !== b.group_name)
                      return a.group_name.localeCompare(b.group_name);
                    return a.match_number - b.match_number;
                  })
                  .map((match, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background:
                          match.status === 'ongoing' ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 8px',
                          color: '#fff',
                          fontWeight: match.status === 'ongoing' ? 700 : 500,
                        }}
                      >
                        #{match.match_number}
                        {match.status === 'ongoing' && (
                          <span
                            style={{
                              marginLeft: '6px',
                              padding: '2px 6px',
                              background: 'rgba(34, 197, 94, 0.2)',
                              color: '#22c55e',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          >
                            LIVE
                          </span>
                        )}
                        {match.status === 'completed' && (
                          <span
                            style={{
                              marginLeft: '6px',
                              fontSize: '11px',
                              color: '#6b7280',
                            }}
                          >
                            Done
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#a855f7', fontWeight: 600 }}>
                        {match.group_name}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#9ca3af' }}>
                        {match.map_name || 'TBD'}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#9ca3af' }}>
                        {match.scheduled_date
                          ? new Date(match.scheduled_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'TBD'}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#06b6d4', fontWeight: 600 }}>
                        {match.scheduled_time
                          ? new Date(`1970-01-01T${match.scheduled_time}`).toLocaleTimeString(
                              'en-US',
                              {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }
                            )
                          : 'TBD'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Matches Message */}
      {showSchedule && matchSchedule.length === 0 && (
        <div
          className="no-matches-message"
          style={{
            marginTop: '12px',
            padding: '16px',
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#f59e0b',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <svg
            style={{ width: '24px', height: '24px', margin: '0 auto 8px', opacity: 0.7 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          No match schedule available yet. The host will update this soon.
        </div>
      )}

      {/* Points Table Modal */}
      <PointsTableModal
        isOpen={showPointsTable}
        onClose={() => setShowPointsTable(false)}
        tournament={fullTournament || tournament}
        currentRound={fullTournament?.current_round || tournament?.current_round || 1}
      />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default PlayerTournamentCard;
