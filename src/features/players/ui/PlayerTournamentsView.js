import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Gamepad2, ChevronDown, Check, Table2, ArrowRight } from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import PointsTableModal from '../../tournaments/ui/PointsTableModal';
import posterBgmi from '../../../assets/poster-bgmi.png';
import posterFreefire from '../../../assets/poster-freefire.jpg';
import posterScarfall from '../../../assets/poster-scarfall.png';
import posterValorant from '../../../assets/poster-valorant.jpg';
import posterCodm from '../../../assets/poster-codm.jpg';
import './PlayerTournamentsView.css';

const MEDIA_URL = (process.env.REACT_APP_MEDIA_URL || 'http://localhost:8000').replace(
  /\/media\/?$/,
  ''
);

const GAME_POSTERS = {
  BGMI: posterBgmi,
  Freefire: posterFreefire,
  Scarfall: posterScarfall,
  Valorant: posterValorant,
  COD: posterCodm,
};

// Helper: resolve poster image
const getPoster = (t) => {
  if (t.banner_image) {
    return t.banner_image.startsWith('http') ? t.banner_image : `${MEDIA_URL}${t.banner_image}`;
  }
  return GAME_POSTERS[t.game_name] || posterBgmi;
};

// Helper: common card fields
const getCardData = (t) => {
  const registered = t.current_participants || 0;
  const total = t.max_participants || 100;
  const progressPct = Math.min((registered / total) * 100, 100);
  const spotsLeft = Math.max(total - registered, 0);
  const prizePool = t.prize_pool ? `₹${t.prize_pool}` : 'TBD';
  const entryFee = t.entry_fee ? `₹${t.entry_fee} per team` : 'Free';
  const hostName = t.host_name || t.host?.username || '';
  const hostId = t.host?.id || t.host_id;
  return { registered, total, progressPct, spotsLeft, prizePool, entryFee, hostName, hostId };
};

