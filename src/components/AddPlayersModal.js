import React, { useState, useEffect } from 'react';
import { authAPI, teamAPI } from '../utils/api';
import useToast from '../hooks/useToast';

const AddPlayersModal = ({ teamId, currentMembersCount, onClose, onUpdate }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          // Use for_team=true to only show players without teams
          const res = await authAPI.searchPlayerUsernames(searchQuery, true);
          setSuggestions(res.data.results || []);
        } catch (err) {
          console.error('Search error:', err);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleInvite = async (playerId, username) => {
    if (currentMembersCount >= 15) {
      showToast('Team is full (max 15 members)', 'warning');
      return;
    }

    try {
      setInvitingId(playerId);
      await teamAPI.invitePlayer(teamId, playerId);
      showToast(`Invitation sent to ${username}`, 'success');
      // Optionally remove from suggestions or show invited status
      setSuggestions((prev) => prev.filter((s) => s.id !== playerId));
      onUpdate();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send invitation', 'error');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1014] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight uppercase">
              Invite Players
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              Search for available players to join your squad
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-all font-mono"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {suggestions.length > 0 ? (
              suggestions.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1e] border border-white/10 flex items-center justify-center font-bold text-white overflow-hidden">
                      {player.profile_picture ? (
                        <img
                          src={player.profile_picture}
                          alt={player.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        player.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">{player.username}</h3>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                        Available
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(player.id, player.username)}
                    disabled={invitingId === player.id}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      invitingId === player.id
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20'
                    }`}
                  >
                    {invitingId === player.id ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-gray-500 text-xs">
                  No available players found for "{searchQuery}"
                </p>
                <p className="text-gray-600 text-[10px] uppercase mt-1 tracking-widest font-bold">
                  Only players not in any team appear here
                </p>
              </div>
            ) : (
              <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-gray-500 text-xs tracking-wide">
                  Enter at least 2 characters to search
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Team Members: {currentMembersCount}/15
          </p>
        </div>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AddPlayersModal;
