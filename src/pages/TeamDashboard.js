import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teamAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import JoinRequestsModal from '../components/JoinRequestsModal';
import EditTeamModal from '../components/EditTeamModal';
import ConfirmModal from '../components/ConfirmModal';
import AddPlayersModal from '../components/AddPlayersModal';
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';

const TeamDashboard = () => {
  const navigate = useNavigate();
  const { teamId: teamIdParam } = useParams();
  const { user, fetchUserData } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAddPlayersModal, setShowAddPlayersModal] = useState(false);
  const [pastTournaments, setPastTournaments] = useState([]);

  // Use team ID from URL param if present, else fall back to user's current team
  const teamId = teamIdParam || user?.profile?.current_team?.id;

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await teamAPI.getTeam(teamId);
      setTeam(res.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const fetchPastTournaments = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await teamAPI.getPastTournaments(teamId);
      setPastTournaments(res.data);
    } catch (error) {
      console.error('Error fetching past tournaments:', error);
      setPastTournaments([]);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      fetchTeam();
      fetchPastTournaments();
    } else {
      setLoading(false);
    }
  }, [teamId, fetchTeam, fetchPastTournaments]);

  const handleMemberAction = async (action, memberId) => {
    try {
      if (action === 'appoint') {
        await teamAPI.appointCaptain(teamId, memberId);
        showToast('Captain appointed successfully', 'success');
      } else if (action === 'remove') {
        await teamAPI.removeMember(teamId, memberId);
        showToast('Member removed successfully', 'success');
      }
      fetchTeam();
      setShowMemberMenu(null);
    } catch (error) {
      showToast(error.response?.data?.error || 'Action failed', 'error');
    }
  };

  const handleLeaveTeam = () => {
    setShowLeaveConfirm(true);
  };

  const performLeaveTeam = async () => {
    try {
      const response = await teamAPI.leaveTeam(teamId);
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

  if (!teamId || !team) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0c] text-center px-4">
        <h2 className="text-white text-3xl font-black mb-4 uppercase tracking-tighter">
          No Team Found
        </h2>
        <p className="text-gray-500 max-w-md mb-8">
          You are not currently part of any team. Create one to start your journey!
        </p>
        <button
          onClick={() => navigate('/player/create-team')}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-primary-900/20"
        >
          Create Team
        </button>
      </div>
    );
  }

  const isCaptain = user?.user?.id === team.captain;

  return (
    <div className="min-h-screen py-8 px-4 bg-[#0a0a0c] text-white font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Team Header Card */}
        <div className="relative bg-[#0f1014] border border-white/5 p-8 mb-6 overflow-hidden cyber-card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

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
                <h2 className="text-4xl font-black text-white tracking-tight uppercase mb-2">
                  {team.name}
                </h2>
                <p className="text-gray-500 font-medium uppercase tracking-widest text-xs mb-4">
                  {team.description || 'SQUAD MANAGEMENT'}
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

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full md:min-w-[200px] md:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {isCaptain && (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="w-full sm:flex-1 px-6 py-2.5 bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowRequestsModal(true)}
                      className="w-full sm:flex-1 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-red-900/20"
                    >
                      Requests{' '}
                      {team.pending_requests_count > 0 && `(${team.pending_requests_count})`}
                    </button>
                  </>
                )}
                {!isCaptain && (
                  <button
                    onClick={handleLeaveTeam}
                    className="w-full px-6 py-2.5 bg-transparent hover:bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Leave Team
                  </button>
                )}
              </div>

              {isCaptain && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowAddPlayersModal(true)}
                    disabled={team.members.length >= 15}
                    className="w-full px-6 py-2.5 bg-black hover:bg-purple-500/5 disabled:bg-gray-900/50 disabled:text-gray-600 disabled:border-gray-800 text-purple-500 border border-purple-500/50 hover:border-purple-500 text-xs font-black uppercase tracking-[0.2em] rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    {team.members.length >= 15 ? 'Team Full (15/15)' : 'Add Players'}
                  </button>
                  <button
                    onClick={handleLeaveTeam}
                    className="w-full px-6 py-2.5 bg-transparent hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-500/10 transition-all flex items-center justify-center gap-2 opacity-50 hover:opacity-100"
                  >
                    Leave Team
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#18181b] p-1 flex mb-8 w-full border border-white/5 cyber-card">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'members' ? 'bg-[#0f1014] text-white shadow-lg border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Team Members ({team.members.length}/15)
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'tournaments' ? 'bg-[#0f1014] text-white shadow-lg border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Team History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="relative bg-[#0f1014] border border-purple-500/10 p-6 hover:border-purple-500/30 transition-all group cyber-card"
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl font-black text-black overflow-hidden border-2 border-white/10">
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
                    {member.is_captain && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 border border-black shadow-lg">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate mb-1">
                      {member.username}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${member.is_captain ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-gray-800 text-gray-400 border-white/10'}`}
                      >
                        {member.is_captain ? 'Captain' : 'Member'}
                      </span>
                      {member.user?.id === user?.user?.id && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {isCaptain && member.user?.id !== user?.user?.id && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowMemberMenu(showMemberMenu === member.id ? null : member.id)
                        }
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z"></path>
                        </svg>
                      </button>
                      {showMemberMenu === member.id && (
                        <div className="absolute right-0 top-full mt-2 bg-[#18181b] border border-white/10 rounded-lg shadow-2xl z-20 min-w-[160px] py-1">
                          {!member.is_captain && (
                            <button
                              onClick={() => handleMemberAction('appoint', member.id)}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 uppercase tracking-wide transition-all"
                            >
                              Appoint Captain
                            </button>
                          )}
                          <button
                            onClick={() => handleMemberAction('remove', member.id)}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-500/10 uppercase tracking-wide transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            {pastTournaments.length > 0 ? (
              pastTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-[#0f1014] border border-white/5 p-6 hover:bg-[#131418] transition-colors cursor-pointer cyber-card"
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
                          <span>•</span>
                          <span className="text-purple-400">{tournament.placement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#0f1014] border border-white/5 p-12 text-center cyber-card">
                <p className="text-gray-500">No tournament history yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showRequestsModal && (
        <JoinRequestsModal
          teamId={teamId}
          onClose={() => setShowRequestsModal(false)}
          onUpdate={fetchTeam}
        />
      )}
      {showEditModal && (
        <EditTeamModal team={team} onClose={() => setShowEditModal(false)} onUpdate={fetchTeam} />
      )}
      {showAddPlayersModal && (
        <AddPlayersModal
          teamId={teamId}
          currentMembersCount={team.members.length}
          onClose={() => setShowAddPlayersModal(false)}
          onUpdate={fetchTeam}
        />
      )}
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

export default TeamDashboard;
