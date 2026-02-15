import React, { useState, useEffect } from 'react';
import { teamAPI } from '../utils/api';
import ConfirmModal from './ConfirmModal';

const TeamManagementModal = ({ teamId, onClose, onUpdate }) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [error, setError] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    type: 'danger',
  });

  const showConfirm = (config) => {
    setConfirmConfig({
      ...config,
      isOpen: true,
    });
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await teamAPI.getTeam(teamId);
      setTeam(res.data);
    } catch (err) {
      console.error('Error fetching team:', err);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberUsername.trim()) return;

    try {
      setError('');
      await teamAPI.addMember(teamId, newMemberUsername);
      setNewMemberUsername('');
      fetchTeam();
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = (memberId) => {
    showConfirm({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the team?',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          await teamAPI.removeMember(teamId, memberId);
          fetchTeam();
          onUpdate();
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to remove member');
        }
      },
    });
  };

  const handleTransferCaptaincy = (memberId) => {
    showConfirm({
      title: 'Transfer Captaincy',
      message: 'Are you sure you want to transfer captaincy? You will no longer be the captain.',
      confirmText: 'Transfer',
      onConfirm: async () => {
        try {
          await teamAPI.transferCaptaincy(teamId, memberId);
          fetchTeam();
          onUpdate();
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to transfer captaincy');
        }
      },
    });
  };

  const handleLeaveTeam = () => {
    const isAlone = team?.members?.length === 1;
    showConfirm({
      title: 'Leave Team',
      message: isAlone
        ? 'You are the only member. Leaving will delete the team. Continue?'
        : 'Are you sure you want to leave the team? The next oldest member will become captain.',
      confirmText: isAlone ? 'Delete Team' : 'Leave Team',
      onConfirm: async () => {
        try {
          const response = await teamAPI.leaveTeam(teamId);

          // Show success message
          if (response.data.team_deleted) {
            alert(response.data.message);
          } else if (response.data.new_captain) {
            alert(response.data.message);
          } else {
            alert('Successfully left the team');
          }

          onClose();
          onUpdate();
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to leave team');
        }
      },
    });
  };

  if (!teamId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-bg-card w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{team?.name || 'Manage Team'}</h2>
            <p className="text-gray-400 text-sm">Squad Management & Roster</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Add Member Form */}
              <form
                onSubmit={handleAddMember}
                className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5"
              >
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Add New Member
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    placeholder="Enter player username"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-all font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                  >
                    <span>+</span> Add
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest">
                  Max 15 players per team
                </p>
              </form>

              {/* Members List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Team Roster ({team?.members?.length}/15)
                </h3>
                {team?.members?.map((member) => (
                  <div
                    key={member.id}
                    className="group flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${member.is_captain ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-primary-500/20 text-primary-500 border border-primary-500/30'}`}
                      >
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{member.username}</span>
                          {member.is_captain && (
                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                              Captain
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {member.user ? 'Registered User' : 'Temporary Entry'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {member.is_captain && (
                        <button
                          onClick={handleLeaveTeam}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Leave Team"
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      )}
                      {!member.is_captain && member.user && (
                        <button
                          onClick={() => handleTransferCaptaincy(member.id)}
                          className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                          title="Make Captain"
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                          </svg>
                        </button>
                      )}
                      {!member.is_captain && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-all"
          >
            Done
          </button>
        </div>

        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          onClose={closeConfirm}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          type={confirmConfig.type}
        />
      </div>
    </div>
  );
};

export default TeamManagementModal;
