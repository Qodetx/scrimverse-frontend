import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tournamentAPI, authAPI, paymentsAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const TournamentDetail = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [matchSchedule, setMatchSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    prizepools: false,
    hostinfo: false,
    schedule: false,
    rounds: false,
    rules: false,
    requirements: false,
  });
  const [registrationData, setRegistrationData] = useState({
    team_name: '',
    teammate_emails: [],
    in_game_details: { ign: '', uid: '', rank: '' },
  });
  const [usernameSuggestions, setUsernameSuggestions] = useState({}); // { fieldIndex: [suggestions] }
  const [showSuggestions, setShowSuggestions] = useState({}); // { fieldIndex: boolean }
  const suggestionTimeoutRef = useRef({});

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

      // start payment for the registration
      try {
        const regId =
          registration?.registration_id || registration?.registrationId || registration?.id;
        if (!registration || !regId) {
          console.error('Missing registration id, cannot start payment', registration);
          alert('Registration created but missing registration id. Please refresh and try again.');
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
        // Backend returns `redirect_url` for provider redirect
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

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const AccordionSection = ({ id, title, icon, children, badge }) => (
    <div className="bg-dark-bg-primary rounded-lg border border-dark-bg-hover overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-bg-hover/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {icon} {title}
          {badge && (
            <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-full font-bold">
              {badge}
            </span>
          )}
        </h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSections[id] ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expandedSections[id] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-dark-bg-hover">{children}</div>
      </div>
    </div>
  );

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
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Details */}
            <div className="space-y-6">
              {/* Description */}
              <AccordionSection id="description" title="Description" icon="📋">
                <p className="text-gray-300 leading-relaxed">{tournament.description}</p>
              </AccordionSection>

              {/* Prize Pool & Entry Fee */}
              <AccordionSection
                id="prizepools"
                title="Prize Pool & Entry Details"
                icon="💰"
                badge={`₹${tournament.prize_pool}`}
              >
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 text-sm">Total Prize Pool</span>
                    <div className="text-2xl font-bold text-accent-gold">
                      ₹{tournament.prize_pool}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-dark-bg-hover space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Entry Fee (per team):</span>
                      <span className="text-accent-cyan font-bold">₹{tournament.entry_fee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Participants:</span>
                      <span className="text-white font-semibold bg-dark-bg-hover px-3 py-1 rounded-full text-sm">
                        {tournament.current_participants}/{tournament.max_participants}
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionSection>

              {/* Host Information */}
              <AccordionSection id="hostinfo" title="Host Information" icon="👤">
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 text-sm block mb-2">Hosted By</span>
                    <Link
                      to={`/host/profile/${tournament.host?.id}`}
                      className="text-accent-purple hover:text-accent-purple/80 font-semibold text-lg"
                    >
                      {tournament.host?.organization_name || 'Unknown'}
                    </Link>
                  </div>
                  {tournament.host?.bio && (
                    <div className="pt-3 border-t border-dark-bg-hover">
                      <span className="text-gray-500 text-sm block mb-2">About</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{tournament.host.bio}</p>
                    </div>
                  )}
                  {tournament.host?.contact_email && (
                    <div className="pt-3 border-t border-dark-bg-hover">
                      <span className="text-gray-500 text-sm block mb-2">Contact</span>
                      <a
                        href={`mailto:${tournament.host.contact_email}`}
                        className="text-accent-blue hover:underline text-sm"
                      >
                        {tournament.host.contact_email}
                      </a>
                    </div>
                  )}
                </div>
              </AccordionSection>

              {/* Schedule */}
              <AccordionSection id="schedule" title="Schedule" icon="📅">
                <div className="space-y-3">
                  <div>
                    <span className="text-accent-blue font-semibold block mb-1">
                      📝 Registration Period:
                    </span>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>
                        <span className="text-gray-500">Opens:</span>{' '}
                        {tournament.registration_start ? (
                          <span className="text-accent-cyan">
                            {new Date(tournament.registration_start).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not set</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">Closes:</span>{' '}
                        {tournament.registration_end ? (
                          <span className="text-accent-gold">
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
                  <div className="pt-2 border-t border-dark-bg-hover">
                    <span className="text-accent-purple font-semibold block mb-1">
                      🏆 Tournament Period:
                    </span>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>
                        <span className="text-gray-500">Starts:</span>{' '}
                        <span className="text-accent-cyan">
                          {new Date(tournament.tournament_start).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Ends:</span>{' '}
                        <span className="text-accent-gold">
                          {new Date(tournament.tournament_end).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionSection>

              {/* Rounds Structure */}
              {tournament.rounds && tournament.rounds.length > 0 && (
                <AccordionSection
                  id="rounds"
                  title="Rounds Structure"
                  icon="🏆"
                  badge={`${tournament.rounds.length} rounds`}
                >
                  <div className="space-y-3">
                    {tournament.rounds.map((round, index) => (
                      <div key={round.round} className="border-l-4 border-accent-blue pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-accent-blue font-bold">Round {round.round}</span>
                          {round.max_teams && (
                            <span className="text-gray-400 text-sm">({round.max_teams} teams)</span>
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
                </AccordionSection>
              )}
            </div>

            {/* Right Column - Rules & Actions */}
            <div className="space-y-6">
              {/* Rules */}
              {tournament.rules && (
                <AccordionSection id="rules" title="Rules" icon="📜">
                  <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm">
                    {tournament.rules}
                  </pre>
                </AccordionSection>
              )}

              {/* Requirements */}
              {tournament.requirements && tournament.requirements.length > 0 && (
                <AccordionSection
                  id="requirements"
                  title="Requirements"
                  icon="✅"
                  badge={`${tournament.requirements.length}`}
                >
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {tournament.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </AccordionSection>
              )}

              {/* Files & Links */}
              <div className="space-y-3">
                {tournament.tournament_file && (
                  <a
                    href={tournament.tournament_file}
                    download
                    className="block w-full bg-dark-bg-primary hover:bg-dark-bg-hover text-accent-blue px-4 py-3 rounded-lg border border-accent-blue transition-all text-center font-semibold"
                  >
                    📄 Download Rules PDF
                  </a>
                )}
                {/* View Tournament Stats (Visible to everyone when tournament has scores) */}
                {tournament.status === 'completed' || tournament.round_scores?.length > 0 ? (
                  <Link
                    to={`/tournaments/${id}/stats`}
                    className="bg-accent-purple text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent-purple/90 transition-all"
                  >
                    📊 View Tournament Stats
                  </Link>
                ) : null}
                {tournament.discord_id && (
                  <a
                    href={`https://${tournament.discord_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-dark-bg-primary hover:bg-dark-bg-hover text-accent-purple px-4 py-3 rounded-lg border border-accent-purple transition-all text-center font-semibold"
                  >
                    💬 Join Discord Server
                  </a>
                )}
              </div>

              {/* Registration Section (Players only, not hosts) */}
              {!isHost() && (
                <div className="mt-6">
                  {isPlayer() ? (
                    (() => {
                      // Check if player is already registered
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

                      // Check if dates are valid
                      if (isNaN(regStart.getTime()) || isNaN(regEnd.getTime())) {
                        return (
                          <div className="w-full bg-dark-bg-primary text-gray-400 py-3 rounded-lg text-center border border-dark-bg-hover">
                            Invalid registration dates
                          </div>
                        );
                      }

                      // Check registration period (handle timezone issues)
                      // Add 5 minute buffer to account for timezone differences and server/client time sync
                      const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
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
                            className="w-full bg-accent-blue text-white py-3 rounded-lg font-bold hover:bg-accent-blue/90 transition-all shadow-glow-blue"
                          >
                            Register for Tournament
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
              <button className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 rounded-md">
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
    </div>
  );
};

export default TournamentDetail;
