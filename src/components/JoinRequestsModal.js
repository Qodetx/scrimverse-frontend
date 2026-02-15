import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../utils/api';
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';

const JoinRequestsModal = ({ teamId, onClose, onUpdate }) => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [teamId]);

  const fetchRequests = async () => {
    try {
      const res = await teamAPI.getJoinRequests(teamId);
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await teamAPI.acceptRequest(teamId, requestId);
      showToast('Request accepted!', 'success');
      fetchRequests();
      onUpdate();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to accept request', 'error');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await teamAPI.rejectRequest(teamId, requestId);
      showToast('Request rejected', 'success');
      fetchRequests();
      onUpdate();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to reject request', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#1a1f35] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Join Requests</h2>
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

        {/* Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p className="text-gray-400">No pending join requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center justify-between"
                >
                  <div
                    className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      request.player_details.id &&
                      navigate(`/player/profile/${request.player_details.id}`)
                    }
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                      {request.player_details.username.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{request.player_details.username}</h3>
                      <p className="text-sm text-gray-400">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default JoinRequestsModal;
