import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { leaderboardAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import Footer from '../components/Footer';
import { generateLeaderboardImages } from './leaderboardImageGenerator';
import './LeaderboardPage.css';

const GAME_OPTIONS = [
  { value: 'ALL', label: 'All Games' },
  { value: 'BGMI', label: 'BGMI' },
  { value: 'COD', label: 'Call of Duty' },
  { value: 'Valorant', label: 'Valorant' },
  { value: 'Freefire', label: 'Free Fire' },
];

// 5v5 games use wins-only scoring (no position/kill points)
const WINS_ONLY_GAMES = ['Valorant', 'COD'];

const LeaderboardPage = () => {
  const { user } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState('tournaments'); // 'tournaments' or 'scrims'
  const [gameFilter, setGameFilter] = useState('ALL');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgGenerating, setImgGenerating] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, gameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Download helpers ───────────────────────────────────────────────────────

  const triggerPngDownload = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleShareLink = () => {
    const url = `https://scrimverse.com/leaderboard/public?type=${activeTab}&game=${gameFilter}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast('Link copied!', 'success'))
      .catch(() => showToast('Failed to copy link', 'error'));
  };

  const handleDownloadAll = async () => {
    if (imgGenerating) return;
    setImgGenerating(true);
    try {
      const images = await generateLeaderboardImages(leaderboard, gameFilter, activeTab);
      images.forEach(({ dataUrl, label }) => {
        triggerPngDownload(dataUrl, `leaderboard-${label}.png`);
      });
    } catch (err) {
      console.error('Download all error:', err);
      showToast('Failed to generate images', 'error');
    } finally {
      setImgGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (imgGenerating) return;
    setImgGenerating(true);
    try {
      const images = await generateLeaderboardImages(leaderboard, gameFilter, activeTab);
      if (images.length === 0) return;

      // Use the first image to determine dimensions
      const firstImg = new Image();
      await new Promise((resolve) => {
        firstImg.onload = resolve;
        firstImg.src = images[0].dataUrl;
      });
      const imgW = firstImg.naturalWidth || 1080;
      const imgH = firstImg.naturalHeight || 1441;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [imgW, imgH],
      });

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage([imgW, imgH], 'portrait');
        pdf.addImage(images[i].dataUrl, 'PNG', 0, 0, imgW, imgH);
      }

      const tabLabel = activeTab === 'tournaments' ? 'tournaments' : 'scrims';
      const gameLabel = gameFilter === 'ALL' ? 'all-games' : gameFilter.toLowerCase();
      pdf.save(`leaderboard-${tabLabel}-${gameLabel}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Failed to generate PDF', 'error');
    } finally {
      setImgGenerating(false);
    }
  };

  const handleDownloadRange = async (startRank, endRank) => {
    if (imgGenerating) return;
    setImgGenerating(true);
    try {
      // Slice the leaderboard to just the requested range (1-based inclusive)
      const slice = leaderboard.slice(startRank - 1, endRank);
      const images = await generateLeaderboardImages(slice, gameFilter, activeTab);
      if (images.length > 0) {
        triggerPngDownload(images[0].dataUrl, `leaderboard-${startRank}-${endRank}.png`);
      }
    } catch (err) {
      console.error('Range download error:', err);
      showToast('Failed to generate image', 'error');
    } finally {
      setImgGenerating(false);
    }
  };

  // Build range buttons based on actual leaderboard length
  const buildRangeButtons = () => {
    if (leaderboard.length <= 20) return [];
    const ranges = [];
    let start = 1;
    while (start <= leaderboard.length) {
      const end = Math.min(start + 19, leaderboard.length);
      ranges.push({ start, end, label: `${start}–${end}` });
      start += 20;
    }
    return ranges;
  };

  const rangeButtons = buildRangeButtons();
  const showToolbar = !loading && !error && leaderboard.length > 0;

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

        {/* Export Dropdown */}
        {showToolbar && (
          <div className="lb-download-toolbar" ref={exportRef}>
            <div style={{ position: 'relative' }}>
              <button
                className="lb-dl-btn lb-dl-btn--export"
                onClick={() => setExportOpen((v) => !v)}
                disabled={imgGenerating}
              >
                {imgGenerating ? (
                  <span className="lb-spinner" />
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                Export
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: exportOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {exportOpen && (
                <div className="lb-export-menu">
                  <button
                    className="lb-export-item"
                    onClick={() => {
                      handleShareLink();
                      setExportOpen(false);
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Share Link
                  </button>
                  <button
                    className="lb-export-item"
                    onClick={() => {
                      handleDownloadPdf();
                      setExportOpen(false);
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Download PDF
                  </button>
                  <button
                    className="lb-export-item"
                    onClick={() => {
                      handleDownloadAll();
                      setExportOpen(false);
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PNG
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
                <div className="header-cell wins-col">
                  {WINS_ONLY_GAMES.includes(gameFilter) ? 'Wins' : 'Overall Wins'}
                </div>
                {!WINS_ONLY_GAMES.includes(gameFilter) && (
                  <>
                    <div className="header-cell points-col">Position Pts</div>
                    <div className="header-cell points-col">Kill Pts</div>
                    <div className="header-cell total-col">Total Points</div>
                  </>
                )}
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
                        {activeTab === 'scrims' ? team.scrim_wins : team.tournament_wins}
                      </span>
                    </div>
                    {!WINS_ONLY_GAMES.includes(gameFilter) && (
                      <>
                        <div className="cell points-col">
                          <span className="stat-value position">{team.total_position_points}</span>
                        </div>
                        <div className="cell points-col">
                          <span className="stat-value kills">{team.total_kill_points}</span>
                        </div>
                        <div className="cell total-col">
                          <span className="stat-value total">{team.total_points}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default LeaderboardPage;
