import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Swords,
  TrendingUp,
  Gamepad2,
  ChevronDown,
  Check,
  Eye,
  Loader2,
  RefreshCw,
  Download,
  FileText,
  Link2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { leaderboardAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import { generateLeaderboardImages } from '../../../pages/leaderboardImageGenerator';
import './HostLeaderboardsView.css';

const GAME_FILTERS = ['All', 'BGMI', 'Free Fire', 'Scarfall', 'Valorant', 'COD Mobile'];

const GAME_PARAM_MAP = {
  All: 'ALL',
  BGMI: 'BGMI',
  'Free Fire': 'Freefire',
  Scarfall: 'Scarfall',
  Valorant: 'Valorant',
  'COD Mobile': 'COD',
};

const HostLeaderboardsView = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('tournaments');
  const [gameFilter, setGameFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [tournamentData, setTournamentData] = useState([]);
  const [scrimData, setScrimData] = useState([]);
  const [tournamentTotalTeams, setTournamentTotalTeams] = useState(0);
  const [scrimTotalTeams, setScrimTotalTeams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgGenerating, setImgGenerating] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pngExpanded, setPngExpanded] = useState(false);
  const exportRef = useRef(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(false);
    const game = GAME_PARAM_MAP[gameFilter] || 'ALL';
    try {
      const [tournRes, scrimRes] = await Promise.all([
        leaderboardAPI.getLeaderboard(50, 'tournaments', game).catch(() => ({
          data: { leaderboard: [], total_teams: 0 },
        })),
        leaderboardAPI.getLeaderboard(50, 'scrims', game).catch(() => ({
          data: { leaderboard: [], total_teams: 0 },
        })),
      ]);
      setTournamentData(tournRes.data.leaderboard || []);
      setScrimData(scrimRes.data.leaderboard || []);
      setTournamentTotalTeams(tournRes.data.total_teams || 0);
      setScrimTotalTeams(scrimRes.data.total_teams || 0);
    } catch (err) {
      setError(true);
      showToast('Failed to load leaderboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFilter]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Download helpers ──────────────────────────────────────────────────────
  const gameParam = GAME_PARAM_MAP[gameFilter] || 'ALL';

  const triggerPngDownload = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleShareLink = () => {
    const url = `https://scrimverse.com/leaderboard/public?type=${activeTab}&game=${gameParam}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast('Link copied!', 'success'))
      .catch(() => showToast('Failed to copy link', 'error'));
  };

  const handleDownloadAll = async () => {
    if (imgGenerating) return;
    setImgGenerating(true);
    try {
      const data = activeTab === 'tournaments' ? tournamentData : scrimData;
      const images = await generateLeaderboardImages(data, gameParam, activeTab);
      images.forEach(({ dataUrl, label }) =>
        triggerPngDownload(dataUrl, `leaderboard-${label}.png`)
      );
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to generate images', 'error');
    } finally {
      setImgGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (imgGenerating) return;
    setImgGenerating(true);
    try {
      const data = activeTab === 'tournaments' ? tournamentData : scrimData;
      const images = await generateLeaderboardImages(data, gameParam, activeTab);
      if (images.length === 0) return;

      const firstImg = new Image();
      await new Promise((resolve) => {
        firstImg.onload = resolve;
        firstImg.src = images[0].dataUrl;
      });
      const imgW = firstImg.naturalWidth || 1080;
      const imgH = firstImg.naturalHeight || 1441;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [imgW, imgH] });
      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage([imgW, imgH], 'portrait');
        pdf.addImage(images[i].dataUrl, 'PNG', 0, 0, imgW, imgH);
      }
      const tabLabel = activeTab === 'tournaments' ? 'tournaments' : 'scrims';
      const gameLabel = gameParam === 'ALL' ? 'all-games' : gameParam.toLowerCase();
      pdf.save(`leaderboard-${tabLabel}-${gameLabel}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Failed to generate PDF', 'error');
    } finally {
      setImgGenerating(false);
    }
  };

  const handleDownloadRange = async (start, end) => {
    if (imgGenerating) return;
    setImgGenerating(true);
    try {
      const data = activeTab === 'tournaments' ? tournamentData : scrimData;
      const slice = data.slice(start - 1, end);
      const images = await generateLeaderboardImages(slice, gameParam, activeTab);
      if (images.length > 0) {
        const a = document.createElement('a');
        a.href = images[0].dataUrl;
        a.download = `leaderboard-${start}-${end}.png`;
        a.click();
      }
    } catch (err) {
      showToast('Failed to generate image', 'error');
    } finally {
      setImgGenerating(false);
    }
  };

  const activeDataLen = (activeTab === 'tournaments' ? tournamentData : scrimData).length;
  const rangeButtons = (() => {
    if (activeDataLen <= 20) return [];
    const ranges = [];
    let s = 1;
    while (s <= activeDataLen) {
      const e = Math.min(s + 19, activeDataLen);
      ranges.push({ start: s, end: e, label: `${s}–${e}` });
      s += 20;
    }
    return ranges;
  })();

  // ── Podium (top 3) ──────────────────────────────────────────────────────
  const renderPodium = (teams) => {
    const top3 = teams.slice(0, 3);
    if (top3.length < 3) return null;
    // Reorder: 2nd, 1st, 3rd for podium visual
    const ordered = [top3[1], top3[0], top3[2]];
    const heights = ['hlb-podium-2nd', 'hlb-podium-1st', 'hlb-podium-3rd'];
    const styles = ['silver', 'gold', 'bronze'];

    return (
      <div className="hlb-podium">
        {ordered.map((team, i) => {
          const teamName = team.team_name || team.team?.name || `Team ${team.rank}`;
          const initial = teamName.charAt(0).toUpperCase();
          const pts = Number(team.total_points || 0).toLocaleString();
          const wins = team.tournament_wins ?? team.scrim_wins ?? 0;

          return (
            <div
              key={team.rank}
              className={`hlb-podium-col ${heights[i]} hlb-podium-${styles[i]}`}
              onClick={() =>
                (team.team_id || team.team?.id) &&
                navigate(`/team/${team.team_id || team.team?.id}`)
              }
            >
              <div className={`hlb-podium-rank hlb-rank-${styles[i]}`}>{team.rank}</div>
              <div className="hlb-podium-bottom">
                <div className={`hlb-podium-avatar hlb-avatar-${styles[i]}`}>{initial}</div>
                <h4 className="hlb-podium-name">{teamName}</h4>
                <div className={`hlb-podium-pts hlb-pts-${styles[i]}`}>{pts}</div>
                <div className="hlb-podium-wins">{wins} wins</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── List (rank 4+) ──────────────────────────────────────────────────────
  const renderList = (teams) => (
    <div className="hlb-list">
      {teams.slice(3).map((team) => {
        const teamName = team.team_name || team.team?.name || `Team ${team.rank}`;
        const initial = teamName.charAt(0).toUpperCase();
        const pts = Number(team.total_points || 0).toLocaleString();
        const wins = team.tournament_wins ?? team.scrim_wins ?? 0;
        const matchesPlayed =
          activeTab === 'tournaments'
            ? (team.tournament_matches_played ?? team.matches_played ?? 0)
            : (team.scrim_matches_played ?? team.matches_played ?? 0);

        return (
          <div
            key={`${team.rank}-${teamName}`}
            className="hlb-row"
            onClick={() =>
              (team.team_id || team.team?.id) && navigate(`/team/${team.team_id || team.team?.id}`)
            }
          >
            <div className="hlb-row-left">
              <span className="hlb-row-rank">#{team.rank}</span>
              <div className="hlb-row-avatar">{initial}</div>
              <div className="hlb-row-info">
                <span className="hlb-row-name">{teamName}</span>
                <span className="hlb-row-sub">
                  {wins} wins{matchesPlayed > 0 ? ` · ${matchesPlayed} matches` : ''}
                </span>
              </div>
            </div>
            <div className="hlb-row-right">
              <div className="hlb-row-pts-wrap">
                <span className="hlb-row-pts">{pts}</span>
                <span className="hlb-row-pts-label">PTS</span>
              </div>
              <Eye size={16} className="hlb-row-eye" />
            </div>
          </div>
        );
      })}
    </div>
  );

  const activeData = activeTab === 'tournaments' ? tournamentData : scrimData;
  const totalTeams = activeTab === 'tournaments' ? tournamentTotalTeams : scrimTotalTeams;

  return (
    <div className="hlb-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="hlb-header">
        <div className="hlb-header-left">
          <h2 className="hlb-title">
            <TrendingUp size={20} className="hlb-title-icon" />
            Leaderboards
          </h2>
          {totalTeams > 0 && <span className="hlb-total-badge">{totalTeams} teams</span>}
        </div>

        <div className="hlb-header-right">
          {/* Game filter dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button className="hlb-filter-btn" onClick={() => setDropdownOpen((v) => !v)}>
              <Gamepad2 size={13} />
              {gameFilter}
              <ChevronDown
                size={12}
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            {dropdownOpen && (
              <div className="hlb-dropdown-menu">
                {GAME_FILTERS.map((g) => (
                  <button
                    key={g}
                    className={`hlb-dropdown-item${gameFilter === g ? ' selected' : ''}`}
                    onClick={() => {
                      setGameFilter(g);
                      setDropdownOpen(false);
                    }}
                  >
                    {gameFilter === g && <Check size={12} />}
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export dropdown */}
          <div style={{ position: 'relative' }} ref={exportRef}>
            <button
              className="hlb-export-btn"
              onClick={() => {
                setExportOpen((v) => !v);
                setPngExpanded(false);
              }}
              disabled={imgGenerating}
              title="Export leaderboard"
            >
              {imgGenerating ? (
                <Loader2 size={13} style={{ animation: 'hlb-spin 0.7s linear infinite' }} />
              ) : (
                <Download size={13} />
              )}
              Export
              <ChevronDown
                size={11}
                style={{
                  transform: exportOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            {exportOpen && (
              <div className="hlb-export-menu">
                <button
                  className="hlb-export-item"
                  onClick={() => {
                    handleShareLink();
                    setExportOpen(false);
                  }}
                >
                  <Link2 size={13} />
                  Share Link
                </button>
                <button
                  className="hlb-export-item"
                  onClick={() => {
                    handleDownloadPdf();
                    setExportOpen(false);
                  }}
                >
                  <FileText size={13} />
                  Download PDF
                </button>
                {/* Download PNG — expandable sub-list */}
                <button
                  className="hlb-export-item hlb-export-item--parent"
                  onClick={() => setPngExpanded((v) => !v)}
                >
                  <Download size={13} />
                  Download PNG
                  <ChevronDown
                    size={11}
                    style={{
                      marginLeft: 'auto',
                      transform: pngExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s',
                    }}
                  />
                </button>
                {pngExpanded && (
                  <div className="hlb-export-sub">
                    <button
                      className="hlb-export-item hlb-export-item--sub"
                      onClick={() => {
                        handleDownloadAll();
                        setExportOpen(false);
                        setPngExpanded(false);
                      }}
                    >
                      <Download size={12} />
                      Download All
                    </button>
                    {rangeButtons.map(({ start, end, label }) => (
                      <button
                        key={label}
                        className="hlb-export-item hlb-export-item--sub"
                        onClick={() => {
                          handleDownloadRange(start, end);
                          setExportOpen(false);
                          setPngExpanded(false);
                        }}
                      >
                        <Download size={12} />
                        PNG {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button className="hlb-refresh-btn" onClick={fetchLeaderboard} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="hlb-tabs-bar">
        <button
          className={`hlb-tab-btn${activeTab === 'tournaments' ? ' active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Trophy size={14} /> Tournaments
        </button>
        <button
          className={`hlb-tab-btn${activeTab === 'scrims' ? ' active' : ''}`}
          onClick={() => setActiveTab('scrims')}
        >
          <Swords size={14} /> Scrims
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="hlb-loading">
          <Loader2
            size={32}
            className="hlb-icon-purple"
            style={{ animation: 'hlb-spin 1s linear infinite' }}
          />
        </div>
      ) : error ? (
        <div className="hlb-error">
          <Trophy size={40} style={{ opacity: 0.2 }} />
          <p>Failed to load leaderboard</p>
          <button className="hlb-retry-btn" onClick={fetchLeaderboard}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : activeData.length === 0 ? (
        <div className="hlb-empty">
          <Trophy size={48} style={{ opacity: 0.3 }} />
          <p>No leaderboard data yet for {gameFilter}</p>
        </div>
      ) : (
        <>
          {renderPodium(activeData)}
          {renderList(activeData)}
        </>
      )}
    </div>
  );
};

export default HostLeaderboardsView;
