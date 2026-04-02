import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Star,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { leaderboardAPI, teamAPI } from '../../../utils/api';
import './PlayerLeaderboardsView.css';

const GAME_FILTERS = ['All', 'BGMI', 'Free Fire', 'Scarfall', 'Valorant', 'COD Mobile'];

// Map display name → backend game param
const GAME_PARAM_MAP = {
  All: 'ALL',
  BGMI: 'BGMI',
  'Free Fire': 'Freefire',
  Scarfall: 'Scarfall',
  Valorant: 'Valorant',
  'COD Mobile': 'COD',
};

const PlayerLeaderboardsView = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tournaments');
  const [gameFilter, setGameFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [tournamentData, setTournamentData] = useState([]);
  const [scrimData, setScrimData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Player's own team IDs for gold highlight
  const [myTeamIds, setMyTeamIds] = useState(new Set());

  // ── Fetch player's team IDs ──
  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const res = await teamAPI.getTeams({ mine: true });
        const data = res.data.results || res.data;
        const ids = new Set((Array.isArray(data) ? data : []).map((t) => t.id));
        setMyTeamIds(ids);
      } catch (err) {
        console.error('Failed to fetch my teams:', err);
      }
    };
    fetchMyTeams();
  }, []);

  // ── Fetch leaderboard data when game filter changes ──
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const game = GAME_PARAM_MAP[gameFilter] || 'ALL';
      try {
        const [tournRes, scrimRes] = await Promise.all([
          leaderboardAPI.getLeaderboard(50, 'tournaments', game).catch(() => ({
            data: { leaderboard: [] },
          })),
          leaderboardAPI.getLeaderboard(50, 'scrims', game).catch(() => ({
            data: { leaderboard: [] },
          })),
        ]);
        setTournamentData(tournRes.data.leaderboard || []);
        setScrimData(scrimRes.data.leaderboard || []);
      } catch (err) {
        console.error('Leaderboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [gameFilter]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isMyTeam = (entry) => myTeamIds.has(entry.team_id || entry.team?.id);

  // ── Podium (top 3) ──
  const renderPodium = (teams) => {
    const top3 = teams.slice(0, 3);
    if (top3.length < 3) return null;
    // Reorder: 2nd, 1st, 3rd for podium visual
    const ordered = [top3[1], top3[0], top3[2]];
    const heights = ['lb-podium-2nd', 'lb-podium-1st', 'lb-podium-3rd'];
    const styles = ['silver', 'gold', 'bronze'];

    return (
      <div className="lb-podium">
        {ordered.map((team, i) => {
          const mine = isMyTeam(team);
          const teamName = team.team_name || team.team?.name || `Team ${team.rank}`;
          const initial = teamName.charAt(0).toUpperCase();
          const pts = Number(team.total_points || 0).toLocaleString();
          const wins = team.tournament_wins ?? team.scrim_wins ?? 0;

          return (
            <div
              key={team.rank}
              className={`lb-podium-col ${heights[i]} lb-podium-${styles[i]}${mine ? ' lb-podium-mine' : ''}`}
              onClick={() =>
                (team.team_id || team.team?.id) &&
                navigate(`/team/${team.team_id || team.team?.id}`)
              }
            >
              <div className={`lb-podium-rank lb-rank-${styles[i]}`}>{team.rank}</div>
              <div className="lb-podium-bottom">
                <div className={`lb-podium-avatar lb-avatar-${styles[i]}`}>{initial}</div>
                <h4 className="lb-podium-name">{teamName}</h4>
                <div className={`lb-podium-pts lb-pts-${styles[i]}`}>{pts}</div>
                <div className="lb-podium-wins">{wins} wins</div>
                {mine && <Star size={12} className="lb-mine-star" />}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── List (rank 4+) ──
  const renderList = (teams) => (
    <div className="lb-list">
      {teams.slice(3).map((team) => {
        const mine = isMyTeam(team);
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
            className={`lb-row${mine ? ' lb-row-mine' : ''}`}
            onClick={() =>
              (team.team_id || team.team?.id) && navigate(`/team/${team.team_id || team.team?.id}`)
            }
          >
            <div className="lb-row-left">
              <span className="lb-row-rank">#{team.rank}</span>
              <div className="lb-row-avatar">{initial}</div>
              <div className="lb-row-info">
                <span className="lb-row-name">
                  {teamName}
                  {mine && <Star size={11} className="lb-mine-star-inline" />}
                </span>
                <span className="lb-row-sub">
                  {wins} wins{matchesPlayed > 0 ? ` · ${matchesPlayed} matches` : ''}
                </span>
              </div>
            </div>
            <div className="lb-row-right">
              <div className="lb-row-pts-wrap">
                <span className="lb-row-pts">{pts}</span>
                <span className="lb-row-pts-label">PTS</span>
              </div>
              <Eye size={16} className="lb-row-eye" />
            </div>
          </div>
        );
      })}
    </div>
  );

  const activeData = activeTab === 'tournaments' ? tournamentData : scrimData;

  return (
    <div className="lb-container">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="lb-header">
        <h2 className="lb-title">
          <TrendingUp size={20} className="lb-title-icon" />
          Leaderboards
        </h2>

        {/* Game filter dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button className="lb-filter-btn" onClick={() => setDropdownOpen((v) => !v)}>
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
            <div className="lb-dropdown-menu">
              {GAME_FILTERS.map((g) => (
                <button
                  key={g}
                  className={`lb-dropdown-item${gameFilter === g ? ' selected' : ''}`}
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
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="lb-tabs-bar">
        <button
          className={`lb-tab-btn${activeTab === 'tournaments' ? ' active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Trophy size={14} /> Tournaments
        </button>
        <button
          className={`lb-tab-btn${activeTab === 'scrims' ? ' active' : ''}`}
          onClick={() => setActiveTab('scrims')}
        >
          <Swords size={14} /> Scrims
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="lb-loading">
          <Loader2
            size={32}
            className="lb-icon-purple"
            style={{ animation: 'spin 1s linear infinite' }}
          />
        </div>
      ) : activeData.length === 0 ? (
        <div className="lb-empty">
          <Trophy size={48} style={{ opacity: 0.3 }} />
          <p>No leaderboard data yet for {gameFilter}</p>
        </div>
      ) : (
        <>
          {renderPodium(activeData)}
          {renderList(activeData)}
        </>
      )}

      {/* ── My team legend ────────────────────────────────────────── */}
      {myTeamIds.size > 0 && (
        <div className="lb-legend">
          <Star size={11} className="lb-mine-star" />
          <span>Your team is highlighted</span>
        </div>
      )}
    </div>
  );
};

export default PlayerLeaderboardsView;
