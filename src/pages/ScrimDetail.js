import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import RegistrationModal from '../components/RegistrationModal';
import Toast from '../components/Toast';

// Premium SVG Icons
const TrophyIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-accent-blue"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const GamepadIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <path d="M6 12h4" />
    <path d="M8 10v4" />
    <path d="M15 13h.01" />
    <path d="M18 11h.01" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ScrimDetail = () => {
  const { id } = useParams();
  const [scrim, setScrim] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState({ id: false, password: false });

  const { isAuthenticated, isPlayer, isHost, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScrimData();
    // Poll for match updates if scrim is ongoing
    const interval = setInterval(() => {
      if (scrim?.status === 'ongoing') {
        fetchMatchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [id, scrim?.status]);

  const fetchScrimData = async () => {
    try {
      setLoading(true);
      const detailRes = await tournamentAPI.getTournament(id);
      const data = detailRes.data;

      // Redirect if this is actually a TOURNAMENT
      const mode = (data.event_mode || '').toUpperCase();
      if (mode === 'TOURNAMENT') {
        navigate(`/tournaments/${id}`, { replace: true });
        return;
      }

      setScrim(data);

      // Now that we have basic scrim data, try fetching matches and leaderboard
      // These won't block the initial render if they fail or 404
      try {
        const matchesRes = await tournamentAPI.getRoundGroups(id, 1);
        if (matchesRes.data.groups && matchesRes.data.groups.length > 0) {
          setMatches(matchesRes.data.groups[0].matches || []);
        }
      } catch (err) {
        // Matches not yet available
      }
    } catch (error) {
      console.error('Error fetching scrim details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchData = async () => {
    try {
      const response = await tournamentAPI.getRoundGroups(id, 1);
      if (response.data.groups && response.data.groups.length > 0) {
        setMatches(response.data.groups[0].matches || []);
      }
    } catch (err) {
      // Failed to fetch match data
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setToast({ message: `${type === 'id' ? 'Room ID' : 'Password'} copied!`, type: 'success' });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-accent-blue/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!scrim) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-xl font-black uppercase tracking-widest">Arena Missing</p>
        <Link
          to="/scrims"
          className="px-6 py-2 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  const isRegistered = scrim.user_registration_status === 'confirmed';

  return (
    <div className="min-h-screen relative pb-20 -mt-[112px]">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[350px] w-full overflow-hidden">
        <img
          src={`${process.env.REACT_APP_MEDIA_URL || 'http://localhost:8000'}/media/tournaments/default_banners/Tournament_Details_Banner.jpg`}
          alt={scrim.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="animate-fade-in">
              <span
                className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest border backdrop-blur-md shadow-2xl mb-3 ${
                  scrim.status === 'ongoing'
                    ? 'text-success bg-success/10 border-success/30'
                    : 'text-accent-blue bg-accent-blue/10 border-accent-blue/30'
                }`}
              >
                {scrim.status === 'ongoing' ? 'LIVE NOW' : scrim.status.toUpperCase()}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3 drop-shadow-2xl">
                {scrim.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 backdrop-blur-md">
                  <GamepadIcon />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {scrim.game_name} • {scrim.game_mode}
                  </span>
                </div>
                {scrim.prize_pool && parseFloat(scrim.prize_pool) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold border border-accent-gold/30">
                      <TrophyIcon />
                    </div>
                    <span className="font-bold text-gray-400 text-sm">
                      Prize Pool:{' '}
                      <span className="text-accent-gold font-black">₹{scrim.prize_pool}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              {/* Stats Quick Cards */}
              <div className="hidden lg:flex gap-2">
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-2.5 rounded-xl min-w-[100px] text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    Entry Fee
                  </p>
                  <p className="text-lg font-black text-white">
                    {scrim.entry_fee === 0 ? 'FREE' : `₹${scrim.entry_fee}`}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-2.5 rounded-xl min-w-[100px] text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    Capacity
                  </p>
                  <p className="text-lg font-black text-accent-blue">
                    {scrim.current_participants}/{scrim.max_participants}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="cyber-card rounded-[1.2rem] p-6 shadow-xl">
              <section className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-5 bg-accent-blue rounded-full"></div>
                  <h2 className="text-lg font-black text-white tracking-widest uppercase">
                    Scrim Briefing
                  </h2>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  {scrim.description || 'No description provided for this scrim.'}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-5 bg-accent-purple rounded-full"></div>
                  <h2 className="text-lg font-black text-white tracking-widest uppercase">
                    Directives
                  </h2>
                </div>
                <div className="text-gray-400 text-xs leading-relaxed font-medium bg-black/40 p-5 rounded-xl border border-white/5 whitespace-pre-wrap backdrop-blur-sm">
                  {scrim.rules}
                </div>
              </section>
            </div>

            {/* Host Details - Compact Version */}
            <div className="cyber-card rounded-[1.2rem] p-6 shadow-xl relative overflow-hidden group/host">
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent-purple/5 rounded-full blur-[60px] group-hover/host:bg-accent-purple/10 transition-all duration-1000"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-1 h-5 bg-accent-blue rounded-full"></div>
                  <h2 className="text-lg font-black text-white tracking-widest uppercase">
                    Host Details
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* Host Avatar & Basic Info */}
                  <div className="flex flex-col items-center text-center space-y-3 min-w-[140px]">
                    <div className="relative p-0.5">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue via-accent-purple to-accent-blue rounded-full animate-spin-slow opacity-30"></div>
                      <div className="relative w-16 h-16 rounded-full bg-background border-2 border-background overflow-hidden">
                        {scrim.host?.user?.profile_picture ? (
                          <img
                            src={scrim.host.user.profile_picture}
                            alt={scrim.host.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-black bg-white/5 text-gray-500">
                            {scrim.host?.user?.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {scrim.host?.verified && (
                        <div
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-blue rounded-full border-2 border-[#070708] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20"
                          title="Verified Host"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-none mb-1.5">
                        {scrim.host?.user?.username}
                      </h3>
                    </div>
                  </div>

                  {/* Host Stats Grid - Compacted */}
                  <div className="flex-1 w-full grid grid-cols-2 gap-3">
                    {[
                      {
                        label: 'Hosted',
                        value: scrim.host?.total_tournaments_hosted || '12',
                        icon: '🏆',
                        color: 'text-accent-blue',
                      },
                      {
                        label: 'Rating',
                        value: `${scrim.host?.average_rating || scrim.host?.rating || '0.0'}`,
                        icon: '★',
                        color: 'text-accent-gold',
                      },
                      {
                        label: 'Players',
                        value: scrim.host?.total_participants?.toLocaleString() || '1,240',
                        icon: '👥',
                        color: 'text-accent-purple',
                      },
                      {
                        label: 'Bounty',
                        value: `₹${(scrim.host?.prize_pool_distributed || 50000).toLocaleString()}`,
                        icon: '💰',
                        color: 'text-accent-gold',
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all group/stat"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px]">{stat.icon}</span>
                          <span
                            className={`text-[7px] font-black uppercase tracking-widest opacity-30 group-hover/stat:opacity-80 transition-opacity`}
                          >
                            {stat.label}
                          </span>
                        </div>
                        <div className={`text-sm font-black ${stat.color} tracking-tight`}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification/Trust Badge */}
                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_6px_#22c55e]"></div>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                      Host Credentials Verified
                    </span>
                  </div>
                  <Link
                    to={`/host/profile/${scrim.host?.id || scrim.host_id}`}
                    className="text-[8px] font-black text-accent-blue uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center gap-1"
                  >
                    View Intel File <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-32 self-start relative z-10">
            {/* Action Card */}
            {!isHost() && (
              <div className="cyber-card rounded-[1.2rem] p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/5 blur-2xl rounded-full"></div>
                <div className="text-center mb-5">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2rem] mb-2.5">
                    Arena Access
                  </p>
                  <div className="flex justify-center mb-2.5">
                    <div className="p-2.5 bg-accent-blue/10 border border-accent-blue/20 rounded-full text-accent-blue">
                      <ShieldIcon />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tighter uppercase mb-0.5">
                    Registration
                  </h3>
                </div>

                <div className="space-y-4">
                  {!isRegistered ? (
                    <div className="space-y-4">
                      {scrim.status === 'upcoming' ? (
                        <button
                          onClick={() =>
                            isAuthenticated() && isPlayer()
                              ? setShowRegisterModal(true)
                              : navigate('/player/login')
                          }
                          className="w-full py-4 bg-accent-blue text-white rounded-xl font-black uppercase tracking-widest text-base shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all"
                        >
                          Join Arena
                        </button>
                      ) : (
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center font-bold text-gray-600 uppercase tracking-widest text-xs">
                          Registration Closed
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-success/10 border border-success/20 rounded-3xl text-center">
                      <p className="text-lg font-black text-success tracking-widest uppercase mb-1">
                        Registered
                      </p>
                      <p className="text-[10px] font-bold text-success/60 uppercase tracking-widest">
                        Ready for deployment
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chronology Card */}
            <div className="cyber-card rounded-[1.2rem] p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-accent-blue rounded-full"></div>
                <h3 className="text-sm font-black text-white tracking-widest uppercase">
                  Chronology
                </h3>
              </div>

              <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                <div className="relative pl-7">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-black/60 border border-accent-blue rounded-full flex items-center justify-center backdrop-blur-md">
                    <div className="w-1.5 h-1.5 bg-accent-blue rounded-full"></div>
                  </div>
                  <p className="text-[8px] font-black text-accent-blue uppercase tracking-widest mb-0.5">
                    Registration Starts on
                  </p>
                  <p className="text-xs font-black text-white">
                    {new Date(scrim.registration_start).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-black/60 border border-accent-purple rounded-full flex items-center justify-center backdrop-blur-md">
                    <div className="w-1.5 h-1.5 bg-accent-purple rounded-full"></div>
                  </div>
                  <p className="text-[8px] font-black text-accent-purple uppercase tracking-widest mb-0.5">
                    Registration Closes on
                  </p>
                  <p className="text-xs font-black text-white">
                    {new Date(scrim.tournament_start).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-black/60 border border-accent-gold rounded-full flex items-center justify-center backdrop-blur-md">
                    <div className="w-1.5 h-1.5 bg-accent-gold rounded-full"></div>
                  </div>
                  <p className="text-[8px] font-black text-accent-gold uppercase tracking-widest mb-0.5">
                    Match Starts On
                  </p>
                  <p className="text-xs font-black text-white">
                    {new Date(scrim.tournament_end).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Links & Assets */}
            <div className="space-y-3">
              {scrim.discord_id && (
                <a
                  href={`https://${scrim.discord_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#5865F2]/20 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                  Discord Base
                </a>
              )}
              {scrim.tournament_file && scrim.tournament_file.trim() !== '' && (
                <a
                  href={scrim.tournament_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-500/20 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Rules Document
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRegisterModal && (
        <RegistrationModal
          event={scrim}
          type="scrim"
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false);
            fetchScrimData();
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ScrimDetail;
