import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tournamentAPI, authAPI, paymentsAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import RegistrationModal from '../components/RegistrationModal';
import './TournamentDetail.css';

// Game poster images
// Note: banner/hero images should come from backend (tournament object).
// Fallbacks are handled in getHeroImage below.

/* ─── Map pool data ──────────────────────────────────────── */
const gameMaps = {
  BGMI: ['Erangel', 'Miramar', 'Sanhok', 'Rondo', 'Vikendi', 'Karakin', 'Livik', 'Nusa'],
  'Free Fire': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine'],
  Scarfall: ['Norvania', 'Gorge', 'Tropicana', 'Bayfront'],
  Valorant: ['Bind', 'Haven', 'Split', 'Ascent', 'Icebox', 'Breeze', 'Fracture', 'Pearl'],
  'COD Mobile': ['Crossfire', 'Crash', 'Firing Range', 'Nuketown', 'Standoff', 'Summit'],
};

const getGameMaps = (gameName = '') => {
  const exact = gameMaps[gameName];
  if (exact) return exact;
  const lc = gameName.toLowerCase();
  if (lc.includes('bgmi') || lc.includes('pubg')) return gameMaps['BGMI'];
  if (lc.includes('free fire') || lc.includes('freefire')) return gameMaps['Free Fire'];
  if (lc.includes('scar')) return gameMaps['Scarfall'];
  if (lc.includes('valorant')) return gameMaps['Valorant'];
  if (lc.includes('cod')) return gameMaps['COD Mobile'];
  return gameMaps['BGMI'];
};

/* ─── Is 5v5 game ────────────────────────────────────────── */
const is5v5Game = (gameName = '', gameMode = '') => {
  const gn = gameName.toLowerCase();
  const gm = (gameMode || '').toLowerCase();
  return gm === '5v5' || gm.includes('5v5') || gn.includes('valorant') || gn.includes('cod');
};

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

