import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inviteAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

export default function JoinTeam() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useContext(AuthContext);

  const [invite, setInvite] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoadingInvite(true);
      try {
        const res = await inviteAPI.getInviteDetails(token);
        setInvite(res.data);
      } catch (e) {
        setError(e.response?.data?.error || 'Unable to load invite');
      } finally {
        setLoadingInvite(false);
      }
    };
    load();
  }, [token]);

  const handleAccept = async () => {
    // If not authenticated, send to login with redirect back
    if (!isAuthenticated()) {
      navigate('/player/login', { state: { next: `/join-team/${token}` } });
      return;
    }

    setBusy(true);
    try {
      const res = await inviteAPI.acceptInvite(token);
      setMessage(res.data.message || 'Invite accepted');
      // Optionally redirect to team or dashboard
      setTimeout(() => navigate('/player/dashboard'), 1200);
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Failed to accept invite');
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      const res = await inviteAPI.declineInvite(token);
      setMessage(res.data.message || 'Invite declined');
      setInvite((i) => (i ? { ...i, status: 'declined' } : i));
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to decline invite');
    } finally {
      setBusy(false);
    }
  };

  if (loadingInvite) return <div className="p-6">Loading invite...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="border rounded-lg shadow p-6 bg-white">
        <h2 className="text-xl font-bold mb-2">You have been invited</h2>
        <p className="text-gray-700 mb-4">{`"${invite.team_name}" for ${invite.tournament_name}`}</p>
        <p className="mb-4">
          Captain: <strong>{invite.captain_name}</strong>
        </p>

        {message ? (
          <div className="mb-4 text-green-600">{message}</div>
        ) : (
          <div className="flex gap-3">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
              onClick={handleAccept}
              disabled={busy}
            >
              {busy ? 'Processing...' : 'Accept Invite'}
            </button>

            <button
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
              onClick={handleDecline}
              disabled={busy}
            >
              Decline
            </button>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">Invite status: {invite.status}</p>
      </div>
    </div>
  );
}
