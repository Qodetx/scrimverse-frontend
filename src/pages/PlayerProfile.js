import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authAPI, tournamentAPI, teamAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import EditPlayerProfileModal from '../components/EditPlayerProfileModal';
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();
  const [player, setPlayer] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const isOwnProfile = user?.user?.id === parseInt(id);

  // Redirect if viewing own profile
  useEffect(() => {
    if (isOwnProfile) {
      navigate('/player/dashboard');
    }
  }, [isOwnProfile, navigate]);

  const fetchPlayerData = useCallback(async () => {
    try {
      // Use getPlayerProfile (returns profile or { user, profile })
      const playerRes = await authAPI.getPlayerProfile(id);
      let userData = null;

      // Normalize API shapes:
      // - Case A: API returns { user, profile }
      // - Case B: API returns profile object directly
      // - Case C: API returns a mixed object with top-level profile fields and a nested `user` object
      if (playerRes.data) {
        const data = playerRes.data;

        if (data.user && data.profile) {
          // Case A: explicit user + profile
          userData = {
            ...data.user,
            player_profile: data.profile,
          };
        } else if (
          data.user &&
          (data.matches_played !== undefined || data.current_team !== undefined)
        ) {
          // Case C: mixed shape (profile fields at top-level + nested user)
          const { user, ...profileLike } = data;
          userData = {
            ...user,
            player_profile: profileLike,
          };
        } else {
          // Case B: profile object only
          const profile = data;
          userData = {
            username: profile.username || profile.user?.username || `player${profile.id}`,
            profile_picture: profile.profile_picture || profile.user?.profile_picture || null,
            player_profile: profile,
          };
        }
      }

      setPlayer(userData);

      // Fetch registrations publicly
      try {
        const regRes = await tournamentAPI.getPlayerRegistrations(id, { confirmed: 'true' });
        setRegistrations(regRes.data.results || regRes.data || []);
      } catch (err) {
        // Registrations not available
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      setError(error.response?.data?.error || 'Failed to load player profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlayerData();
  }, [fetchPlayerData]);

  const handleEditSuccess = (updatedData) => {
    setPlayer({
      ...player,
      ...updatedData,
    });
  };

  const handleInvite = async () => {
    if (!user?.profile?.current_team?.is_captain) return;

    setIsInviting(true);
    try {
      await teamAPI.invitePlayer(user.profile.current_team.id, id);
      showToast('Invitation sent successfully!', 'success');
      // Update local state to reflect the invite
      setPlayer((prev) => ({
        ...prev,
        player_profile: {
          ...prev.player_profile,
          invitation_status: 'pending',
        },
      }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send invitation', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${baseUrl}${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500/20 border-t-amber-500"></div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">{error || 'Player not found'}</h2>
          <Link to="/search" className="text-amber-500 hover:text-amber-400">
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  const winRate =
    player.player_profile?.matches_played > 0
      ? Math.round(
          (((player.player_profile?.tournament_wins || 0) +
            (player.player_profile?.scrim_wins || 0)) /
            player.player_profile?.matches_played) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#000000] text-gray-300 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="bg-[#111114] border border-white/5 p-6 md:p-10 relative overflow-hidden cyber-card hover-lift">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-4 border-white/10 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                {player.profile_picture ? (
                  <img
                    src={getImageUrl(player.profile_picture)}
                    alt={player.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  player.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 border-4 border-[#111114]"></div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                  <h1 className="text-4xl font-black text-white">{player.username}</h1>
                  {player.player_profile?.bio && (
                    <span className="text-gray-500 text-sm italic font-medium border-l-2 border-primary-500/30 pl-3 py-1">
                      {player.player_profile.bio}
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-400 font-bold uppercase tracking-widest">
                  TEAM:{' '}
                  <span className="text-white">
                    {player.player_profile?.current_team?.name || 'NO TEAM'}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {user?.profile?.current_team?.is_captain && !player.player_profile?.current_team && (
                <button
                  onClick={handleInvite}
                  disabled={isInviting || player.player_profile?.invitation_status === 'pending'}
                  className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all shadow-xl disabled:opacity-70 ${
                    player.player_profile?.invitation_status === 'pending'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-amber-500/5'
                      : 'bg-white hover:bg-gray-200 text-black shadow-white/5'
                  }`}
                >
                  {isInviting
                    ? 'Sending...'
                    : player.player_profile?.invitation_status === 'pending'
                      ? 'Invited'
                      : 'Invite to Team'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Key Stats */}
            <div className="bg-[#111114] border border-white/5 p-6 cyber-card hover-lift">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Key Stats
              </h2>

              <div className="space-y-4">
                <div className="bg-[#1c1c21] p-6 text-center border border-white/5">
                  <div className="text-3xl font-black text-white">
                    {player.player_profile?.matches_played || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                    Matches Played
                  </div>
                </div>
                <div className="bg-[#1c1c21] p-6 text-center border border-white/5">
                  <div className="text-3xl font-black text-green-500">
                    {player.player_profile?.tournament_wins || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                    Tournament Wins
                  </div>
                </div>
                <div className="bg-[#1c1c21] p-6 text-center border border-white/5">
                  <div className="text-3xl font-black text-amber-500">
                    {player.player_profile?.scrim_wins || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                    Scrim Wins
                  </div>
                </div>
              </div>
            </div>

            {/* Team & Teammates */}
            <div className="bg-[#111114] border border-white/5 p-6 cyber-card hover-lift">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Team & Teammates
              </h2>

              {player.player_profile?.current_team ? (
                <div className="space-y-6">
                  <Link
                    to={`/teams/${player.player_profile.current_team.id}`}
                    className="block bg-[#1c1c21] p-4 border border-white/5 hover:border-amber-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all overflow-hidden">
                        {player.player_profile.current_team.profile_picture ? (
                          <img
                            src={getImageUrl(player.player_profile.current_team.profile_picture)}
                            alt={player.player_profile.current_team.name}
                            className="w-full h-full object-cover"
                          />
                        ) : player.player_profile.current_team.name ? (
                          <span className="font-bold text-sm">
                            {player.player_profile.current_team.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-black uppercase tracking-tight">
                          {player.player_profile.current_team.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          Current Team
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                      Teammates
                    </div>
                    <div className="space-y-3">
                      {(player.player_profile.current_team.members || []).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                              {member.user?.profile_picture ? (
                                <img
                                  src={getImageUrl(member.user.profile_picture)}
                                  alt={member.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                member.username?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                                {member.username}
                              </div>
                              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                                {member.is_captain ? 'Captain' : 'Member'}
                              </div>
                            </div>
                          </div>
                          <Link
                            to={`/player/profile/${member.id}`}
                            className="px-3 py-1 bg-[#1c1c21] text-[10px] font-black text-gray-400 uppercase tracking-widest border border-white/5 hover:bg-white hover:text-black transition-all"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-[#1c1c21] border border-dashed border-white/10">
                  <div className="text-gray-600 font-bold uppercase tracking-widest text-xs">
                    No Team Joined
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Match History */}
          <div className="lg:col-span-2">
            <div className="bg-[#111114] border border-white/5 p-6 h-full cyber-card hover-lift">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Match History
              </h2>

              <div className="space-y-4">
                {registrations.length > 0 ? (
                  registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="bg-[#1c1c21] border border-white/5 p-5 hover:border-amber-500/30 transition-all group cursor-pointer"
                      onClick={() => navigate(`/tournaments/${reg.tournament?.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <svg
                              className="w-6 h-6 text-purple-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg mb-1 group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                              {reg.tournament?.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
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
                                {new Date(reg.registered_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              <span>•</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20`}
                              >
                                {reg.tournament?.event_mode || 'TOURNAMENT'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                            reg.tournament?.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : reg.tournament?.status === 'ongoing'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {reg.tournament?.status === 'completed'
                            ? 'Completed'
                            : reg.tournament?.status === 'ongoing'
                              ? 'Live'
                              : 'Upcoming'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#1c1c21] border border-white/5 p-12 text-center">
                    <div className="w-16 h-16 bg-[#111114] rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">No Match History</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto uppercase tracking-widest">
                      Participate in tournaments to see your stats here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditPlayerProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        player={player}
        onSuccess={handleEditSuccess}
      />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default PlayerProfile;
