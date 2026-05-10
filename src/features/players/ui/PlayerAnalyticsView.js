import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Trophy,
  Target,
  Medal,
  Crown,
  TrendingUp,
  Gamepad2,
  BarChart3,
  ChevronDown,
  Check,
  MapPin,
  Loader2,
  Download,
  Users,
  Swords,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AuthContext } from '../../../context/AuthContext';
import { analyticsAPI } from '../../../utils/api';
import GuestLockedState from '../../../components/GuestLockedState';
import './PlayerAnalyticsView.css';

const GAME_OPTIONS = ['All Games', 'BGMI', 'Valorant', 'Free Fire', 'Scarfall', 'COD Mobile'];

// Map display name → backend game_name value
const GAME_PARAM_MAP = {
  'All Games': null,
  BGMI: 'BGMI',
  Valorant: 'Valorant',
  'Free Fire': 'Freefire',
  Scarfall: 'Scarfall',
  'COD Mobile': 'COD',
};

const tooltipStyle = {
  background: 'hsl(0 0% 11%)',
  border: '1px solid hsl(0 0% 20%)',
  borderRadius: 8,
  fontSize: 12,
};

const getPlacementClass = (placement) => {
  if (placement <= 1) return 'an-placement-1';
  if (placement <= 2) return 'an-placement-2';
  if (placement <= 3) return 'an-placement-3';
  return 'an-placement-default';
};

// Wrapper component handles the guest fork so the analytics view's hook list
// (heavy with charts state and API effects) only runs for authenticated users.
const PlayerAnalyticsView = () => {
  const { isGuest } = useContext(AuthContext);
  if (isGuest()) {
    return (
      <GuestLockedState
        title="Player Analytics"
        description="Track your performance over time — win rate, kill points, position points, ranking, and more — once you start playing tournaments."
      />
    );
  }
  return <PlayerAnalyticsViewAuthenticated />;
};

