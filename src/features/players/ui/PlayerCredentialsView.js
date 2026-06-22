import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import GuestLockedState from '../../../components/GuestLockedState';
import {
  Key,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Trophy,
  Clock,
  Calendar,
  MapPin,
  X,
  Gamepad2,
  Video,
  ExternalLink,
  Eye,
  ShieldAlert,
  ShieldCheck,
  CircleCheck,
  Timer,
  Pencil,
  UserPlus,
  MessageCircle,
  Mail,
  Send,
  Loader2,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { tournamentAPI, teamAPI, authAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import './PlayerCredentialsView.css';

// Game hero images — same imports as PlayerOverviewView
import heroBgmi from '../../../assets/hero-bgmi.webp';
import heroBgmiAction from '../../../assets/hero-bgmi-action.jpg';
import heroValorant from '../../../assets/hero-valorant.jpg';
import heroCodm from '../../../assets/hero-codm.png';
import heroFreefire from '../../../assets/hero-freefire.jpeg';

// ─── Constants ───────────────────────────────────────────────────────────────

const GAME_FILTER_OPTIONS = [
  { label: 'All Games', value: 'All' },
  { label: 'BGMI', value: 'BGMI' },
  { label: 'Scarfall', value: 'Scarfall' },
  { label: 'Free Fire', value: 'Freefire' },
  { label: 'Valorant', value: 'Valorant' },
  { label: 'COD Mobile', value: 'COD' },
];

const GAME_HERO_IMAGES = {
  BGMI: heroBgmi,
  Valorant: heroValorant,
  COD: heroCodm,
  Freefire: heroFreefire,
  Scarfall: heroBgmiAction,
};

// Valorant uses a single Room ID field (no password needed)
const IS_VALORANT = (gameName) => (gameName || '').toLowerCase() === 'valorant';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mediaBase = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getBannerImage = (tournament) => {
  const img = tournament.banner_image || tournament.poster_image;
  if (!img) return GAME_HERO_IMAGES[tournament.game_name] || heroBgmi;
  if (img.startsWith('http')) return img;
  return `${mediaBase}${img}`;
};

const getTournamentLink = (tournament) => {
  const mode = (tournament.event_mode || '').toUpperCase();
  return mode === 'SCRIM' ? `/scrims/${tournament.id}` : `/tournaments/${tournament.id}`;
};

// Status badge for the tournament (LIVE / UPCOMING / COMPLETED)
const getTournamentBadge = (status) => {
  switch (status) {
    case 'ongoing':
      return { label: 'LIVE', cls: 'credentials-badge credentials-badge-live' };
    case 'upcoming':
      return { label: 'UPCOMING', cls: 'credentials-badge credentials-badge-upcoming' };
    case 'completed':
      return { label: 'ENDED', cls: 'credentials-badge credentials-badge-completed' };
    default:
      return null;
  }
};

// Status badge for the registration (REGISTERED / PENDING / REJECTED)
const getRegistrationBadge = (regStatus) => {
  switch (regStatus) {
    case 'confirmed':
      return { label: 'REGISTERED', cls: 'credentials-badge credentials-badge-registered' };
    case 'pending':
      return { label: 'PENDING', cls: 'credentials-badge credentials-badge-pending' };
    default:
      return null;
  }
};

// Format "2025-03-14" → "Mar 14"
const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

// ─── Countdown helper ─────────────────────────────────────────────────────────

const useCountdown = (targetDateStr) => {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!targetDateStr) {
      setRemaining(null);
      return;
    }

    const target = new Date(targetDateStr).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining({ expired: true, d: 0, h: 0, m: 0, s: 0 });
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining({ expired: false, d, h, m, s });
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDateStr]);

  return remaining;
};

const CountdownDisplay = ({ remaining, label }) => {
  if (!remaining || remaining.expired) return null;
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="credentials-countdown">
      <p className="credentials-countdown-label">
        <Clock size={12} />
        {label}
      </p>
      <div className="credentials-countdown-timer">
        {remaining.d > 0 && (
          <span className="credentials-countdown-unit">
            <span className="credentials-countdown-value">{pad(remaining.d)}</span>
            <span className="credentials-countdown-suffix">d</span>
          </span>
        )}
        <span className="credentials-countdown-unit">
          <span className="credentials-countdown-value">{pad(remaining.h)}</span>
          <span className="credentials-countdown-suffix">h</span>
        </span>
        <span className="credentials-countdown-sep">:</span>
        <span className="credentials-countdown-unit">
          <span className="credentials-countdown-value">{pad(remaining.m)}</span>
          <span className="credentials-countdown-suffix">m</span>
        </span>
        <span className="credentials-countdown-sep">:</span>
        <span className="credentials-countdown-unit">
          <span className="credentials-countdown-value">{pad(remaining.s)}</span>
          <span className="credentials-countdown-suffix">s</span>
        </span>
      </div>
    </div>
  );
};

// ─── Card Skeleton ────────────────────────────────────────────────────────────

const CardSkeleton = () => <div className="credentials-card-skeleton" />;

// ─── Match Schedule Modal ─────────────────────────────────────────────────────

