import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import Footer from '../components/Footer';

const PlayerSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setSearched(true);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.searchPlayerUsernames(query);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching players:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <div className="relative bg-gradient-radial py-20 overflow-hidden">
        <div className="absolute inset-0 bg-transparent opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-extrabold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-blue glow-text">
              Player Search
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Find players by their username and view their profiles
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by username..."
                className="w-full px-6 py-4 bg-dark-bg-card text-white rounded-lg border-2 border-dark-bg-hover focus:border-accent-blue outline-none transition-colors text-lg"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
                🔍
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="py-20 bg-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-blue border-t-transparent mx-auto"></div>
              <p className="text-gray-400 mt-4">Searching players...</p>
            </div>
          ) : searched && searchQuery.length >= 2 ? (
            searchResults.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Found {searchResults.length} player{searchResults.length !== 1 ? 's' : ''}
                </h2>
                <div className="space-y-4">
                  {searchResults.map((player) => (
                    <Link
                      key={player.id}
                      to={`/player/profile/${player.id}`}
                      className="block bg-dark-bg-card p-6 rounded-xl shadow-card border border-dark-bg-hover hover:border-accent-blue transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-blue rounded-full flex items-center justify-center text-3xl overflow-hidden border-2 border-white/5 shadow-inner">
                            {player.profile_picture ? (
                              <img
                                src={player.profile_picture}
                                alt={player.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (player.username?.charAt(0) || 'U').toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-accent-blue transition-colors">
                              {player.username}
                            </h3>
                            <p className="text-gray-400">Player Profile</p>
                            <p className="text-gray-500 text-sm">{player.email}</p>
                          </div>
                        </div>
                        <div className="text-accent-blue text-2xl group-hover:translate-x-2 transition-transform">
                          →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400 text-xl">No players found matching "{searchQuery}"</p>
                <p className="text-gray-500 mt-2">Try a different search term</p>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-400 text-xl">Start typing to search for players</p>
              <p className="text-gray-500 mt-2">Enter at least 2 characters</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="py-20 bg-transparent border-t border-dark-bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Search Tips</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-dark-bg-card p-6 rounded-xl shadow-card border border-dark-bg-hover">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="text-lg font-bold text-white mb-2">Partial Matches</h3>
              <p className="text-gray-400 text-sm">
                You don't need to type the full username. Partial matches will be shown.
              </p>
            </div>
            <div className="bg-dark-bg-card p-6 rounded-xl shadow-card border border-dark-bg-hover">
              <div className="text-4xl mb-3">🔤</div>
              <h3 className="text-lg font-bold text-white mb-2">Case Insensitive</h3>
              <p className="text-gray-400 text-sm">
                Search is not case-sensitive. "PLAYER" and "player" will return the same results.
              </p>
            </div>
            <div className="bg-dark-bg-card p-6 rounded-xl shadow-card border border-dark-bg-hover">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">Real-time Results</h3>
              <p className="text-gray-400 text-sm">
                Results update as you type for a seamless search experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PlayerSearchPage;
