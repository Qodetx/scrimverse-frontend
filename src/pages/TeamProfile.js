import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamAPI, leaderboardAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';

const GAME_OPTIONS = [
  { value: 'ALL', label: 'All Games' },
  { value: 'BGMI', label: 'BGMI' },
  { value: 'COD', label: 'Call Of Duty' },
  { value: 'Valorant', label: 'Valorant' },
  { value: 'Freefire', label: 'Free Fire' },
];

const TeamProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchUserData } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pastTournaments, setPastTournaments] = useState([]);
  const [rank, setRank] = useState(null);
  const [gameFilter, setGameFilter] = useState('ALL');

  const fetchTeam = useCallback(async () => {
    try {
      const res = await teamAPI.getTeam(id);
      setTeam(res.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPastTournaments = useCallback(async () => {
    try {
      const res = await teamAPI.getPastTournaments(id);
      setPastTournaments(res.data);
    } catch (error) {
      console.error('Error fetching past tournaments:', error);
      setPastTournaments([]);
    }
  }, [id]);

  const fetchTeamRank = useCallback(async () => {
    try {
      const res = await leaderboardAPI.getTeamRank(id);
      setRank(res.data.tournament_rank || res.data.rank);
    } catch (error) {
      console.error('Error fetching team rank:', error);
      setRank(null);
    }
  }, [id]);

  useEffect(() => {
    fetchTeam();
    fetchPastTournaments();
    fetchTeamRank();
  }, [fetchTeam, fetchPastTournaments, fetchTeamRank]);

  const handleJoinRequest = async () => {
    try {
      await teamAPI.requestJoin(id);
      showToast('Join request sent!', 'success');
      fetchTeam();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to send join request', 'error');
    }
  };

  const handleLeaveTeam = () => {
    setShowLeaveConfirm(true);
  };

  const performLeaveTeam = async () => {
    try {
      const response = await teamAPI.leaveTeam(id);
      await fetchUserData(); // Refresh global user data

      if (response.data.team_deleted) {
        showToast(response.data.message, 'success');
      } else if (response.data.new_captain) {
        showToast(response.data.message, 'success');
      } else {
        showToast('You have left the team', 'success');
      }

      navigate('/player/dashboard');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to leave team', 'error');
    } finally {
      setShowLeaveConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <p className="text-white text-xl">Team not found</p>
      </div>
    );
  }

  const isCaptain = user?.user?.id === team.captain;
  const isMember = team.members.some((m) => m.user?.id === user?.user?.id);

  // Check if player is in ANY permanent team
  const userPermanentTeamId = user?.profile?.current_team?.id;
  const isInAnyPermanentTeam = !!userPermanentTeamId;

  const canJoin =
    !isMember &&
    !isInAnyPermanentTeam &&
    team.members.length < 15 &&
    user?.user?.user_type === 'player';
  const showLeaveButton = isMember;

  // Get game-specific stats
  const getGameStats = () => {
    if (gameFilter === 'ALL') {
      return team.overall_stats || {};
    }
    return team.stats_by_game?.[gameFilter] || {};
  };

  const currentStats = getGameStats();

  return (
    <div className="min-h-screen py-8 px-4 bg-[#0a0a0c] text-white font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Team Header */}
        <div className="relative bg-[#0f1014] border border-white/5 p-8 mb-6 overflow-hidden cyber-card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Logo */}
              <div className="w-32 h-32 rounded-full bg-[#1a1a1e] border-2 border-white/10 flex items-center justify-center text-5xl font-bold text-white shadow-2xl overflow-hidden relative z-10">
                {team.profile_picture ? (
                  <img
                    src={team.profile_picture}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  team.name.charAt(0)
                )}
              </div>

              {/* Text Info */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                    {team.name}
                  </h1>
                  {rank > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full shadow-lg shadow-yellow-500/5">
                      <svg
                        className="w-3.5 h-3.5 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[11px] font-black text-yellow-500 uppercase tracking-wider">
                        Rank #{rank}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 font-medium uppercase tracking-widest text-xs mb-4">
                  {team.description || 'ESTABLISHED SQUAD'}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                    {team.members.length}/15 members
                  </span>
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Public Action Buttons */}
            <div className="flex items-center gap-4">
              {isCaptain && (
                <button
                  onClick={() => navigate('/player/team/dashboard')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2"
                >
                  Manage Team
                </button>
              )}

              {canJoin && (
                <button
                  onClick={handleJoinRequest}
                  disabled={team.user_request_status === 'pending'}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-red-900/20"
                >
                  {team.user_request_status === 'pending' ? 'Requested' : 'Join Request'}
                </button>
              )}

              {showLeaveButton && (
                <button
                  onClick={handleLeaveTeam}
                  className="px-6 py-2.5 bg-transparent hover:bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-500/20 transition-all flex items-center gap-2"
                >
                  Leave Team
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Game Filter and Stats Row */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Game Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1rem 1.5rem',
              background: 'rgba(15, 16, 20, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ color: '#a855f7' }}
              >
                <rect width="20" height="12" x="2" y="6" rx="2" />
                <path d="M6 12h4" />
                <path d="M8 10v4" />
                <path d="M15 13h.01" />
                <path d="M18 11h.01" />
              </svg>
              <span>Team Stats</span>
            </div>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              style={{
                background: 'rgba(24, 24, 27, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '0.625rem 2.5rem 0.625rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                minWidth: '180px',
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                appearance: 'none',
              }}
            >
              {GAME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              className="cyber-card"
              style={{
                background: 'rgba(15, 16, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: '#fbbf24' }}
                >
                  <path d="M6 9H4a2 2 0 0 1 0-4h2" />
                  <path d="M18 9h2a2 2 0 0 0 0-4h-2" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: '#9ca3af',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Tournament Wins
                </span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                {currentStats.tournament_wins || 0}
              </div>
            </div>

            <div
              className="cyber-card"
              style={{
                background: 'rgba(15, 16, 20, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: '#8b5cf6' }}
                >
                  <polyline points="14.5 17.5 3 6 6 3 17.5 14.5" />
                  <line x1="13" y1="19" x2="19" y2="13" />
                  <line x1="16" y1="16" x2="20" y2="20" />
                  <line x1="19" y1="21" x2="20" y2="22" />
                  <line x1="21" y1="19" x2="22" y2="20" />
                </svg>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: '#9ca3af',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Scrim Wins
                </span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                {currentStats.scrim_wins || 0}
              </div>
            </div>

            <div
              className="cyber-card"
              style={{
                background:
                  'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                padding: '1.5rem',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
                      #{currentStats.tournament_rank || 'N/A'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        color: '#9ca3af',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      Tournaments
                    </div>
                  </div>
                  <div
                    style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.1)' }}
                  ></div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
                      #{currentStats.scrim_rank || 'N/A'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        color: '#9ca3af',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      Scrim
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                Global Ranks
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="bg-[#18181b] p-1 flex mb-8 w-full border border-white/5 cyber-card">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'members' ? 'bg-[#0f1014] text-white shadow-lg border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Members ({team.members.length}/15)
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'tournaments' ? 'bg-[#0f1014] text-white shadow-lg border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Past Tournaments
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="relative bg-[#0f1014] border border-white/5 p-6 hover:bg-[#131418] transition-all cursor-pointer group cyber-card"
                onClick={() => {
                  if (member.user?.id === user?.user?.id) {
                    navigate('/player/dashboard');
                  } else if (member.user) {
                    navigate(`/player/profile/${member.user.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl font-black text-black overflow-hidden border-2 border-white/10 group-hover:scale-105 transition-transform">
                    {member.user?.profile_picture ? (
                      <img
                        src={member.user.profile_picture}
                        alt={member.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.username.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate mb-1 group-hover:text-purple-400 transition-colors">
                      {member.username}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${member.is_captain ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-gray-800 text-gray-400 border-white/10'}`}
                    >
                      {member.is_captain ? 'Captain' : 'Member'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tournaments Content */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            {pastTournaments.length > 0 ? (
              pastTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-[#0f1014] border border-white/5 p-6 hover:bg-[#131418] transition-colors cursor-pointer cyber-card"
                  onClick={() =>
                    navigate(
                      tournament.tournament_type === 'scrim'
                        ? `/scrims/${tournament.id}`
                        : `/tournaments/${tournament.id}`
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <svg
                          className="w-6 h-6 text-purple-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg mb-1">{tournament.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-wider">
                          <span>{tournament.date}</span>
                          <span className="text-emerald-400">{tournament.placement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#0f1014] border border-white/5 p-12 text-center cyber-card">
                <p className="text-gray-500">No past tournaments recorded.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={performLeaveTeam}
        title="Leave Team"
        message={
          isCaptain
            ? team.members.length === 1
              ? 'You are the only member. Leaving will delete the team. Continue?'
              : 'Are you sure you want to leave? The next oldest member will become captain.'
            : 'Are you sure you want to leave this team?'
        }
        confirmText="Leave Team"
        type="danger"
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default TeamProfile;