const PlayerAnalyticsViewAuthenticated = () => {
  const { user } = useContext(AuthContext);
  const [selectedGame, setSelectedGame] = useState('All Games');
  const [activityPeriod, setActivityPeriod] = useState('monthly');
  const [trendPeriod, setTrendPeriod] = useState('monthly');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Data from API
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [activity, setActivity] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  // Team tab state
  const [analyticsTab, setAnalyticsTab] = useState('player');
  const [teamStatsData, setTeamStatsData] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target)) {
        setTeamDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch all analytics data when game filter changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const gameParam = GAME_PARAM_MAP[selectedGame];

      try {
        const [statsRes, trendRes, weeklyTrendRes, activityRes, weeklyRes, recentRes] =
          await Promise.all([
            analyticsAPI.getStats(gameParam).catch(() => ({ data: {} })),
            analyticsAPI.getTrend(gameParam).catch(() => ({ data: { trend: [] } })),
            analyticsAPI.getWeeklyTrend(gameParam).catch(() => ({ data: { trend: [] } })),
            analyticsAPI.getActivity(gameParam).catch(() => ({ data: { activity: [] } })),
            analyticsAPI.getWeeklyActivity(gameParam).catch(() => ({ data: { activity: [] } })),
            analyticsAPI.getRecentResults(gameParam).catch(() => ({ data: { results: [] } })),
          ]);

        setStats(statsRes.data);
        setTrend(trendRes.data.trend || []);
        setWeeklyTrend(weeklyTrendRes.data.trend || []);
        setActivity(activityRes.data.activity || []);
        setWeeklyActivity(weeklyRes.data.activity || []);
        setRecentResults(recentRes.data.results || []);
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedGame]);

  // Fetch team analytics when Team tab is active or game filter changes while on Team tab
  useEffect(() => {
    if (analyticsTab !== 'team') return;
    const fetchTeamStats = async () => {
      setTeamLoading(true);
      const gameParam = GAME_PARAM_MAP[selectedGame];
      try {
        const res = await analyticsAPI.getTeamStats(gameParam).catch(() => ({ data: [] }));
        const data = res.data || [];
        setTeamStatsData(data);
        if (data.length > 0) {
          setSelectedTeamId((prev) => {
            if (prev && data.find((t) => t.team_id === prev)) return prev;
            const current = data.find((t) => t.is_current_member);
            return (current || data[0]).team_id;
          });
        }
      } catch (err) {
        console.error('Team analytics fetch failed:', err);
      } finally {
        setTeamLoading(false);
      }
    };
    fetchTeamStats();
  }, [analyticsTab, selectedGame]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTeam = teamStatsData.find((t) => t.team_id === selectedTeamId) || null;

  const hasData =
    stats && (stats.matches_played > 0 || trend.length > 0 || recentResults.length > 0);

  const statCards = stats
    ? [
        {
          icon: Trophy,
          label: 'Tournament Wins',
          value: stats.total_wins || 0,
          sub: `${stats.matches_played || 0} matches`,
          subColor: 'an-sub-muted',
          iconColor: 'an-icon-yellow',
          bgColor: 'an-bg-yellow',
        },
        {
          icon: Target,
          label: 'Win Rate',
          value: stats.matches_played > 0 ? `${stats.win_rate}%` : 'N/A',
          sub: `avg ${stats.avg_kill_points || 0} KP`,
          subColor: 'an-sub-green',
          iconColor: 'an-icon-blue',
          bgColor: 'an-bg-blue',
        },
        {
          icon: Medal,
          label: 'Played',
          value: stats.matches_played || 0,
          sub: `avg ${stats.avg_position_points || 0} PP`,
          subColor: 'an-sub-muted',
          iconColor: 'an-icon-purple',
          bgColor: 'an-bg-purple',
        },
        {
          icon: Crown,
          label: 'Ranking',
          value: stats.ranking > 0 ? `#${stats.ranking}` : 'N/A',
          sub: stats.ranking > 0 ? 'Leaderboard' : 'Unranked',
          subColor: stats.ranking > 0 ? 'an-sub-green' : 'an-sub-muted',
          iconColor: 'an-icon-purple-light',
          bgColor: 'an-bg-purple',
        },
      ]
    : [];

  const exportCSV = () => {
    if (!stats && recentResults.length === 0) return;
    const escapeCSV = (val) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const rows = [];

    // Summary stats
    rows.push([`Player Analytics — ${selectedGame}`]);
    rows.push(['Metric', 'Value']);
    if (stats) {
      rows.push(['Tournament Wins', stats.total_wins || 0]);
      rows.push(['Win Rate %', stats.win_rate || 0]);
      rows.push(['Matches Played', stats.matches_played || 0]);
      rows.push(['Avg Kill Points', stats.avg_kill_points || 0]);
      rows.push(['Ranking', stats.ranking > 0 ? `#${stats.ranking}` : 'Unranked']);
    }
    rows.push([]);

    // Recent results
    if (recentResults.length > 0) {
      rows.push(['Recent Results']);
      rows.push(['Tournament', 'Game', 'Match #', 'Placement', 'Total Points', 'Kills', 'Date']);
      recentResults.forEach((r) =>
        rows.push([
          r.tournament_title || '',
          r.game_name || '',
          r.match_number || '',
          r.placement || '',
          r.total_points || '',
          r.kills || '',
          r.date ? new Date(r.date).toLocaleDateString('en-IN') : '',
        ])
      );
    }

    const csv = rows.map((r) => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrimverse-analytics-${selectedGame.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="an-container">
      {/* Header */}
      <div className="an-header">
        <h2 className="an-title">
          <BarChart3 size={20} className="an-title-icon" />
          {analyticsTab === 'player' ? 'Player Analytics' : 'Team Analytics'}
        </h2>

        <div className="an-header-actions">
          {/* Tab switcher */}
          <div className="an-tab-switcher">
            <button
              className={`an-tab-btn${analyticsTab === 'player' ? ' active' : ''}`}
              onClick={() => setAnalyticsTab('player')}
            >
              Player
            </button>
            <button
              className={`an-tab-btn${analyticsTab === 'team' ? ' active' : ''}`}
              onClick={() => setAnalyticsTab('team')}
            >
              Team
            </button>
          </div>

          {/* Game filter */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button className="an-filter-btn" onClick={() => setDropdownOpen((v) => !v)}>
              <Gamepad2 size={13} />
              {selectedGame}
              <ChevronDown
                size={12}
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>

            {dropdownOpen && (
              <div className="an-dropdown-menu">
                {GAME_OPTIONS.map((g) => (
                  <button
                    key={g}
                    className={`an-dropdown-item${selectedGame === g ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedGame(g);
                      setDropdownOpen(false);
                    }}
                  >
                    {selectedGame === g && <Check size={12} />}
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Team selector in header — only when on Team tab and player has multiple teams */}
          {analyticsTab === 'team' && !teamLoading && teamStatsData.length > 1 && (
            <div style={{ position: 'relative' }} ref={teamDropdownRef}>
              <button className="an-filter-btn" onClick={() => setTeamDropdownOpen((v) => !v)}>
                <Users size={13} />
                {selectedTeam?.team_name || 'Select Team'}
                <ChevronDown
                  size={12}
                  style={{
                    transform: teamDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              {teamDropdownOpen && (
                <div className="an-dropdown-menu">
                  {teamStatsData.map((t) => (
                    <button
                      key={t.team_id}
                      className={`an-dropdown-item${selectedTeamId === t.team_id ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedTeamId(t.team_id);
                        setTeamDropdownOpen(false);
                      }}
                    >
                      {selectedTeamId === t.team_id && <Check size={12} />}
                      <span style={{ flex: 1 }}>{t.team_name}</span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: t.is_current_member ? '#4ade80' : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {t.is_current_member ? 'Current' : 'Past'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {analyticsTab === 'player' && hasData && (
            <button onClick={exportCSV} className="an-filter-btn" style={{ gap: '0.375rem' }}>
              <Download size={13} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* ── PLAYER TAB ───────────────────────────────────────────────────── */}
      {analyticsTab === 'player' &&
        (loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2
              size={32}
              className="an-icon-purple"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
        ) : !hasData ? (
          <div className="an-empty">
            <BarChart3 size={48} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              No analytics data yet
            </p>
            <p>Play your first match to see stats here.</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="an-stats-grid">
              {statCards.map((s, i) => (
                <div key={i} className="an-stat-card">
                  <div className="an-stat-card-top">
                    <div className={`an-stat-icon-wrap ${s.bgColor}`}>
                      <s.icon size={16} className={s.iconColor} />
                    </div>
                    <span className={`an-stat-sub ${s.subColor}`}>{s.sub}</span>
                  </div>
                  <div className="an-stat-value">{s.value}</div>
                  <div className="an-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts — side by side */}
            <div className="an-charts-grid">
              {/* Performance Trend */}
              <div className="an-chart-card">
                <div className="an-chart-header">
                  <h3 className="an-chart-title">
                    <TrendingUp size={16} className="an-icon-purple" />
                    Performance Trend
                  </h3>
                  <div className="an-period-toggle">
                    <button
                      className={`an-period-btn${trendPeriod === 'monthly' ? ' active' : ''}`}
                      onClick={() => setTrendPeriod('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      className={`an-period-btn${trendPeriod === 'weekly' ? ' active' : ''}`}
                      onClick={() => setTrendPeriod('weekly')}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
                <div className="an-chart-body">
                  {(trendPeriod === 'weekly' ? weeklyTrend : trend).length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={trendPeriod === 'weekly' ? weeklyTrend : trend}>
                        <defs>
                          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(265 80% 65%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(265 80% 65%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                        <XAxis
                          dataKey={trendPeriod === 'weekly' ? 'week' : 'month'}
                          tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area
                          type="monotone"
                          dataKey="avg_points"
                          name="Avg Points"
                          stroke="hsl(265 80% 65%)"
                          fill="url(#purpleGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="an-chart-empty">
                      {trendPeriod === 'weekly'
                        ? 'No data in the last 8 weeks'
                        : 'No trend data yet'}
                    </div>
                  )}
                </div>
              </div>

              {/* Tournaments & Scrims Activity */}
              <div className="an-chart-card">
                <div className="an-chart-header">
                  <h3 className="an-chart-title">
                    <BarChart3 size={16} className="an-icon-purple" />
                    Tournaments &amp; Scrims
                  </h3>
                  <div className="an-period-toggle">
                    <button
                      className={`an-period-btn${activityPeriod === 'monthly' ? ' active' : ''}`}
                      onClick={() => setActivityPeriod('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      className={`an-period-btn${activityPeriod === 'weekly' ? ' active' : ''}`}
                      onClick={() => setActivityPeriod('weekly')}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
                <div className="an-chart-body">
                  {activityPeriod === 'weekly' ? (
                    weeklyActivity.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyActivity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                          <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(0 0% 50%)' }} />
                          <YAxis
                            tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                            allowDecimals={false}
                          />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar
                            dataKey="tournaments"
                            name="Tournaments"
                            fill="hsl(265 80% 65%)"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="scrims"
                            name="Scrims"
                            fill="hsl(265 85% 75%)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="an-chart-empty">No activity in the last 8 weeks</div>
                    )
                  ) : activity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={activity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar
                          dataKey="tournaments"
                          name="Tournaments"
                          fill="hsl(265 80% 65%)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="scrims"
                          name="Scrims"
                          fill="hsl(265 85% 75%)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="an-chart-empty">No activity data yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Results (Placement Per Match) */}
            {recentResults.length > 0 && (
              <div className="an-results-card">
                <h3 className="an-results-title">
                  <MapPin size={16} className="an-icon-purple" />
                  Recent Results (Placement Per Match)
                </h3>
                <div className="an-results-list">
                  {recentResults.map((r, i) => {
                    const dateStr = r.date
                      ? new Date(r.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '';
                    return (
                      <div key={i} className="an-result-row">
                        <div className={`an-result-badge ${getPlacementClass(r.placement)}`}>
                          #{r.placement}
                        </div>
                        <div className="an-result-info">
                          <p className="an-result-main">
                            #{r.placement} in Match {r.match_number} — {r.total_points} pts
                            {r.kills > 0 && ` (${r.kills} KP)`}
                          </p>
                          <div className="an-result-meta">
                            <span>{r.tournament_title}</span>
                            <span className="an-result-dot">·</span>
                            <span>{r.game_name}</span>
                            {dateStr && (
                              <>
                                <span className="an-result-dot">·</span>
                                <span>{dateStr}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Player IGN Card (game-specific) */}
            {selectedGame !== 'All Games' &&
              user?.profile &&
              (() => {
                const GAME_KEY_MAP = {
                  BGMI: 'BGMI',
                  Valorant: 'Valorant',
                  'Free Fire': 'Freefire',
                  Scarfall: 'Scarfall',
                  'COD Mobile': 'COD',
                };
                const gameKey = GAME_KEY_MAP[selectedGame];
                const perGame = user.profile.game_profiles?.[gameKey];
                const displayIgn =
                  perGame?.ign || user.profile.in_game_name || user?.user?.username || 'Unknown';
                const displayGameId = perGame?.game_id || user.profile.game_id || null;
                return (
                  <div className="an-ign-card">
                    <div className="an-ign-icon-wrap">
                      <Gamepad2 size={20} className="an-ign-icon" />
                    </div>
                    <div>
                      <p className="an-ign-game">{selectedGame}</p>
                      <p className="an-ign-name">{displayIgn}</p>
                      {displayGameId && <p className="an-ign-id">ID: {displayGameId}</p>}
                    </div>
                  </div>
                );
              })()}
          </>
        ))}

      {/* ── TEAM TAB ─────────────────────────────────────────────────────── */}
      {analyticsTab === 'team' && (
        <>
          {teamLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2
                size={32}
                className="an-icon-purple"
                style={{ animation: 'spin 1s linear infinite' }}
              />
            </div>
          ) : teamStatsData.length === 0 ? (
            <div className="an-empty">
              <Users size={48} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                No team analytics yet
              </p>
              <p>Join a team and play tournaments to see team stats here.</p>
            </div>
          ) : (
            <>
              {selectedTeam && (
                <>
                  {/* Team header with membership badge */}
                  <div className="an-team-header">
                    <Swords size={16} className="an-icon-purple" />
                    <span className="an-team-header-name">{selectedTeam.team_name}</span>
                    <span
                      className={`an-member-badge ${selectedTeam.is_current_member ? 'current' : 'past'}`}
                    >
                      {selectedTeam.is_current_member ? 'Current Member' : 'Past Member'}
                    </span>
                  </div>

                  {/* Team Overall — from TeamStatistics */}
                  {selectedTeam.team_overall &&
                    Object.keys(selectedTeam.team_overall).length > 0 && (
                      <>
                        <p className="an-section-label">Team Overall</p>
                        <div className="an-stats-grid">
                          {[
                            {
                              icon: Crown,
                              label: 'Overall Rank',
                              value:
                                selectedTeam.team_overall.rank > 0
                                  ? `#${selectedTeam.team_overall.rank}`
                                  : 'N/A',
                              sub: 'Leaderboard',
                              subColor:
                                selectedTeam.team_overall.rank > 0
                                  ? 'an-sub-green'
                                  : 'an-sub-muted',
                              iconColor: 'an-icon-purple-light',
                              bgColor: 'an-bg-purple',
                            },
                            {
                              icon: Trophy,
                              label: 'Tournament Wins',
                              value: selectedTeam.team_overall.tournament_wins || 0,
                              sub: `${selectedTeam.team_overall.tournament_matches_played || 0} tournament matches`,
                              subColor: 'an-sub-muted',
                              iconColor: 'an-icon-yellow',
                              bgColor: 'an-bg-yellow',
                            },
                            {
                              icon: Target,
                              label: 'Total Points',
                              value: selectedTeam.team_overall.total_points || 0,
                              sub: `${selectedTeam.team_overall.scrim_matches_played || 0} scrim matches`,
                              subColor: 'an-sub-muted',
                              iconColor: 'an-icon-blue',
                              bgColor: 'an-bg-blue',
                            },
                            {
                              icon: Medal,
                              label: 'Matches Played',
                              value: selectedTeam.team_overall.matches_played || 0,
                              sub: 'all time',
                              subColor: 'an-sub-muted',
                              iconColor: 'an-icon-purple',
                              bgColor: 'an-bg-purple',
                            },
                          ].map((s, i) => (
                            <div key={i} className="an-stat-card">
                              <div className="an-stat-card-top">
                                <div className={`an-stat-icon-wrap ${s.bgColor}`}>
                                  <s.icon size={16} className={s.iconColor} />
                                </div>
                                <span className={`an-stat-sub ${s.subColor}`}>{s.sub}</span>
                              </div>
                              <div className="an-stat-value">{s.value}</div>
                              <div className="an-stat-label">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                  {/* My Contribution — scoped to player's registrations */}
                  <p className="an-section-label">My Contribution</p>
                  <div className="an-stats-grid">
                    {[
                      {
                        icon: Trophy,
                        label: 'Wins',
                        value: selectedTeam.my_contribution.wins || 0,
                        sub: `of ${selectedTeam.my_contribution.tournaments_played} tournaments`,
                        subColor: 'an-sub-muted',
                        iconColor: 'an-icon-yellow',
                        bgColor: 'an-bg-yellow',
                      },
                      {
                        icon: Target,
                        label: 'Win Rate',
                        value:
                          selectedTeam.my_contribution.tournaments_played > 0
                            ? `${selectedTeam.my_contribution.win_rate}%`
                            : 'N/A',
                        sub: `${selectedTeam.my_contribution.tournaments_played} tournaments played`,
                        subColor: 'an-sub-green',
                        iconColor: 'an-icon-blue',
                        bgColor: 'an-bg-blue',
                      },
                      {
                        icon: Medal,
                        label: 'Matches Played',
                        value: selectedTeam.my_contribution.matches_played || 0,
                        sub: 'matches I participated in',
                        subColor: 'an-sub-muted',
                        iconColor: 'an-icon-purple',
                        bgColor: 'an-bg-purple',
                      },
                      {
                        icon: Crown,
                        label: 'Points Earned',
                        value: selectedTeam.my_contribution.total_points_earned || 0,
                        sub: 'total points from my matches',
                        subColor: 'an-sub-muted',
                        iconColor: 'an-icon-purple-light',
                        bgColor: 'an-bg-purple',
                      },
                    ].map((s, i) => (
                      <div key={i} className="an-stat-card">
                        <div className="an-stat-card-top">
                          <div className={`an-stat-icon-wrap ${s.bgColor}`}>
                            <s.icon size={16} className={s.iconColor} />
                          </div>
                          <span className={`an-stat-sub ${s.subColor}`}>{s.sub}</span>
                        </div>
                        <div className="an-stat-value">{s.value}</div>
                        <div className="an-stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Performance Trend chart */}
                  <div className="an-chart-card">
                    <div className="an-chart-header">
                      <h3 className="an-chart-title">
                        <TrendingUp size={16} className="an-icon-purple" />
                        My Performance Trend with {selectedTeam.team_name}
                      </h3>
                    </div>
                    <div className="an-chart-body">
                      {selectedTeam.trend.some((t) => t.matches > 0) ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={selectedTeam.trend}>
                            <defs>
                              <linearGradient id="teamPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(265 80% 65%)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="hsl(265 80% 65%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} />
                            <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area
                              type="monotone"
                              dataKey="avg_points"
                              name="Avg Points"
                              stroke="hsl(265 80% 65%)"
                              fill="url(#teamPurpleGrad)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="an-chart-empty">No match data yet for this team</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Results with this team */}
                  {selectedTeam.recent_results.length > 0 && (
                    <div className="an-results-card">
                      <h3 className="an-results-title">
                        <MapPin size={16} className="an-icon-purple" />
                        Recent Results with {selectedTeam.team_name}
                      </h3>
                      <div className="an-results-list">
                        {selectedTeam.recent_results.map((r, i) => {
                          const dateStr = r.date
                            ? new Date(r.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '';
                          return (
                            <div key={i} className="an-result-row">
                              <div className={`an-result-badge ${getPlacementClass(r.placement)}`}>
                                #{r.placement}
                              </div>
                              <div className="an-result-info">
                                <p className="an-result-main">
                                  #{r.placement} in Match {r.match_number} — {r.total_points} pts
                                  {r.kills > 0 && ` (${r.kills} KP)`}
                                </p>
                                <div className="an-result-meta">
                                  <span>{r.tournament_title}</span>
                                  <span className="an-result-dot">·</span>
                                  <span>{r.game_name}</span>
                                  {dateStr && (
                                    <>
                                      <span className="an-result-dot">·</span>
                                      <span>{dateStr}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerAnalyticsView;
