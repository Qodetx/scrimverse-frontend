import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Swords,
  Trophy,
  Clock,
  Gamepad2,
  ChevronDown,
  Check,
  Table2,
  ArrowRight,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import ScrimPointsTableModal from '../../tournaments/ui/ScrimPointsTableModal';
import posterBgmi from '../../../assets/poster-bgmi.png';
import posterFreefire from '../../../assets/poster-freefire.jpg';
import posterScarfall from '../../../assets/poster-scarfall.png';
import posterValorant from '../../../assets/poster-valorant.jpg';
import posterCodm from '../../../assets/poster-codm.jpg';
import './PlayerScrimsView.css';

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
  const total = t.max_participants || 25;
  const progressPct = Math.min((registered / total) * 100, 100);
  const spotsLeft = Math.max(total - registered, 0);
  const prizePool = t.prize_pool ? `₹${t.prize_pool}` : 'Practice';
  const entryFee = t.entry_fee ? `₹${t.entry_fee} per team` : 'Free';
  const hostName = t.host_name || t.host?.username || '';
  const hostId = t.host?.id || t.host_id;
  return { registered, total, progressPct, spotsLeft, prizePool, entryFee, hostName, hostId };
};

// Registered scrim card (Tab 1)
const RegisteredScrimCard = ({ registration }) => {
  const t = registration.tournament;
  if (!t) return null;
  const poster = getPoster(t);
  const { registered, progressPct, spotsLeft, prizePool, entryFee, hostName } = getCardData(t);

  return (
    <div className="sv-reg-card">
      <div className="sv-registered-badge">✓ Registered</div>
      <div className="sv-card-img">
        <img src={poster} alt={t.game_name || ''} />
      </div>
      <div className="sv-card-body">
        <h4 className="sv-card-title">{t.title}</h4>
        {hostName && (
          <p className="sv-card-host">
            by <span>{hostName}</span>
          </p>
        )}
        <div className="sv-card-row">
          <span className="sv-card-prize">
            <Trophy size={13} /> {prizePool}
          </span>
          <span className="sv-card-fee">{entryFee}</span>
        </div>
        <div className="sv-card-progress-wrap">
          <div className="sv-card-progress-bar">
            <div className="sv-card-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="sv-card-progress-labels">
            <span>{registered} registered</span>
            <span className="sv-card-spots">{spotsLeft} spots left</span>
          </div>
        </div>
        <div className="sv-card-footer">
          <Link to={`/scrims/${t.id}`} className="sv-card-details">
            Details <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Browse scrim card (Tab 2)
const BrowseScrimCard = ({ scrim }) => {
  const navigate = useNavigate();
  const t = scrim;
  const poster = getPoster(t);
  const { registered, progressPct, spotsLeft, prizePool, entryFee, hostName, hostId } =
    getCardData(t);
  const link = `/scrims/${t.id}`;

  return (
    <div className="sv-browse-card" onClick={() => navigate(link)}>
      <div className="sv-card-img">
        <img src={poster} alt={t.game_name || ''} />
      </div>
      <div className="sv-card-body">
        <h4 className="sv-card-title">{t.title}</h4>
        {hostName && (
          <p className="sv-card-host">
            by{' '}
            <Link
              to={`/host/profile/${hostId}`}
              className="sv-card-host-link"
              onClick={(e) => e.stopPropagation()}
            >
              {hostName}
            </Link>
          </p>
        )}
        <div className="sv-card-row">
          <span className="sv-card-prize">
            <Trophy size={13} /> {prizePool}
          </span>
          <span className="sv-card-fee">{entryFee}</span>
        </div>
        <div className="sv-card-progress-wrap">
          <div className="sv-card-progress-bar">
            <div className="sv-card-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="sv-card-progress-labels">
            <span>{registered} registered</span>
            <span className="sv-card-spots">{spotsLeft} spots left</span>
          </div>
        </div>
        <div className="sv-card-footer">
          <Link to={link} className="sv-card-details" onClick={(e) => e.stopPropagation()}>
            Details <ArrowRight size={12} />
          </Link>
          <Link to={link} className="sv-card-register" onClick={(e) => e.stopPropagation()}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

// Ongoing scrim card (Tab 3)
const OngoingScrimCard = ({ scrim, onPointsTable }) => {
  const navigate = useNavigate();
  const t = scrim;
  const poster = getPoster(t);
  const { registered, progressPct, spotsLeft, prizePool, entryFee, hostName, hostId } =
    getCardData(t);
  const link = `/scrims/${t.id}`;

  return (
    <div className="sv-browse-card" onClick={() => navigate(link)}>
      <span className="sv-live-badge">LIVE</span>
      <div className="sv-card-img">
        <img src={poster} alt={t.game_name || ''} />
      </div>
      <div className="sv-card-body">
        <h4 className="sv-card-title">{t.title}</h4>
        {hostName && (
          <p className="sv-card-host">
            by{' '}
            <Link
              to={`/host/profile/${hostId}`}
              className="sv-card-host-link"
              onClick={(e) => e.stopPropagation()}
            >
              {hostName}
            </Link>
          </p>
        )}
        <div className="sv-card-row">
          <span className="sv-card-prize">
            <Trophy size={13} /> {prizePool}
          </span>
          <span className="sv-card-fee">{entryFee}</span>
        </div>
        <div className="sv-card-progress-wrap">
          <div className="sv-card-progress-bar">
            <div className="sv-card-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="sv-card-progress-labels">
            <span>{registered} registered</span>
            <span className="sv-card-spots">{spotsLeft} spots left</span>
          </div>
        </div>
        <div className="sv-card-footer">
          <Link to={link} className="sv-card-details" onClick={(e) => e.stopPropagation()}>
            Details <ArrowRight size={12} />
          </Link>
        </div>
        <div className="sv-ongoing-footer">
          <span className="sv-round-label">
            {t.current_round ? `Round ${t.current_round}` : 'In Progress'}
            {' · '}
            {t.current_participants || 0} teams
          </span>
          <button
            className="sv-pts-btn"
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

const PAGE_SIZE = 9;

const GAME_FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'BGMI', value: 'BGMI' },
  { label: 'Free Fire', value: 'Freefire' },
  { label: 'COD Mobile', value: 'COD' },
  { label: 'Valorant', value: 'Valorant' },
  { label: 'Scarfall', value: 'Scarfall' },
];

const PlayerScrimsView = () => {
  const { showToast } = useToast();

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
  const [registrations, setRegistrations] = useState([]);
  const [allScrims, setAllScrims] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [gameFilter, setGameFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [ongoingScrims, setOngoingScrims] = useState([]);

  // Points table modal
  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [ptModalScrim, setPtModalScrim] = useState(null);
  const [ptModalRound, setPtModalRound] = useState(1);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regRes, scrimRes] = await Promise.all([
          tournamentAPI.getMyRegistrations().catch(() => ({ data: [] })),
          tournamentAPI
            .getTournaments({ event_mode: 'SCRIM', page_size: 50 })
            .catch(() => ({ data: [] })),
        ]);

        // registrations — filter to scrims only (my-registrations returns all event types)
        const rawRegs = regRes.data?.results || regRes.data || [];
        const filteredRegs = rawRegs.filter(
          (r) =>
            (r.status === 'confirmed' || r.status === 'pending') &&
            r.tournament?.event_mode === 'SCRIM'
        );
        setRegistrations(filteredRegs);

        // all scrims
        const rawScrims = scrimRes.data?.results || scrimRes.data || [];
        setAllScrims(rawScrims);

        // ongoing
        setOngoingScrims(rawScrims.filter((s) => s.status === 'ongoing'));
      } catch (err) {
        console.error('PlayerScrimsView: fetch error', err);
        showToast('Failed to load scrims', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derived: filtered scrims
  const filteredScrims =
    gameFilter === 'All' ? allScrims : allScrims.filter((s) => s.game_name === gameFilter);

  const visibleScrims = filteredScrims.slice(0, visibleCount);
  const hasMore = visibleCount < filteredScrims.length;

  const handleGameFilter = (value) => {
    setGameFilter(value);
    setVisibleCount(PAGE_SIZE);
    setDropdownOpen(false);
  };

  const openPointsTable = (scrim) => {
    setPtModalScrim(scrim);
    setPtModalRound(scrim.current_round || 1);
    setPtModalOpen(true);
  };

  if (loading) {
    return (
      <div className="sv-loading">
        <div className="sv-spinner" />
      </div>
    );
  }

  const selectedGameLabel = GAME_FILTER_OPTIONS.find((o) => o.value === gameFilter)?.label || 'All';

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="sv-tabs">
        <button
          className={`sv-tab${activeTab === 'registered' ? ' active' : ''}`}
          onClick={() => setActiveTab('registered')}
        >
          <Swords size={13} />
          My Registrations ({registrations.length})
        </button>

        <button
          className={`sv-tab${activeTab === 'all' ? ' active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Scrims
        </button>

        <button
          className={`sv-tab${activeTab === 'ongoing' ? ' active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          <Clock size={13} />
          Ongoing ({ongoingScrims.length})
        </button>
      </div>

      {/* Tab 1 — My Registrations */}
      {activeTab === 'registered' && (
        <div>
          <h2 className="sv-section-title" style={{ marginBottom: '16px' }}>
            Your Registered Scrims
          </h2>

          {registrations.length === 0 ? (
            <div className="sv-empty">
              <Swords size={40} className="sv-empty-icon" />
              <p>You haven&apos;t registered for any scrims yet.</p>
              <button className="sv-empty-btn" onClick={() => setActiveTab('all')}>
                Browse Scrims
              </button>
            </div>
          ) : (
            <div className="sv-grid">
              {registrations.map((reg) => (
                <RegisteredScrimCard key={reg.id} registration={reg} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2 — All Scrims */}
      {activeTab === 'all' && (
        <div>
          <div className="sv-section-header">
            <h2 className="sv-section-title">Scrims</h2>

            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button className="sv-filter-btn" onClick={() => setDropdownOpen((v) => !v)}>
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
                <div className="sv-dropdown-menu">
                  {GAME_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`sv-dropdown-item${gameFilter === opt.value ? ' selected' : ''}`}
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

          {filteredScrims.length === 0 ? (
            <div className="sv-empty">
              <p>No scrims for {selectedGameLabel}</p>
            </div>
          ) : (
            <>
              <div className="sv-grid">
                {visibleScrims.map((scrim) => (
                  <BrowseScrimCard key={scrim.id} scrim={scrim} />
                ))}
              </div>

              {hasMore && (
                <div className="sv-load-more-wrap">
                  <button
                    className="sv-load-more-btn"
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

      {/* Tab 3 — Ongoing */}
      {activeTab === 'ongoing' && (
        <div>
          <h2 className="sv-section-title" style={{ marginBottom: '16px' }}>
            Ongoing Scrims
          </h2>

          {ongoingScrims.length === 0 ? (
            <div className="sv-empty">
              <Clock size={40} className="sv-empty-icon" />
              <p>No ongoing scrims right now.</p>
            </div>
          ) : (
            <div className="sv-grid">
              {ongoingScrims.map((scrim) => (
                <OngoingScrimCard key={scrim.id} scrim={scrim} onPointsTable={openPointsTable} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Points Table Modal */}
      {ptModalOpen && ptModalScrim && (
        <ScrimPointsTableModal
          isOpen={ptModalOpen}
          onClose={() => setPtModalOpen(false)}
          tournament={ptModalScrim}
          currentRound={ptModalRound}
        />
      )}
    </div>
  );
};

export default PlayerScrimsView;
