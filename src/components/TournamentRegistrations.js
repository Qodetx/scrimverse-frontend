import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';

/* ─── Status badge renderers ─────────────────────────────── */
const MemberStatusBadge = ({ status }) => {
  const map = {
    accepted: {
      label: 'Accepted',
      cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    pending: {
      label: 'Pending',
      cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
      dot: 'bg-yellow-400',
    },
    declined: {
      label: 'Declined',
      cls: 'bg-red-500/15 text-red-400 border border-red-500/20',
      dot: 'bg-red-400',
    },
    rejected: {
      label: 'Declined',
      cls: 'bg-red-500/15 text-red-400 border border-red-500/20',
      dot: 'bg-red-400',
    },
    expired: {
      label: 'Expired',
      cls: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
      dot: 'bg-gray-400',
    },
  };
  const cfg = map[status] || map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const RegistrationStatusBadge = ({ status }) => {
  const map = {
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    withdrawn: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  const cls = map[status] || map.pending;
  return (
    <span
      className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${cls}`}
    >
      {status}
    </span>
  );
};

/* ─── Individual Registration Card ───────────────────────── */
const RegistrationCard = ({ registration, onRefresh }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(null);

  const loadDetail = useCallback(async () => {
    if (detail) return; // already loaded
    setDetailLoading(true);
    try {
      const res = await tournamentAPI.getRegistrationDetail(
        registration.tournament?.id || registration.tournament,
        registration.id
      );
      setDetail(res.data);
    } catch (err) {
      console.error('Failed to load registration detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [registration, detail]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDetail();
  };

  const handleResend = async (email) => {
    setResendingEmail(email);
    try {
      const tournamentId = registration.tournament?.id || registration.tournament;
      await tournamentAPI.resendInvite(tournamentId, registration.id, email);
      // Reset the local member status to pending
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          team_members: prev.team_members.map((m) =>
            m.email === email ? { ...m, status: 'pending' } : m
          ),
        };
      });
      alert(`Invitation resent to ${email}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resend invitation');
    } finally {
      setResendingEmail(null);
    }
  };

  const tournamentName =
    registration.tournament_details?.title ||
    registration.tournament?.title ||
    `Tournament #${registration.tournament?.id || registration.tournament}`;
  const gameName =
    registration.tournament_details?.game_name || registration.tournament?.game_name || '';

  const members = detail?.team_members || [];
  const pendingCount = members.filter((m) => !m.is_captain && m.status === 'pending').length;
  const declinedCount = members.filter(
    (m) => !m.is_captain && (m.status === 'declined' || m.status === 'rejected')
  ).length;

  return (
    <div className="bg-[#0d1117] border border-[#1e2530] rounded-xl overflow-hidden transition-all duration-200">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-gray-500 font-mono">#{registration.id}</span>
              {gameName && (
                <span className="px-2 py-0.5 bg-[#1e2530] rounded text-xs text-gray-400 font-medium">
                  {gameName}
                </span>
              )}
              <RegistrationStatusBadge status={registration.status} />
            </div>
            <h3 className="text-white font-semibold text-base leading-snug truncate">
              {tournamentName}
            </h3>
            <p className="text-gray-400 text-sm mt-0.5">
              Team:{' '}
              <span className="text-gray-200 font-medium">{registration.team_name || '—'}</span>
            </p>
          </div>

          {/* Alert dots */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {declinedCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                {declinedCount} declined
              </span>
            )}
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#2a3340] hover:border-[#3a4350] transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {expanded ? 'Hide Team' : 'View Team'}
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button
            onClick={() =>
              navigate(`/tournaments/${registration.tournament?.id || registration.tournament}`)
            }
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Tournament
          </button>
        </div>
      </div>

      {/* Expanded: Team Members */}
      {expanded && (
        <div className="border-t border-[#1e2530] bg-[#080c10]">
          {detailLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Loading team members...
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                Team Members ({members.length})
              </p>
              {members.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No member details available
                </p>
              ) : (
                members.map((member, idx) => (
                  <div
                    key={member.email || idx}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#0d1117] border border-[#1e2530]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(member.username || member.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium truncate">
                            {member.username || '—'}
                          </span>
                          {member.is_captain && (
                            <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-semibold">
                              Captain
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MemberStatusBadge status={member.status} />
                      {/* Resend button – captain can resend to declined/expired */}
                      {!member.is_captain &&
                        (member.status === 'declined' ||
                          member.status === 'rejected' ||
                          member.status === 'expired') && (
                          <button
                            onClick={() => handleResend(member.email)}
                            disabled={resendingEmail === member.email}
                            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resendingEmail === member.email ? (
                              <>
                                <svg
                                  className="animate-spin w-3 h-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Sending…
                              </>
                            ) : (
                              <>
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="23 4 23 10 17 10" />
                                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                </svg>
                                Resend
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────── */
const TournamentRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tournamentAPI.getMyRegistrations();
      const data = res.data?.results || res.data || [];
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setError('Failed to load tournament registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  if (loading) {
    return (
      <div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-[#0d1117] border border-[#1e2530] rounded-xl p-5 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-[#1e2530] rounded w-1/4" />
                  <div className="h-5 bg-[#1e2530] rounded w-2/3" />
                  <div className="h-3 bg-[#1e2530] rounded w-1/3" />
                </div>
                <div className="h-6 bg-[#1e2530] rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 text-sm py-4">{error}</p>;
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-[#0d1117] border border-[#1e2530] rounded-xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-[#1e2530] flex items-center justify-center mx-auto mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gray-500"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" />
          </svg>
        </div>
        <p className="text-gray-400 font-medium mb-1">No tournament registrations yet</p>
        <p className="text-gray-600 text-sm">
          Register for a tournament to see your team status here
        </p>
      </div>
    );
  }

  return (
    <div id="tournament-registrations-section">
      <div className="space-y-3">
        {registrations.map((reg) => (
          <RegistrationCard key={reg.id} registration={reg} onRefresh={loadRegistrations} />
        ))}
      </div>
    </div>
  );
};

export default TournamentRegistrations;
