import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { leaderboardAPI } from '../utils/api';
import './LeaderboardPublicPage.css';

const GAME_OPTIONS = [
  { value: 'ALL', label: 'All Games' },
  { value: 'BGMI', label: 'BGMI' },
  { value: 'COD', label: 'Call of Duty' },
  { value: 'Valorant', label: 'Valorant' },
  { value: 'Freefire', label: 'Free Fire' },
];

const WINS_ONLY_GAMES = ['Valorant', 'COD'];

const LeaderboardPublicPage = () => {
  const [searchParams] = useSearchParams();

  // Read initial state from URL query params: ?type=tournaments&game=BGMI
  const [activeTab, setActiveTab] = useState(
    searchParams.get('type') === 'scrims' ? 'scrims' : 'tournaments'
  );
  const [gameFilter, setGameFilter] = useState(
    GAME_OPTIONS.some((o) => o.value === searchParams.get('game'))
      ? searchParams.get('game')
      : 'ALL'
  );
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, gameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaderboardAPI.getLeaderboard(50, activeTab, gameFilter);
      setLeaderboard(response.data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeClass = (rank) => {
    if (rank === 1) return 'lpub-rank-gold';
    if (rank === 2) return 'lpub-rank-silver';
    if (rank === 3) return 'lpub-rank-bronze';
    return '';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const isWinsOnly = WINS_ONLY_GAMES.includes(gameFilter);

  return (
    <div className="lpub-root">
      {/* Back link */}
      <div className="lpub-back-bar">
        <a href="https://scrimverse.com" className="lpub-back-link">
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Scrimverse
        </a>
      </div>

      {/* Header */}
      <div className="lpub-hero">
        <div className="lpub-wordmark">
          <span className="lpub-scrim">SCRIM</span>
          <span className="lpub-verse">VERSE</span>
        </div>
        <h1 className="lpub-title">Global Leaderboard</h1>
        <p className="lpub-subtitle">
          Top teams ranked by performance across all tournaments and scrims
        </p>
      </div>

      {/* Controls */}
      <div className="lpub-controls">
        {/* Tab switcher */}
        <div className="lpub-tabs">
          <button
            className={`lpub-tab ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => setActiveTab('tournaments')}
          >
            Tournaments
          </button>
          <button
            className={`lpub-tab ${activeTab === 'scrims' ? 'active' : ''}`}
            onClick={() => setActiveTab('scrims')}
          >
            Scrims
          </button>
        </div>

        {/* Game filter */}
        <div className="lpub-game-filter">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect width="20" height="12" x="2" y="6" rx="2" />
            <path d="M6 12h4" />
            <path d="M8 10v4" />
            <circle cx="15" cy="13" r="0.5" fill="currentColor" />
            <circle cx="18" cy="11" r="0.5" fill="currentColor" />
          </svg>
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="lpub-select"
          >
            {GAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="lpub-table-wrap">
        {loading ? (
          <div className="lpub-state-center">
            <div className="lpub-spinner" />
            <p className="lpub-state-text">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="lpub-state-center">
            <p className="lpub-state-error">{error}</p>
            <button className="lpub-retry-btn" onClick={fetchLeaderboard}>
              Retry
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="lpub-state-center">
            <p className="lpub-state-text">No teams ranked yet for this filter.</p>
            <p className="lpub-state-sub">Complete {activeTab} to appear on the leaderboard.</p>
          </div>
        ) : (
          <div className="lpub-table">
            {/* Header */}
            <div className={`lpub-header ${isWinsOnly ? 'wins-only' : ''}`}>
              <div className="lpub-hcell lpub-col-rank">Rank</div>
              <div className="lpub-hcell lpub-col-team">Team</div>
              <div className="lpub-hcell lpub-col-wins">{isWinsOnly ? 'Wins' : 'Wins'}</div>
              {!isWinsOnly && (
                <>
                  <div className="lpub-hcell lpub-col-pts">Pos Pts</div>
                  <div className="lpub-hcell lpub-col-pts">Kill Pts</div>
                  <div className="lpub-hcell lpub-col-total">Total</div>
                </>
              )}
            </div>

            {/* Rows */}
            {leaderboard.map((team) => (
              <div
                key={team.team_id}
                className={`lpub-row ${getRankBadgeClass(team.rank)} ${isWinsOnly ? 'wins-only' : ''}`}
              >
                <div className="lpub-cell lpub-col-rank">
                  <div className={`lpub-rank-badge ${getRankBadgeClass(team.rank)}`}>
                    {getRankIcon(team.rank)}
                  </div>
                </div>
                <div className="lpub-cell lpub-col-team">
                  <span className="lpub-team-name">{team.team_name}</span>
                </div>
                <div className="lpub-cell lpub-col-wins">
                  <span className="lpub-stat-wins">
                    {activeTab === 'scrims' ? (team.scrim_wins ?? 0) : (team.tournament_wins ?? 0)}
                  </span>
                </div>
                {!isWinsOnly && (
                  <>
                    <div className="lpub-cell lpub-col-pts">
                      <span className="lpub-stat-pts">{team.total_position_points ?? 0}</span>
                    </div>
                    <div className="lpub-cell lpub-col-pts">
                      <span className="lpub-stat-kills">{team.total_kill_points ?? 0}</span>
                    </div>
                    <div className="lpub-cell lpub-col-total">
                      <span className="lpub-stat-total">{team.total_points ?? 0}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="lpub-footer">
        <div className="lpub-footer-wordmark">
          <span className="lpub-scrim">SCRIM</span>
          <span className="lpub-verse">VERSE</span>
        </div>
        <p className="lpub-footer-text">scrimverse.com &mdash; Esports Tournament Platform</p>
      </div>
    </div>
  );
};

export default LeaderboardPublicPage;