// Lovable-style browse card (Tab 2 — All Tournaments)
const BrowseTournamentCard = ({ tournament, isRegistered }) => {
  const navigate = useNavigate();
  const t = tournament;
  const poster = getPoster(t);
  const { registered, progressPct, spotsLeft, prizePool, entryFee, hostName, hostId } =
    getCardData(t);
  const link = `/tournaments/${t.id}`;

  return (
    <div className="tv-browse-card" onClick={() => navigate(link)}>
      <div className="tv-browse-card-img">
        <img src={poster} alt={t.game_name || ''} />
      </div>
      <div className="tv-browse-card-body">
        <h4 className="tv-browse-card-title">{t.title}</h4>
        {hostName && (
          <p className="tv-browse-card-host">
            by{' '}
            <Link
              to={`/host/profile/${hostId}`}
              className="tv-browse-card-host-link"
              onClick={(e) => e.stopPropagation()}
            >
              {hostName}
            </Link>
          </p>
        )}
        <div className="tv-browse-card-row">
          <span className="tv-browse-card-prize">
            <Trophy size={13} /> {prizePool}
          </span>
          <span className="tv-browse-card-fee">{entryFee}</span>
        </div>
        <div className="tv-browse-card-progress-wrap">
          <div className="tv-browse-card-progress-bar">
            <div className="tv-browse-card-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="tv-browse-card-progress-labels">
            <span>{registered} registered</span>
            <span className="tv-browse-card-spots">{spotsLeft} spots left</span>
          </div>
        </div>
        <div className="tv-browse-card-footer">
          <Link to={link} className="tv-browse-card-details" onClick={(e) => e.stopPropagation()}>
            Details <ArrowRight size={12} />
          </Link>
          {isRegistered ? (
            <span className="tv-browse-card-registered">✓ Registered</span>
          ) : (
            <Link
              to={link}
              className="tv-browse-card-register"
              onClick={(e) => e.stopPropagation()}
            >
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Lovable-style ongoing card (Tab 3)
const OngoingTournamentCard = ({ tournament, onPointsTable }) => {
  const navigate = useNavigate();
  const t = tournament;
  const poster = getPoster(t);
  const { registered, progressPct, spotsLeft, prizePool, entryFee, hostName, hostId } =
    getCardData(t);
  const link = `/tournaments/${t.id}`;

  return (
    <div className="tv-browse-card" onClick={() => navigate(link)}>
      {/* LIVE badge */}
      <span className="tv-live-badge">LIVE</span>

      <div className="tv-browse-card-img">
        <img src={poster} alt={t.game_name || ''} />
      </div>
      <div className="tv-browse-card-body">
        <h4 className="tv-browse-card-title">{t.title}</h4>
        {hostName && (
          <p className="tv-browse-card-host">
            by{' '}
            <Link
              to={`/host/profile/${hostId}`}
              className="tv-browse-card-host-link"
              onClick={(e) => e.stopPropagation()}
            >
              {hostName}
            </Link>
          </p>
        )}
        <div className="tv-browse-card-row">
          <span className="tv-browse-card-prize">
            <Trophy size={13} /> {prizePool}
          </span>
          <span className="tv-browse-card-fee">{entryFee}</span>
        </div>
        <div className="tv-browse-card-progress-wrap">
          <div className="tv-browse-card-progress-bar">
            <div className="tv-browse-card-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="tv-browse-card-progress-labels">
            <span>{registered} registered</span>
            <span className="tv-browse-card-spots">{spotsLeft} spots left</span>
          </div>
        </div>
        <div className="tv-browse-card-footer">
          <Link to={link} className="tv-browse-card-details" onClick={(e) => e.stopPropagation()}>
            Details <ArrowRight size={12} />
          </Link>
        </div>
        {/* Round + Points Table */}
        <div className="tv-ongoing-footer">
          <span className="tv-round-label">
            {t.current_round ? `Round ${t.current_round}` : 'In Progress'}
          </span>
          <button
            className="tv-pts-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPointsTable(t);
            }}
          >
            <Table2 size={12} />
            Points Table
          </button>
        </div>
      </div>
    </div>
  );
};

// Lovable-style registered tournament card (clean — no status badges)
const RegisteredTournamentCard = ({ registration }) => {
  const t = registration.tournament;
  if (!t) return null;

  const gameName = t.game_name || '';
  const poster = t.banner_image
    ? t.banner_image.startsWith('http')
      ? t.banner_image
      : `${MEDIA_URL}${t.banner_image}`
    : GAME_POSTERS[gameName] || posterBgmi;

  const registered = t.current_participants || 0;
  const total = t.max_participants || 100;
  const progressPct = Math.min((registered / total) * 100, 100);
  const spotsLeft = Math.max(total - registered, 0);
  const prizePool = t.prize_pool ? `₹${t.prize_pool}` : 'TBD';
  const entryFee = t.entry_fee ? `₹${t.entry_fee} per team` : 'Free';
  const hostName = t.host_name || t.host?.username || '';

  return (
    <div className="tv-reg-card">
      {/* ✓ Registered badge */}
      <div className="tv-registered-badge">✓ Registered</div>

      {/* Poster */}
      <div className="tv-reg-card-img">
        <img src={poster} alt={gameName} />
      </div>

      {/* Body */}
      <div className="tv-reg-card-body">
        <h4 className="tv-reg-card-title">{t.title}</h4>
        {hostName && (
          <p className="tv-reg-card-host">
            by <span>{hostName}</span>
          </p>
        )}

        {/* Prize + entry fee */}
        <div className="tv-reg-card-row">
          <span className="tv-reg-card-prize">
            <Trophy size={13} /> {prizePool}
          </span>
          <span className="tv-reg-card-fee">{entryFee}</span>
        </div>

        {/* Progress bar */}
        <div className="tv-reg-card-progress-wrap">
          <div className="tv-reg-card-progress-bar">
            <div className="tv-reg-card-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="tv-reg-card-progress-labels">
            <span>{registered} registered</span>
            <span className="tv-reg-card-spots">{spotsLeft} spots left</span>
          </div>
        </div>

        {/* Details link */}
        <div className="tv-reg-card-footer">
          <Link to={`/tournaments/${t.id}`} className="tv-reg-card-details">
            Details <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 9;

// Maps display label → backend game_name value
const GAME_FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'BGMI', value: 'BGMI' },
  { label: 'Scarfall', value: 'Scarfall' },
  { label: 'Free Fire', value: 'Freefire' },
  { label: 'Valorant', value: 'Valorant' },
  { label: 'COD Mobile', value: 'COD' },
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'Live', value: 'ongoing' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'completed' },
];

const PlayerTournamentsView = () => {
  const { showToast } = useToast();

  // ── tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'registered';
  });

  // Sync activeTab to URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(window.history.state, '', newUrl);
    }
  }, [activeTab]);

  // ── registrations ─────────────────────────────────────────────────────────
  const [registrations, setRegistrations] = useState([]);
  const [regStatusFilter, setRegStatusFilter] = useState('ongoing');
  const [regGameFilter, setRegGameFilter] = useState('All');
  const [regGameDropdownOpen, setRegGameDropdownOpen] = useState(false);
  const regGameDropdownRef = useRef(null);

  // ── all tournaments ───────────────────────────────────────────────────────
  const [allTournaments, setAllTournaments] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [gameFilter, setGameFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── ongoing ───────────────────────────────────────────────────────────────
  const [ongoingTournaments, setOngoingTournaments] = useState([]);

  // ── points table modal ────────────────────────────────────────────────────
  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [ptModalTournament, setPtModalTournament] = useState(null);
  const [ptModalRound, setPtModalRound] = useState(1);

  // ── loading ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  // ── data fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regRes, tourRes] = await Promise.all([
          tournamentAPI.getMyRegistrations(),
          tournamentAPI.getTournaments({ is_scrim: false }),
        ]);

        // registrations — handle both array and paginated object
        const rawRegs = regRes.data?.results || regRes.data || [];
        const filteredRegs = rawRegs.filter(
          (r) =>
            (r.status === 'confirmed' || r.status === 'pending') &&
            (r.tournament?.event_mode || '').toUpperCase() !== 'SCRIM'
        );
        setRegistrations(filteredRegs);

        // all tournaments — paginated
        const rawTours = tourRes.data?.results || tourRes.data || [];
        setAllTournaments(rawTours);

        // ongoing — derived from same list
        setOngoingTournaments(rawTours.filter((t) => t.status === 'ongoing'));
      } catch (err) {
        console.error('PlayerTournamentsView: fetch error', err);
        showToast('Failed to load tournaments', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (regGameDropdownRef.current && !regGameDropdownRef.current.contains(e.target)) {
        setRegGameDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── derived: filtered registrations ──────────────────────────────────────
  const filteredRegistrations = registrations.filter((r) => {
    const t = r.tournament;
    if (!t) return false;
    const statusMatch = regStatusFilter === 'All' || t.status === regStatusFilter;
    const gameMatch = regGameFilter === 'All' || t.game_name === regGameFilter;
    return statusMatch && gameMatch;
  });

  const regGameLabel = GAME_FILTER_OPTIONS.find((o) => o.value === regGameFilter)?.label || 'All';

  // ── derived: filtered tournaments ─────────────────────────────────────────
  const filteredTournaments =
    gameFilter === 'All'
      ? allTournaments
      : allTournaments.filter((t) => t.game_name === gameFilter);

  const visibleTournaments = filteredTournaments.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTournaments.length;

  // Set of tournament IDs the player is registered for
  const registeredTournamentIds = new Set(
    registrations.map((r) => r.tournament?.id).filter(Boolean)
  );

  // Reset visible count when filter changes
  const handleGameFilter = (value) => {
    setGameFilter(value);
    setVisibleCount(PAGE_SIZE);
    setDropdownOpen(false);
  };

  // ── open points table ─────────────────────────────────────────────────────
  const openPointsTable = (tournament) => {
    setPtModalTournament(tournament);
    setPtModalRound(tournament.current_round || 1);
    setPtModalOpen(true);
  };

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="tv-loading">
        <div className="tv-spinner" />
      </div>
    );
  }

  const selectedGameLabel = GAME_FILTER_OPTIONS.find((o) => o.value === gameFilter)?.label || 'All';

  return (
    <div className="space-y-5">
      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="tv-tabs">
        <button
          className={`tv-tab${activeTab === 'registered' ? ' active' : ''}`}
          onClick={() => setActiveTab('registered')}
        >
          <Trophy size={13} />
          My Registrations ({registrations.length})
        </button>

        <button
          className={`tv-tab${activeTab === 'all' ? ' active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tournaments
        </button>

        <button
          className={`tv-tab${activeTab === 'ongoing' ? ' active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          <Clock size={13} />
          Ongoing ({ongoingTournaments.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 1 — My Registrations
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'registered' && (
        <div>
          {/* Header row with status pills + game filter */}
          <div className="tv-section-header">
            <div className="tv-reg-status-pills">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`tv-reg-status-pill${regStatusFilter === opt.value ? ' active' : ''}`}
                  onClick={() => setRegStatusFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Game filter dropdown */}
            <div style={{ position: 'relative' }} ref={regGameDropdownRef}>
              <button className="tv-filter-btn" onClick={() => setRegGameDropdownOpen((v) => !v)}>
                <Gamepad2 size={13} />
                {regGameLabel}
                <ChevronDown
                  size={12}
                  style={{
                    transform: regGameDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              {regGameDropdownOpen && (
                <div className="tv-dropdown-menu">
                  {GAME_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`tv-dropdown-item${regGameFilter === opt.value ? ' selected' : ''}`}
                      onClick={() => {
                        setRegGameFilter(opt.value);
                        setRegGameDropdownOpen(false);
                      }}
                    >
                      {regGameFilter === opt.value && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="tv-empty">
              <Trophy size={40} className="tv-empty-icon" />
              <p>You haven&apos;t registered for any tournaments yet.</p>
              <button className="tv-empty-btn" onClick={() => setActiveTab('all')}>
                Browse Tournaments
              </button>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="tv-empty">
              <Trophy size={40} className="tv-empty-icon" />
              <p>
                No{' '}
                {regStatusFilter === 'All'
                  ? ''
                  : STATUS_FILTER_OPTIONS.find(
                      (o) => o.value === regStatusFilter
                    )?.label.toLowerCase() + ' '}
                tournaments{regGameFilter !== 'All' ? ` for ${regGameLabel}` : ''}.
              </p>
            </div>
          ) : (
            <div className="tv-grid">
              {filteredRegistrations.map((reg) => (
                <RegisteredTournamentCard key={reg.id} registration={reg} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 2 — All Tournaments
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'all' && (
        <div>
          {/* Header row with game filter */}
          <div className="tv-section-header">
            <h2 className="tv-section-title">Tournaments</h2>

            {/* Custom dropdown — no ShadCN */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button className="tv-filter-btn" onClick={() => setDropdownOpen((v) => !v)}>
                <Gamepad2 size={13} />
                {selectedGameLabel}
                <ChevronDown
                  size={12}
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              {dropdownOpen && (
                <div className="tv-dropdown-menu">
                  {GAME_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`tv-dropdown-item${gameFilter === opt.value ? ' selected' : ''}`}
                      onClick={() => handleGameFilter(opt.value)}
                    >
                      {gameFilter === opt.value && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredTournaments.length === 0 ? (
            <div className="tv-empty">
              <p>No tournaments for {selectedGameLabel}</p>
            </div>
          ) : (
            <>
              <div className="tv-grid">
                {visibleTournaments.map((tournament) => (
                  <BrowseTournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    isRegistered={registeredTournamentIds.has(tournament.id)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="tv-load-more-wrap">
                  <button
                    className="tv-load-more-btn"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Tab 3 — Ongoing
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ongoing' && (
        <div>
          <h2 className="tv-section-title" style={{ marginBottom: '16px' }}>
            Ongoing Tournaments
          </h2>

          {ongoingTournaments.length === 0 ? (
            <div className="tv-empty">
              <Clock size={40} className="tv-empty-icon" />
              <p>No ongoing tournaments right now.</p>
            </div>
          ) : (
            <div className="tv-grid">
              {ongoingTournaments.map((tournament) => (
                <OngoingTournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onPointsTable={openPointsTable}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Points Table Modal ─────────────────────────────────────────────── */}
      {ptModalOpen && ptModalTournament && (
        <PointsTableModal
          isOpen={ptModalOpen}
          onClose={() => setPtModalOpen(false)}
          tournament={ptModalTournament}
          currentRound={ptModalRound}
        />
      )}
    </div>
  );
};

export default PlayerTournamentsView;