const MatchScheduleModal = ({ tournament, roundsData, roundNumbers, onClose }) => {
  const [selectedRound, setSelectedRound] = useState(roundNumbers[0] || 1);

  // Build flat list of matches for the selected round
  const currentGroups = roundsData[selectedRound];
  const matches = Array.isArray(currentGroups) ? currentGroups.flatMap((g) => g.matches || []) : [];

  const hasSchedule = matches.some((m) => m.scheduled_date || m.scheduled_time);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="credentials-modal-overlay" onClick={handleOverlayClick}>
      <div className="credentials-modal-box">
        {/* Header */}
        <div className="credentials-modal-header">
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: 'hsl(var(--purple))' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Match Schedule
              </p>
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {tournament.title}
              </p>
            </div>
          </div>
          <button className="credentials-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Round tabs — only show if more than 1 round */}
        {roundNumbers.length > 1 && (
          <div className="credentials-modal-tabs">
            {roundNumbers.map((rn) => (
              <button
                key={rn}
                className={`credentials-modal-tab${selectedRound === rn ? ' active' : ''}`}
                onClick={() => setSelectedRound(rn)}
              >
                Round {rn}
              </button>
            ))}
          </div>
        )}

        {/* Match list */}
        <div className="credentials-modal-matches">
          {hasSchedule ? (
            <div className="space-y-2">
              {matches.map((match, idx) => (
                <div key={match.id || idx} className="credentials-match-row">
                  <div className="flex items-center gap-3">
                    {/* Match badge */}
                    <div className="credentials-match-badge">M{match.match_number || idx + 1}</div>
                    {/* Map name */}
                    {match.map_name && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {match.map_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {match.scheduled_time && (
                      <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                        {match.scheduled_time}
                      </p>
                    )}
                    {match.scheduled_date && (
                      <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {formatShortDate(match.scheduled_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Calendar size={24} style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} />
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Schedule not available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── IGN Invite Modal ────────────────────────────────────────────────────────

const IGNInviteModal = ({ teamId, registrationId, onClose, onInviteSent }) => {
  const { showToast } = useToast();
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteSuggestions, setInviteSuggestions] = useState([]);
  const [inviteSelected, setInviteSelected] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmailMode, setInviteEmailMode] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteEmailLoading, setInviteEmailLoading] = useState(false);
  const [inviteEmailError, setInviteEmailError] = useState('');
  const searchCounter = useRef(0);

  const handleUsernameChange = async (val) => {
    setInviteUsername(val);
    setInviteSuggestions([]);
    if (val.trim().length < 2) return;
    const counter = ++searchCounter.current;
    try {
      const res = await authAPI.searchPlayerUsernames(val.trim(), true);
      if (counter !== searchCounter.current) return;
      const results = res.data?.results || res.data || [];
      const selectedNames = inviteSelected.map((p) => p.username.toLowerCase());
      setInviteSuggestions(
        results.filter((p) => !selectedNames.includes((p.username || '').toLowerCase())).slice(0, 5)
      );
    } catch {
      // ignore
    }
  };

  const handleSelectPlayer = (player) => {
    const uname = player.username || player;
    if (!uname) return;
    if (inviteSelected.find((p) => p.username === uname)) return;
    setInviteSelected((prev) => [...prev, { username: uname, id: player.id || uname }]);
    setInviteUsername('');
    setInviteSuggestions([]);
  };

  const handleRemoveChip = (username) => {
    setInviteSelected((prev) => prev.filter((p) => p.username !== username));
  };

  const handleSendUsernameInvite = async () => {
    const targets =
      inviteSelected.length > 0
        ? inviteSelected
        : inviteUsername.trim()
          ? [{ username: inviteUsername.trim() }]
          : [];
    if (targets.length === 0) return;
    setInviteSending(true);
    try {
      await teamAPI.sendInvites(
        teamId,
        targets.map((p) => ({ type: 'username', value: p.username })),
        registrationId
      );
      const names = targets.map((p) => p.username).join(', ');
      showToast(`Invite sent to ${names}`, 'success');
      targets.forEach((p) => onInviteSent(p.username));
    } catch (err) {
      showToast(
        err?.response?.data?.error || err?.response?.data?.detail || 'Failed to send invite',
        'error'
      );
    } finally {
      setInviteSending(false);
    }
  };

  const handleWhatsAppInvite = async () => {
    try {
      const res = await teamAPI.generateInviteLink(teamId);
      const token = res.data.invite_token;
      const link = `${window.location.origin}/join-team/${token}`;
      const msg = encodeURIComponent(`Hey! Join my team on ScrimVerse!\n\nClick to join: ${link}`);
      window.open(`https://wa.me/?text=${msg}`, '_blank');
      onClose();
    } catch {
      showToast('Failed to generate invite link', 'error');
    }
  };

  const handleSendEmailInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteEmailLoading(true);
    setInviteEmailError('');
    try {
      const res = await teamAPI.sendInvites(
        teamId,
        [{ type: 'email', value: inviteEmail.trim() }],
        registrationId
      );
      const result = (res.data?.results || [])[0];
      if (result?.status === 'error') {
        setInviteEmailError(result.message);
      } else {
        showToast(`Invite sent to ${inviteEmail}`, 'success');
        onInviteSent(inviteEmail.trim());
      }
    } catch (err) {
      setInviteEmailError(
        err?.response?.data?.detail || err?.response?.data?.error || 'Failed to send email invite'
      );
    } finally {
      setInviteEmailLoading(false);
    }
  };

  const handleClose = () => {
    setInviteEmailMode(false);
    setInviteEmail('');
    setInviteEmailError('');
    setInviteUsername('');
    setInviteSuggestions([]);
    setInviteSelected([]);
    onClose();
  };

  return (
    <div className="tm-invite-overlay" onClick={handleClose}>
      <div className="tm-invite-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tm-invite-header">
          <h3 className="tm-invite-title">
            <UserPlus size={18} className="tm-icon-purple" />
            Invite Player to Team
          </h3>
          <button className="tm-invite-close" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            margin: '0.75rem 1.25rem 0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem', flexShrink: 0, marginTop: '1px' }}>ℹ️</span>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'hsl(var(--muted-foreground))',
              margin: 0,
              lineHeight: '1.4',
            }}
          >
            Players already in a permanent team won't appear here. They must leave their current
            team first.
          </p>
        </div>

        <div className="tm-invite-body">
          {/* By Username */}
          <div className="tm-invite-section">
            <div className="tm-invite-section-header">
              <div className="tm-invite-section-icon">
                <Users size={16} className="tm-icon-purple" />
              </div>
              <div>
                <p className="tm-invite-section-title">Search by Username</p>
                <p className="tm-invite-section-desc">Find and invite players directly</p>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              {inviteSelected.length > 0 && (
                <div className="tm-invite-chips">
                  {inviteSelected.map((p) => (
                    <span key={p.username} className="tm-invite-chip">
                      {p.username}
                      <button
                        className="tm-invite-chip-remove"
                        onClick={() => handleRemoveChip(p.username)}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="tm-invite-input-row">
                <input
                  type="text"
                  placeholder={
                    inviteSelected.length > 0 ? 'Add more players...' : 'Search username...'
                  }
                  value={inviteUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="tm-invite-input"
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    inviteSuggestions.length > 0 &&
                    handleSelectPlayer(inviteSuggestions[0])
                  }
                  autoComplete="off"
                />
                <button
                  className="tm-invite-send-btn"
                  onClick={handleSendUsernameInvite}
                  disabled={
                    inviteSending || (inviteSelected.length === 0 && !inviteUsername.trim())
                  }
                >
                  {inviteSending ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              {inviteSuggestions.length > 0 && (
                <div className="tm-invite-suggestions">
                  {inviteSuggestions
                    .filter((p) => !inviteSelected.find((s) => s.username === p.username))
                    .map((p) => (
                      <button
                        key={p.id || p.username}
                        className="tm-invite-suggestion-item"
                        onClick={() => handleSelectPlayer(p)}
                      >
                        <div className="tm-invite-suggestion-avatar">
                          {(p.username || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span>{p.username}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="tm-invite-divider">
            <span className="tm-invite-divider-line" />
            <span className="tm-invite-divider-text">or invite via email</span>
            <span className="tm-invite-divider-line" />
          </div>

          {/* Email only */}
          <button
            className="tm-invite-share email"
            style={{ width: '100%' }}
            onClick={() => setInviteEmailMode((v) => !v)}
          >
            <div className="tm-invite-share-icon email">
              <Mail size={20} />
            </div>
            <span className="tm-invite-share-label email">Email</span>
            <span className="tm-invite-share-desc">Send email invite</span>
          </button>

          {inviteEmailMode && (
            <div>
              <div className="tm-invite-email-row">
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteEmailError('');
                  }}
                  className="tm-invite-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendEmailInvite()}
                  autoFocus
                />
                <button
                  className="tm-invite-send-btn"
                  onClick={handleSendEmailInvite}
                  disabled={inviteEmailLoading || !inviteEmail.trim()}
                >
                  {inviteEmailLoading ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              {inviteEmailError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginTop: '8px',
                    padding: '8px 10px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>⚠️</span>
                  <p
                    style={{
                      fontSize: '0.7rem',
                      color: 'rgb(248,113,113)',
                      margin: 0,
                      lineHeight: '1.4',
                    }}
                  >
                    {inviteEmailError}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── IGN Modal ───────────────────────────────────────────────────────────────
// Single-page form. Per-field locking: slots that already have an IGN in
// ign_submissions show as read-only (green lock). Empty slots show an input.
// No invite/cancel buttons — tournament already started.

export const IGNModal = ({
  registration,
  gameName,
  myUsername,
  myProfileIGN,
  isCaptain,
  onSubmitted,
  onClose,
}) => {
  const isViewOnly = !isCaptain;

  const MODE_CAPS = { Squad: 4, '5v5': 5, Duo: 2, Solo: 1 };
  const modeCap = MODE_CAPS[registration.tournament?.game_mode] || 4;

  const captainUsername = registration.player?.user?.username || myUsername || '';
  const ignSubmissions = registration.ign_submissions || {};

  // Build the slot list — every slot is an editable input (no locking).
  // 1. Captain (always slot 1, keyed by username so their profile updates)
  // 2. Known teammates from the snapshot (keyed by username, deduped)
  // 3. Pending invites that already have a submitted IGN (keep them visible/editable)
  // 4. Pad with generic "Player N" slots so the captain always has `modeCap` fields,
  //    even when the team_members snapshot is incomplete (common — many teams only
  //    have the captain in the snapshot).
  const seenKeys = new Set();
  const builtSlots = [];
  if (captainUsername) {
    builtSlots.push({ key: captainUsername, label: captainUsername, isCaptain: true });
    seenKeys.add(captainUsername);
  }
  (registration.team_members || []).forEach((m) => {
    const uname = (m && m.username ? String(m.username) : '').trim();
    if (uname && !seenKeys.has(uname)) {
      seenKeys.add(uname);
      builtSlots.push({ key: uname, label: uname, isCaptain: false });
    }
  });
  const ims = registration.invited_members_status || {};
  Object.keys(ims).forEach((id) => {
    if (ims[id]?.status === 'pending' && !seenKeys.has(id) && ignSubmissions[id]) {
      seenKeys.add(id);
      builtSlots.push({ key: id, label: id, isPending: true });
    }
  });
  while (builtSlots.length < modeCap) {
    const pos = builtSlots.length + 1;
    builtSlots.push({ key: `player_${pos}`, label: `Player ${pos}`, isGeneric: true });
  }
  const allSlots = builtSlots;

  // Every slot is editable and pre-filled from existing submissions
  // (captain's own slot falls back to their profile IGN).
  const [ignMap, setIgnMap] = useState(() => {
    const init = {};
    allSlots.forEach((s) => {
      if (ignSubmissions[s.key]) {
        init[s.key] = ignSubmissions[s.key];
      } else if (s.key === myUsername && myProfileIGN) {
        init[s.key] = myProfileIGN;
      } else {
        init[s.key] = '';
      }
    });
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const game = gameName || registration.tournament.game_name || '';

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const hasNewEntries = Object.values(ignMap).some((v) => (v || '').trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const finalMap = {};
      Object.entries(ignMap).forEach(([key, val]) => {
        if (val?.trim()) finalMap[key] = val.trim();
      });
      const res = await tournamentAPI.submitIGN(registration.tournament.id, registration.id, {
        ign_submissions: finalMap,
      });
      onSubmitted(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Failed to save IGNs. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="credentials-modal-overlay" onClick={handleOverlayClick}>
      <div className="credentials-modal-box credentials-ign-modal-box">
        {/* Header */}
        <div className="credentials-modal-header">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} style={{ color: 'hsl(var(--destructive))' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Team IGN Submission
              </p>
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {game}
              </p>
            </div>
          </div>
          <button className="credentials-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="credentials-ign-warning">
            <ShieldAlert size={13} style={{ color: '#f87171', flexShrink: 0 }} />
            <span>
              Enter IGNs exactly as they appear in {game}. You can edit and re-submit anytime while
              the tournament is live.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {allSlots.map((slot, idx) => {
              const isMe = slot.key === myUsername;
              const hasValue = (ignMap[slot.key] || '').trim();
              return (
                <div
                  key={slot.key}
                  className={`credentials-ign-player-card${isMe ? ' credentials-ign-player-card-mine' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="credentials-ign-player-num">P{idx + 1}</span>
                      <span
                        className={`credentials-ign-player-name${slot.isGeneric || slot.isPending ? ' credentials-ign-pending-name' : ''}`}
                      >
                        {slot.label}
                      </span>
                      {isMe && <span className="credentials-ign-you-badge">YOU</span>}
                    </div>
                    {hasValue && <CircleCheck size={13} style={{ color: '#10b981' }} />}
                  </div>
                  {slot.isPending && (
                    <span
                      className="credentials-ign-pending-badge"
                      style={{ marginBottom: '6px', display: 'inline-block' }}
                    >
                      Invite pending
                    </span>
                  )}
                  {!isViewOnly ? (
                    <input
                      className="credentials-ign-input"
                      type="text"
                      value={ignMap[slot.key] || ''}
                      onChange={(e) =>
                        setIgnMap((prev) => ({ ...prev, [slot.key]: e.target.value }))
                      }
                      placeholder={slot.isCaptain ? 'Enter IGN' : 'Enter IGN (optional)'}
                      maxLength={50}
                      autoFocus={isMe && idx === 0}
                    />
                  ) : (
                    <div className="credentials-ign-readonly">
                      {hasValue ? (
                        <span>{ignMap[slot.key]}</span>
                      ) : (
                        <span
                          style={{ color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}
                        >
                          Not submitted yet
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button className="credentials-action-btn flex-1" onClick={onClose}>
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button
                className="credentials-ign-confirm-btn credentials-ign-confirm-btn-green flex-1"
                onClick={handleSubmit}
                disabled={submitting || !hasNewEntries}
              >
                {submitting ? 'Saving...' : 'Save IGNs'}
                {!submitting && <ShieldCheck size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Credential Card ─────────────────────────────────────────────────────────

const CredentialCard = ({ registration: initialRegistration }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // registration is local state so we can update ign_submissions after submit
  const [registration, setRegistration] = useState(initialRegistration);
  const [showIgnModal, setShowIgnModal] = useState(false);

  const { tournament, status: regStatus, id: regId } = registration;

  // My own username
  const myUsername = user?.user?.username || user?.username || '';

  // IGN verification temporarily disabled — credentials show directly without IGN gate
  // Re-enable by uncommenting the lines below and removing the const myIgnSubmitted = true line
  // const hasAnyIgnSubmissions = Object.keys(registration.ign_submissions || {}).length > 0;
  // const isCompletedLegacy = tournament.status === 'completed' && !hasAnyIgnSubmissions;
  // const myIgnSubmitted = isCompletedLegacy || (registration.ign_submissions || {})[myUsername];
  const myIgnSubmitted = true;

  // Pre-fill IGN from player profile if available
  const gameName = tournament.game_name;
  const myProfileIGN =
    (user?.profile?.game_profiles || user?.player_profile?.game_profiles || {})?.[gameName]?.ign ||
    '';

  const handleIgnSubmitted = (data) => {
    setRegistration((prev) => ({
      ...prev,
      ign_submissions: data.ign_submissions,
      ign_locked: data.ign_locked,
    }));
    setShowIgnModal(false);
  };

  const refreshRegistration = async () => {
    try {
      const res = await tournamentAPI.getMyRegistrations();
      const fresh = (res.data || []).find((r) => r.id === registration.id);
      if (fresh) setRegistration(fresh);
    } catch (_) {}
  };

  // Countdown for credential release (tournament-level)
  const credCountdown = useCountdown(tournament.credential_release_time);

  // Per-match scheduled release countdown (earliest upcoming release time across current round's matches)
  const [matchCredReleaseTime, setMatchCredReleaseTime] = useState(null);
  const matchCredCountdown = useCountdown(matchCredReleaseTime);

  // Each card tracks its own selected round and per-field copied state
  const [selectedRound, setSelectedRound] = useState(1);
  const [roundsData, setRoundsData] = useState({}); // { [roundNumber]: groups[] | null }
  const [loadingRound, setLoadingRound] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null); // e.g. "123-id-1", "123-pass-1"
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null); // null = auto-select latest match with creds

  // Determine how many rounds this tournament has (best-effort from rounds_count or default 1)
  const roundCount = tournament.rounds_count || tournament.current_round || 1;
  // For ongoing tournaments only show the current active round pill — completed rounds are hidden.
  // For completed tournaments show all rounds so players can review past credentials.
  const roundNumbers =
    tournament.status !== 'completed' && tournament.current_round
      ? [tournament.current_round]
      : Array.from({ length: roundCount }, (_, i) => i + 1);

  // Fetch credentials for a round (silently — no toast on failure)
  // Returns true if the round has any credentials
  const fetchRound = useCallback(
    async (roundNumber) => {
      // Only skip if we already have real data (array). null means previous fetch failed — retry.
      if (Array.isArray(roundsData[roundNumber])) {
        const groups = roundsData[roundNumber];
        return groups.some((g) => (g.matches || []).some((m) => m.match_id));
      }
      setLoadingRound(true);
      try {
        const res = await tournamentAPI.getRoundGroups(tournament.id, roundNumber);
        const groups =
          res.data?.groups || res.data?.results || (Array.isArray(res.data) ? res.data : []);
        setRoundsData((prev) => ({ ...prev, [roundNumber]: groups }));
        return groups.some((g) => (g.matches || []).some((m) => m.match_id));
      } catch {
        // 403 / 404 means credentials not released yet
        setRoundsData((prev) => ({ ...prev, [roundNumber]: null }));
        return false;
      } finally {
        setLoadingRound(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tournament.id, roundsData]
  );

  // On mount: for ongoing tournaments always land on current_round (even if creds not released yet).
  // For completed tournaments scan downward to find the last round that had credentials.
  useEffect(() => {
    const autoSelectRound = async () => {
      if (tournament.status !== 'completed' && tournament.current_round) {
        const r = tournament.current_round;
        // Force fresh fetch on mount — clear any stale cache so scheduled creds are picked up
        setRoundsData({});
        await fetchRound(r);
        setSelectedRound(r);
        return;
      }
      // Completed: find last round with credentials
      const startRound = tournament.current_round || roundCount;
      for (let r = startRound; r >= 1; r--) {
        // eslint-disable-next-line no-await-in-loop
        const hasCreds = await fetchRound(r);
        if (hasCreds) {
          setSelectedRound(r);
          return;
        }
      }
      if (!roundsData[1]) fetchRound(1);
      setSelectedRound(1);
    };
    autoSelectRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling: every 10s, if tournament is not completed, re-fetch the current round silently.
  // Fetches in background and swaps data in only when ready — no loading blink.
  useEffect(() => {
    if (tournament.status === 'completed') return;

    const id = setInterval(async () => {
      try {
        const res = await tournamentAPI.getRoundGroups(tournament.id, selectedRound);
        const groups =
          res.data?.groups || res.data?.results || (Array.isArray(res.data) ? res.data : []);
        setRoundsData((prev) => ({ ...prev, [selectedRound]: groups }));
      } catch {
        // silent — don't clear existing data on poll failure
      }
    }, 10000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound, tournament.status, tournament.id]);

  // Auto-reveal: when tournament-level countdown expires, clear cache and re-fetch
  const prevExpired = useRef(false);
  useEffect(() => {
    if (credCountdown?.expired && !prevExpired.current) {
      prevExpired.current = true;
      setRoundsData((prev) => {
        const next = { ...prev };
        delete next[selectedRound];
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credCountdown?.expired]);

  // Auto-reveal: when per-match countdown expires, clear cache and re-fetch
  const prevMatchExpired = useRef(false);
  useEffect(() => {
    if (matchCredCountdown?.expired && !prevMatchExpired.current) {
      prevMatchExpired.current = true;
      setMatchCredReleaseTime(null);
      setRoundsData((prev) => {
        const next = { ...prev };
        delete next[selectedRound];
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchCredCountdown?.expired]);

  // When roundsData for current round is cleared (auto-reveal), re-fetch
  useEffect(() => {
    if (!roundsData.hasOwnProperty(selectedRound)) {
      fetchRound(selectedRound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundsData, selectedRound]);

  // Track earliest upcoming match credential_release_time for per-match countdown
  useEffect(() => {
    const groups = roundsData[selectedRound];
    if (!Array.isArray(groups)) {
      setMatchCredReleaseTime(null);
      return;
    }
    const now = Date.now();
    const futureTimes = groups
      .flatMap((g) => g.matches || [])
      .filter((m) => !m.match_id && m.credential_release_time)
      .map((m) => new Date(m.credential_release_time).getTime())
      .filter((t) => t > now);
    if (futureTimes.length === 0) {
      setMatchCredReleaseTime(null);
      return;
    }
    const earliest = new Date(Math.min(...futureTimes)).toISOString();
    setMatchCredReleaseTime((prev) => (prev === earliest ? prev : earliest));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundsData, selectedRound]);

  // When round pill changes, fetch that round's data
  const handleRoundSelect = (rn) => {
    setSelectedRound(rn);
    fetchRound(rn);
  };

  // Copy to clipboard helper
  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may not be available on non-HTTPS — fail silently
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
  };

  // Derive credentials from the selected round's groups
  const currentGroups = roundsData[selectedRound];
  const hasData = Array.isArray(currentGroups) && currentGroups.length > 0;

  // All matches that are visible to the player (have creds OR are scheduled) — used for tabs
  const matchesVisible = hasData
    ? currentGroups.flatMap((g) =>
        (g.matches || []).filter((m) => m.match_id || m.credential_release_time)
      )
    : [];
  // Only matches with actual revealed credentials — used for rendering ID/password
  const matchesWithCreds = hasData
    ? currentGroups.flatMap((g) => (g.matches || []).filter((m) => m.match_id))
    : [];

  // IGN window: open only until the room credentials for this group are released
  // (round underway). Once any match's creds are revealed, the IGN button is
  // hidden entirely for everyone — no more entering, updating, or viewing.
  const amCaptain = registration.player?.user?.username === myUsername;
  const ignWindowOpen = matchesWithCreds.length === 0 && tournament.status === 'ongoing';

  // Auto-select the latest match (highest match_number) that is visible (creds or scheduled)
  const latestMatchNumber =
    matchesVisible.length > 0 ? Math.max(...matchesVisible.map((m) => m.match_number)) : null;

  // If polling brought in a newer match than what the user manually selected, reset to auto
  const activeMatchNumber =
    selectedMatch !== null && latestMatchNumber !== null && latestMatchNumber > selectedMatch
      ? latestMatchNumber
      : selectedMatch !== null
        ? selectedMatch
        : latestMatchNumber;

  const tournamentBadge = getTournamentBadge(tournament.status);
  const regBadge = getRegistrationBadge(regStatus);
  const isValorant = IS_VALORANT(tournament.game_name);

  return (
    <>
      <div className="credentials-card">
        {/* ── Banner ── */}
        <div className="credentials-banner">
          <img src={getBannerImage(tournament)} alt={tournament.title} loading="lazy" />
          <div className="credentials-banner-overlay" />

          {/* Top-left badges */}
          <div className="credentials-banner-badges">
            {tournament.game_name && (
              <span className="credentials-badge">{tournament.game_name}</span>
            )}
            {tournamentBadge && (
              <span className={tournamentBadge.cls}>{tournamentBadge.label}</span>
            )}
            {regBadge && <span className={regBadge.cls}>{regBadge.label}</span>}
          </div>

          {/* Title at bottom of banner */}
          <div className="credentials-banner-title">
            <h3>{tournament.title}</h3>
          </div>
        </div>

        {/* Group + slot strip — sits between banner and body */}
        {(() => {
          const myGroupName = (currentGroups || []).reduce((found, g, gIdx) => {
            if (found) return found;
            const inGroup = (g.teams || []).some(
              (t) => (t.team_name || '').toLowerCase() === registration.team_name.toLowerCase()
            );
            return inGroup ? g.group_name || `Group ${gIdx + 1}` : null;
          }, null);
          let mySlot = null;
          for (const g of currentGroups || []) {
            let counter = 2;
            for (const t of g.teams || []) {
              counter++;
              if ((t.team_name || '').toLowerCase() === registration.team_name.toLowerCase()) {
                mySlot = counter;
                break;
              }
            }
            if (mySlot) break;
          }
          const mySlotPadded = mySlot ? String(mySlot).padStart(2, '0') : null;
          if (!myGroupName && !mySlotPadded) return null;
          return (
            <div className="credentials-group-strip">
              <span className="credentials-group-strip-icon">☆</span>
              <span>{registration.team_name}</span>
              {myGroupName && (
                <>
                  <span className="credentials-group-strip-sep">·</span>
                  <span>{myGroupName}</span>
                </>
              )}
              {mySlotPadded && (
                <>
                  <span className="credentials-group-strip-sep">·</span>
                  <span>Slot {mySlotPadded}</span>
                </>
              )}
            </div>
          );
        })()}

        {/* ── Body ── */}
        <div className="credentials-body">
          {/* Round pills — always show so player knows which round they're in */}
          {roundNumbers.length > 0 && (
            <div className="credentials-round-pills">
              {roundNumbers.map((rn) => (
                <button
                  key={rn}
                  className={`credentials-round-pill${selectedRound === rn ? ' active' : ''}`}
                  onClick={
                    tournament.status === 'completed' ? undefined : () => handleRoundSelect(rn)
                  }
                  disabled={roundNumbers.length === 1 || tournament.status === 'completed'}
                  style={{ cursor: 'default' }}
                >
                  Round {rn}
                </button>
              ))}
            </div>
          )}

          {/* ── Credentials box ── */}
          <div
            className={`credentials-creds-box${!myIgnSubmitted ? ' credentials-ign-unverified' : ''}`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <Key
                  size={12}
                  style={{ color: myIgnSubmitted ? '#10b981' : 'hsl(var(--muted-foreground))' }}
                />
                <span
                  className="font-semibold uppercase"
                  style={{
                    fontSize: '10px',
                    color: myIgnSubmitted ? '#10b981' : 'hsl(var(--muted-foreground))',
                    letterSpacing: '0.06em',
                  }}
                >
                  CREDENTIALS
                </span>
              </div>
              {myIgnSubmitted && (
                <div className="credentials-ign-badge">
                  <CircleCheck size={10} />
                  <span>VERIFIED</span>
                </div>
              )}
            </div>

            {/* ── IGN NOT submitted: show locked state with unverified UI ── */}
            {!myIgnSubmitted ? (
              <div className="credentials-creds-grid">
                {/* ID button — red eye, opens modal */}
                <button
                  className="credentials-ign-locked-btn"
                  onClick={() => setShowIgnModal(true)}
                >
                  <div className="text-left">
                    <div className="credentials-ign-locked-label">ID</div>
                    <div className="credentials-ign-locked-dots">••••••</div>
                  </div>
                  <Eye size={14} className="credentials-ign-eye-icon" />
                </button>
                {/* Pass button — red eye */}
                <button
                  className="credentials-ign-locked-btn"
                  onClick={() => setShowIgnModal(true)}
                >
                  <div className="text-left">
                    <div className="credentials-ign-locked-label">PASS</div>
                    <div className="credentials-ign-locked-dots">••••••</div>
                  </div>
                  <Eye size={14} className="credentials-ign-eye-icon" />
                </button>
                {/* Hint message spanning both columns */}
                <div className="col-span-2 flex items-center gap-1.5 px-1 pt-0.5">
                  <ShieldAlert size={12} style={{ color: '#f87171', flexShrink: 0 }} />
                  <span className="credentials-ign-hint">
                    Tap to verify IGNs &amp; start 24h unlock
                  </span>
                </div>
              </div>
            ) : (
              /* ── IGN submitted: show normal creds or verified countdown ── */
              <>
                {loadingRound ? (
                  <div
                    className="credentials-no-creds"
                    style={{ animation: 'credentials-pulse 1.5s ease-in-out infinite' }}
                  >
                    <p>Loading credentials...</p>
                  </div>
                ) : matchesVisible.length > 0 ? (
                  (() => {
                    const activeMatch =
                      matchesVisible.length > 1
                        ? matchesVisible.find((m) => m.match_number === activeMatchNumber) ||
                          matchesVisible[matchesVisible.length - 1]
                        : matchesVisible[0];
                    const match = activeMatch;
                    const idKey = `${regId}-id-${match.id}`;
                    const passKey = `${regId}-pass-${match.id}`;
                    return (
                      <div>
                        {matchesVisible.length > 1 && tournament.status !== 'completed' && (
                          <div className="credentials-round-pills" style={{ marginBottom: '10px' }}>
                            {matchesVisible.map((m) => (
                              <button
                                key={m.id}
                                className={`credentials-round-pill${activeMatchNumber === m.match_number ? ' active' : ''}`}
                                onClick={() => setSelectedMatch(m.match_number)}
                              >
                                Match {m.match_number}
                              </button>
                            ))}
                          </div>
                        )}

                        {!match.match_id && match.credential_release_time ? (
                          /* Match scheduled but not yet revealed — show countdown */
                          matchCredCountdown && !matchCredCountdown.expired ? (
                            <div className="credentials-ign-verified-countdown">
                              <div className="credentials-ign-verified-countdown-row">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="credentials-ign-timer-icon">
                                    <Timer size={16} style={{ color: '#6ee7b7' }} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="credentials-ign-unlock-label">
                                      Credentials unlock in
                                    </div>
                                    <div className="credentials-ign-unlock-sub">
                                      Room ID scheduled · auto-reveals on time
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="credentials-ign-timer-value">
                                    {matchCredCountdown.d > 0 &&
                                      `${String(matchCredCountdown.d).padStart(2, '0')}d `}
                                    {String(matchCredCountdown.h).padStart(2, '0')}:
                                    {String(matchCredCountdown.m).padStart(2, '0')}:
                                    {String(matchCredCountdown.s).padStart(2, '0')}
                                  </div>
                                  <div className="credentials-ign-timer-remaining">remaining</div>
                                </div>
                              </div>
                              <div className="credentials-creds-grid" style={{ marginTop: '8px' }}>
                                <button className="credentials-ign-masked-btn" disabled>
                                  <div className="text-left">
                                    <div className="credentials-ign-masked-label">ID</div>
                                    <div className="credentials-ign-masked-dots">••••••</div>
                                  </div>
                                  <Clock size={14} className="credentials-ign-clock-icon" />
                                </button>
                                <button className="credentials-ign-masked-btn" disabled>
                                  <div className="text-left">
                                    <div className="credentials-ign-masked-label">Pass</div>
                                    <div className="credentials-ign-masked-dots">••••••</div>
                                  </div>
                                  <Clock size={14} className="credentials-ign-clock-icon" />
                                </button>
                              </div>
                              <p className="credentials-match-start-notice">
                                Matches start exactly 10 minutes after the IDP is revealed.
                              </p>
                            </div>
                          ) : null
                        ) : isValorant ? (
                          <div className="credentials-field-row">
                            <span className="credentials-field-label">Room ID</span>
                            <span className="credentials-field-value">{match.match_id}</span>
                            <button
                              className={`credentials-copy-btn${copiedKey === idKey ? ' copied' : ''}`}
                              onClick={() => handleCopy(match.match_id, idKey)}
                              title="Copy Room ID"
                              aria-label="Copy Room ID"
                            >
                              {copiedKey === idKey ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <div className="credentials-creds-grid">
                            <div className="credentials-cred-cell">
                              <span
                                className="uppercase"
                                style={{
                                  fontSize: '9px',
                                  color: 'hsl(var(--muted-foreground))',
                                  letterSpacing: '0.06em',
                                  fontWeight: 600,
                                }}
                              >
                                ID
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className="flex-1 font-bold text-sm font-mono truncate"
                                  style={{ color: 'hsl(var(--foreground))' }}
                                >
                                  {match.match_id}
                                </span>
                                <button
                                  className={`credentials-copy-btn${copiedKey === idKey ? ' copied' : ''}`}
                                  onClick={() => handleCopy(match.match_id, idKey)}
                                  title="Copy Room ID"
                                  aria-label="Copy Room ID"
                                >
                                  {copiedKey === idKey ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                              </div>
                            </div>
                            {match.match_password && (
                              <div className="credentials-cred-cell">
                                <span
                                  className="uppercase"
                                  style={{
                                    fontSize: '9px',
                                    color: 'hsl(var(--muted-foreground))',
                                    letterSpacing: '0.06em',
                                    fontWeight: 600,
                                  }}
                                >
                                  PASS
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span
                                    className="flex-1 font-bold text-sm font-mono truncate"
                                    style={{ color: 'hsl(var(--foreground))' }}
                                  >
                                    {match.match_password}
                                  </span>
                                  <button
                                    className={`credentials-copy-btn${copiedKey === passKey ? ' copied' : ''}`}
                                    onClick={() => handleCopy(match.match_password, passKey)}
                                    title="Copy Password"
                                    aria-label="Copy Password"
                                  >
                                    {copiedKey === passKey ? (
                                      <Check size={13} />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : matchCredCountdown && !matchCredCountdown.expired ? (
                  /* Per-match scheduled release countdown */
                  <div className="credentials-ign-verified-countdown">
                    <div className="credentials-ign-verified-countdown-row">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="credentials-ign-timer-icon">
                          <Timer size={16} style={{ color: '#6ee7b7' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="credentials-ign-unlock-label">Credentials unlock in</div>
                          <div className="credentials-ign-unlock-sub">
                            Room ID scheduled · auto-reveals on time
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="credentials-ign-timer-value">
                          {matchCredCountdown.d > 0 &&
                            `${String(matchCredCountdown.d).padStart(2, '0')}d `}
                          {String(matchCredCountdown.h).padStart(2, '0')}:
                          {String(matchCredCountdown.m).padStart(2, '0')}:
                          {String(matchCredCountdown.s).padStart(2, '0')}
                        </div>
                        <div className="credentials-ign-timer-remaining">remaining</div>
                      </div>
                    </div>
                    <div className="credentials-creds-grid" style={{ marginTop: '8px' }}>
                      <button className="credentials-ign-masked-btn" disabled>
                        <div className="text-left">
                          <div className="credentials-ign-masked-label">ID</div>
                          <div className="credentials-ign-masked-dots">••••••</div>
                        </div>
                        <Clock size={14} className="credentials-ign-clock-icon" />
                      </button>
                      <button className="credentials-ign-masked-btn" disabled>
                        <div className="text-left">
                          <div className="credentials-ign-masked-label">Pass</div>
                          <div className="credentials-ign-masked-dots">••••••</div>
                        </div>
                        <Clock size={14} className="credentials-ign-clock-icon" />
                      </button>
                    </div>
                    <p className="credentials-match-start-notice">
                      Matches start exactly 10 minutes after the IDP is revealed.
                    </p>
                  </div>
                ) : credCountdown && !credCountdown.expired ? (
                  /* Tournament-level countdown: green state from coderef */
                  <div className="credentials-ign-verified-countdown">
                    <div className="credentials-ign-verified-countdown-row">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="credentials-ign-timer-icon">
                          <Timer size={16} style={{ color: '#6ee7b7' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="credentials-ign-unlock-label">Credentials unlock in</div>
                          <div className="credentials-ign-unlock-sub">
                            You&apos;re all set · auto-reveals on time
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="credentials-ign-timer-value">
                          {credCountdown.d > 0 && `${String(credCountdown.d).padStart(2, '0')}d `}
                          {String(credCountdown.h).padStart(2, '0')}:
                          {String(credCountdown.m).padStart(2, '0')}:
                          {String(credCountdown.s).padStart(2, '0')}
                        </div>
                        <div className="credentials-ign-timer-remaining">remaining</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    {tournament.credential_release_time &&
                      (() => {
                        const releaseMs = new Date(tournament.credential_release_time).getTime();
                        const nowMs = Date.now();
                        const totalMs = 24 * 3600 * 1000;
                        const pct = Math.max(
                          0,
                          Math.min(100, ((totalMs - (releaseMs - nowMs)) / totalMs) * 100)
                        );
                        return (
                          <div className="credentials-ign-progress-wrap">
                            <div className="credentials-ign-progress-bar">
                              <div
                                className="credentials-ign-progress-fill"
                                style={{ width: `${pct.toFixed(2)}%` }}
                              />
                            </div>
                            <div className="credentials-ign-progress-row">
                              <span className="credentials-ign-progress-pct">
                                {pct.toFixed(1)}% to unlock
                              </span>
                              {amCaptain && ignWindowOpen && (
                                <button
                                  className="credentials-ign-edit-btn"
                                  onClick={() => setShowIgnModal(true)}
                                >
                                  <Pencil size={10} />
                                  Edit IGN
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    {/* Masked creds */}
                    <div className="credentials-creds-grid" style={{ marginTop: '8px' }}>
                      <button className="credentials-ign-masked-btn" disabled>
                        <div className="text-left">
                          <div className="credentials-ign-masked-label">ID</div>
                          <div className="credentials-ign-masked-dots">••••••</div>
                        </div>
                        <Clock size={14} className="credentials-ign-clock-icon" />
                      </button>
                      <button className="credentials-ign-masked-btn" disabled>
                        <div className="text-left">
                          <div className="credentials-ign-masked-label">Pass</div>
                          <div className="credentials-ign-masked-dots">••••••</div>
                        </div>
                        <Clock size={14} className="credentials-ign-clock-icon" />
                      </button>
                    </div>
                    <p className="credentials-match-start-notice">
                      Matches start exactly 10 minutes after the IDP is revealed.
                    </p>
                  </div>
                ) : (
                  <div className="credentials-no-creds">
                    <p>Credentials not released yet</p>
                  </div>
                )}
                {/* IGN access — open only until creds release; captain edits, members view */}
                {ignWindowOpen && (
                  <button
                    className="credentials-ign-players-btn"
                    onClick={() => setShowIgnModal(true)}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {amCaptain ? <AlertTriangle size={12} /> : <Eye size={12} />}
                    <span>{amCaptain ? 'Enter / Update Team IGNs' : 'View Team IGNs'}</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Qualification / Elimination status banner ── */}
          {/* Hide during active match (IDP scheduled/revealed); show only after round completes */}
          {tournament.status === 'ongoing' &&
            (tournament.current_round || 1) > 1 &&
            Array.isArray(currentGroups) &&
            currentGroups.length > 0 &&
            !currentGroups.some((g) =>
              (g.matches || []).some((m) => m.credential_release_time || m.match_id)
            ) &&
            (() => {
              const isQualified = currentGroups.some((g) =>
                (g.teams || []).some(
                  (t) => (t.team_name || '').toLowerCase() === registration.team_name.toLowerCase()
                )
              );
              const roundLabel =
                (tournament.round_names || {})[String(tournament.current_round)] ||
                `Round ${tournament.current_round}`;
              return isQualified ? (
                <div className="credentials-status-banner credentials-status-banner--qualified">
                  <Trophy size={13} style={{ flexShrink: 0 }} />
                  <span>
                    Congratulations! Your team qualified for{' '}
                    <strong>{roundLabel.toUpperCase()}</strong>
                  </span>
                </div>
              ) : (
                <div className="credentials-status-banner credentials-status-banner--eliminated">
                  <X size={13} style={{ flexShrink: 0 }} />
                  <span>Your team has been eliminated. Better luck next time!</span>
                </div>
              );
            })()}

          {/* ── Actions row ── */}
          <div className="flex gap-2 mt-3">
            <button className="credentials-action-btn" onClick={() => setShowSchedule(true)}>
              <Clock size={13} />
              Time
            </button>
            <button
              className="credentials-action-btn"
              onClick={() => navigate(getTournamentLink(tournament))}
            >
              Details
              <ChevronRight size={13} />
            </button>
            {tournament.live_link && (
              <a
                href={tournament.live_link}
                target="_blank"
                rel="noopener noreferrer"
                className="credentials-action-btn credentials-live-btn"
              >
                <Video size={13} />
                Watch Live
                <ExternalLink size={11} style={{ opacity: 0.7 }} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Match Schedule Modal ── */}
      {showSchedule && (
        <MatchScheduleModal
          tournament={tournament}
          roundsData={roundsData}
          roundNumbers={roundNumbers}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {/* ── IGN Modal ── */}
      {showIgnModal && (
        <IGNModal
          registration={registration}
          gameName={gameName}
          myUsername={myUsername}
          myProfileIGN={myProfileIGN}
          isCaptain={amCaptain && ignWindowOpen}
          onSubmitted={handleIgnSubmitted}
          onClose={() => setShowIgnModal(false)}
        />
      )}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'Live', value: 'ongoing' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'completed' },
];

// Wrapper splits guest vs authenticated rendering into separate components so
// the authenticated view's hook list isn't gated by the isGuest() check
// (which would violate Rules of Hooks).
const PlayerCredentialsView = () => {
  const { isGuest } = useContext(AuthContext);
  if (isGuest()) {
    return (
      <GuestLockedState
        title="Match IDs & Passwords"
        description="Once you register for a tournament, the room ID and password for each match appear here at the scheduled release time."
      />
    );
  }
  return <PlayerCredentialsViewAuthenticated />;
};

const PlayerCredentialsViewAuthenticated = () => {
  const { user } = useContext(AuthContext);
  const myUsername = user?.user?.username || user?.username || '';
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Fetch the player's registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await tournamentAPI.getMyRegistrations();
        const data = res.data?.results || res.data || [];
        // Only show confirmed or pending registrations (exclude rejected/withdrawn)
        const active = (Array.isArray(data) ? data : []).filter(
          (r) => r.status === 'confirmed' || r.status === 'pending'
        );
        setRegistrations(active);
      } catch (err) {
        console.error('Error fetching registrations for credentials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter by game, status, and snapshot membership
  const filteredRegistrations = registrations.filter((r) => {
    const gameMatch = gameFilter === 'All' || (r.tournament?.game_name || '') === gameFilter;
    const statusMatch = statusFilter === 'All' || (r.tournament?.status || '') === statusFilter;
    return gameMatch && statusMatch;
  });

  const activeGameLabel =
    GAME_FILTER_OPTIONS.find((o) => o.value === gameFilter)?.label || 'All Games';

  return (
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--purple) / 0.15)' }}
          >
            <Key size={18} style={{ color: 'hsl(var(--purple))' }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold leading-tight"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              Match IDs &amp; Passwords
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Your room credentials for registered tournaments
            </p>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`tv-reg-status-pill${statusFilter === opt.value ? ' active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Game filter — Lovable outline style */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-medium transition-all"
            style={{
              border: '1px solid hsl(var(--border) / 0.5)',
              background: 'transparent',
              color: 'hsl(var(--foreground))',
            }}
          >
            <Gamepad2 size={13} />
            <span>{activeGameLabel}</span>
            <ChevronDown
              size={13}
              className={filterOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
          </button>

          {filterOpen && (
            <div className="overview-filter-dropdown credentials-filter-dropdown">
              {GAME_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`overview-filter-option${gameFilter === option.value ? ' selected' : ''}`}
                  onClick={() => {
                    setGameFilter(option.value);
                    setFilterOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredRegistrations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRegistrations.map((registration) => (
            <CredentialCard key={registration.id} registration={registration} />
          ))}
        </div>
      ) : (
        <div className="credentials-empty">
          <div className="credentials-empty-icon">
            <Trophy size={24} />
          </div>
          {registrations.length > 0 && (gameFilter !== 'All' || statusFilter !== 'All') ? (
            <>
              <p>
                No{' '}
                {statusFilter !== 'All'
                  ? STATUS_FILTER_OPTIONS.find(
                      (o) => o.value === statusFilter
                    )?.label.toLowerCase() + ' '
                  : ''}
                {gameFilter !== 'All' ? activeGameLabel + ' ' : ''}registrations found
              </p>
              <button
                onClick={() => {
                  setGameFilter('All');
                  setStatusFilter('All');
                }}
                className="text-xs hover:underline"
                style={{ color: 'hsl(var(--purple))' }}
              >
                Clear filter
              </button>
            </>
          ) : (
            <>
              <p>You haven&apos;t registered for any tournaments yet</p>
              <Link to="/tournaments" className="credentials-empty-cta">
                Browse Tournaments
                <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerCredentialsView;
