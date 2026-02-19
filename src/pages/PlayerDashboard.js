import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { tournamentAPI, teamAPI, leaderboardAPI } from '../utils/api';
import TeamManagementModal from '../components/TeamManagementModal';
import EditPlayerProfileModal from '../components/EditPlayerProfileModal';
import PlayerTournamentCard from '../components/PlayerTournamentCard';
import './PlayerDashboard.css';
import { useIsMobile } from '../hooks/use-mobile';

// Helper function to get full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

// ... (Icon components kept same as before)
const TrophyIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4a2 2 0 0 1 0-4h2" />
    <path d="M18 9h2a2 2 0 0 0 0-4h-2" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SwordIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="14.5 17.5 3 6 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="20" y2="22" />
    <line x1="21" y1="19" x2="22" y2="20" />
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

const SearchIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="14"
    height="14"
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

const GAME_OPTIONS = [
  { value: 'ALL', label: 'All Games' },
  { value: 'BGMI', label: 'BGMI' },
  { value: 'COD', label: 'Call Of Duty' },
  { value: 'Valorant', label: 'Valorant' },
  { value: 'Freefire', label: 'Free Fire' },
];

const PlayerDashboard = () => {
  const { user, fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tournamentRegistrations, setTournamentRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manageTeamId, setManageTeamId] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [matchesTab, setMatchesTab] = useState('live'); // 'live', 'upcoming', or 'past'
  const [gameFilter, setGameFilter] = useState('ALL');

  const location = useLocation();

  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();
    fetchInvitations();
  }, []);

  // Check if user logged in via Google and needs to complete profile
  useEffect(() => {
    if (!loading && location.state?.showProfileEdit) {
      // Check if profile is incomplete
      if (!user?.profile?.in_game_name || !user?.profile?.game_id || !user?.user?.phone_number) {
        setShowEditProfileModal(true);
        // Do NOT clear location.state yet — we need the `next` value in onSuccess
      } else if (location.state?.next) {
        // Profile already complete, redirect immediately
        const dest = location.state.next;
        window.history.replaceState({}, document.title);
        navigate(dest);
      }
    }
  }, [loading, location.state, user]);

  // Refetch user data when game filter changes
  useEffect(() => {
    if (!loading) {
      fetchUserData(gameFilter);
    }
  }, [gameFilter]);

  useEffect(() => {
    if (!loading && location.state?.scrollTo === 'team-section') {
      const teamSection = document.getElementById('team-section');
      if (teamSection) {
        setTimeout(() => {
          teamSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Clear the state so it doesn't scroll again on refresh/back navigation
          window.history.replaceState({}, document.title);
        }, 100);
      }
    }
  }, [loading, location.state]);

  const fetchDashboardData = async () => {
    try {
      const [regRes, teamRes] = await Promise.all([
        tournamentAPI.getMyRegistrations(),
        teamAPI.getTeams({ mine: true }),
      ]);
      setTournamentRegistrations(regRes.data.results || regRes.data);
      const teamsData = teamRes.data.results || teamRes.data;
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await teamAPI.getMyInvites();
      setInvitations(res.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleInviteAction = async (inviteId, action) => {
    try {
      await teamAPI.handleInvite(inviteId, action);
      fetchInvitations();
      if (action === 'accept') {
        fetchUserData(); // Refresh global user state to show new team
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error handling invitation:', error);
    }
  };

  const handleCreateTeam = () => {
    navigate('/player/create-team');
  };

  const syncTeams = async () => {
    try {
      const teamRes = await teamAPI.getTeams({ mine: true });
      setTeams(teamRes.data.results || teamRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="player-dashboard flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const profile = user?.profile || {};
  const teamsArray = Array.isArray(teams) ? teams : teams?.results || [];
  const activeTeams = teamsArray.filter((t) => !t.is_temporary);
  const isInTeam = activeTeams.length > 0 || !!profile.current_team;

  return (
    <div className="player-dashboard">
      <div className="dashboard-container">
        {/* Header Section */}
        <header className="profile-header">
          <div className="profile-info-main">
            <div className="profile-avatar-large">
              {user?.user?.profile_picture ? (
                <img
                  src={user.user.profile_picture}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (user?.user?.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="profile-text-info">
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                <h1>{user?.user?.username}</h1>
                {user?.profile?.bio && (
                  <span className="text-gray-500 text-sm italic font-medium border-l-2 border-primary-500/30 pl-3 py-1 mb-2 md:mb-0">
                    {user.profile.bio}
                  </span>
                )}
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                TEAM: {user?.profile?.current_team?.name || 'NO TEAM'}
              </p>
            </div>
          </div>
          <button
            className="settings-btn"
            onClick={() => setShowEditProfileModal(true)}
            title="Edit Profile"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </header>

        {/* Game Filter */}
        <div className="profile-game-filter">
          <div className="game-filter-label">
            <GamepadIcon />
            <span>Game Stats</span>
          </div>
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="game-select-profile"
          >
            {GAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Row (hidden on mobile when user is logged in) */}
        {!isMobile && (
          <div className="stats-row">
            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <GamepadIcon />
              </div>
              <div className="stat-val">{user?.profile?.matches_played || 0}</div>
              <div className="stat-lbl">Matches Played</div>
            </div>

            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <TrophyIcon />
              </div>
              <div className="stat-val">{user?.profile?.tournament_wins || 0}</div>
              <div className="stat-lbl">Tournament Wins</div>
            </div>

            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <SwordIcon />
              </div>
              <div className="stat-val">{user?.profile?.scrim_wins || 0}</div>
              <div className="stat-lbl">Scrim Wins</div>
            </div>

            <div className="player-stat-card holographic cyber-card hover-lift">
              <div className="rank-grid">
                <div className="rank-item">
                  <div className="rank-val">#{user?.profile?.tournament_rank || 'N/A'}</div>
                  <div className="rank-lbl">Tournaments</div>
                </div>
                <div className="v-separator"></div>
                <div className="rank-item">
                  <div className="rank-val">#{user?.profile?.scrim_rank || 'N/A'}</div>
                  <div className="rank-lbl">Scrim</div>
                </div>
              </div>
              <div className="stat-lbl">Global Ranks</div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="dashboard-main-grid">
          {/* Left Column: Registered Matches with Tabs */}
          <div className="dashboard-section-box cyber-card hover-lift">
            <div className="section-header-row">
              <h2 className="flex items-center gap-2">
                <TrophyIcon /> Registered Matches
              </h2>
              <Link to="/tournaments" className="find-more-link">
                Find More <span>›</span>
              </Link>
            </div>

            {/* Tabs */}
            <div className="tournament-tabs">
              <button
                className={`tournament-tab ${matchesTab === 'live' ? 'active' : ''}`}
                onClick={() => setMatchesTab('live')}
              >
                Live
              </button>
              <button
                className={`tournament-tab ${matchesTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setMatchesTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`tournament-tab ${matchesTab === 'past' ? 'active' : ''}`}
                onClick={() => setMatchesTab('past')}
              >
                Past
              </button>
            </div>

            {/* Tournament List with Scrollbar */}
            <div className="tournament-list-scrollable">
              {matchesTab === 'live' ? (
                tournamentRegistrations.filter((r) => {
                  const status = r.tournament?.status || r.tournament_details?.status;
                  return status === 'ongoing';
                }).length > 0 ? (
                  <div className="space-y-4">
                    {tournamentRegistrations
                      .filter((r) => {
                        const status = r.tournament?.status || r.tournament_details?.status;
                        return status === 'ongoing';
                      })
                      .map((reg) => (
                        <PlayerTournamentCard key={reg.id} registration={reg} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-white/5 border border-white/5">
                    <p className="text-sm font-bold uppercase tracking-widest">No live matches</p>
                  </div>
                )
              ) : matchesTab === 'upcoming' ? (
                tournamentRegistrations.filter((r) => {
                  const status = r.tournament?.status || r.tournament_details?.status;
                  return status === 'upcoming';
                }).length > 0 ? (
                  <div className="space-y-4">
                    {tournamentRegistrations
                      .filter((r) => {
                        const status = r.tournament?.status || r.tournament_details?.status;
                        return status === 'upcoming';
                      })
                      .map((reg) => (
                        <PlayerTournamentCard key={reg.id} registration={reg} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-white/5 border border-white/5">
                    <p className="text-sm font-bold uppercase tracking-widest">
                      No upcoming matches
                    </p>
                  </div>
                )
              ) : tournamentRegistrations.filter((r) => {
                  const status = r.tournament?.status || r.tournament_details?.status;
                  return status === 'completed';
                }).length > 0 ? (
                <div className="space-y-4">
                  {tournamentRegistrations
                    .filter((r) => {
                      const status = r.tournament?.status || r.tournament_details?.status;
                      return status === 'completed';
                    })
                    .map((reg) => (
                      <PlayerTournamentCard key={reg.id} registration={reg} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-sm font-bold uppercase tracking-widest">No past matches</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Matches & Activity */}
          <div className="dashboard-section-box matches-card cyber-card hover-lift">
            <div className="section-header-row">
              <h2 className="flex items-center gap-2">
                <CalendarIcon /> Live & Upcoming
              </h2>
            </div>
            <div className="matches-mini-list space-y-4">
              {tournamentRegistrations.some(
                (r) => (r.tournament?.status || r.tournament_details?.status) === 'ongoing'
              ) ? (
                tournamentRegistrations
                  .filter(
                    (r) => (r.tournament?.status || r.tournament_details?.status) === 'ongoing'
                  )
                  .map((reg) => {
                    const t = reg.tournament || reg.tournament_details;
                    return (
                      <Link
                        to={t.event_mode === 'SCRIM' ? `/scrims/${t.id}` : `/tournaments/${t.id}`}
                        key={t.id}
                        className="match-mini-item block hover:bg-white/5 transition-all p-4 border border-white/5 group"
                      >
                        <div className="match-mini-header flex justify-between items-center mb-2">
                          <span className="match-mini-title text-white font-black italic uppercase tracking-tighter group-hover:text-accent-blue transition-colors">
                            {t.title}
                          </span>
                          <span className="match-mini-status px-2 py-0.5 bg-success/10 text-success text-[8px] font-black rounded-md animate-pulse border border-success/30">
                            LIVE
                          </span>
                        </div>
                        <div className="match-mini-footer flex justify-between items-center">
                          <span className="match-time text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-widest">
                            {t.event_mode} • Round {t.current_round}
                          </span>
                          <span className="match-vs text-[10px] font-black text-accent-blue uppercase italic tracking-widest">
                            Enter Arena ›
                          </span>
                        </div>
                      </Link>
                    );
                  })
              ) : (
                <div className="text-center py-20 bg-white/5 border border-white/5">
                  <div className="text-4xl mb-4 opacity-20">📡</div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
                    All Systems Nominal
                  </p>
                  <p className="text-[8px] font-bold text-gray-700 uppercase tracking-widest mt-1 text-center">
                    No live matches currently
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="action-grid">
          <div
            className="action-card cyber-card hover-lift"
            onClick={() => navigate('/tournaments')}
          >
            <div className="action-icon-circle">
              <SearchIcon />
            </div>
            <h3>Find Tournaments</h3>
            <p>Browse and join upcoming tournaments</p>
          </div>
          <div className="action-card cyber-card hover-lift" onClick={() => navigate('/scrims')}>
            <div className="action-icon-circle">
              <SwordIcon />
            </div>
            <h3>Join Scrims</h3>
            <p>Practice matches with other teams</p>
          </div>
          <div className="action-card cyber-card hover-lift" onClick={() => navigate('/search')}>
            <div className="action-icon-circle">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3>Search</h3>
            <p>Find players and teams</p>
          </div>
          <div
            className="action-card cyber-card hover-lift"
            onClick={() => navigate('/leaderboard')}
          >
            <div className="action-icon-circle">
              <TrophyIcon />
            </div>
            <h3>Leaderboards</h3>
            <p>Check rankings and standings</p>
          </div>
        </div>

        {/* Team Invitations Section */}
        {invitations.length > 0 && (
          <section className="invitations-section mb-8">
            <div className="section-header flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <UsersIcon />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Team Invitations
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invitations.map((invite) => (
                <div key={invite.id} className="cyber-card hover-lift p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg border border-white/10 shadow-lg">
                      {invite.team_details?.profile_picture ? (
                        <img
                          src={getImageUrl(invite.team_details.profile_picture)}
                          alt={invite.team_details.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        invite.team_details?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{invite.team_details?.name}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Wants you in their squad
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInviteAction(invite.id, 'accept')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-green-500/20 shadow-lg shadow-green-900/10"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleInviteAction(invite.id, 'reject')}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all border border-white/10"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Your Squad Section */}
        <section className="squad-section" id="team-section">
          <div className="squad-header">
            <h2 className="squad-title">
              <UsersIcon /> Your Squad
            </h2>
            {!isInTeam && (
              <div className="squad-header-actions">
                <button className="squad-header-btn" onClick={handleCreateTeam}>
                  + Create Team
                </button>
              </div>
            )}
          </div>

          {isInTeam ? (
            <div className="space-y-6">
              {activeTeams.length > 0 ? (
                activeTeams.map((team) => (
                  <div
                    key={team.id}
                    className="cyber-card hover-lift p-8 transition-all duration-300 mb-6"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden">
                          {team.profile_picture ? (
                            <img
                              src={getImageUrl(team.profile_picture)}
                              alt={team.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl font-bold text-white">
                              {team.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            {team.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                              {team.members?.length || 0}{' '}
                              {team.members?.length === 1 ? 'Member' : 'Members'}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span>
                              Captain:{' '}
                              <span className="text-white font-medium">
                                {team.captain_details?.username}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
                        Active
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/20 p-4 text-center hover:border-blue-500/40 transition-all">
                        <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-medium">
                          Matches
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {team.total_matches || 0}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-500/20 p-4 text-center hover:border-green-500/40 transition-all">
                        <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-medium">
                          Wins
                        </div>
                        <div className="text-3xl font-bold text-emerald-400">{team.wins || 0}</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 border border-yellow-500/20 p-4 text-center hover:border-yellow-500/40 transition-all">
                        <div className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-medium">
                          Win Rate
                        </div>
                        <div className="text-3xl font-bold text-amber-400">
                          {team.win_rate || 0}%
                        </div>
                      </div>
                    </div>

                    {/* Team Members Preview */}
                    <div className="border-t border-white/10 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                          Roster
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          {team.members?.length || 0} / 15
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-6">
                        {team.members?.slice(0, 6).map((member, idx) => (
                          <div key={idx} className="relative group" title={member.username}>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border border-white/10 shadow-lg">
                              {member.user?.profile_picture ? (
                                <img
                                  src={member.user.profile_picture}
                                  alt={member.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                member.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            {member.is_captain && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#111114] flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                                  <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                        {team.members?.length > 6 && (
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 font-semibold text-xs">
                            +{team.members.length - 6}
                          </div>
                        )}
                      </div>
                      <button
                        className="w-full py-4 bg-transparent border-2 border-primary-500/30 hover:border-primary-500 hover:bg-primary-500/10 text-sm font-bold transition-all text-primary-400 hover:text-primary-300 tracking-widest uppercase relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/player/team/dashboard/${team.id}`);
                        }}
                      >
                        <span className="relative z-10">Manage Team</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#0f1419] border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <p className="text-gray-400 mb-4">Loading your team details...</p>
                  <button
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold"
                    onClick={() => navigate(`/player/team/dashboard/${profile.current_team?.id}`)}
                  >
                    Go to {profile.current_team.name}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="squad-empty-state">
              <div className="empty-state-icon">
                <UsersIcon />
              </div>
              <p className="empty-state-text">You haven't created a team yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Create a team to compete in tournaments and scrims
              </p>
              <button className="create-first-btn" onClick={handleCreateTeam}>
                + Create Your First Team
              </button>
            </div>
          )}
        </section>
      </div>

      {manageTeamId && (
        <TeamManagementModal
          teamId={manageTeamId}
          onClose={() => setManageTeamId(null)}
          onUpdate={syncTeams}
        />
      )}

      <EditPlayerProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        player={{ ...user?.user, player_profile: user?.profile }}
        // If user has no phone number (e.g. signed up via Google), make phone mandatory
        requirePhone={!user?.user?.phone_number}
        onSuccess={async () => {
          await fetchUserData();
          setShowEditProfileModal(false);
          // If opened after Google signup with a pending invite link, redirect there
          const redirectNext = location.state?.next;
          if (redirectNext) {
            window.history.replaceState({}, document.title);
            navigate(redirectNext);
          }
        }}
      />
    </div>
  );
};

export default PlayerDashboard;