/* ─── SVG Icons (inline, no external lib needed) ─────────── */
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
const IconVideo = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 18, height: 18 }}
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
    style={{ width: 14, height: 14 }}
  >
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
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
const IconMapPin = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 14, height: 14 }}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
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

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ─── State ─────────────────────────────────────────────── */
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [matchSchedule, setMatchSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTeamRegistration, setShowTeamRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    team_name: '',
    teammate_emails: [],
    in_game_details: { ign: '', uid: '', rank: '' },
  });
  const [usernameSuggestions, setUsernameSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const suggestionTimeoutRef = useRef({});

  const { isAuthenticated, isPlayer, isHost, user } = useContext(AuthContext);

  /* ─── Fetch tournament ───────────────────────────────────── */
  useEffect(() => {
    const loadTournament = async () => {
      await fetchTournament();
    };
    loadTournament();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tournament && isHost()) {
      const hostProfileId = user?.profile?.id || user?.host_profile?.id;
      const tournamentHostId = tournament.host?.id;
      if (hostProfileId && tournamentHostId && Number(hostProfileId) === Number(tournamentHostId)) {
        navigate(`/tournaments/${id}/manage`);
      }
    }
  }, [tournament, isHost, user, id, navigate]);

  const fetchTournament = async () => {
    try {
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Fetch match schedule ───────────────────────────────── */
  const fetchMatchSchedule = async (tournamentData) => {
    if (!tournamentData?.rounds?.length) return;
    if (!isAuthenticated()) return;
    setScheduleLoading(true);
    try {
      const allMatches = [];
      for (const roundConfig of tournamentData.rounds) {
        try {
          const response = await tournamentAPI.getRoundGroups(tournamentData.id, roundConfig.round);
          const groups = response.data.groups || [];
          groups.forEach((group) => {
            (group.matches || []).forEach((match) => {
              allMatches.push({
                ...match,
                group_name: group.group_name,
                round_number: roundConfig.round,
              });
            });
          });
        } catch (err) {
          console.debug(`No groups for round ${roundConfig.round}:`, err.message);
        }
      }
      setMatchSchedule(allMatches);
    } catch (error) {
      console.error('Error fetching match schedule:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (tournament?.rounds?.length) fetchMatchSchedule(tournament);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.id]);

  /* ─── Registration helpers ───────────────────────────────── */
  const getRequiredPlayers = (gameMode) => {
    const modeMap = { Squad: 4, Duo: 2, Solo: 1, '5v5': 5, '4v4': 4, '2v2': 2 };
    return modeMap[gameMode] || 1;
  };

  useEffect(() => {
    if (showRegisterModal && tournament) {
      const requiredPlayers = getRequiredPlayers(tournament.game_mode);
      const teammateCount = Math.max(0, requiredPlayers - 1);
      setRegistrationData({
        team_name: '',
        teammate_emails: Array(teammateCount).fill(''),
        in_game_details: { ign: '', uid: '', rank: '' },
      });
      setUsernameSuggestions({});
      setShowSuggestions({});
    }
    return () => {
      Object.values(suggestionTimeoutRef.current).forEach((t) => t && clearTimeout(t));
      suggestionTimeoutRef.current = {};
    };
  }, [showRegisterModal, tournament, user]);

  const searchUsernames = async (query, fieldIndex) => {
    if (!query || query.length < 2) {
      setUsernameSuggestions((prev) => ({ ...prev, [fieldIndex]: [] }));
      setShowSuggestions((prev) => ({ ...prev, [fieldIndex]: false }));
      return;
    }
    if (suggestionTimeoutRef.current[fieldIndex])
      clearTimeout(suggestionTimeoutRef.current[fieldIndex]);
    suggestionTimeoutRef.current[fieldIndex] = setTimeout(async () => {
      try {
        const response = await authAPI.searchPlayerUsernames(query);
        const suggestions = response.data.results || [];
        setUsernameSuggestions((prev) => ({ ...prev, [fieldIndex]: suggestions }));
        setShowSuggestions((prev) => ({ ...prev, [fieldIndex]: true }));
      } catch (error) {
        console.error('Error searching usernames:', error);
        setUsernameSuggestions((prev) => ({ ...prev, [fieldIndex]: [] }));
      }
    }, 300);
  };

  const handleTeammateEmailChange = (index, value) => {
    const newEmails = [...registrationData.teammate_emails];
    newEmails[index] = value;
    setRegistrationData({ ...registrationData, teammate_emails: newEmails });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isAuthenticated() || !isPlayer()) {
      navigate('/player/login');
      return;
    }
    if (!registrationData.team_name.trim()) {
      alert('Please enter a team name');
      return;
    }
    const emails = registrationData.teammate_emails || [];
    const requiredPlayers = getRequiredPlayers(tournament.game_mode);
    const expectedTeammates = Math.max(0, requiredPlayers - 1);
    if (emails.length !== expectedTeammates) {
      alert(`This tournament requires ${expectedTeammates} teammate email(s).`);
      return;
    }
    const normalized = emails.map((e) => (e || '').trim().toLowerCase());
    for (let i = 0; i < normalized.length; i++) {
      const eMail = normalized[i];
      if (!eMail) {
        alert('Please enter all teammate email fields');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eMail)) {
        alert(`Invalid email at teammate ${i + 1}: ${eMail}`);
        return;
      }
    }
    const uniqueSet = new Set(normalized);
    if (uniqueSet.size !== normalized.length) {
      alert('Duplicate teammate emails are not allowed');
      return;
    }
    const captainEmail = (user?.user?.email || '').toLowerCase();
    if (captainEmail && normalized.includes(captainEmail)) {
      alert('You cannot include your own (captain) email in the teammate list.');
      return;
    }
    try {
      const payload = {
        team_name: registrationData.team_name,
        teammate_emails: registrationData.teammate_emails,
      };
      const initResp = await tournamentAPI.registerInitiate(id, payload);
      const registration = initResp.data;
      const isFree = parseFloat(tournament.entry_fee) === 0;
      if (isFree) {
        alert('Registration successful! You are now registered for this tournament.');
        setShowRegisterModal(false);
        fetchTournament();
      } else {
        try {
          const regId =
            registration?.registration_id || registration?.registrationId || registration?.id;
          if (!registration || !regId) {
            alert(
              'Registration created but missing registration id. Please refresh and try again.'
            );
            return;
          }
          const paymentPayload = {
            payment_type: 'entry_fee',
            amount: Number(tournament.entry_fee) || 0,
            registration_id: regId,
            tournament_id: id,
          };
          const payResp = await paymentsAPI.startPayment(paymentPayload);
          const paymentData = payResp.data;
          const redirect =
            paymentData.redirect_url || paymentData.payment_url || paymentData.paymentUrl;
          if (redirect) {
            window.location.href = redirect;
            return;
          }
          alert('Registration initiated. Please complete payment from the next screen.');
          setShowRegisterModal(false);
          fetchTournament();
        } catch (payErr) {
          const errBody = payErr.response?.data;
          const friendly =
            errBody?.registration_id?.[0] ||
            errBody?.error ||
            errBody?.details ||
            'Registration created but payment failed to start.';
          alert(friendly);
        }
      }
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Registration failed.');
    }
  };

  /* ─── QR download ────────────────────────────────────────── */
  const downloadQr = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=000000&format=png`;
      const resp = await fetch(qrUrl);
      if (!resp.ok) throw new Error('Failed to fetch QR image');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournament-${id}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.open(
        `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=000000&format=png`,
        '_blank'
      );
    }
  };

  /* ─── Registration button logic ─────────────────────────── */
  const renderRegistrationButton = () => {
    if (isHost()) return null;

    if (isPlayer()) {
      const regStatus = tournament.user_registration_status;
      if (regStatus) {
        const map = {
          pending: {
            text: '⏳ Registration Pending — Complete Payment',
            cls: 'td-reg-status td-reg-status-pending',
          },
          confirmed: {
            text: '✅ You are Registered',
            cls: 'td-reg-status td-reg-status-confirmed',
          },
          cancelled: {
            text: '❌ Registration Cancelled',
            cls: 'td-reg-status td-reg-status-cancelled',
          },
        };
        const info = map[regStatus] || {
          text: `Registered (${regStatus})`,
          cls: 'td-reg-status td-reg-status-closed',
        };
        return <div className={info.cls}>{info.text}</div>;
      }

      if (!tournament.registration_start || !tournament.registration_end) {
        return <div className="td-reg-status td-reg-status-closed">Registration dates not set</div>;
      }

      const now = new Date();
      const regStart = new Date(tournament.registration_start);
      const regEnd = new Date(tournament.registration_end);

      if (isNaN(regStart.getTime()) || isNaN(regEnd.getTime())) {
        return <div className="td-reg-status td-reg-status-closed">Invalid registration dates</div>;
      }

      const buffer = 5 * 60 * 1000;
      const isRegistrationOpen =
        now >= regStart.getTime() - buffer && now <= regEnd.getTime() + buffer;
      const isFull = tournament.current_participants >= tournament.max_participants;
      const canRegister = isRegistrationOpen && !isFull && tournament.status === 'upcoming';

      if (canRegister) {
        return (
          <button className="td-join-btn" onClick={() => setShowRegisterModal(true)}>
            Join Tournament <IconArrowRight />
          </button>
        );
      }

      let message = 'Registration Closed';
      if (!isRegistrationOpen) {
        if (now < regStart) {
          message = `Registration opens ${regStart.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`;
        } else {
          message = `Registration closed on ${regEnd.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`;
        }
      } else if (isFull) {
        message = `Tournament is Full (${tournament.current_participants}/${tournament.max_participants})`;
      } else if (tournament.status !== 'upcoming') {
        message =
          tournament.status === 'ongoing' ? 'Tournament Live' : `Tournament ${tournament.status}`;
      }
      return <div className="td-reg-status td-reg-status-closed">{message}</div>;
    }

    return (
      <button className="td-join-btn" onClick={() => navigate('/player/login')}>
        Login to Register <IconArrowRight />
      </button>
    );
  };

  /* ─── Prize distribution ─────────────────────────────────── */
  const prizePool = parseFloat((tournament?.prize_pool || '0').toString().replace(/,/g, '')) || 0;
  const formatPrize = (amount) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

  /* ─── Loading / not found states ─────────────────────────── */
  if (loading) {
    return (
      <div className="td-loading">
        <div className="td-spinner" />
        <p style={{ color: 'hsl(220 5% 55%)', fontSize: 14 }}>Loading tournament…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="td-loading">
        <p style={{ color: 'hsl(220 5% 55%)', fontSize: 16 }}>Tournament not found.</p>
      </div>
    );
  }

  /* ─── Derived values ─────────────────────────────────────── */
  // Build hero image URL from backend-provided fields (production-ready).
  const mediaBase = process.env.REACT_APP_MEDIA_URL
    ? process.env.REACT_APP_MEDIA_URL.replace(/\/$/, '')
    : '';
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Support paths that may start with /media or similar
    if (mediaBase) return `${mediaBase}${url.startsWith('/') ? '' : '/'}${url}`;
    return url;
  };
  const heroImage =
    resolveUrl(tournament?.hero_image) ||
    resolveUrl(tournament?.banner_image) ||
    resolveUrl(tournament?.image) ||
    resolveUrl(tournament?.poster) ||
    null;
  const maps = getGameMaps(tournament.game_name);
  const is5v5 = is5v5Game(tournament.game_name, tournament.game_mode);
  const entryFeeNum = parseFloat(tournament.entry_fee) === 0 ? 'FREE' : `₹${tournament.entry_fee}`;

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return dateStr;
    }
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="td-hero-section">
        <div
          className="td-hero-image-wrapper"
          style={{
            backgroundImage: heroImage
              ? undefined
              : 'linear-gradient(180deg, rgba(8,8,10,1) 0%, rgba(18,16,22,1) 100%)',
          }}
        >
          {heroImage ? (
            <img src={heroImage} alt={tournament.title} className="td-hero-image" />
          ) : null}
          <div className="td-hero-gradient-bottom" />
          <div className="td-hero-gradient-sides" />

          {/* Back button */}
          <button className="td-back-btn" onClick={() => navigate(-1)} title="Go back">
            <IconArrowLeft />
          </button>
        </div>

        {/* Hero content overlay */}
        <div className="td-hero-content">
          <div className="td-hero-inner">
            {/* Left: title + meta */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}
            >
              {/* Status badge */}
              <span className={getStatusClass(tournament.status)}>
                {getStatusLabel(tournament.status)}
              </span>

              {/* Title */}
              <h1 className="td-title">{tournament.title}</h1>

              {/* Info row */}
              <div className="td-info-row">
                <span className="td-info-pill">
                  <IconGamepad className="td-info-pill-icon" />
                  <strong>{tournament.game_name}</strong>
                  <span style={{ color: 'hsl(220 5% 55%)', margin: '0 2px' }}>•</span>
                  <span style={{ color: 'hsl(220 5% 70%)' }}>{tournament.game_mode}</span>
                </span>
                <span className="td-prize-pill">
                  <IconTrophy style={{ width: 16, height: 16 }} />
                  Prize Pool: ₹{tournament.prize_pool}
                </span>
              </div>
            </div>

            {/* Right: stat boxes + watch live */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="td-stat-boxes">
                <div className="td-stat-box">
                  <div className="td-stat-label">Entry Fee</div>
                  <div className="td-stat-value">{entryFeeNum}</div>
                </div>
                <div className="td-stat-box">
                  <div className="td-stat-label">Capacity</div>
                  <div className="td-stat-value">
                    <span className="td-stat-value-accent">{tournament.current_participants}</span>
                    <span className="td-stat-value-muted">/{tournament.max_participants}</span>
                  </div>
                </div>
              </div>

              {/* Watch Live */}
              <a
                href="https://www.youtube.com/@ArgoOGGAMING"
                target="_blank"
                rel="noopener noreferrer"
                className="td-watch-live-btn"
              >
                <div className="td-watch-live-pulse" />
                <IconVideo className="td-watch-live-icon" />
                <span className="td-watch-live-label">Watch Live</span>
                <IconExternalLink />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          QUICK ACTIONS BAR
      ══════════════════════════════════════ */}
      <div className="td-actions-bar">
        <div className="td-actions-inner">
          {/* Registration / Join button */}
          {renderRegistrationButton()}

          {/* Tag pills */}
          <div className="td-action-tags">
            {/* Share */}
            <button className="td-share-btn" onClick={() => setShowShareModal(true)}>
              <IconShare /> Share
            </button>

            {/* Map */}
            {tournament.map_name && (
              <span className="td-tag-pill">
                <IconMapPin /> {tournament.map_name}
              </span>
            )}

            {/* Region */}
            <span className="td-tag-pill">
              <IconTarget /> {tournament.region || 'India'}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB SECTION
      ══════════════════════════════════════ */}
      <div className="td-tabs-section">
        {/* Tab navigation */}
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
              {/* Left column: timeline + rounds + map pool */}
              <div>
                {/* Timeline */}
                <p className="td-section-heading">Timeline</p>
                <ul className="td-timeline">
                  <li className="td-timeline-item">
                    <div className="td-timeline-dot td-timeline-dot-green" />
                    <div>
                      <div className="td-timeline-label td-timeline-label-green">
                        Registration Starts
                      </div>
                      <div className="td-timeline-value">
                        {fmtDate(tournament.registration_start)}
                      </div>
                    </div>
                  </li>
                  <li className="td-timeline-item">
                    <div className="td-timeline-dot td-timeline-dot-blue" />
                    <div>
                      <div className="td-timeline-label td-timeline-label-blue">
                        Registration Closes
                      </div>
                      <div className="td-timeline-value">
                        {fmtDate(tournament.registration_end)}
                      </div>
                    </div>
                  </li>
                  <li className="td-timeline-item">
                    <div className="td-timeline-dot td-timeline-dot-red" />
                    <div>
                      <div className="td-timeline-label td-timeline-label-red">Match Starts</div>
                      <div className="td-timeline-value">
                        {fmtDate(tournament.tournament_start)}
                      </div>
                    </div>
                  </li>
                </ul>

                {/* Rounds */}
                {tournament.rounds && tournament.rounds.length > 0 && (
                  <>
                    <hr className="td-divider" />
                    <p className="td-section-heading">Rounds</p>
                    {tournament.rounds.map((round) => {
                      const matchCount = round.max_matches || tournament.max_matches;
                      return (
                        <div key={round.round} className="td-round-item">
                          <span className="td-round-badge">
                            {round.round_name || `Round ${round.round}`}
                          </span>
                          <span className="td-round-meta">
                            {matchCount ? `${matchCount} match${matchCount > 1 ? 'es' : ''}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Map Pool */}
                <hr className="td-divider" />
                <p className="td-section-heading">Map Pool</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {maps.slice(0, 6).map((map) => (
                    <span key={map} className="td-map-badge">
                      <IconMapPin /> {map}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right column: prize distribution */}
              <div>
                <p className="td-section-heading">Prize Distribution</p>

                <div className="td-prize-row td-prize-row-1">
                  <div className="td-prize-label td-prize-label-1">
                    <IconTrophy style={{ width: 18, height: 18 }} />
                    1st Place
                  </div>
                  <span className="td-prize-amount td-prize-amount-1">
                    {formatPrize(prizePool * 0.5)}
                  </span>
                </div>

                <div className="td-prize-row td-prize-row-2">
                  <div className="td-prize-label td-prize-label-2">
                    <IconTrophy style={{ width: 18, height: 18 }} />
                    2nd Place
                  </div>
                  <span className="td-prize-amount td-prize-amount-2">
                    {formatPrize(prizePool * 0.3)}
                  </span>
                </div>

                <div className="td-prize-row td-prize-row-3">
                  <div className="td-prize-label td-prize-label-3">
                    <IconTrophy style={{ width: 18, height: 18 }} />
                    3rd Place
                  </div>
                  <span className="td-prize-amount td-prize-amount-3">
                    {formatPrize(prizePool * 0.2)}
                  </span>
                </div>

                <p className="td-prize-total">
                  Total Prize Pool:{' '}
                  <strong style={{ color: '#f9c22a' }}>₹{tournament.prize_pool}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Briefing & Rules ── */}
        {activeTab === 'briefing' && (
          <div className="td-tab-panel" role="tabpanel">
            <div className="td-three-col">
              {/* Left: description + rules */}
              <div>
                <p className="td-section-heading">About This Tournament</p>
                <p className="td-description">
                  {tournament.description || 'No description provided.'}
                </p>

                {tournament.rules && (
                  <>
                    <hr className="td-divider" />
                    <p className="td-section-heading">Rules &amp; Guidelines</p>
                    {/* If rules is a string with newlines, split into items; otherwise show as text */}
                    {typeof tournament.rules === 'string' ? (
                      <div className="td-rules-grid">
                        {tournament.rules
                          .split('\n')
                          .filter((r) => r.trim())
                          .map((rule, i) => (
                            <div key={i} className="td-rule-item">
                              <div className="td-rule-dot" />
                              <span className="td-rule-text">{rule.trim()}</span>
                            </div>
                          ))}
                      </div>
                    ) : Array.isArray(tournament.rules) ? (
                      <div className="td-rules-grid">
                        {tournament.rules.map((rule, i) => (
                          <div key={i} className="td-rule-item">
                            <div className="td-rule-dot" />
                            <span className="td-rule-text">{rule}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* Right: points system */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <IconTarget />
                  <p
                    className="td-section-heading"
                    style={{ margin: 0, color: 'hsl(270 60% 65%)' }}
                  >
                    {is5v5 ? '5v5 Scoring' : 'Placement Points'}
                  </p>
                </div>

                {is5v5 ? (
                  <div className="td-5v5-info">
                    <div className="td-5v5-row" style={{ background: 'hsl(270 60% 55% / 0.1)' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(270 60% 65%)' }}>
                        Format
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(270 60% 65%)' }}>
                        Team vs Team
                      </span>
                    </div>
                    <div className="td-5v5-row">
                      <span style={{ fontSize: 13, color: 'hsl(220 5% 55%)' }}>Scoring Range</span>
                      <span className="td-points-value td-points-value-1">10 – 50 pts</span>
                    </div>
                    <div className="td-5v5-row">
                      <span style={{ fontSize: 13, color: 'hsl(220 5% 55%)' }}>
                        Winner Selection
                      </span>
                      <span style={{ fontSize: 12, color: 'hsl(220 5% 55%)' }}>
                        By score or direct pick
                      </span>
                    </div>
                    <div className="td-5v5-row">
                      <span style={{ fontSize: 13, color: 'hsl(220 5% 55%)' }}>Advancement</span>
                      <span style={{ fontSize: 12, color: 'hsl(220 5% 55%)' }}>
                        Winner advances
                      </span>
                    </div>
                    <div className="td-points-footer">
                      <p className="td-points-footer-note">
                        Higher score wins • No placement/kill points
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="td-points-table">
                    {[
                      { place: 1, label: '1st Place', points: 10 },
                      { place: 2, label: '2nd Place', points: 6 },
                      { place: 3, label: '3rd Place', points: 5 },
                      { place: 4, label: '4th Place', points: 4 },
                      { place: 5, label: '5th Place', points: 3 },
                      { place: 6, label: '6th Place', points: 2 },
                      { place: 7, label: '7th Place', points: 1 },
                      { place: 8, label: '8th Place', points: 1 },
                    ].map((item) => (
                      <div key={item.place} className="td-points-row">
                        <span className="td-points-place">{item.label}</span>
                        <span
                          className={`td-points-value ${
                            item.place === 1
                              ? 'td-points-value-1'
                              : item.place === 3
                                ? 'td-points-value-3'
                                : 'td-points-value-def'
                          }`}
                        >
                          {item.points} pts
                        </span>
                      </div>
                    ))}
                    <div className="td-points-footer">
                      <div
                        className="td-points-row"
                        style={{
                          border: 'none',
                          borderTop: '1px solid hsl(0 0% 100% / 0.06)',
                          padding: '10px 0 0',
                        }}
                      >
                        <span className="td-points-place">Per Finish / Kill</span>
                        <span className="td-points-value td-points-value-kill">+1 pt</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Host Details ── */}
        {activeTab === 'host' && (
          <div className="td-tab-panel" role="tabpanel">
            {/* Host card */}
            <Link
              to={`/host/profile/${tournament.host?.id}`}
              className="td-host-card"
              style={{ display: 'flex' }}
            >
              <div className="td-host-avatar">
                {(tournament.host?.organization_name || 'H').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="td-host-name">
                    {tournament.host?.organization_name || 'Tournament Host'}
                  </span>
                  <IconBadgeCheck />
                </div>
                <div className="td-host-verified">Verified by Scrimverse</div>
                <div className="td-host-stats">
                  <span className="td-host-stat-tag purple">
                    <IconTrophy style={{ width: 11, height: 11 }} />
                    50+ tournaments
                  </span>
                  <span className="td-host-stat-tag green">
                    <IconStar />
                    4.8 rating
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

            {/* Host stats grid */}
            <div className="td-host-stats-grid">
              <div className="td-host-stats-box">
                <div className="td-host-stats-number blue">50+</div>
                <div className="td-host-stats-label">Tournaments</div>
              </div>
              <div className="td-host-stats-box">
                <div className="td-host-stats-number yellow">4.8</div>
                <div className="td-host-stats-label">Rating</div>
              </div>
            </div>

            {/* Trusted banner */}
            <div className="td-trusted-banner">
              <div className="td-trusted-banner-title">
                <IconShield />
                Verified by Scrimverse • Trusted Host
              </div>
              <p className="td-trusted-banner-desc">
                This organizer has been verified and has successfully hosted multiple events.
              </p>
            </div>

            {/* Bio */}
            {tournament.host?.bio && (
              <>
                <hr className="td-divider" />
                <p className="td-section-heading">About</p>
                <p className="td-description">{tournament.host.bio}</p>
              </>
            )}

            {/* Contact */}
            {tournament.host?.contact_email && (
              <>
                <hr className="td-divider" />
                <p className="td-section-heading">Contact</p>
                <a
                  href={`mailto:${tournament.host.contact_email}`}
                  style={{ color: 'hsl(200 85% 60%)', fontSize: 14, fontWeight: 600 }}
                >
                  {tournament.host.contact_email}
                </a>
              </>
            )}

            {/* Extra links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {tournament.tournament_file && (
                <a
                  href={tournament.tournament_file}
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
              {(tournament.status === 'completed' || tournament.round_scores?.length > 0) && (
                <Link
                  to={`/tournaments/${id}/stats`}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'hsl(270 60% 55%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    textAlign: 'center',
                  }}
                >
                  📊 View Tournament Stats
                </Link>
              )}
              {tournament.discord_id && (
                <a
                  href={`https://${tournament.discord_id}`}
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
      {/* end td-tabs-section */}

      {/* ══════════════════════════════════════
          MATCH SCHEDULE
      ══════════════════════════════════════ */}
      {(matchSchedule.length > 0 || scheduleLoading) && (
        <div className="td-match-schedule">
          <div className="bg-dark-bg-primary rounded-lg border border-dark-bg-hover overflow-hidden">
            <button
              onClick={() => setExpandedSchedule(!expandedSchedule)}
              className="w-full flex items-center justify-between p-4 hover:bg-dark-bg-hover transition-colors"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                🗓️ Match Schedule
                <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-full font-bold">
                  {matchSchedule.length} {matchSchedule.length === 1 ? 'match' : 'matches'}
                </span>
              </h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSchedule ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedSchedule && matchSchedule.length > 0 && (
              <div className="border-t border-dark-bg-hover">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-dark-bg-hover/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Match</span>
                  <span>Group</span>
                  <span>Map</span>
                  <span>Date</span>
                  <span>Time</span>
                </div>
                <div className="divide-y divide-dark-bg-hover/50">
                  {matchSchedule
                    .sort((a, b) => {
                      if (a.round_number !== b.round_number) return a.round_number - b.round_number;
                      if (a.group_name !== b.group_name)
                        return (a.group_name || '').localeCompare(b.group_name || '');
                      return a.match_number - b.match_number;
                    })
                    .map((match) => (
                      <div
                        key={match.id}
                        className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm items-center transition-colors hover:bg-dark-bg-hover/30 ${match.status === 'ongoing' ? 'bg-green-500/5 border-l-2 border-green-500' : match.status === 'completed' ? 'opacity-60' : ''}`}
                      >
                        <span className="text-white font-semibold flex items-center gap-2">
                          #{match.match_number}
                          {match.status === 'ongoing' && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                          {match.status === 'completed' && (
                            <span className="text-[9px] text-gray-500 font-bold uppercase">
                              Done
                            </span>
                          )}
                        </span>
                        <span className="text-accent-purple font-medium text-xs">
                          {match.group_name || '—'}
                        </span>
                        <span className="text-gray-300 text-xs">{match.map_name || '—'}</span>
                        <span className="text-gray-300 text-xs">
                          {match.scheduled_date
                            ? new Date(match.scheduled_date + 'T00:00:00').toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )
                            : '—'}
                        </span>
                        <span className="text-accent-cyan font-medium text-xs">
                          {match.scheduled_time
                            ? (() => {
                                const [h, m] = match.scheduled_time.split(':');
                                const d = new Date();
                                d.setHours(parseInt(h), parseInt(m));
                                return d.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                });
                              })()
                            : '—'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {scheduleLoading && (
              <div className="p-6 text-center">
                <div className="td-spinner" style={{ margin: '0 auto 8px' }} />
                <p className="text-gray-500 text-xs">Loading match schedule…</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          REGISTRATION MODAL
      ══════════════════════════════════════ */}
      {showRegisterModal && tournament && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-50 p-4 overflow-auto">
          <div className="relative bg-[#0b0b0d] rounded-xl p-6 w-full max-w-md mx-4 border border-[#222] shadow-xl mt-12">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Join Tournament</h2>
              <p className="text-gray-400 text-sm">Register for &quot;{tournament.title}&quot;</p>
            </div>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowRegisterModal(false);
                  setShowTeamRegistration(true);
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 rounded-md transition-colors"
              >
                ✨ Use Team Still ✨
              </button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="block text-gray-400 text-sm mb-1">Your Username</label>
                <input
                  type="text"
                  disabled
                  value={user?.user?.username || ''}
                  className="w-full px-3 py-2 bg-[#0b0b0d] border border-[#222] rounded-md text-gray-300"
                />
                <div className="text-gray-500 text-xs mt-1">
                  You&apos;ll be registered as the team leader
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-gray-300 mb-2">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registrationData.team_name}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, team_name: e.target.value })
                  }
                  placeholder="Enter your team name"
                  className="w-full px-3 py-2 bg-[#0b0b0d] border border-[#222] rounded-md text-white"
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-300 mb-2">
                  Teammate Email IDs <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {registrationData.teammate_emails.map((email, index) => (
                    <input
                      key={index}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleTeammateEmailChange(index, e.target.value)}
                      placeholder={`Teammate ${index + 2} email`}
                      className="w-full px-3 py-2 bg-[#0b0b0d] border border-[#222] rounded-md text-white"
                    />
                  ))}
                </div>
                <div className="text-purple-300 text-xs bg-[#1b0b2b] border border-[#2b153b] rounded-md p-3 mt-3">
                  <strong>First time only.</strong> Once your teammates join and you&apos;re part of
                  a team, you can register for future tournaments in 30 seconds by selecting players
                  directly.
                </div>
              </div>
              <div className="flex items-center justify-between bg-transparent py-3 mt-3 border-t border-[#222]">
                <div className="text-gray-300">Entry Fee</div>
                <div className="text-white font-semibold">₹{tournament.entry_fee}</div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 bg-transparent text-gray-300 py-2 rounded-md border border-[#333]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-accent-blue text-white py-2 rounded-md font-semibold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Registration Modal */}
      {showTeamRegistration && tournament && (
        <RegistrationModal
          event={tournament}
          type="tournament"
          onClose={() => setShowTeamRegistration(false)}
          onSuccess={() => {
            setShowTeamRegistration(false);
            fetchTournament();
          }}
        />
      )}

      {/* ══════════════════════════════════════
          SHARE MODAL
      ══════════════════════════════════════ */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div className="td-share-card w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-accent-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <h3 className="td-share-title">Share Tournament</h3>
              </div>
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
              Invite friends to <span className="text-white font-semibold">{tournament.title}</span>
            </p>

            <div className="td-share-input">
              <input type="text" readOnly value={window.location.href} className="" />
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

            <div className="grid grid-cols-3 gap-3 mb-6">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🎮 Join *${tournament.title}* on ScrimVerse!\n\n🏆 Prize Pool: ₹${tournament.prize_pool}\n💰 Entry: ${parseFloat(tournament.entry_fee) === 0 ? 'FREE' : `₹${tournament.entry_fee}`}\n\n${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-bg-hover hover:bg-green-500/10 border border-dark-bg-hover hover:border-green-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-300 font-medium">WhatsApp</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎮 Join ${tournament.title} on ScrimVerse! 🏆 Prize: ₹${tournament.prize_pool}`)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-bg-hover hover:bg-blue-500/10 border border-dark-bg-hover hover:border-blue-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-300 font-medium">Twitter / X</span>
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-bg-hover hover:bg-accent-purple/10 border border-dark-bg-hover hover:border-accent-purple/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center group-hover:bg-accent-purple/30 transition-colors">
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

            <div className="td-qr-section">
              <h4 className="td-qr-title">Scan QR Code</h4>
              <div className="td-qr-box">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=000000&format=png`}
                  alt="Tournament QR Code"
                  className="w-44 h-44"
                />
              </div>
              <div className="td-qr-actions">
                <button onClick={downloadQr} className="">
                  <svg
                    className="w-4 h-4 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v12"
                    />
                  </svg>
                  Download QR
                </button>
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: tournament.title,
                          url: window.location.href,
                        });
                      } catch (err) {
                        /* cancelled */
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      } catch (e) {
                        /* ignore */
                      }
                    }
                  }}
                  className=""
                >
                  <svg
                    className="w-4 h-4 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  {navigator.share ? 'Share' : copiedLink ? 'Copied' : 'Copy Link'}
                </button>
              </div>
              <p className="text-center text-gray-500 text-xs mt-3">
                Scan or download the QR to share
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;
