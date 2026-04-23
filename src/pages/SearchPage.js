import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Shield, Gamepad2 } from 'lucide-react';
import { authAPI, teamAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const base =
    process.env.REACT_APP_MEDIA_URL ||
    process.env.REACT_APP_API_URL?.replace('/api', '') ||
    'http://localhost:8000';
  return `${base}${imageUrl}`;
};

const TABS = [
  { key: 'players', label: 'Players', icon: Gamepad2 },
  { key: 'teams', label: 'Teams', icon: Users },
  { key: 'hosts', label: 'Hosts', icon: Shield },
];

const SearchPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (query, tab) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      let results = [];
      if (tab === 'players') {
        const res = await authAPI.searchPlayerUsernames(query);
        results = res.data.results || [];
      } else if (tab === 'teams') {
        const res = await teamAPI.getTeams({ search: query });
        const all = res.data.results || res.data || [];
        results = all.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
      } else if (tab === 'hosts') {
        const res = await authAPI.searchHosts(query);
        results = res.data.results || [];
      }
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearchResults([]);
    if (searchQuery.trim().length >= 2) {
      runSearch(searchQuery, activeTab);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(searchQuery, activeTab);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, runSearch]);

  const handleResultClick = (result) => {
    if (activeTab === 'players') {
      if (!isAuthenticated()) {
        navigate('/player-auth');
        return;
      }
      if (user?.user?.id === result.id) navigate('/player/dashboard');
      else navigate(`/player/profile/${result.id}`);
    } else if (activeTab === 'teams') {
      if (!isAuthenticated()) {
        navigate('/player-auth');
        return;
      }
      if (result.id === user?.profile?.current_team?.id) navigate('/player/team/dashboard');
      else navigate(`/teams/${result.id}`);
    } else if (activeTab === 'hosts') {
      navigate(`/host/profile/${result.id}`);
    }
  };

  const getDisplayName = (r) => r.username || r.name || r.email || 'Unknown';

  const getSubtitle = (r) => {
    if (activeTab === 'teams') return `${r.members?.length || 0} members`;
    if (activeTab === 'hosts') return r.game_titles?.join(', ') || 'Host';
    return r.player_profile?.in_game_name ? `IGN: ${r.player_profile.in_game_name}` : 'Player';
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Top search bar strip */}
      <div className="border-b border-border/30 bg-card/60 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              autoFocus
              className="w-full pl-11 pr-4 h-10 bg-secondary/40 border border-border/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 transition-all text-sm"
            />
          </div>

          {/* Tabs */}
          <div className="flex border border-border/40 rounded-lg overflow-hidden shrink-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setSearchResults([]);
                }}
                className={`flex items-center justify-center gap-1.5 px-4 h-10 text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === key
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30 bg-secondary/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple" />
          </div>
        )}

        {/* Results grid */}
        {!loading && searchResults.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;
              {searchQuery}&rdquo;
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((result, idx) => {
                const displayName = getDisplayName(result);
                const subtitle = getSubtitle(result);
                return (
                  <div
                    key={idx}
                    onClick={() => handleResultClick(result)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card hover:border-purple/30 hover:bg-secondary/20 transition-all cursor-pointer gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {activeTab === 'players' ? (
                        <div className="w-10 h-10 rounded-full bg-secondary border border-border/30 flex items-center justify-center text-foreground text-sm font-bold shrink-0 overflow-hidden">
                          {result.profile_picture ? (
                            <img
                              src={getImageUrl(result.profile_picture)}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-purple/15 flex items-center justify-center shrink-0">
                          {activeTab === 'teams' ? (
                            <Users className="h-5 w-5 text-purple" />
                          ) : (
                            <Shield className="h-5 w-5 text-purple" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="text-sm font-semibold truncate block">{displayName}</span>
                        <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResultClick(result);
                      }}
                      className="text-[10px] h-7 px-2.5 border border-border/40 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors shrink-0"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* No results */}
        {!loading && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary border border-border/30 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold mb-1">No {activeTab} found</p>
            <p className="text-sm text-muted-foreground">
              No results matching &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && searchQuery.trim().length < 2 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary border border-border/30 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold mb-1">Search ScrimVerse</p>
            <p className="text-sm text-muted-foreground">
              Type at least 2 characters to find {activeTab}
            </p>
            {!isAuthenticated() && (
              <button
                onClick={() => navigate('/player-auth')}
                className="mt-5 px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-purple to-purple-dark text-white hover:opacity-90 transition-all"
              >
                Sign in to interact
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
