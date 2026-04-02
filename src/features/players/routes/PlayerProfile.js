import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Target, Flame, Users, Calendar, Circle, Gamepad2 } from 'lucide-react';
import { authAPI, tournamentAPI, teamAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import EditPlayerProfileModal from '../ui/EditPlayerProfileModal';
import useToast from '../../../hooks/useToast';
import Toast from '../../../components/Toast';

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
  const [visibleCount, setVisibleCount] = useState(8);
  const PAGE_SIZE = 8;

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Player Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The player profile you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/80 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Helper to get rank color
  const getRankColor = (rank) => {
    if (!rank) return 'bg-gray-500 text-white';
    const lowerRank = rank.toLowerCase();
    if (lowerRank.includes('elite'))
      return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black';
    if (lowerRank.includes('pro')) return 'bg-gradient-to-r from-purple to-purple-dark text-white';
    if (lowerRank.includes('advanced'))
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
  };

  // Helper to get status color
  const getStatusColor = (status) => {
    if (!status) return 'text-muted-foreground';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('active')) return 'text-green-500';
    if (lowerStatus.includes('recently')) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — serves as page header (no Navbar when logged in) */}
      <div className="border-b border-border/30 bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm">Player Profile</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Profile Header */}
        <div className="cyber-card rounded-xl mb-6 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-purple/40 to-blue-600 border-2 border-purple/30 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                {player.profile_picture ? (
                  <img
                    src={getImageUrl(player.profile_picture)}
                    alt={player.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  player.username?.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold">{player.username}</h1>
                {player.player_profile?.rank && (
                  <span
                    className={`${getRankColor(player.player_profile.rank)} border-0 text-xs px-2 py-1 rounded-full font-medium`}
                  >
                    {player.player_profile.rank}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {player.player_profile?.in_game_name && (
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="h-3.5 w-3.5" /> IGN:{' '}
                    <span className="text-foreground font-medium">
                      {player.player_profile.in_game_name}
                    </span>
                  </span>
                )}
                {player.player_profile?.preferred_game && (
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" /> {player.player_profile.preferred_game}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Key Stats */}
            <div className="cyber-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/20">
                <Trophy className="h-4 w-4 text-purple" />
                <h2 className="text-sm font-bold">Key Stats</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-secondary/20 rounded-lg">
                  <div className="text-xl font-bold text-purple">
                    {player.player_profile?.matches_played || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Total Matches</div>
                </div>
                <div className="text-center p-3 bg-secondary/20 rounded-lg">
                  <div className="text-xl font-bold text-green-400">
                    {player.player_profile?.tournament_wins || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Wins</div>
                </div>
                <div className="text-center p-3 bg-secondary/20 rounded-lg">
                  <div className="text-xl font-bold text-yellow-400">
                    {player.player_profile?.matches_played > 0
                      ? Math.round(
                          (((player.player_profile?.tournament_wins || 0) +
                            (player.player_profile?.scrim_wins || 0)) /
                            player.player_profile.matches_played) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-[10px] text-muted-foreground">Win Rate</div>
                </div>
              </div>
              {/* Game ID */}
              <div className="mt-3 p-3 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Gamepad2 className="h-3.5 w-3.5 text-purple" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {player.player_profile?.preferred_game || 'Gaming'}
                  </span>
                </div>
                <p className="text-sm font-bold">{player.player_profile?.in_game_name || 'N/A'}</p>
              </div>
            </div>

            {/* Team & Teammates */}
            <div className="cyber-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/20">
                <Users className="h-4 w-4 text-purple" />
                <h2 className="text-sm font-bold">Team & Teammates</h2>
              </div>
              {player.player_profile?.current_team ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2.5 bg-secondary/20 rounded-lg">
                    <div className="h-9 w-9 rounded-full bg-purple/20 flex items-center justify-center">
                      <Flame className="h-4 w-4 text-purple" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {player.player_profile.current_team.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Current Team</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground mb-1.5">Teammates</div>
                    {(player.player_profile.current_team.members || []).map((teammate) => (
                      <Link
                        key={teammate.id}
                        to={`/player/profile/${teammate.id}`}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden flex-shrink-0">
                          {teammate.user?.profile_picture ? (
                            <img
                              src={getImageUrl(teammate.user.profile_picture)}
                              alt={teammate.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            teammate.username?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{teammate.username}</div>
                        </div>
                        <span className="text-[10px] border border-border/40 px-2 py-0.5 rounded text-muted-foreground flex-shrink-0">
                          View
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Not in a team</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Match History */}
          <div className="lg:col-span-2">
            <div className="cyber-card rounded-xl p-4 flex flex-col" style={{ maxHeight: '520px' }}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/20 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple" />
                  <h2 className="text-sm font-bold">Match History</h2>
                </div>
                {registrations.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {registrations.length} total
                  </span>
                )}
              </div>
              {registrations.length > 0 ? (
                <>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b border-border/20">
                          <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                            Tournament
                          </th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">
                            Game
                          </th>
                          <th className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">
                            Status
                          </th>
                          <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.slice(0, visibleCount).map((reg) => (
                          <tr
                            key={reg.id}
                            className="border-b border-border/10 hover:bg-secondary/10"
                          >
                            <td className="py-2 px-2 font-medium">
                              {reg.tournament?.title || reg.tournament?.name || 'Tournament'}
                            </td>
                            <td className="py-2 px-2 text-center text-xs">
                              {reg.tournament?.game_name || reg.tournament?.game_title || '-'}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="text-[10px] bg-purple/20 text-purple px-2 py-1 rounded">
                                {reg.status || 'Registered'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right text-xs text-muted-foreground">
                              {new Date(reg.registered_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {visibleCount < registrations.length && (
                    <div className="flex-shrink-0 pt-3 border-t border-border/20 mt-2 text-center">
                      <button
                        onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-1.5 rounded-lg hover:bg-secondary/30"
                      >
                        Show more ({Math.min(PAGE_SIZE, registrations.length - visibleCount)} more)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No match history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
