import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tournamentAPI, authAPI, paymentsAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import RegistrationModal from '../components/RegistrationModal';

const TournamentDetail = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [matchSchedule, setMatchSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'schedule', 'host'
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    team_name: '',
    teammate_emails: [],
    in_game_details: { ign: '', uid: '', rank: '' },
  });
  const [usernameSuggestions, setUsernameSuggestions] = useState({}); // { fieldIndex: [suggestions] }
  const [showSuggestions, setShowSuggestions] = useState({}); // { fieldIndex: boolean }
  const suggestionTimeoutRef = useRef({});
  const [showTeamRegistration, setShowTeamRegistration] = useState(false);

  const { isAuthenticated, isPlayer, isHost, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTournament = async () => {
      await fetchTournament();
    };
    loadTournament();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Redirect hosts to manage page if they own this tournament
    // user structure from /accounts/me/ is {user: {...}, profile: {...}} where profile is host_profile
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

  // Fetch match schedule for all rounds
  const fetchMatchSchedule = async (tournamentData) => {
    if (!tournamentData || !tournamentData.rounds || tournamentData.rounds.length === 0) return;
    if (!isAuthenticated()) return;

    setScheduleLoading(true);
    try {
      const allMatches = [];
      // Fetch groups for each round
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
          // Round may not be configured yet, skip
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

  // Fetch match schedule when tournament loads
  useEffect(() => {
    if (tournament && tournament.rounds && tournament.rounds.length > 0) {
      fetchMatchSchedule(tournament);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.id]);

  // Get required number of players based on game mode
  const getRequiredPlayers = (gameMode) => {
    const modeMap = {
      Squad: 4,
      Duo: 2,
      Solo: 1,
      '5v5': 5,
      '4v4': 4,
      '2v2': 2,
    };
    return modeMap[gameMode] || 1;
  };

  // Initialize player usernames array when modal opens
  useEffect(() => {
    if (showRegisterModal && tournament) {
      const requiredPlayers = getRequiredPlayers(tournament.game_mode);
      // captain is the current logged in user; we only collect teammate emails (requiredPlayers - 1)
      const teammateCount = Math.max(0, requiredPlayers - 1);
      const initialEmails = Array(teammateCount).fill('');

      setRegistrationData({
        team_name: '',
        teammate_emails: initialEmails,
        in_game_details: { ign: '', uid: '', rank: '' },
      });
      setUsernameSuggestions({});
      setShowSuggestions({});
    }

    // Cleanup timeouts when modal closes
    return () => {
      Object.values(suggestionTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
      suggestionTimeoutRef.current = {};
    };
  }, [showRegisterModal, tournament, user]);

  // Username autocomplete search
  const searchUsernames = async (query, fieldIndex) => {
    if (!query || query.length < 2) {
      setUsernameSuggestions((prev) => ({ ...prev, [fieldIndex]: [] }));
      setShowSuggestions((prev) => ({ ...prev, [fieldIndex]: false }));
      return;
    }

    // Clear previous timeout
    if (suggestionTimeoutRef.current[fieldIndex]) {
      clearTimeout(suggestionTimeoutRef.current[fieldIndex]);
    }

    // Debounce search
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
    // Validate team name
    if (!registrationData.team_name.trim()) {
      alert('Please enter a team name');
      return;
    }

    // Validate teammate emails (if any)
    const emails = registrationData.teammate_emails || [];
    // required teammate count based on game mode
    const requiredPlayers = getRequiredPlayers(tournament.game_mode);
    const expectedTeammates = Math.max(0, requiredPlayers - 1);

    if (emails.length !== expectedTeammates) {
      alert(`This tournament requires ${expectedTeammates} teammate email(s).`);
      return;
    }

    // Normalize and validate
    const normalized = emails.map((e) => (e || '').trim().toLowerCase());

    for (let i = 0; i < normalized.length; i++) {
      const eMail = normalized[i];
      if (!eMail) {
        alert('Please enter all teammate email fields (use placeholders if none)');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eMail)) {
        alert(`Invalid email at teammate ${i + 1}: ${eMail}`);
        return;
      }
    }

    // Ensure no duplicates
    const uniqueSet = new Set(normalized);
    if (uniqueSet.size !== normalized.length) {
      alert('Duplicate teammate emails are not allowed');
      return;
    }

    // Captain email must not be included
    const captainEmail = (user?.user?.email || '').toLowerCase();
    if (captainEmail && normalized.includes(captainEmail)) {
      alert('You cannot include your own (captain) email in the teammate list.');
      return;
    }

    try {
      // initiate registration (creates pending registration and stores temp emails)
      const payload = {
        team_name: registrationData.team_name,
        teammate_emails: registrationData.teammate_emails,
      };

      const initResp = await tournamentAPI.registerInitiate(id, payload);
      const registration = initResp.data;

      const isFree = parseFloat(tournament.entry_fee) === 0;

      if (isFree) {
        // Free tournament — no payment needed
        alert('Registration successful! You are now registered for this tournament.');
        setShowRegisterModal(false);
        fetchTournament();
      } else {
        // Paid tournament — start payment
        try {
          const regId =
            registration?.registration_id || registration?.registrationId || registration?.id;
          if (!registration || !regId) {
            console.error('Missing registration id, cannot start payment', registration);
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

          console.debug('Starting payment with payload:', paymentPayload);

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
          console.error('Payment start error:', payErr, payErr.response?.data);
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
      const errorMessage =
        error.response?.data?.error || error.response?.data?.message || 'Registration failed.';
      alert(errorMessage);
      console.error('Registration error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-gray-400">Tournament not found</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-accent-blue text-white';
      case 'ongoing':
        return 'bg-success text-white';
      case 'completed':
        return 'bg-gray-600 text-gray-200';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-semibold transition-all relative ${
        activeTab === id
          ? 'text-accent-blue border-b-2 border-accent-blue'
          : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      <span className="flex items-center gap-2">
        {icon} {label}
      </span>
    </button>
  );

  // Download QR programmatically (fetch -> blob) so download works cross-origin
  const downloadQr = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
        window.location.href
      )}&bgcolor=ffffff&color=000000&format=png`;
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
      console.error('QR download failed:', err);
      // fallback: open image in new tab
      const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
        window.location.href
      )}&bgcolor=ffffff&color=000000&format=png`;
      window.open(fallback, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Image */}
        {tournament.banner_image && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-card">
            <img
              src={tournament.banner_image}
              alt={tournament.title}
              className="w-full h-80 object-cover"
            />
          </div>
        )}

        <div className="bg-dark-bg-card rounded-xl shadow-card p-8 border border-dark-bg-hover">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{tournament.title}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-2">
                  🎮 {tournament.game_name} - {tournament.game_mode}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(tournament.status)}`}
                >
                  {tournament.status}
                </span>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-bg-hover hover:bg-dark-bg-hover/70 text-gray-300 hover:text-white transition-all text-sm border border-dark-bg-hover hover:border-accent-blue/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Registration Button - Always visible above tabs */}
          {!isHost() && (
            <div className="mb-6">
              {isPlayer() ? (
                (() => {
                  const regStatus = tournament.user_registration_status;
                  if (regStatus) {
                    const statusLabels = {
                      pending: {
                        text: '⏳ Registration Pending — Complete Payment',
                        color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
                      },
                      confirmed: {
                        text: '✅ You are Registered',
                        color: 'text-green-400 border-green-500/30 bg-green-500/5',
                      },
                      cancelled: {
                        text: '❌ Registration Cancelled',
                        color: 'text-red-400 border-red-500/30 bg-red-500/5',
                      },
                    };
                    const info = statusLabels[regStatus] || {
                      text: `Registered (${regStatus})`,
                      color: 'text-gray-400 border-gray-500/30',
                    };
                    return (
                      <div
                        className={`w-full py-3 rounded-lg text-center border font-semibold text-sm ${info.color}`}
                      >
                        {info.text}
                      </div>
                    );
                  }

                  if (!tournament.registration_start || !tournament.registration_end) {
                    return (
                      <div className="w-full bg-dark-bg-primary text-gray-400 py-3 rounded-lg text-center border border-dark-bg-hover">
                        Registration dates not set
                      </div>
                    );
                  }

                  const now = new Date();
                  const regStart = new Date(tournament.registration_start);
                  const regEnd = new Date(tournament.registration_end);

                  if (isNaN(regStart.getTime()) || isNaN(regEnd.getTime())) {
                    return (
                      <div className="w-full bg-dark-bg-primary text-gray-400 py-3 rounded-lg text-center border border-dark-bg-hover">
                        Invalid registration dates
                      </div>
                    );
                  }

                  const buffer = 5 * 60 * 1000;
                  const isRegistrationOpen =
                    now.getTime() >= regStart.getTime() - buffer &&
                    now.getTime() <= regEnd.getTime() + buffer;
                  const isTournamentFull =
                    tournament.current_participants >= tournament.max_participants;
                  const canRegister =
                    isRegistrationOpen && !isTournamentFull && tournament.status === 'upcoming';

                  if (canRegister) {
                    return (
                      <button
                        onClick={() => setShowRegisterModal(true)}
                        className="w-full bg-accent-blue text-white py-3 rounded-lg font-bold hover:bg-accent-blue/90 transition-all shadow-glow-blue flex items-center justify-center gap-2"
                      >
                        <span>Join Tournament</span>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>
                    );
                  } else {
                    let message = 'Registration Closed';
                    if (!isRegistrationOpen) {
                      if (now.getTime() < regStart.getTime()) {
                        message = `Registration opens ${regStart.toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`;
                      } else {
                        message = `Registration closed on ${regEnd.toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`;
                      }
                    } else if (isTournamentFull) {
                      message = `Tournament is Full (${tournament.current_participants}/${tournament.max_participants})`;
                    } else if (tournament.status !== 'upcoming') {
                      message = `Tournament status: ${tournament.status}`;
                    }
                    return (
                      <div className="w-full bg-dark-bg-primary text-gray-400 py-3 rounded-lg text-center border border-dark-bg-hover">
                        {message}
                      </div>
                    );
                  }
                })()
              ) : (
                <button
                  onClick={() => navigate('/player/login')}
                  className="w-full bg-accent-blue text-white py-3 rounded-lg font-bold hover:bg-accent-blue/90 transition-all shadow-glow-blue"
                >
                  Login to Register
                </button>
              )}
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="bg-dark-bg-primary rounded-xl border border-dark-bg-hover overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-dark-bg-hover overflow-x-auto">
                <TabButton id="details" label="DETAILS & PRIZES" icon="💰" />
                <TabButton id="schedule" label="SCHEDULE & RULES" icon="📅" />
                <TabButton id="host" label="HOST INFO" icon="👤" />
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Tab 1: Details & Prizes */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">
                        About This Tournament
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{tournament.description}</p>
                    </div>

                    {/* Prize Pool & Entry */}
                    <div className="pt-6 border-t border-dark-bg-hover">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4 text-center">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Prize Pool
                          </span>
                          <div className="text-2xl font-bold text-accent-gold">
                            ₹{tournament.prize_pool}
                          </div>
                        </div>
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4 text-center">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Entry Fee
                          </span>
                          <div className="text-2xl font-bold text-accent-cyan">
                            {parseFloat(tournament.entry_fee) === 0
                              ? 'FREE'
                              : `₹${tournament.entry_fee}`}
                          </div>
                        </div>
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4 text-center">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Capacity
                          </span>
                          <div className="text-2xl font-bold text-white">
                            <span className="text-accent-blue">
                              {tournament.current_participants}
                            </span>
                            <span className="text-gray-500">/{tournament.max_participants}</span>
                          </div>
                        </div>
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4 text-center">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Mode
                          </span>
                          <div className="text-2xl font-bold text-accent-purple">
                            {tournament.game_mode}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rounds */}
                    {tournament.rounds && tournament.rounds.length > 0 && (
                      <div className="pt-6 border-t border-dark-bg-hover">
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                          Rounds Structure
                          <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-1 rounded-full normal-case">
                            {tournament.rounds.length} rounds
                          </span>
                        </h3>
                        <div className="space-y-3">
                          {tournament.rounds.map((round) => (
                            <div
                              key={round.round}
                              className="border-l-4 border-accent-blue pl-4 bg-dark-bg-hover/30 p-3 rounded-r-lg"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-accent-blue font-bold">
                                  Round {round.round}
                                </span>
                                {round.max_teams && (
                                  <span className="text-gray-400 text-sm">
                                    ({round.max_teams} teams)
                                  </span>
                                )}
                              </div>
                              {round.qualifying_teams && (
                                <p className="text-gray-300 text-sm">
                                  → {round.qualifying_teams} teams qualify
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Schedule & Rules */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    {/* Registration Schedule */}
                    <div>
                      <h3 className="text-lg font-bold text-accent-blue mb-4 uppercase tracking-wide">
                        Registration Period
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Opens
                          </span>
                          {tournament.registration_start ? (
                            <span className="text-accent-cyan font-semibold">
                              {new Date(tournament.registration_start).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-500">Not set</span>
                          )}
                        </div>
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Closes
                          </span>
                          {tournament.registration_end ? (
                            <span className="text-accent-gold font-semibold">
                              {new Date(tournament.registration_end).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-500">Not set</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tournament Schedule */}
                    <div className="pt-6 border-t border-dark-bg-hover">
                      <h3 className="text-lg font-bold text-accent-purple mb-4 uppercase tracking-wide">
                        Tournament Period
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Starts
                          </span>
                          <span className="text-accent-cyan font-semibold">
                            {new Date(tournament.tournament_start).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div className="bg-dark-bg-hover/50 rounded-lg p-4">
                          <span className="text-gray-400 text-xs uppercase tracking-wide block mb-2">
                            Ends
                          </span>
                          <span className="text-accent-gold font-semibold">
                            {new Date(tournament.tournament_end).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rules */}
                    {tournament.rules && (
                      <div className="pt-6 border-t border-dark-bg-hover">
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide">
                          Rules & Guidelines
                        </h3>
                        <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm bg-dark-bg-hover/30 p-4 rounded-lg leading-relaxed">
                          {tournament.rules}
                        </pre>
                      </div>
                    )}

                    {/* Requirements */}
                    {tournament.requirements && tournament.requirements.length > 0 && (
                      <div className="pt-6 border-t border-dark-bg-hover">
                        <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                          Requirements
                          <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-1 rounded-full normal-case">
                            {tournament.requirements.length}
                          </span>
                        </h3>
                        <ul className="space-y-2 text-gray-300">
                          {tournament.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-accent-blue mt-1">●</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Host Info */}
                {activeTab === 'host' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">
                        Hosted By
                      </h3>
                      <Link
                        to={`/host/profile/${tournament.host?.id}`}
                        className="text-accent-purple hover:text-accent-purple/80 font-semibold text-2xl"
                      >
                        {tournament.host?.organization_name || 'Unknown'}
                      </Link>
                    </div>

                    {tournament.host?.bio && (
                      <div className="pt-6 border-t border-dark-bg-hover">
                        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                          About
                        </h3>
                        <p className="text-gray-300 leading-relaxed">{tournament.host.bio}</p>
                      </div>
                    )}

                    {tournament.host?.contact_email && (
                      <div className="pt-6 border-t border-dark-bg-hover">
                        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                          Contact
                        </h3>
                        <a
                          href={`mailto:${tournament.host.contact_email}`}
                          className="text-accent-blue hover:underline text-lg"
                        >
                          {tournament.host.contact_email}
                        </a>
                      </div>
                    )}

                    {/* Files & Links */}
                    <div className="pt-6 border-t border-dark-bg-hover space-y-3">
                      {tournament.tournament_file && (
                        <a
                          href={tournament.tournament_file}
                          download
                          className="block w-full bg-dark-bg-hover hover:bg-dark-bg-hover/70 text-accent-blue px-4 py-3 rounded-lg border border-accent-blue/30 transition-all text-center font-semibold"
                        >
                          📄 Download Rules PDF
                        </a>
                      )}
                      {(tournament.status === 'completed' ||
                        tournament.round_scores?.length > 0) && (
                        <Link
                          to={`/tournaments/${id}/stats`}
                          className="block w-full bg-accent-purple hover:bg-accent-purple/90 text-white px-4 py-3 rounded-lg font-semibold transition-all text-center"
                        >
                          📊 View Tournament Stats
                        </Link>
                      )}
                      {tournament.discord_id && (
                        <a
                          href={`https://${tournament.discord_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-dark-bg-hover hover:bg-dark-bg-hover/70 text-accent-purple px-4 py-3 rounded-lg border border-accent-purple/30 transition-all text-center font-semibold"
                        >
                          💬 Join Discord Server
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Schedule Section - Full Width */}
          {matchSchedule.length > 0 && (
            <div className="mt-6">
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

                {expandedSchedule && (
                  <div className="border-t border-dark-bg-hover">
                    {/* Table header */}
                    <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-dark-bg-hover/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <span>Match</span>
                      <span>Group</span>
                      <span>Map</span>
                      <span>Date</span>
                      <span>Time</span>
                    </div>
                    {/* Match rows */}
                    <div className="divide-y divide-dark-bg-hover/50">
                      {matchSchedule
                        .sort((a, b) => {
                          // Sort by round, then group, then match number
                          if (a.round_number !== b.round_number)
                            return a.round_number - b.round_number;
                          if (a.group_name !== b.group_name)
                            return (a.group_name || '').localeCompare(b.group_name || '');
                          return a.match_number - b.match_number;
                        })
                        .map((match) => (
                          <div
                            key={match.id}
                            className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm items-center transition-colors hover:bg-dark-bg-hover/30 ${
                              match.status === 'ongoing'
                                ? 'bg-green-500/5 border-l-2 border-green-500'
                                : match.status === 'completed'
                                  ? 'opacity-60'
                                  : ''
                            }`}
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
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                    }
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
              </div>
            </div>
          )}

          {/* Loading state for match schedule */}
          {scheduleLoading && (
            <div className="mt-6 text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-blue mx-auto"></div>
              <p className="text-gray-500 text-xs mt-2">Loading match schedule...</p>
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && tournament && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-50 p-4 overflow-auto">
          <div className="relative bg-[#0b0b0d] rounded-xl p-6 w-full max-w-md mx-4 border border-[#222] shadow-xl mt-12">
            {/* Close */}
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Join Tournament</h2>
              <p className="text-gray-400 text-sm">Register for “{tournament.title}”</p>
            </div>

            {/* Use Team CTA */}
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
              {/* Current Username (disabled) */}
              <div className="mb-3">
                <label className="block text-gray-400 text-sm mb-1">Your Username</label>
                <input
                  type="text"
                  disabled
                  value={user?.user?.username || ''}
                  className="w-full px-3 py-2 bg-[#0b0b0d] border border-[#222] rounded-md text-gray-300"
                />
                <div className="text-gray-500 text-xs mt-1">
                  You'll be registered as the team leader
                </div>
              </div>

              {/* Team Name */}
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

              {/* Teammate Emails */}
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
                  <strong>First time only.</strong> Once your teammates join and you're part of a
                  team, you can register for future tournaments in 30 seconds by selecting players
                  directly.
                </div>
              </div>

              {/* Entry Fee Row */}
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

      {/* Team Registration Modal (RegistrationModal with team selection + player checkboxes) */}
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

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-dark-bg-card border border-dark-bg-hover rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                <h3 className="text-xl font-bold text-white">Share Tournament</h3>
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
            <p className="text-gray-400 text-sm mb-5">
              Invite friends to <span className="text-white font-semibold">{tournament.title}</span>
            </p>

            {/* Share URL */}
            <div className="flex items-center gap-2 bg-dark-bg-hover rounded-lg p-3 mb-6 border border-dark-bg-hover">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent text-gray-300 text-sm outline-none truncate"
              />
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

            {/* Share Options */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* WhatsApp */}
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

              {/* Twitter / X */}
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

              {/* Copy Link */}
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

            {/* QR Code Section */}
            <div className="border-t border-dark-bg-hover pt-5">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">
                Scan QR Code
              </h4>
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=000000&format=png`}
                    alt="Tournament QR Code"
                    className="w-44 h-44"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadQr}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-dark-bg-hover rounded-lg text-gray-300 hover:text-white border border-dark-bg-hover hover:border-accent-blue/30 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          // user cancelled
                        }
                      } else {
                        // fallback: copy link
                        try {
                          await navigator.clipboard.writeText(window.location.href);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        } catch (e) {
                          // ignore
                        }
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-dark-bg-hover rounded-lg text-gray-300 hover:text-white border border-dark-bg-hover hover:border-accent-purple/30 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 12v.01M12 12v.01M20 12v.01M4 12a8 8 0 0116 0M12 4v16"
                      />
                    </svg>
                    {navigator.share ? 'Share' : copiedLink ? 'Copied' : 'Copy Link'}
                  </button>
                </div>

                <p className="text-center text-gray-500 text-xs mt-1">
                  Scan or download the QR to share
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetail;
