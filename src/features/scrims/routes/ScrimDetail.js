import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';

import { tournamentAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import RegistrationModal from '../../tournaments/ui/RegistrationModal';
import '../../tournaments/routes/TournamentDetail.css';

/* ─── SVG Icons ─────────────────────────────────────────── */
const IconVideo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 18, height: 18, position: 'relative' }}
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IconExternalLink = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14, position: 'relative' }}
  >
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const IconArrowLeft = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 18, height: 18 }}
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const IconArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 16, height: 16 }}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IconTrophy = ({ style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style || { width: 16, height: 16 }}
  >
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>
);
const IconGamepad = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 15, height: 15 }}
  >
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="2" />
  </svg>
);
const IconShare = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 15, height: 15 }}
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const IconTarget = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IconClock = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconShield = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconUsers = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
  >
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 11, height: 11 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconBadgeCheck = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 15, height: 15 }}>
    <path
      d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 12.14 2 8.27l6.91-1.01z"
      fill="#60a5fa"
    />
    <path
      d="M9 12l2 2 4-4"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─── Status helpers ─────────────────────────────────────── */
const getStatusLabel = (status) => {
  if (status === 'ongoing') return 'LIVE';
  if (status === 'completed') return 'COMPLETED';
  return 'REGISTRATION OPEN';
};
const getStatusClass = (status) => {
  if (status === 'ongoing') return 'td-badge td-badge-live';
  if (status === 'completed') return 'td-badge td-badge-completed';
  return 'td-badge td-badge-open';
};

