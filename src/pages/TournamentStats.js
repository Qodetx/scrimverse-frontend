import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

const TournamentStats = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/tournaments/${id}/stats/`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-gray-400">
        Failed to load stats.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-dark-bg-card p-6 rounded-xl shadow-card border border-dark-bg-hover mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{stats.tournament}</h1>
          <p className="text-gray-400">
            Game: <span className="text-accent-blue">{stats.game}</span> | Status:{' '}
            <span
              className={`font-semibold ${
                stats.status === 'completed'
                  ? 'text-success'
                  : stats.status === 'ongoing'
                    ? 'text-accent-blue'
                    : 'text-accent-gold'
              }`}
            >
              {stats.status}
            </span>
          </p>
        </div>

        {/* Leaderboard */}
        <div className="bg-dark-bg-card rounded-xl shadow-card border border-dark-bg-hover p-6 overflow-x-auto">
          <h2 className="text-2xl font-bold text-white mb-4">🏆 Leaderboard</h2>
          <table className="min-w-full text-white border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 text-left px-2">Rank</th>
                <th className="py-3 text-left px-2">Team</th>
                <th className="py-3 text-left px-2">Position Points</th>
                <th className="py-3 text-left px-2">Kill Points</th>
                <th className="py-3 text-left px-2">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {stats.leaderboard.length > 0 ? (
                stats.leaderboard.map((team) => (
                  <tr
                    key={team.team_id}
                    className={`border-b border-gray-800 hover:bg-dark-bg-hover/50 ${
                      team.rank === 1 ? 'bg-accent-blue/10' : ''
                    }`}
                  >
                    <td className="py-2 px-2 font-bold text-accent-gold">{team.rank}</td>
                    <td className="py-2 px-2 font-semibold">{team.team_name}</td>
                    <td className="py-2 px-2">{team.total_position_points}</td>
                    <td className="py-2 px-2">{team.total_kill_points}</td>
                    <td className="py-2 px-2 font-bold text-accent-blue">{team.total_points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-400">
                    No scores available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center">
          <Link
            to={
              (stats.event_mode || '').toUpperCase() === 'SCRIM'
                ? `/scrims/${id}`
                : `/tournaments/${id}`
            }
            className="inline-block bg-accent-blue text-white px-6 py-3 rounded-lg font-bold hover:bg-accent-blue/90 transition-all"
          >
            🔙 Back to Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TournamentStats;
