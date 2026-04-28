import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { inviteAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';

export default function JoinTeam() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const autoDecline = searchParams.get('action') === 'decline';
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useContext(AuthContext);

  const [invite, setInvite] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  // If authenticated but phone not verified, redirect to setup first then come back
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated() && !user?.user?.phone_verified) {
      navigate('/player/setup', { state: { next: `/join-team/${token}` }, replace: true });
    }
  }, [loading, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch invite whenever the token changes OR auth loading settles
  // This fixes the bug where the accept/decline form disappears after login redirect:
  // after redirect, AuthContext briefly sets loading=true while restoring auth from
  // storage; we must wait for that to finish before fetching the invite.
  useEffect(() => {
    if (loading) return; // Wait for auth to finish settling after login redirect
    const load = async () => {
      setLoadingInvite(true);
      setError(null);
      setMessage(null);
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
  }, [token, loading]); // `loading` dep ensures re-run once auth settles after login redirect

  // Auto-decline when ?action=decline is in the URL (clicked Decline in email)
  useEffect(() => {
    if (!autoDecline || loadingInvite || !invite || invite.status !== 'pending') return;
    const doDecline = async () => {
      setBusy(true);
      try {
        const res = await inviteAPI.declineInvite(token);
        setMessage(res.data.message || 'Invite declined');
        setInvite((i) => (i ? { ...i, status: 'rejected' } : i));
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to decline invite');
      } finally {
        setBusy(false);
      }
    };
    doDecline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDecline, loadingInvite, invite?.status]);

  const handleAccept = async () => {
    if (!isAuthenticated()) {
      navigate('/player/login', { state: { next: `/join-team/${token}` } });
      return;
    }

    if (!user?.user?.phone_verified) {
      navigate('/player/setup', { state: { next: `/join-team/${token}` } });
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

  if (loadingInvite || (autoDecline && !message && !error))
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          {autoDecline ? 'Declining invite...' : 'Loading invite...'}
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={() => navigate('/')} className="text-sm text-muted-foreground underline">
            Go to Home
          </button>
        </div>
      </div>
    );

  const alreadyActed =
    invite.status === 'accepted' || invite.status === 'rejected' || invite.status === 'expired';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="max-w-md w-full rounded-2xl p-8 space-y-6"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border) / 0.4)',
        }}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <p
            className="text-xs font-semibold tracking-widest"
            style={{ color: 'hsl(var(--accent))' }}
          >
            SCRIMVERSE
          </p>
          <h2 className="text-2xl font-bold text-foreground">Team Invitation</h2>
        </div>

        {/* Details */}
        <div
          className="rounded-xl p-4 space-y-2 text-sm"
          style={{ background: 'hsl(var(--secondary) / 0.4)' }}
        >
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground shrink-0">Team</span>
            <span className="font-semibold text-foreground text-right">{invite.team_name}</span>
          </div>
          {invite.tournament_name && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Tournament</span>
              <span className="font-semibold text-foreground text-right">
                {invite.tournament_name}
              </span>
            </div>
          )}
          {invite.captain_name && invite.captain_name !== 'Unknown' && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Captain</span>
              <span className="font-semibold text-foreground text-right">
                {invite.captain_name}
              </span>
            </div>
          )}
        </div>

        {/* Result message */}
        {message && (
          <div
            className="rounded-lg px-4 py-3 text-center text-sm font-medium"
            style={{
              background:
                invite.status === 'accepted' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              color: invite.status === 'accepted' ? 'rgb(74,222,128)' : 'rgb(248,113,113)',
              border: `1px solid ${invite.status === 'accepted' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {message}
          </div>
        )}

        {/* Already acted */}
        {!message && alreadyActed && (
          <div className="text-center text-sm text-muted-foreground">
            This invite is <strong>{invite.status}</strong>.
          </div>
        )}

        {/* Action buttons */}
        {!message && !alreadyActed && !isAuthenticated() && (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Login or create an account to accept this invite.
            </p>
            <button
              onClick={() => navigate('/player/login', { state: { next: `/join-team/${token}` } })}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ background: 'hsl(var(--accent))', color: '#000' }}
            >
              Login to Accept
            </button>
            <button
              onClick={() =>
                navigate('/player/register', { state: { next: `/join-team/${token}` } })
              }
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: 'transparent',
                border: '1px solid hsl(var(--border) / 0.5)',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {!message && !alreadyActed && isAuthenticated() && (
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={busy}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: 'hsl(var(--accent))',
                color: '#000',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Processing...' : '✓ Join Team'}
            </button>
            <button
              onClick={handleDecline}
              disabled={busy}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: 'transparent',
                border: '1px solid hsl(var(--border) / 0.5)',
                color: 'hsl(var(--muted-foreground))',
                opacity: busy ? 0.6 : 1,
              }}
            >
              Decline
            </button>
          </div>
        )}

        {(message || alreadyActed) && (
          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-sm text-muted-foreground underline"
          >
            Go to Home
          </button>
        )}
      </div>
    </div>
  );
}
