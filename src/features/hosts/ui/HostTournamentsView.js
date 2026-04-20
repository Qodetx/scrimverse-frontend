import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trophy, Swords, Users, Activity, Calendar, ChevronRight } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { tournamentAPI } from '../../../utils/api';
import './HostTournamentsView.css';

const GAME_ICON_COLORS = {
  BGMI: 'bg-amber-500/15 text-amber-400',
  Valorant: 'bg-red-500/15 text-red-400',
  'COD Mobile': 'bg-green-500/15 text-green-400',
  'Free Fire': 'bg-orange-500/15 text-orange-400',
  Scarfall: 'bg-cyan-500/15 text-cyan-400',
};

const isLiveStatus = (s) => s === 'live' || s === 'ongoing';
const isPastStatus = (s) => s === 'completed' || s === 'cancelled';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const HostTournamentsView = ({ onManage }) => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [subTab, setSubTab] = useState(() => {
    return searchParams.get('tab') || 'live';
  });

  // Persist subTab to URL
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (subTab && currentTab !== subTab) {
      const params = new URLSearchParams(searchParams);
      params.set('tab', subTab);
      setSearchParams(params, { replace: true });
    }
  }, [subTab, searchParams, setSearchParams]);

  const fetchTournaments = async () => {
    setLoading(true);
    setError(false);
    try {
      const hostId = user?.profile?.id;
      if (!hostId) return;
      const res = await tournamentAPI.getHostTournaments(hostId);
      setTournaments(res.data.results || res.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profile?.id]);

  const liveTournaments = tournaments.filter((t) => isLiveStatus(t.status));
  const pastTournaments = tournaments.filter((t) => isPastStatus(t.status));

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="htv-header">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            Tournaments
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="htv-card animate-pulse space-y-2 py-5">
              <div className="h-4 bg-secondary/40 rounded w-2/3" />
              <div className="h-3 bg-secondary/30 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-500" />
          Tournaments
        </h2>
        <div className="text-center py-12">
          <p className="text-sm text-red-400 mb-3">Failed to load tournaments</p>
          <button onClick={fetchTournaments} className="htv-manage-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Main ────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Header + sub-tabs */}
      <div className="htv-header">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {subTab === 'live' ? (
            <Activity className="h-5 w-5 text-red-500 animate-pulse" />
          ) : (
            <Calendar className="h-5 w-5 text-muted-foreground" />
          )}
          Tournaments
        </h2>
        <div className="htv-subtabs">
          <button
            className={`htv-subtab${subTab === 'live' ? ' htv-subtab-active' : ''}`}
            onClick={() => setSubTab('live')}
          >
            Live
            {liveTournaments.length > 0 && (
              <span className="htv-subtab-badge htv-subtab-badge-red">
                {liveTournaments.length}
              </span>
            )}
          </button>
          <button
            className={`htv-subtab${subTab === 'past' ? ' htv-subtab-active' : ''}`}
            onClick={() => setSubTab('past')}
          >
            Past
            {pastTournaments.length > 0 && (
              <span className="htv-subtab-badge">{pastTournaments.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Live tab ────────────────────────────────────── */}
      {subTab === 'live' && (
        <>
          {liveTournaments.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No live tournaments right now
              </p>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Your live events will appear here once started
              </p>
              <Link to="/host/create-tournament" className="text-xs text-accent hover:underline">
                Create a Tournament →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {liveTournaments.map((t) => {
                const isScrimEvent = t.event_mode === 'SCRIM';
                const gameName = t.game_name || '';
                const iconStyle = GAME_ICON_COLORS[gameName] || 'bg-purple/15 text-purple';
                const currentRound = t.current_round || 'In Progress';
                return (
                  <div
                    key={t.id}
                    className={`htv-card${isScrimEvent ? ' border-purple-500/30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${isScrimEvent ? 'bg-purple-500/15 text-purple-400' : iconStyle}`}
                        >
                          {isScrimEvent ? (
                            <Swords className="h-5 w-5" />
                          ) : (
                            <Trophy className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{t.title || t.name}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {isScrimEvent ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-semibold animate-pulse">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
                                LIVE SCRIM
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-semibold animate-pulse">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
                                LIVE
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {currentRound}
                            </span>
                            <span className="text-[10px] text-muted-foreground">&bull;</span>
                            <span className="text-[10px] text-muted-foreground">{gameName}</span>
                            <span className="text-[10px] text-muted-foreground">&bull;</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {t.current_participants ?? 0}/{t.max_participants ?? '∞'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="htv-manage-btn"
                        onClick={() =>
                          onManage && onManage(t.id, isScrimEvent ? 'scrim' : 'tournament')
                        }
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Past tab ────────────────────────────────────── */}
      {subTab === 'past' && (
        <>
          {pastTournaments.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No past tournaments</p>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Completed tournaments will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastTournaments.map((t) => {
                const isScrimEvent = t.event_mode === 'SCRIM';
                const gameName = t.game_name || '';
                const iconStyle = GAME_ICON_COLORS[gameName] || 'bg-purple/15 text-purple';
                const isCancelled = t.status === 'cancelled';
                return (
                  <div key={t.id} className="htv-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${isScrimEvent ? 'bg-purple-500/15 text-purple-400' : iconStyle} opacity-70`}
                        >
                          {isScrimEvent ? (
                            <Swords className="h-5 w-5" />
                          ) : (
                            <Trophy className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground/90">
                            {t.title || t.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${isCancelled ? 'bg-red-500/15 text-red-400' : 'bg-secondary/50 text-muted-foreground'}`}
                            >
                              {isCancelled ? 'CANCELLED' : 'COMPLETED'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{gameName}</span>
                            <span className="text-[10px] text-muted-foreground">&bull;</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {t.current_participants ?? 0} played
                            </span>
                            {t.start_date && (
                              <>
                                <span className="text-[10px] text-muted-foreground">&bull;</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(t.start_date)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link to={`/tournaments/${t.id}/manage`} className="htv-view-btn">
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HostTournamentsView;
