import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Key,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Trophy,
  Clock,
  Calendar,
  MapPin,
  X,
  Gamepad2,
  Video,
  ExternalLink,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import './PlayerCredentialsView.css';

// Game hero images — same imports as PlayerOverviewView
import heroBgmi from '../../../assets/hero-bgmi.webp';
import heroBgmiAction from '../../../assets/hero-bgmi-action.jpg';
import heroValorant from '../../../assets/hero-valorant.jpg';
import heroCodm from '../../../assets/hero-codm.png';
import heroFreefire from '../../../assets/hero-freefire.jpeg';

// ─── Constants ───────────────────────────────────────────────────────────────

const GAME_FILTER_OPTIONS = [
  { label: 'All Games', value: 'All' },
  { label: 'BGMI', value: 'BGMI' },
  { label: 'Scarfall', value: 'Scarfall' },
  { label: 'Free Fire', value: 'Freefire' },
  { label: 'Valorant', value: 'Valorant' },
  { label: 'COD Mobile', value: 'COD' },
];

const GAME_HERO_IMAGES = {
  BGMI: heroBgmi,
  Valorant: heroValorant,
  COD: heroCodm,
  Freefire: heroFreefire,
  Scarfall: heroBgmiAction,
};

// Valorant uses a single Room ID field (no password needed)
const IS_VALORANT = (gameName) => (gameName || '').toLowerCase() === 'valorant';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mediaBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getBannerImage = (tournament) => {
  const img = tournament.banner_image || tournament.poster_image;
  if (!img) return GAME_HERO_IMAGES[tournament.game_name] || heroBgmi;
  if (img.startsWith('http')) return img;
  return `${mediaBase}${img}`;
};

const getTournamentLink = (tournament) => {
  const mode = (tournament.event_mode || '').toUpperCase();
  return mode === 'SCRIM' ? `/scrims/${tournament.id}` : `/tournaments/${tournament.id}`;
};

// Status badge for the tournament (LIVE / UPCOMING / COMPLETED)
const getTournamentBadge = (status) => {
  switch (status) {
    case 'ongoing':
      return { label: 'LIVE', cls: 'credentials-badge credentials-badge-live' };
    case 'upcoming':
      return { label: 'UPCOMING', cls: 'credentials-badge credentials-badge-upcoming' };
    case 'completed':
      return { label: 'ENDED', cls: 'credentials-badge credentials-badge-completed' };
    default:
      return null;
  }
};

// Status badge for the registration (REGISTERED / PENDING / REJECTED)
const getRegistrationBadge = (regStatus) => {
  switch (regStatus) {
    case 'confirmed':
      return { label: 'REGISTERED', cls: 'credentials-badge credentials-badge-registered' };
    case 'pending':
      return { label: 'PENDING', cls: 'credentials-badge credentials-badge-pending' };
    default:
      return null;
  }
};

// Format "2025-03-14" → "Mar 14"
const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

// ─── Countdown helper ─────────────────────────────────────────────────────────

const useCountdown = (targetDateStr) => {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!targetDateStr) {
      setRemaining(null);
      return;
    }

    const target = new Date(targetDateStr).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining({ expired: true, d: 0, h: 0, m: 0, s: 0 });
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining({ expired: false, d, h, m, s });
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDateStr]);

  return remaining;
};

const CountdownDisplay = ({ remaining, label }) => {
  if (!remaining || remaining.expired) return null;
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="credentials-countdown">
      <p className="credentials-countdown-label">
        <Clock size={12} />
        {label}
      </p>
      <div className="credentials-countdown-timer">
        {remaining.d > 0 && (
          <span className="credentials-countdown-unit">
            <span className="credentials-countdown-value">{pad(remaining.d)}</span>
            <span className="credentials-countdown-suffix">d</span>
          </span>
        )}
        <span className="credentials-countdown-unit">
          <span className="credentials-countdown-value">{pad(remaining.h)}</span>
          <span className="credentials-countdown-suffix">h</span>
        </span>
        <span className="credentials-countdown-sep">:</span>
        <span className="credentials-countdown-unit">
          <span className="credentials-countdown-value">{pad(remaining.m)}</span>
          <span className="credentials-countdown-suffix">m</span>
        </span>
        <span className="credentials-countdown-sep">:</span>
        <span className="credentials-countdown-unit">
          <span className="credentials-countdown-value">{pad(remaining.s)}</span>
          <span className="credentials-countdown-suffix">s</span>
        </span>
      </div>
    </div>
  );
};

