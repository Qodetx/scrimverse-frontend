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
  const [scheduleByRound, setScheduleByRound] = useState({});
  const [showSchedule, setShowSchedule] = useState(false);
  const [selRound, setSelRound] = useState(null);
  const [selGroup, setSelGroup] = useState(null);

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
            setFullTournament(tournamentResponse.data);
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
        const rounds = tournament.rounds || [];
        const allMatches = [];
        const byRound = {};

        for (const roundConfig of rounds) {
          try {
            const response = await tournamentAPI.getRoundGroups(tournament.id, roundConfig.round);
            const groups = response.data.groups || [];
            if (groups.length > 0) {
              byRound[roundConfig.round] = { groups: [] };
              groups.forEach((group) => {
                const groupMatches = (group.matches || []).map((match) => ({
                  ...match,
                  group_name: group.group_name,
                  round_number: roundConfig.round,
                }));
                byRound[roundConfig.round].groups.push({
                  group_name: group.group_name,
                  group_id: group.id,
                  matches: groupMatches,
                });
                allMatches.push(...groupMatches);
              });
            }
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
            if (groups.length > 0) {
              byRound[tournament.current_round] = { groups: [] };
              groups.forEach((group) => {
                const groupMatches = (group.matches || []).map((match) => ({
                  ...match,
                  group_name: group.group_name,
                  round_number: tournament.current_round,
                }));
                byRound[tournament.current_round].groups.push({
                  group_name: group.group_name,
                  group_id: group.id,
                  matches: groupMatches,
                });
                allMatches.push(...groupMatches);
              });
            }
          } catch (err) {
            // No groups available
          }
        }

        setMatchSchedule(allMatches);
        setScheduleByRound(byRound);
        // Auto-select first round/group if not yet selected
        const roundKeys = Object.keys(byRound)
          .map(Number)
          .sort((a, b) => a - b);
        if (roundKeys.length > 0 && !selRound) {
          setSelRound(roundKeys[0]);
          if (byRound[roundKeys[0]].groups.length > 0) {
            setSelGroup(byRound[roundKeys[0]].groups[0].group_name);
          }
        }
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
    <div className="player-tournament-card-wrapper">
      <Link
        to={
          (tournament.event_mode || '').toUpperCase() === 'SCRIM'
            ? `/scrims/${tournament.id}`
            : `/tournaments/${tournament.id}`
        }
        className="player-tournament-card"
        onClick={(e) => {
          // Prevent navigation when clicking on interactive elements
          if (
            e.target.closest('.copy-btn') ||
            e.target.closest('.points-table-btn') ||
            e.target.closest('.time-toggle-btn')
          ) {
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
      {showSchedule && Object.keys(scheduleByRound).length > 0 && (
        <div
          className="match-schedule-section"
          style={{
            marginTop: '12px',
            background: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Match Schedule</span>
          </div>

          {/* Round Tabs */}
          <div style={{ display: 'flex', gap: '4px', padding: '12px 16px 0' }}>
            {Object.keys(scheduleByRound)
              .map(Number)
              .sort((a, b) => a - b)
              .map((roundNum) => {
                const roundName =
                  tournament?.round_names?.[String(roundNum)] || `Round ${roundNum}`;
                const isActive = selRound === roundNum;
                return (
                  <button
                    key={roundNum}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelRound(roundNum);
                      const groups = scheduleByRound[roundNum]?.groups || [];
                      if (groups.length > 0) setSelGroup(groups[0].group_name);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: isActive ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#fff' : '#9ca3af',
                      boxShadow: isActive ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                    }}
                  >
                    {roundName}
                  </button>
                );
              })}
          </div>

          {/* Group Switcher */}
          {selRound && scheduleByRound[selRound]?.groups?.length > 1 && (
            <div style={{ display: 'flex', gap: '4px', padding: '8px 16px 0' }}>
              {scheduleByRound[selRound].groups.map((g) => {
                const isActive = selGroup === g.group_name;
                return (
                  <button
                    key={g.group_name}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelGroup(g.group_name);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      border: isActive
                        ? '1px solid rgba(255,255,255,0.2)'
                        : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: isActive ? '#fff' : '#6b7280',
                    }}
                  >
                    {g.group_name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Match Cards */}
          <div
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '350px',
              overflowY: 'auto',
            }}
          >
            {(() => {
              const currentRoundData = scheduleByRound[selRound];
              if (!currentRoundData) return null;
              const currentGroup =
                currentRoundData.groups.find((g) => g.group_name === selGroup) ||
                currentRoundData.groups[0];
              if (!currentGroup) return null;

              return currentGroup.matches
                .sort((a, b) => a.match_number - b.match_number)
                .map((match) => {
                  const timeStr = match.scheduled_time
                    ? (() => {
                        const [h, m] = match.scheduled_time.split(':');
                        const d = new Date();
                        d.setHours(parseInt(h), parseInt(m));
                        return d.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        });
                      })()
                    : null;
                  const dateStr = match.scheduled_date
                    ? new Date(match.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : null;

                  return (
                    <div
                      key={match.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border:
                          match.status === 'ongoing'
                            ? '1px solid rgba(34,197,94,0.3)'
                            : '1px solid rgba(255,255,255,0.05)',
                        background:
                          match.status === 'ongoing'
                            ? 'rgba(34,197,94,0.05)'
                            : 'rgba(255,255,255,0.02)',
                        opacity: match.status === 'completed' ? 0.6 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 800,
                            border:
                              match.status === 'ongoing'
                                ? '1px solid rgba(34,197,94,0.3)'
                                : match.status === 'completed'
                                  ? '1px solid rgba(255,255,255,0.1)'
                                  : '1px solid rgba(139,92,246,0.3)',
                            background:
                              match.status === 'ongoing'
                                ? 'rgba(34,197,94,0.1)'
                                : match.status === 'completed'
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(139,92,246,0.1)',
                            color:
                              match.status === 'ongoing'
                                ? '#22c55e'
                                : match.status === 'completed'
                                  ? '#6b7280'
                                  : '#a855f7',
                          }}
                        >
                          M{match.match_number}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {match.map_name && (
                              <span
                                style={{
                                  fontSize: '13px',
                                  color: '#d1d5db',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="#6b7280"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {match.map_name}
                              </span>
                            )}
                            {match.status === 'ongoing' && (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  color: '#22c55e',
                                  textTransform: 'uppercase',
                                }}
                              >
                                <span
                                  style={{
                                    width: '5px',
                                    height: '5px',
                                    borderRadius: '50%',
                                    background: '#22c55e',
                                    animation: 'pulse 2s infinite',
                                  }}
                                />
                                Live
                              </span>
                            )}
                            {match.status === 'completed' && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {timeStr ? (
                          <>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>
                              {timeStr}
                            </div>
                            {dateStr && (
                              <div style={{ fontSize: '10px', color: '#6b7280' }}>{dateStr}</div>
                            )}
                          </>
                        ) : dateStr ? (
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{dateStr}</div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#4b5563' }}>TBD</div>
                        )}
                      </div>
                    </div>
                  );
                });
            })()}
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
            background: '#0a0a0a',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#f59e0b',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
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
    </div>
  );
};

export default PlayerTournamentCard;
