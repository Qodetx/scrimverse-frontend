import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';
import TournamentCard from '../components/TournamentCard';
import Footer from '../components/Footer';
import './TournamentsPage.css'; // Reuse same styles

const ScrimsPage = () => {
  const [scrims, setScrims] = useState([]);
  const [filteredScrims, setFilteredScrims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, active, past
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    game: 'all',
    prizePool: 'all',
  });
  const [searchParams] = useSearchParams();

  const games = ['all', 'BGMI', 'COD', 'Freefire', 'Scarfall'];

  useEffect(() => {
    const gameParam = searchParams.get('game');
    if (gameParam) {
      setFilters((prev) => ({ ...prev, game: gameParam }));
    }
  }, [searchParams]);

  const fetchScrims = useCallback(async () => {
    try {
      setLoading(true);
      const statusMap = {
        upcoming: 'upcoming',
        active: 'ongoing',
        past: 'completed',
      };

      const response = await tournamentAPI.getTournaments({
        status: statusMap[activeTab],
        event_mode: 'SCRIM',
      });
      setScrims(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching scrims:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const applyFilters = useCallback(() => {
    let filtered = [...scrims];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.host_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Game filter
    if (filters.game !== 'all') {
      filtered = filtered.filter(
        (t) => (t.game_name || t.game)?.toLowerCase() === filters.game.toLowerCase()
      );
    }

    // Prize pool filter
    if (filters.prizePool !== 'all') {
      const [min, max] = filters.prizePool
        .split('-')
        .map((v) => (v === '+' ? Infinity : parseInt(v)));
      filtered = filtered.filter((t) => {
        const prize = parseFloat(t.prize_pool || 0);
        if (filters.prizePool.includes('+')) {
          const minVal = parseInt(filters.prizePool);
          return prize >= minVal;
        }
        return prize >= min && prize <= (max || Infinity);
      });
    }

    // Sort by plan type: Premium first, then Featured, then Basic
    filtered.sort((a, b) => {
      const planOrder = { premium: 0, featured: 1, basic: 2 };

      // Get plan types, default to 'basic' if not set
      const aPlan = (a.plan_type || 'basic').toLowerCase().trim();
      const bPlan = (b.plan_type || 'basic').toLowerCase().trim();

      // Get order values, default to 2 (basic) if plan not recognized
      const aOrder = planOrder[aPlan] !== undefined ? planOrder[aPlan] : 2;
      const bOrder = planOrder[bPlan] !== undefined ? planOrder[bPlan] : 2;

      // If same plan type, sort by created_at (newest first)
      if (aOrder === bOrder) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }

      return aOrder - bOrder;
    });

    setFilteredScrims(filtered);
  }, [scrims, searchQuery, filters]);

  useEffect(() => {
    fetchScrims();
  }, [activeTab, fetchScrims]);

  useEffect(() => {
    applyFilters();
  }, [scrims, searchQuery, filters, applyFilters]);

  const resetFilters = () => {
    setFilters({
      game: 'all',
      prizePool: 'all',
    });
    setSearchQuery('');
  };

  return (
    <div className="tournaments-page">
      {/* Hero Section */}
      <div className="tournaments-hero">
        <div className="hero-content">
          <h1 className="hero-title">Scrims</h1>
          <p className="hero-subtitle">
            Hone your skills in casual arenas. No stakes, pure improvement.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="tournaments-container">
        <div className="search-filter-bar">
          <div className="search-box">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search scrims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button className="filters-button" onClick={() => setShowFilters(!showFilters)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Game</label>
                <select
                  value={filters.game}
                  onChange={(e) => setFilters({ ...filters, game: e.target.value })}
                >
                  {games.map((g) => (
                    <option key={g} value={g}>
                      {g === 'all' ? 'All Games' : g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Prize Pool</label>
                <select
                  value={filters.prizePool}
                  onChange={(e) => setFilters({ ...filters, prizePool: e.target.value })}
                >
                  <option value="all">All Prizes</option>
                  <option value="0-1000">₹0 - ₹1,000</option>
                  <option value="1000-5000">₹1,000 - ₹5,000</option>
                  <option value="5000-10000">₹5,000 - ₹10,000</option>
                  <option value="10000+">₹10,000+</option>
                </select>
              </div>
            </div>
            <button className="reset-filters-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tournaments-tabs">
          <button
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button
            className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Scrims
          </button>
        </div>

        {/* Scrims Grid */}
        <div className="tournaments-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading scrims...</p>
            </div>
          ) : filteredScrims.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3>No scrims found</h3>
              <p>Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="tournaments-grid">
              {filteredScrims.map((scrim) => (
                <TournamentCard key={scrim.id} tournament={scrim} activeTab={activeTab} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ScrimsPage;
