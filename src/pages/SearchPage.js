import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, teamAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './SearchPage.css';

const VerifiedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-500">
    <path
      d="M12 2L15.09 5.26L19.47 6.11L20 10.5L23 13.5L20 16.5L19.47 20.89L15.09 21.74L12 25L8.91 21.74L4.53 20.89L4 16.5L1 13.5L4 10.5L4.53 6.11L8.91 5.26L12 2Z"
      fill="currentColor"
    />
    <path
      d="M9 12L11 14L15 10"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Helper function to get the full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${backendUrl}${imageUrl}`;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'players', 'hosts', 'teams'
  const [playerResults, setPlayerResults] = useState([]);
  const [hostResults, setHostResults] = useState([]);
  const [teamResults, setTeamResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      let newPlayerResults = [];
      let newHostResults = [];
      let newTeamResults = [];

      if (filter === 'all' || filter === 'players') {
        const playersRes = await authAPI.searchPlayerUsernames(searchQuery);
        newPlayerResults = playersRes.data.results || [];
        setPlayerResults(newPlayerResults);
      } else {
        setPlayerResults([]);
      }

      if (filter === 'all' || filter === 'hosts') {
        const hostsRes = await authAPI.searchHosts(searchQuery);
        newHostResults = hostsRes.data.results || [];
        setHostResults(newHostResults);
      } else {
        setHostResults([]);
      }

      if (filter === 'all' || filter === 'teams') {
        const teamsRes = await teamAPI.getTeams({ search: searchQuery });
        newTeamResults = teamsRes.data.results || teamsRes.data || [];
        newTeamResults = newTeamResults.filter((team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setTeamResults(newTeamResults);
      } else {
        setTeamResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else if (searchQuery.trim().length === 0) {
        setPlayerResults([]);
        setHostResults([]);
        setTeamResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filter, handleSearch]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePlayerClick = (playerId) => {
    if (user?.user?.id === playerId) {
      navigate('/player/dashboard');
    } else {
      navigate(`/player/profile/${playerId}`);
    }
  };

  const handleHostClick = (hostId) => {
    if (user?.user?.user_type === 'host' && user?.profile?.id === hostId) {
      navigate('/host/dashboard');
    } else {
      navigate(`/host/profile/${hostId}`);
    }
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <h1 className="search-hero-title">Search</h1>

        {/* Search Bar Wrapper */}
        <div className="search-bar-wrapper">
          <div className="search-input-group">
            <svg
              className="search-icon-fixed"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search for players, hosts or teams"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-main-input"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-select"
          >
            <option value="all">All</option>
            <option value="players">Players</option>
            <option value="hosts">Hosts</option>
            <option value="teams">Teams</option>
          </select>
          <button onClick={handleSearch} className="search-btn">
            Search
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Results */}
        {!loading &&
          (playerResults.length > 0 || hostResults.length > 0 || teamResults.length > 0) && (
            <div className="space-y-8">
              {/* Player Results */}
              {playerResults.length > 0 && (
                <div>
                  <h2 className="section-results-title">Players ({playerResults.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 results-grid">
                    {playerResults.map((player) => (
                      <div
                        key={player.id}
                        onClick={() => handlePlayerClick(player.id)}
                        className="cyber-card hover-lift rounded-xl p-6 cursor-pointer transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-lg border-2 border-white/5 flex-shrink-0">
                            {player.profile_picture ? (
                              <img
                                src={getImageUrl(player.profile_picture)}
                                alt={player.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.textContent = player.username
                                    .charAt(0)
                                    .toUpperCase();
                                }}
                              />
                            ) : (
                              player.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-lg truncate">
                              {player.username}
                            </h3>
                            <p className="text-gray-400 text-sm">Player</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Host Results */}
              {hostResults.length > 0 && (
                <div>
                  <h2 className="section-results-title">Hosts ({hostResults.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 results-grid">
                    {hostResults.map((host) => (
                      <div
                        key={host.id}
                        onClick={() => handleHostClick(host.id)}
                        className="cyber-card hover-lift rounded-xl p-6 cursor-pointer transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-lg border-2 border-white/5 flex-shrink-0">
                            {host.profile_picture ? (
                              <img
                                src={getImageUrl(host.profile_picture)}
                                alt={host.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.textContent = host.username
                                    .charAt(0)
                                    .toUpperCase();
                                }}
                              />
                            ) : (
                              host.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-bold text-lg truncate">
                                {host.username}
                              </h3>
                              {host.verified && <VerifiedIcon />}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {host.verified ? 'Verified Host' : 'Host'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Results */}
              {teamResults.length > 0 && (
                <div>
                  <h2 className="section-results-title">Teams ({teamResults.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 results-grid">
                    {teamResults.map((team) => (
                      <div
                        key={team.id}
                        onClick={() => {
                          if (team.id === user?.profile?.current_team?.id) {
                            navigate('/player/team/dashboard');
                          } else {
                            navigate(`/teams/${team.id}`);
                          }
                        }}
                        className="bg-[#1a1f35] border border-white/10 rounded-xl p-6 hover:border-primary-500 transition-all cursor-pointer cyber-card"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-lg border-2 border-white/5 flex-shrink-0">
                            {team.profile_picture ? (
                              <img
                                src={getImageUrl(team.profile_picture)}
                                alt={team.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.textContent = team.name.charAt(0);
                                }}
                              />
                            ) : (
                              team.name.charAt(0)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-lg truncate">{team.name}</h3>
                            <p className="text-gray-400 text-sm">
                              {team.members?.length || 0}/15 members
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{team.wins || 0} wins</span>
                          {(team.members?.length || 0) < 15 && (
                            <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full font-semibold">
                              Open
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* No Results */}
        {!loading &&
          searchQuery &&
          playerResults.length === 0 &&
          hostResults.length === 0 &&
          teamResults.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="text-gray-400 text-lg">No results found for "{searchQuery}"</p>
            </div>
          )}

        {/* Empty State */}
        {!loading && !searchQuery && (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-gray-400 text-lg">Search for players, hosts, or teams</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
