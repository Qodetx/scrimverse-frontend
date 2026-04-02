import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Trophy,
  Calendar,
  Crown,
  Shield,
  Swords,
  Target,
  Gamepad2,
} from 'lucide-react';
import { teamAPI, leaderboardAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import ConfirmModal from '../../../components/ConfirmModal';
import useToast from '../../../hooks/useToast';
import Toast from '../../../components/Toast';
import Footer from '../../../components/Footer';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

const getRoleIcon = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'igl' || r === 'captain') return <Crown className="h-4 w-4 text-yellow-400" />;
  if (r === 'assaulter' || r === 'fragger') return <Swords className="h-4 w-4 text-red-400" />;
  if (r === 'support') return <Shield className="h-4 w-4 text-blue-400" />;
  if (r === 'scout') return <Target className="h-4 w-4 text-green-400" />;
  return <Gamepad2 className="h-4 w-4 text-muted-foreground" />;
};

const TeamProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchUserData } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleJoinRequest = async () => {
    try {
      await teamAPI.requestJoin(id);
      showToast('Join request sent!', 'success');
      fetchTeam();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to send join request', 'error');
    }
  };

  const performLeaveTeam = async () => {
    try {
      const response = await teamAPI.leaveTeam(id);
      await fetchUserData();
      showToast(response.data.message || 'You have left the team', 'success');
      navigate('/player/dashboard');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to leave team', 'error');
    } finally {
      setShowLeaveConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border/30 bg-card/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-sm">Team Profile</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
          <p className="text-muted-foreground mb-4">This team doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/80 transition-colors"
          >
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isCaptain = user?.user?.id === team.captain;
  const isMember = team.members.some((m) => m.user?.id === user?.user?.id);
  const isInAnyPermanentTeam = !!user?.profile?.current_team?.id;
  const canJoin = !isMember && team.members.length < 15 && user?.user?.user_type === 'player';

  const overallStats = team.overall_stats || {};
  const totalMatches = overallStats.matches_played || overallStats.total_matches || 0;
  const wins = (overallStats.tournament_wins || 0) + (overallStats.scrim_wins || 0);
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;

  const tabClass = (tab) =>
    `flex-1 px-4 py-2 text-xs font-semibold transition-all rounded-md ${
      activeTab === tab
        ? 'bg-gradient-to-r from-purple to-purple-dark text-white shadow'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/30 bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm">Team Profile</span>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Team Header */}
          <div className="cyber-card rounded-xl mb-6 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-xl bg-purple/20 border-2 border-purple/30 flex items-center justify-center text-2xl font-bold text-purple overflow-hidden flex-shrink-0">
                {team.profile_picture ? (
                  <img
                    src={getImageUrl(team.profile_picture)}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  team.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{team.name}</h1>
                  <span className="text-xs bg-purple/20 text-purple border border-purple/30 px-2 py-1 rounded-full font-medium">
                    {team.members.length >= 10
                      ? 'Elite'
                      : team.members.length >= 5
                        ? 'Pro'
                        : 'Growing'}
                  </span>
                </div>
                {team.description && (
                  <p className="text-muted-foreground text-sm mb-3">{team.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {team.members.length}/15 members
                  </span>
                  {team.game && (
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="h-4 w-4" /> {team.game}
                    </span>
                  )}
                  {wins > 0 && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-400 font-semibold">{wins} wins</span>
                    </span>
                  )}
                  {winRate > 0 && (
                    <span>
                      Win Rate: <span className="text-green-400 font-semibold">{winRate}%</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {isCaptain && (
                  <button
                    onClick={() => navigate('/player/team/dashboard')}
                    className="px-4 py-2 text-xs font-semibold bg-purple text-white rounded-lg hover:bg-purple/80 transition-colors"
                  >
                    Manage Team
                  </button>
                )}
                {canJoin && (
                  <button
                    onClick={handleJoinRequest}
                    disabled={team.user_request_status === 'pending'}
                    style={{
                      background:
                        team.user_request_status === 'pending'
                          ? 'transparent'
                          : 'hsl(var(--primary))',
                      color:
                        team.user_request_status === 'pending'
                          ? 'hsl(var(--muted-foreground))'
                          : 'hsl(var(--primary-foreground))',
                      border:
                        team.user_request_status === 'pending'
                          ? '1px solid hsl(var(--border) / 0.4)'
                          : 'none',
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                  >
                    {team.user_request_status === 'pending' ? 'Requested' : 'Join Request'}
                  </button>
                )}
                {isMember && !isCaptain && (
                  <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="px-4 py-2 text-xs font-semibold text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Leave Team
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs — gradient active style matching Lovable */}
          <div className="grid grid-cols-2 max-w-md bg-secondary/30 rounded-lg p-1 mb-6">
            <button onClick={() => setActiveTab('members')} className={tabClass('members')}>
              Team Members
            </button>
            <button onClick={() => setActiveTab('stats')} className={tabClass('stats')}>
              Statistics
            </button>
          </div>

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="cyber-card rounded-xl hover:border-purple/30 transition-all cursor-pointer"
                  onClick={() => {
                    // captain entry has no user wrapper; its id IS the user id
                    const userId = member.is_captain ? member.id : member.user?.id;
                    if (!userId) return;
                    if (userId === user?.user?.id) navigate('/player/dashboard');
                    else navigate(`/player/profile/${userId}`);
                  }}
                >
                  <div className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 border-2 border-purple/20 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
                      {member.user?.profile_picture ? (
                        <img
                          src={getImageUrl(member.user.profile_picture)}
                          alt={member.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        member.username.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {member.is_captain ? getRoleIcon('igl') : getRoleIcon(member.role)}
                        <span className="font-semibold text-sm truncate">{member.username}</span>
                      </div>
                      <span className="text-[10px] border border-border/40 px-2 py-0.5 rounded text-muted-foreground">
                        {member.is_captain ? 'Captain' : member.role || 'Member'}
                      </span>
                    </div>

                    {/* View Profile badge */}
                    <span className="text-[10px] bg-secondary/60 border border-border/40 px-2 py-1 rounded text-muted-foreground flex-shrink-0">
                      View Profile
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="cyber-card rounded-xl">
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple mb-1">{totalMatches}</div>
                    <div className="text-xs text-muted-foreground">Total Matches</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-400 mb-1">{wins}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">{winRate}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple mb-1">{team.members.length}</div>
                    <div className="text-xs text-muted-foreground">Players</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

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
