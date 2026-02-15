import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/Footer';
import './LeaderboardPage.css';

const GAME_OPTIONS = [
  { value: 'ALL', label: 'All Games' },
  { value: 'BGMI', label: 'BGMI' },
  { value: 'COD', label: 'Call of Duty' },
  { value: 'Valorant', label: 'Valorant' },
  { value: 'Freefire', label: 'Free Fire' },
];

const LeaderboardPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('tournaments'); // 'tournaments' or 'scrims'
  const [gameFilter, setGameFilter] = useState('ALL');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, gameFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await leaderboardAPI.getLeaderboard(50, activeTab, gameFilter);
      setLeaderboard(response.data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <div className="leaderboard-hero relative py-6 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="hero-title">Global Leaderboard</h1>
        </div>
      </div>

      {/* Tabs & Game Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="leaderboard-filters-row">
          <div className="leaderboard-tabs">
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`tab-button ${activeTab === 'tournaments' ? 'active' : ''}`}
            >
              TOURNAMENTS
            </button>
            <button
              onClick={() => setActiveTab('scrims')}
              className={`tab-button ${activeTab === 'scrims' ? 'active' : ''}`}
            >
              SCRIMS
            </button>
          </div>

          <div className="game-filter-dropdown">
            <svg
              className="game-filter-icon"
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
              className="game-select"
            >
              {GAME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-400 text-xl">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-4 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                Retry
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">No teams on the {activeTab} leaderboard yet</p>
              <p className="text-gray-500 mt-2">Complete {activeTab} to see teams ranked here!</p>
            </div>
          ) : (
            <div className="leaderboard-container">
              {/* Table Header */}
              <div className="leaderboard-header">
                <div className="header-cell rank-col">Rank</div>
                <div className="header-cell team-col">Team Name</div>
                <div className="header-cell wins-col">Overall Wins</div>
                <div className="header-cell points-col">Position Pts</div>
                <div className="header-cell points-col">Kill Pts</div>
                <div className="header-cell total-col">Total Points</div>
              </div>

              {/* Table Body */}
              <div className="leaderboard-body">
                {leaderboard.map((team) => (
                  <div
                    key={team.team_id}
                    className={`leaderboard-row ${getRankBadgeClass(team.rank)}`}
                  >
                    <div className="cell rank-col">
                      <div className={`rank-badge ${getRankBadgeClass(team.rank)}`}>
                        {getRankIcon(team.rank)}
                      </div>
                    </div>
                    <div className="cell team-col">
                      <Link
                        to={
                          team.team_id === user?.profile?.current_team?.id
                            ? '/player/team/dashboard'
                            : `/teams/${team.team_id}`
                        }
                        className="team-link"
                      >
                        <span className="team-name">{team.team_name}</span>
                      </Link>
                    </div>
                    <div className="cell wins-col">
                      <span className="stat-value wins">
                        {team.tournament_wins || team.scrim_wins}
                      </span>
                    </div>
                    <div className="cell points-col">
                      <span className="stat-value position">{team.total_position_points}</span>
                    </div>
                    <div className="cell points-col">
                      <span className="stat-value kills">{team.total_kill_points}</span>
                    </div>
                    <div className="cell total-col">
                      <span className="stat-value total">{team.total_points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LeaderboardPage;