/* ════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════ */
const ScrimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrim, setScrim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { isPlayer, isHost, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await tournamentAPI.getTournament(id);
        const data = res.data;
        // Redirect if this is actually a tournament
        if ((data.event_mode || '').toUpperCase() === 'TOURNAMENT') {
          navigate(`/tournaments/${id}`, { replace: true });
          return;
        }
        setScrim(data);
      } catch (err) {
        console.error('Error fetching scrim:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  /* ─── Registration button ─────────────────────────────── */
  const renderRegistrationButton = () => {
    if (isHost()) return null;

    if (isPlayer()) {
      const regStatus = scrim.user_registration_status;
      if (regStatus === 'confirmed') {
        return <div className="td-reg-status td-reg-status-confirmed">✅ You are Registered</div>;
      }
      if (regStatus === 'pending') {
        return <div className="td-reg-status td-reg-status-pending">⏳ Registration Pending</div>;
      }
      if (scrim.status === 'upcoming') {
        const now = new Date();
        const regEnd = scrim.registration_end ? new Date(scrim.registration_end) : null;
        const isFull = scrim.current_participants >= scrim.max_participants;
        const isOpen = !regEnd || now <= regEnd;
        if (isOpen && !isFull) {
          return (
            <button className="td-join-btn" onClick={() => setShowRegisterModal(true)}>
              Join Arena <IconArrowRight />
            </button>
          );
        }
      }
      return <div className="td-reg-status td-reg-status-closed">Registration Closed</div>;
    }

    return (
      <button
        className="td-join-btn"
        onClick={() => navigate('/player/login', { state: { next: location.pathname } })}
      >
        Login to Register <IconArrowRight />
      </button>
    );
  };

  /* ─── Prize distribution ─────────────────────────────── */
  const prizePool = parseFloat((scrim?.prize_pool || '0').toString().replace(/,/g, '')) || 0;
  const formatPrize = (amount) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return dateStr;
    }
  };

  /* ─── Loading / not found ────────────────────────────── */
  if (loading) {
    return (
      <div className="td-loading">
        <div className="td-spinner" />
        <p style={{ color: 'hsl(220 5% 55%)', fontSize: 14 }}>Loading scrim…</p>
      </div>
    );
  }

  if (!scrim) {
    return (
      <div className="td-loading">
        <p style={{ color: 'hsl(220 5% 55%)', fontSize: 16 }}>Scrim not found.</p>
      </div>
    );
  }

  /* ─── Derived values ─────────────────────────────────── */
  const mediaBase =
    process.env.REACT_APP_MEDIA_URL?.replace(/\/media\/?$/, '').replace(/\/$/, '') || '';
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return mediaBase ? `${mediaBase}${url.startsWith('/') ? '' : '/'}${url}` : url;
  };
  const heroImage =
    resolveUrl(scrim.hero_image) ||
    resolveUrl(scrim.banner_image) ||
    resolveUrl(scrim.image) ||
    null;
  const entryFeeNum = parseFloat(scrim.entry_fee) === 0 ? 'FREE' : `₹${scrim.entry_fee}`;

  /* ─── Prize data ─────────────────────────────────────── */
  let prizeData = [];
  if (
    scrim.prize_distribution &&
    typeof scrim.prize_distribution === 'object' &&
    Object.keys(scrim.prize_distribution).length > 0
  ) {
    prizeData = Object.entries(scrim.prize_distribution).map(([place, amount]) => ({
      place,
      amount: parseInt(amount) || 0,
    }));
  } else if (prizePool > 0) {
    prizeData = [
      { place: '1st', amount: prizePool * 0.5 },
      { place: '2nd', amount: prizePool * 0.3 },
      { place: '3rd', amount: prizePool * 0.2 },
    ];
  }
  const placeColors = {
    '1st': { row: 'td-prize-row-1', label: 'td-prize-label-1', amount: 'td-prize-amount-1' },
    '2nd': { row: 'td-prize-row-2', label: 'td-prize-label-2', amount: 'td-prize-amount-2' },
    '3rd': { row: 'td-prize-row-3', label: 'td-prize-label-3', amount: 'td-prize-amount-3' },
  };
  const defaultColors = {
    row: 'td-prize-row-2',
    label: 'td-prize-label-2',
    amount: 'td-prize-amount-2',
  };

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Standard Navbar ── */}
      <Navbar />

      {/* ══════════════ HERO ══════════════ */}
      <section className="td-hero-section" style={{ paddingTop: '64px' }}>
        <div
          className="td-hero-image-wrapper"
          style={{
            backgroundImage: heroImage
              ? undefined
              : 'linear-gradient(180deg, rgba(8,8,10,1) 0%, rgba(18,16,22,1) 100%)',
          }}
        >
          {heroImage && <img src={heroImage} alt={scrim.title} className="td-hero-image" />}
          <div className="td-hero-gradient-bottom" />
          <div className="td-hero-gradient-sides" />
          <button
            className="td-back-btn"
            onClick={() => {
              if (!isAuthenticated() || !isPlayer()) {
                navigate('/player-auth', { state: { next: location.pathname } });
              } else {
                navigate(-1);
              }
            }}
            title="Go back"
          >
            <IconArrowLeft />
          </button>
        </div>

        <div className="td-hero-content">
          <div className="td-hero-inner">
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}
            >
              <span className={getStatusClass(scrim.status)}>{getStatusLabel(scrim.status)}</span>
              <h1 className="td-title">{scrim.title}</h1>
              <div className="td-info-row">
                <span className="td-info-pill">
                  <IconGamepad />
                  <strong>{scrim.game_name}</strong>
                  <span style={{ color: 'hsl(220 5% 55%)', margin: '0 2px' }}>•</span>
                  <span style={{ color: 'hsl(220 5% 70%)' }}>{scrim.game_mode}</span>
                </span>
                {prizePool > 0 && (
                  <span className="td-prize-pill">
                    <IconTrophy style={{ width: 16, height: 16 }} />
                    Prize Pool: ₹{scrim.prize_pool}
                  </span>
                )}
              </div>
              {/* Actions: Register + Share + region tag — moved to left column */}
              <div className="td-actions-inner">
                {renderRegistrationButton()}
                <div className="td-action-tags">
                  <button className="td-share-btn" onClick={() => setShowShareModal(true)}>
                    <IconShare /> Share
                  </button>
                  <span className="td-tag-pill">
                    <IconTarget /> {scrim.region || 'India'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="td-stat-boxes">
                <div className="td-stat-box">
                  <div className="td-stat-label">Entry Fee</div>
                  <div className="td-stat-value">{entryFeeNum}</div>
                </div>
                <div className="td-stat-box">
                  <div className="td-stat-label">Capacity</div>
                  <div className="td-stat-value">
                    <span className="td-stat-value-accent">{scrim.current_participants}</span>
                    <span className="td-stat-value-muted">/{scrim.max_participants}</span>
                  </div>
                </div>
              </div>
              {scrim.live_link && (
                <a
                  href={scrim.live_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="td-watch-live-btn"
                >
                  <div className="td-watch-live-pulse" />
                  <IconVideo />
                  <span className="td-watch-live-label">Watch Live</span>
                  <IconExternalLink />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CONTENT SECTION ══════════════ */}
      <div style={{ background: 'hsl(220 10% 6%)', paddingTop: 28, paddingBottom: 48 }}>
        {/* ══════════════ TABS ══════════════ */}
        <div className="td-tabs-section">
          <div className="td-tab-list" role="tablist">
            <button
              role="tab"
              className={`td-tab-btn${activeTab === 'schedule' ? ' active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <IconClock /> Schedule &amp; Prizes
            </button>
            <button
              role="tab"
              className={`td-tab-btn${activeTab === 'briefing' ? ' active' : ''}`}
              onClick={() => setActiveTab('briefing')}
            >
              <IconShield /> Briefing &amp; Rules
            </button>
            <button
              role="tab"
              className={`td-tab-btn${activeTab === 'host' ? ' active' : ''}`}
              onClick={() => setActiveTab('host')}
            >
              <IconUsers /> Host Details
            </button>
          </div>

          {/* ── Tab: Schedule & Prizes ── */}
          {activeTab === 'schedule' && (
            <div className="td-tab-panel" role="tabpanel">
              <div className="td-two-col">
                {/* Left: timeline */}
                <div>
                  <p className="td-section-heading">Timeline</p>
                  <ul className="td-timeline">
                    <li className="td-timeline-item">
                      <div className="td-timeline-dot td-timeline-dot-green" />
                      <div>
                        <div className="td-timeline-label td-timeline-label-green">
                          Registration Starts
                        </div>
                        <div className="td-timeline-value">{fmtDate(scrim.registration_start)}</div>
                      </div>
                    </li>
                    <li className="td-timeline-item">
                      <div className="td-timeline-dot td-timeline-dot-blue" />
                      <div>
                        <div className="td-timeline-label td-timeline-label-blue">
                          Registration Closes
                        </div>
                        <div className="td-timeline-value">
                          {fmtDate(scrim.registration_end || scrim.tournament_start)}
                        </div>
                      </div>
                    </li>
                    <li className="td-timeline-item">
                      <div className="td-timeline-dot td-timeline-dot-red" />
                      <div>
                        <div className="td-timeline-label td-timeline-label-red">Match Starts</div>
                        <div className="td-timeline-value">{fmtDate(scrim.tournament_start)}</div>
                      </div>
                    </li>
                  </ul>

                  {/* Match Structure */}
                  {scrim.max_matches && (
                    <>
                      <hr className="td-divider" />
                      <p className="td-section-heading">Match Structure</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Array.from({ length: Number(scrim.max_matches) }, (_, i) => {
                          const matchName =
                            scrim.matches && scrim.matches[i]
                              ? scrim.matches[i].name
                              : `Match ${i + 1}`;
                          return (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 14px',
                                background: 'hsl(220 5% 12%)',
                                borderRadius: 8,
                                border: '1px solid hsl(220 5% 20%)',
                              }}
                            >
                              <span style={{ fontSize: 13, color: 'hsl(220 5% 75%)' }}>
                                {matchName}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 10px',
                                  borderRadius: 20,
                                  background: 'hsl(210 80% 55% / 0.15)',
                                  color: 'hsl(210 80% 75%)',
                                  border: '1px solid hsl(210 80% 55% / 0.3)',
                                }}
                              >
                                SCHEDULED
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Right: prize distribution */}
                <div>
                  <p className="td-section-heading">Prize Distribution</p>
                  {prizeData.length > 0 ? (
                    <>
                      {prizeData.map((prize) => {
                        const colors = placeColors[prize.place] || defaultColors;
                        return (
                          <div key={prize.place} className={`td-prize-row ${colors.row}`}>
                            <div className={`td-prize-label ${colors.label}`}>
                              <IconTrophy style={{ width: 18, height: 18 }} />
                              {prize.place} Place
                            </div>
                            <span className={`td-prize-amount ${colors.amount}`}>
                              {formatPrize(prize.amount)}
                            </span>
                          </div>
                        );
                      })}
                      <p className="td-prize-total">
                        Total Prize Pool:{' '}
                        <strong style={{ color: '#f9c22a' }}>₹{scrim.prize_pool}</strong>
                      </p>
                    </>
                  ) : (
                    <p style={{ color: 'hsl(220 5% 55%)', fontSize: 13 }}>
                      No prize pool for this scrim.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Briefing & Directives ── */}
          {activeTab === 'briefing' && (
            <div className="td-tab-panel" role="tabpanel">
              <div className="td-three-col">
                <div>
                  <p className="td-section-heading">Briefing</p>
                  <p className="td-description">
                    {scrim.description || 'No description provided.'}
                  </p>

                  {scrim.rules && (
                    <>
                      <hr className="td-divider" />
                      <p className="td-section-heading">Detailed Rules</p>
                      {typeof scrim.rules === 'string' ? (
                        <div className="td-rules-grid">
                          {scrim.rules
                            .split('\n')
                            .filter((r) => r.trim())
                            .map((rule, i) => (
                              <div key={i} className="td-rule-item">
                                <div className="td-rule-dot" />
                                <span className="td-rule-text">{rule.trim()}</span>
                              </div>
                            ))}
                        </div>
                      ) : Array.isArray(scrim.rules) ? (
                        <div className="td-rules-grid">
                          {scrim.rules.map((rule, i) => (
                            <div key={i} className="td-rule-item">
                              <div className="td-rule-dot" />
                              <span className="td-rule-text">{rule}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="td-description">{scrim.rules}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Right: Placement Points */}
                <div>
                  {scrim.placement_points &&
                  typeof scrim.placement_points === 'object' &&
                  Object.keys(scrim.placement_points).length > 0 ? (
                    <>
                      <p
                        className="td-section-heading"
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <span style={{ color: 'hsl(270 60% 65%)', fontSize: 16 }}>⊙</span>
                        Placement Points
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(scrim.placement_points)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([rank, pts]) => {
                            const isTop3 = Number(rank) <= 3;
                            const isKill = isNaN(Number(rank));
                            return (
                              <div
                                key={rank}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 14px',
                                  background: 'hsl(220 5% 12%)',
                                  borderRadius: 8,
                                  border: '1px solid hsl(220 5% 20%)',
                                }}
                              >
                                <span style={{ fontSize: 13, color: 'hsl(220 5% 75%)' }}>
                                  {isKill
                                    ? rank
                                    : `${rank}${rank === '1' ? 'st' : rank === '2' ? 'nd' : rank === '3' ? 'rd' : 'th'} Place`}
                                </span>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    padding: '2px 10px',
                                    borderRadius: 20,
                                    background:
                                      isTop3 || isKill ? 'hsl(270 60% 55% / 0.2)' : 'transparent',
                                    color:
                                      isTop3 || isKill ? 'hsl(270 60% 75%)' : 'hsl(220 5% 65%)',
                                    border:
                                      isTop3 || isKill
                                        ? '1px solid hsl(270 60% 55% / 0.4)'
                                        : 'none',
                                  }}
                                >
                                  {isKill ? `+${pts} pt` : `${pts} pts`}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Host Details ── */}
          {activeTab === 'host' && (
            <div className="td-tab-panel" role="tabpanel">
              <Link
                to={`/host/profile/${scrim.host?.id}`}
                className="td-host-card"
                style={{ display: 'flex' }}
              >
                <div className="td-host-avatar">
                  {(scrim.host?.organization_name || scrim.host?.user?.username || 'H')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="td-host-name">
                      {scrim.host?.organization_name || scrim.host?.user?.username || 'Scrim Host'}
                    </span>
                    {scrim.host?.verified && <IconBadgeCheck />}
                  </div>
                  <div className="td-host-verified">Verified by Scrimverse</div>
                  <div className="td-host-stats">
                    <span className="td-host-stat-tag purple">
                      <IconTrophy style={{ width: 11, height: 11 }} />
                      {scrim.host?.total_tournaments_hosted || '—'} hosted
                    </span>
                    <span className="td-host-stat-tag green">
                      <IconStar />
                      {scrim.host?.average_rating || scrim.host?.rating || '—'} rating
                    </span>
                  </div>
                </div>
                <div className="td-host-arrow">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ width: 18, height: 18, color: 'hsl(220 5% 50%)' }}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>

              <div className="td-host-stats-grid">
                <div className="td-host-stats-box">
                  <div className="td-host-stats-number blue">
                    {scrim.host?.total_tournaments_hosted || '—'}
                  </div>
                  <div className="td-host-stats-label">Hosted</div>
                </div>
                <div className="td-host-stats-box">
                  <div className="td-host-stats-number yellow">
                    {scrim.host?.average_rating || '—'}
                  </div>
                  <div className="td-host-stats-label">Rating</div>
                </div>
              </div>

              <div className="td-trusted-banner">
                <div className="td-trusted-banner-title">
                  <IconShield />
                  Verified by Scrimverse • Trusted Host
                </div>
                <p className="td-trusted-banner-desc">
                  This organizer has been verified and has successfully hosted multiple events.
                </p>
              </div>

              {scrim.host?.bio && (
                <>
                  <hr className="td-divider" />
                  <p className="td-section-heading">About</p>
                  <p className="td-description">{scrim.host.bio}</p>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {scrim.tournament_file && (
                  <a
                    href={scrim.tournament_file}
                    download
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'hsl(220 10% 14%)',
                      border: '1px solid hsl(200 85% 60% / 0.3)',
                      color: 'hsl(200 85% 60%)',
                      fontWeight: 600,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    📄 Download Rules PDF
                  </a>
                )}
                {scrim.discord_id && (
                  <a
                    href={`https://${scrim.discord_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'hsl(220 10% 14%)',
                      border: '1px solid hsl(270 60% 55% / 0.3)',
                      color: 'hsl(270 60% 65%)',
                      fontWeight: 600,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    💬 Join Discord Server
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* end content section */}

      {/* ══════════════ REGISTRATION MODAL ══════════════ */}
      {showRegisterModal && scrim && (
        <RegistrationModal
          event={scrim}
          type="scrim"
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false);
            tournamentAPI
              .getTournament(id)
              .then((res) => setScrim(res.data))
              .catch(() => {});
          }}
        />
      )}

      {/* ══════════════ SHARE MODAL ══════════════ */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div className="td-share-card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="td-share-title">Share Scrim</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="td-share-sub">
              Invite friends to <span className="text-white font-semibold">{scrim.title}</span>
            </p>

            <div className="td-share-input">
              <input type="text" readOnly value={window.location.href} />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="text-gray-400 hover:text-accent-blue transition-colors p-1.5 shrink-0"
                title="Copy URL"
              >
                {copiedLink ? (
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🎮 Join *${scrim.title}* on ScrimVerse!\n\n${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-bg-hover hover:bg-green-500/10 border border-dark-bg-hover hover:border-green-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-300 font-medium">WhatsApp</span>
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-bg-hover hover:bg-accent-purple/10 border border-dark-bg-hover hover:border-accent-purple/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center">
                  {copiedLink ? (
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-accent-purple"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-gray-300 font-medium">
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrimDetail;