// ─── Card Skeleton ────────────────────────────────────────────────────────────

const CardSkeleton = () => <div className="credentials-card-skeleton" />;

// ─── Match Schedule Modal ─────────────────────────────────────────────────────

const MatchScheduleModal = ({ tournament, roundsData, roundNumbers, onClose }) => {
  const [selectedRound, setSelectedRound] = useState(roundNumbers[0] || 1);

  // Build flat list of matches for the selected round
  const currentGroups = roundsData[selectedRound];
  const matches = Array.isArray(currentGroups) ? currentGroups.flatMap((g) => g.matches || []) : [];

  const hasSchedule = matches.some((m) => m.scheduled_date || m.scheduled_time);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="credentials-modal-overlay" onClick={handleOverlayClick}>
      <div className="credentials-modal-box">
        {/* Header */}
        <div className="credentials-modal-header">
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: 'hsl(var(--purple))' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Match Schedule
              </p>
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {tournament.title}
              </p>
            </div>
          </div>
          <button className="credentials-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Round tabs — only show if more than 1 round */}
        {roundNumbers.length > 1 && (
          <div className="credentials-modal-tabs">
            {roundNumbers.map((rn) => (
              <button
                key={rn}
                className={`credentials-modal-tab${selectedRound === rn ? ' active' : ''}`}
                onClick={() => setSelectedRound(rn)}
              >
                Round {rn}
              </button>
            ))}
          </div>
        )}

        {/* Match list */}
        <div className="credentials-modal-matches">
          {hasSchedule ? (
            <div className="space-y-2">
              {matches.map((match, idx) => (
                <div key={match.id || idx} className="credentials-match-row">
                  <div className="flex items-center gap-3">
                    {/* Match badge */}
                    <div className="credentials-match-badge">M{match.match_number || idx + 1}</div>
                    {/* Map name */}
                    {match.map_name && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {match.map_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {match.scheduled_time && (
                      <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                        {match.scheduled_time}
                      </p>
                    )}
                    {match.scheduled_date && (
                      <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {formatShortDate(match.scheduled_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Calendar size={24} style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} />
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Schedule not available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Credential Card ─────────────────────────────────────────────────────────

const CredentialCard = ({ registration }) => {
  const navigate = useNavigate();
  const { tournament, status: regStatus, id: regId } = registration;

  // Countdown for credential release
  const credCountdown = useCountdown(tournament.credential_release_time);

  // Each card tracks its own selected round and per-field copied state
  const [selectedRound, setSelectedRound] = useState(1);
  const [roundsData, setRoundsData] = useState({}); // { [roundNumber]: groups[] | null }
  const [loadingRound, setLoadingRound] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null); // e.g. "123-id-1", "123-pass-1"
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null); // null = auto-select latest match with creds

  // Determine how many rounds this tournament has (best-effort from rounds_count or default 1)
  const roundCount = tournament.rounds_count || tournament.current_round || 1;
  const roundNumbers = Array.from({ length: roundCount }, (_, i) => i + 1);

  // Fetch credentials for a round (silently — no toast on failure)
  // Returns true if the round has any credentials
  const fetchRound = useCallback(
    async (roundNumber) => {
      // Only skip if we already have real data (array). null means previous fetch failed — retry.
      if (Array.isArray(roundsData[roundNumber])) {
        const groups = roundsData[roundNumber];
        return groups.some((g) => (g.matches || []).some((m) => m.match_id));
      }
      setLoadingRound(true);
      try {
        const res = await tournamentAPI.getRoundGroups(tournament.id, roundNumber);
        const groups =
          res.data?.groups || res.data?.results || (Array.isArray(res.data) ? res.data : []);
        setRoundsData((prev) => ({ ...prev, [roundNumber]: groups }));
        return groups.some((g) => (g.matches || []).some((m) => m.match_id));
      } catch {
        // 403 / 404 means credentials not released yet
        setRoundsData((prev) => ({ ...prev, [roundNumber]: null }));
        return false;
      } finally {
        setLoadingRound(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tournament.id, roundsData]
  );

  // On mount: scan from latest round downward to auto-select the round that has credentials.
  // For ongoing tournaments this lands on the current active round.
  // For completed tournaments it lands on the final round automatically.
  useEffect(() => {
    const autoSelectRound = async () => {
      const startRound = tournament.current_round || roundCount;
      for (let r = startRound; r >= 1; r--) {
        // eslint-disable-next-line no-await-in-loop
        const hasCreds = await fetchRound(r);
        if (hasCreds) {
          setSelectedRound(r);
          return;
        }
      }
      // No creds found in any round — default to round 1
      if (!roundsData[1]) fetchRound(1);
      setSelectedRound(1);
    };
    autoSelectRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling: every 10s, if tournament is not completed, re-fetch the current round.
  // This ensures credentials entered or updated by the host appear without a page refresh.
  useEffect(() => {
    if (tournament.status === 'completed') return;

    const id = setInterval(() => {
      // Force re-fetch by clearing the cached value for this round
      setRoundsData((prev) => {
        const next = { ...prev };
        delete next[selectedRound];
        return next;
      });
    }, 10000); // 10 seconds

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound, tournament.status]);

  // Auto-reveal: when countdown expires, clear cache and re-fetch
  const prevExpired = useRef(false);
  useEffect(() => {
    if (credCountdown?.expired && !prevExpired.current) {
      prevExpired.current = true;
      // Reset cache so fetchRound treats it as unfetched, then trigger fetch
      setRoundsData((prev) => {
        // Remove only the current round so fetchRound will re-fetch it
        const next = { ...prev };
        delete next[selectedRound];
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credCountdown?.expired]);

  // When roundsData for current round is cleared (auto-reveal), re-fetch
  useEffect(() => {
    if (!roundsData.hasOwnProperty(selectedRound)) {
      fetchRound(selectedRound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundsData, selectedRound]);

  // When round pill changes, fetch that round's data
  const handleRoundSelect = (rn) => {
    setSelectedRound(rn);
    fetchRound(rn);
  };

  // Copy to clipboard helper
  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may not be available on non-HTTPS — fail silently
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
  };

  // Derive credentials from the selected round's groups
  const currentGroups = roundsData[selectedRound];
  const hasData = Array.isArray(currentGroups) && currentGroups.length > 0;

  // Collect all matches across groups for this round that have credentials
  const matchesWithCreds = hasData
    ? currentGroups.flatMap((g) => (g.matches || []).filter((m) => m.match_id))
    : [];

  // Auto-select the latest match (highest match_number) that has credentials
  const latestMatchNumber =
    matchesWithCreds.length > 0 ? Math.max(...matchesWithCreds.map((m) => m.match_number)) : null;
  const activeMatchNumber = selectedMatch !== null ? selectedMatch : latestMatchNumber;

  const tournamentBadge = getTournamentBadge(tournament.status);
  const regBadge = getRegistrationBadge(regStatus);
  const isValorant = IS_VALORANT(tournament.game_name);

  return (
    <>
      <div className="credentials-card">
        {/* ── Banner ── */}
        <div className="credentials-banner">
          <img src={getBannerImage(tournament)} alt={tournament.title} loading="lazy" />
          <div className="credentials-banner-overlay" />

          {/* Top-left badges */}
          <div className="credentials-banner-badges">
            {tournament.game_name && (
              <span className="credentials-badge">{tournament.game_name}</span>
            )}
            {tournamentBadge && (
              <span className={tournamentBadge.cls}>{tournamentBadge.label}</span>
            )}
            {regBadge && <span className={regBadge.cls}>{regBadge.label}</span>}
          </div>

          {/* Title at bottom of banner */}
          <div className="credentials-banner-title">
            <h3>{tournament.title}</h3>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="credentials-body">
          {/* Round pills — only show if more than 1 round */}
          {roundNumbers.length > 1 && (
            <div className="credentials-round-pills">
              {roundNumbers.map((rn) => (
                <button
                  key={rn}
                  className={`credentials-round-pill${selectedRound === rn ? ' active' : ''}`}
                  onClick={() => handleRoundSelect(rn)}
                >
                  Round {rn}
                </button>
              ))}
            </div>
          )}

          {/* ── Credentials box ── */}
          <div className="credentials-creds-box">
            {/* Header row */}
            <div className="flex items-center gap-1.5 mb-2">
              <Key size={12} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span
                className="font-semibold uppercase"
                style={{
                  fontSize: '10px',
                  color: 'hsl(var(--muted-foreground))',
                  letterSpacing: '0.06em',
                }}
              >
                CREDENTIALS
              </span>
            </div>

            {/* Credential content */}
            {loadingRound ? (
              <div
                className="credentials-no-creds"
                style={{ animation: 'credentials-pulse 1.5s ease-in-out infinite' }}
              >
                <p>Loading credentials...</p>
              </div>
            ) : matchesWithCreds.length > 0 ? (
              (() => {
                // If multiple matches, show tab pills and only the selected match
                const activeMatch =
                  matchesWithCreds.length > 1
                    ? matchesWithCreds.find((m) => m.match_number === activeMatchNumber) ||
                      matchesWithCreds[matchesWithCreds.length - 1]
                    : matchesWithCreds[0];
                const match = activeMatch;
                const idKey = `${regId}-id-${match.id}`;
                const passKey = `${regId}-pass-${match.id}`;
                return (
                  <div>
                    {/* Match tab pills — only when multiple matches */}
                    {matchesWithCreds.length > 1 && (
                      <div className="credentials-round-pills" style={{ marginBottom: '10px' }}>
                        {matchesWithCreds.map((m) => (
                          <button
                            key={m.id}
                            className={`credentials-round-pill${activeMatchNumber === m.match_number ? ' active' : ''}`}
                            onClick={() => setSelectedMatch(m.match_number)}
                          >
                            Match {m.match_number}
                          </button>
                        ))}
                      </div>
                    )}

                    {isValorant ? (
                      /* Valorant: single full-width row */
                      <div className="credentials-field-row">
                        <span className="credentials-field-label">Room ID</span>
                        <span className="credentials-field-value">{match.match_id}</span>
                        <button
                          className={`credentials-copy-btn${copiedKey === idKey ? ' copied' : ''}`}
                          onClick={() => handleCopy(match.match_id, idKey)}
                          title="Copy Room ID"
                          aria-label="Copy Room ID"
                        >
                          {copiedKey === idKey ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      /* Non-Valorant: 2-column grid */
                      <div className="credentials-creds-grid">
                        {/* ID cell */}
                        <div className="credentials-cred-cell">
                          <span
                            className="uppercase"
                            style={{
                              fontSize: '9px',
                              color: 'hsl(var(--muted-foreground))',
                              letterSpacing: '0.06em',
                              fontWeight: 600,
                            }}
                          >
                            ID
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className="flex-1 font-bold text-sm font-mono truncate"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {match.match_id}
                            </span>
                            <button
                              className={`credentials-copy-btn${copiedKey === idKey ? ' copied' : ''}`}
                              onClick={() => handleCopy(match.match_id, idKey)}
                              title="Copy Room ID"
                              aria-label="Copy Room ID"
                            >
                              {copiedKey === idKey ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Pass cell — only if password exists */}
                        {match.match_password && (
                          <div className="credentials-cred-cell">
                            <span
                              className="uppercase"
                              style={{
                                fontSize: '9px',
                                color: 'hsl(var(--muted-foreground))',
                                letterSpacing: '0.06em',
                                fontWeight: 600,
                              }}
                            >
                              PASS
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="flex-1 font-bold text-sm font-mono truncate"
                                style={{ color: 'hsl(var(--foreground))' }}
                              >
                                {match.match_password}
                              </span>
                              <button
                                className={`credentials-copy-btn${copiedKey === passKey ? ' copied' : ''}`}
                                onClick={() => handleCopy(match.match_password, passKey)}
                                title="Copy Password"
                                aria-label="Copy Password"
                              >
                                {copiedKey === passKey ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : credCountdown && !credCountdown.expired ? (
              <div className="credentials-no-creds">
                <CountdownDisplay
                  remaining={credCountdown}
                  label="Room ID & Password releasing in..."
                />
              </div>
            ) : (
              <div className="credentials-no-creds">
                <p>Credentials not released yet</p>
              </div>
            )}
          </div>

          {/* ── Actions row ── */}
          <div className="flex gap-2 mt-3">
            <button className="credentials-action-btn" onClick={() => setShowSchedule(true)}>
              <Clock size={13} />
              Time
            </button>
            <button
              className="credentials-action-btn"
              onClick={() => navigate(getTournamentLink(tournament))}
            >
              Details
              <ChevronRight size={13} />
            </button>
            {tournament.live_link && (
              <a
                href={tournament.live_link}
                target="_blank"
                rel="noopener noreferrer"
                className="credentials-action-btn credentials-live-btn"
              >
                <Video size={13} />
                Watch Live
                <ExternalLink size={11} style={{ opacity: 0.7 }} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Match Schedule Modal ── */}
      {showSchedule && (
        <MatchScheduleModal
          tournament={tournament}
          roundsData={roundsData}
          roundNumbers={roundNumbers}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'Live', value: 'ongoing' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'completed' },
];

const PlayerCredentialsView = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('ongoing');

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Fetch the player's registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await tournamentAPI.getMyRegistrations();
        const data = res.data?.results || res.data || [];
        // Only show confirmed or pending registrations (exclude rejected/withdrawn)
        const active = (Array.isArray(data) ? data : []).filter(
          (r) => r.status === 'confirmed' || r.status === 'pending'
        );
        setRegistrations(active);
      } catch (err) {
        console.error('Error fetching registrations for credentials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter by game and status
  const filteredRegistrations = registrations.filter((r) => {
    const gameMatch = gameFilter === 'All' || (r.tournament?.game_name || '') === gameFilter;
    const statusMatch = statusFilter === 'All' || (r.tournament?.status || '') === statusFilter;
    return gameMatch && statusMatch;
  });

  const activeGameLabel =
    GAME_FILTER_OPTIONS.find((o) => o.value === gameFilter)?.label || 'All Games';

  return (
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--purple) / 0.15)' }}
          >
            <Key size={18} style={{ color: 'hsl(var(--purple))' }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold leading-tight"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Match IDs &amp; Passwords
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Your room credentials for registered tournaments
            </p>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`tv-reg-status-pill${statusFilter === opt.value ? ' active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Game filter — Lovable outline style */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-medium transition-all"
            style={{
              border: '1px solid hsl(var(--border) / 0.5)',
              background: 'transparent',
              color: 'hsl(var(--foreground))',
            }}
          >
            <Gamepad2 size={13} />
            <span>{activeGameLabel}</span>
            <ChevronDown
              size={13}
              className={filterOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
          </button>

          {filterOpen && (
            <div className="overview-filter-dropdown credentials-filter-dropdown">
              {GAME_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`overview-filter-option${gameFilter === option.value ? ' selected' : ''}`}
                  onClick={() => {
                    setGameFilter(option.value);
                    setFilterOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredRegistrations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRegistrations.map((registration) => (
            <CredentialCard key={registration.id} registration={registration} />
          ))}
        </div>
      ) : (
        <div className="credentials-empty">
          <div className="credentials-empty-icon">
            <Trophy size={24} />
          </div>
          {registrations.length > 0 && (gameFilter !== 'All' || statusFilter !== 'All') ? (
            <>
              <p>
                No{' '}
                {statusFilter !== 'All'
                  ? STATUS_FILTER_OPTIONS.find(
                      (o) => o.value === statusFilter
                    )?.label.toLowerCase() + ' '
                  : ''}
                {gameFilter !== 'All' ? activeGameLabel + ' ' : ''}registrations found
              </p>
              <button
                onClick={() => {
                  setGameFilter('All');
                  setStatusFilter('All');
                }}
                className="text-xs hover:underline"
                style={{ color: 'hsl(var(--purple))' }}
              >
                Clear filter
              </button>
            </>
          ) : (
            <>
              <p>You haven&apos;t registered for any tournaments yet</p>
              <Link to="/tournaments" className="credentials-empty-cta">
                Browse Tournaments
                <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerCredentialsView;
