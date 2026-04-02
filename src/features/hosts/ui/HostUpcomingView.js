import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Swords, Target, Users, RefreshCw } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { tournamentAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import './HostUpcomingView.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getType = (t) => {
  if (t.event_mode === 'SCRIM') return 'scrim';
  if (t.is_5v5 && t.game === 'Valorant') return 'lobby-valorant';
  if (t.is_5v5) return 'lobby-codm';
  return 'tournament';
};

// ─── UpcomingTournamentCard ────────────────────────────────────────────────────
const UpcomingTournamentCard = ({ tournament, onManage }) => {
  const type = getType(tournament);
  const isScrim = type === 'scrim';
  const isValorant = type === 'lobby-valorant';
  const isCodm = type === 'lobby-codm';
  const isLobby = isValorant || isCodm;

  const borderClass = isScrim
    ? 'upcom-card--scrim'
    : isLobby
      ? 'upcom-card--lobby'
      : 'upcom-card--default';

  const iconBgClass = isScrim ? 'upcom-icon-bg--scrim' : 'upcom-icon-bg--accent';

  const getIcon = () => {
    if (isScrim) return <Swords className="h-5 w-5 sm:h-6 sm:w-6 upcom-icon-scrim" />;
    if (isLobby) return <Target className="h-5 w-5 sm:h-6 sm:w-6 upcom-icon-accent" />;
    return <Calendar className="h-5 w-5 sm:h-6 sm:w-6 upcom-icon-accent" />;
  };

  const getLabel = () => {
    if (isScrim) return 'Scrim';
    if (isValorant) return 'Valorant 5v5';
    if (isCodm) return 'CODM 5v5';
    return tournament.game || '—';
  };

  const badgeClass = isScrim
    ? 'upcom-badge--scrim'
    : isLobby
      ? 'upcom-badge--lobby'
      : 'upcom-badge--default';

  const registrations =
    tournament.current_participants ??
    tournament.registered_teams_count ??
    tournament.registrations_count ??
    0;
  const maxTeams = tournament.max_participants ?? tournament.max_teams ?? '—';

  return (
    <div className={`upcom-card ${borderClass}`}>
      <div className="upcom-card-left">
        <div className={`upcom-icon-box ${iconBgClass}`}>{getIcon()}</div>
        <div className="upcom-card-info">
          <h4 className="upcom-card-title">{tournament.title || tournament.name}</h4>
          <div className="upcom-card-meta">
            <span className={`upcom-badge ${badgeClass}`}>{getLabel()}</span>
            <span className="upcom-card-count">
              <Users className="h-3 w-3" />
              {registrations}/{maxTeams} teams
            </span>
          </div>
        </div>
      </div>

      <div className="upcom-card-right">
        <div className="upcom-card-datetime">
          <div className="upcom-card-date">
            {formatDate(
              tournament.tournament_start || tournament.start_date || tournament.start_time
            )}
          </div>
          <div className="upcom-card-time">
            {formatTime(
              tournament.tournament_start || tournament.start_date || tournament.start_time
            )}
          </div>
        </div>
        <button
          className="upcom-manage-btn"
          onClick={() => onManage(tournament.id, isScrim ? 'scrim' : 'tournament')}
        >
          Manage
        </button>
      </div>
    </div>
  );
};

// ─── Main view ────────────────────────────────────────────────────────────────
export default function HostUpcomingView({ onManage }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUpcoming = async () => {
    if (!user?.profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await tournamentAPI.getHostTournaments(user.profile.id);
      const all = Array.isArray(res.data) ? res.data : res.data?.results || [];
      const upcoming = all.filter((t) => {
        const s = (t.status || '').toLowerCase();
        return s === 'upcoming' || s === 'pending' || s === 'not_started';
      });
      setTournaments(upcoming);
    } catch (err) {
      setError('Failed to load upcoming events');
      showToast('Failed to load upcoming events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profile?.id]);

  return (
    <div className="upcom-root">
      <div className="upcom-card-container">
        {/* Header */}
        <div className="upcom-card-container-header">
          <h2 className="upcom-card-container-title">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Your Upcoming Tournaments
          </h2>
          <button className="upcom-refresh-btn" onClick={fetchUpcoming} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="upcom-card-container-body">
          {loading ? (
            <div className="upcom-skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="upcom-skeleton-card" />
              ))}
            </div>
          ) : error ? (
            <div className="upcom-error">
              <p className="upcom-error-msg">{error}</p>
              <button className="upcom-retry-btn" onClick={fetchUpcoming}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="upcom-empty">
              <Calendar className="upcom-empty-icon" />
              <p className="upcom-empty-title">No upcoming tournaments</p>
              <p className="upcom-empty-sub">Create a tournament or scrim to see it here</p>
            </div>
          ) : (
            <div className="upcom-list">
              {tournaments.map((t) => (
                <UpcomingTournamentCard key={t.id} tournament={t} onManage={onManage} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
