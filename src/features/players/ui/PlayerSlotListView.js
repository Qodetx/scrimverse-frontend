import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ListOrdered,
  Gamepad2,
  ChevronDown,
  Check,
  CheckCircle2,
  Star,
  ClipboardList,
  Clock,
  Download,
  Video,
  ExternalLink,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import './PlayerSlotListView.css';

// ─── helpers ─────────────────────────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Flatten all groups returned by getRoundGroups into a single ordered list.
 * Each entry in the result has: { slotNumber, teamName }
 */
const flattenGroups = (groups) => {
  const slots = [];
  let counter = 1;
  if (!Array.isArray(groups)) return slots;
  groups.forEach((group) => {
    const teams = group.teams || [];
    teams.forEach((team) => {
      const name = team.team_name || team.player_name || team.name || '';
      if (name) {
        slots.push({ slotNumber: counter, teamName: name });
        counter += 1;
      }
    });
  });
  return slots;
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

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const SkeletonRows = ({ count = 3 }) => (
  <div className="space-y-1.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="slot-skeleton" />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const PlayerSlotListView = ({ focusTournamentId: externalFocusId } = {}) => {
  const [registrations, setRegistrations] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const dropdownRef = useRef(null);
  const slotCardRef = useRef(null);

  // ── close dropdown on outside click ──────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── fetch registrations on mount ─────────────────────────────────────────

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await tournamentAPI.getMyRegistrations();
        const all = res.data?.results || res.data || [];
        const filtered = Array.isArray(all)
          ? all.filter((r) => r.status === 'confirmed' || r.status === 'pending')
          : [];
        setRegistrations(filtered);

        // Auto-select tournament from URL or notification
        const params = new URLSearchParams(window.location.search);
        const focusId = externalFocusId || params.get('tournament_id') || params.get('id');
        if (focusId) {
          const idx = filtered.findIndex(
            (r) => String(r.tournament?.id || r.tournament_id) === String(focusId)
          );
          setSelectedIdx(idx >= 0 ? idx : 0);
        } else {
          setSelectedIdx(0);
        }
      } catch (err) {
        console.error('Error fetching registrations for slot list:', err);
        setRegistrations([]);
      } finally {
      }
    };
    fetchRegistrations();
  }, [externalFocusId]);

  // ── derived values (must be before useEffects that depend on them) ────────────

  const selectedReg = registrations[selectedIdx] || null;
  const myTeamName = selectedReg?.team_name || '';
  const tournamentName =
    selectedReg?.tournament?.title ||
    selectedReg?.tournament?.name ||
    selectedReg?.tournament_name ||
    '';
  const roundNumber = selectedReg?.tournament?.current_round || 1;

  const isMyTeam = (teamName) =>
    myTeamName && teamName.trim().toLowerCase() === myTeamName.trim().toLowerCase();

  // Countdown for slot list release (moved here, before the useEffect that uses it)
  const slotCountdown = useCountdown(selectedReg?.tournament?.slot_list_release_time);

  // ── auto-reveal when slot list countdown expires ─────────────────────────

  useEffect(() => {
    if (slotCountdown?.expired && registrations.length > 0) {
      const reg = registrations[selectedIdx];
      if (!reg) return;
      const tournamentId = reg.tournament?.id || reg.tournament_id;
      const roundNumber = reg.tournament?.current_round || 1;
      if (!tournamentId) return;

      setSlotsLoading(true);
      setSlots([]);
      tournamentAPI
        .getRoundGroups(tournamentId, roundNumber)
        .then((res) => {
          const groups =
            res.data?.groups || res.data?.results || (Array.isArray(res.data) ? res.data : []);
          setSlots(flattenGroups(groups));
        })
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotCountdown?.expired]);

  // ── fetch groups when selected registration changes ───────────────────────

  useEffect(() => {
    if (registrations.length === 0) return;
    const reg = registrations[selectedIdx];
    if (!reg) return;

    const tournamentId = reg.tournament?.id || reg.tournament_id;
    const roundNumber = reg.tournament?.current_round || 1;

    if (!tournamentId) return;

    const fetchGroups = async () => {
      // Don't fetch if slot list hasn't been released yet
      const releaseTime = reg.tournament?.slot_list_release_time;
      if (releaseTime && new Date(releaseTime) > new Date()) {
        setSlots([]);
        setSlotsLoading(false);
        return;
      }

      setSlotsLoading(true);
      setSlots([]);
      try {
        const res = await tournamentAPI.getRoundGroups(tournamentId, roundNumber);
        // API returns { round_number, groups: [...] }
        const groups =
          res.data?.groups || res.data?.results || (Array.isArray(res.data) ? res.data : []);
        setSlots(flattenGroups(groups));
      } catch (err) {
        // 404 is expected when groups haven't been assigned yet
        if (err.response?.status !== 404) {
          console.error('Error fetching round groups:', err);
        }
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchGroups();
  }, [registrations, selectedIdx]);

  // ── download slot list as PNG (no gold highlight) ─────────────────────────

  const handleDownload = async () => {
    if (!slotCardRef.current || downloading || slots.length === 0) return;
    setDownloading(true);
    try {
      // Strip gold classes temporarily
      const mineRows = slotCardRef.current.querySelectorAll('.slot-row-mine');
      const mineNames = slotCardRef.current.querySelectorAll('.slot-team-name-mine');
      const mineBadges = slotCardRef.current.querySelectorAll('.slot-your-team-badge');
      mineRows.forEach((el) => el.classList.remove('slot-row-mine'));
      mineNames.forEach((el) => el.classList.remove('slot-team-name-mine'));
      mineBadges.forEach((el) => (el.style.display = 'none'));

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(slotCardRef.current, {
        backgroundColor: null,
        scale: window.devicePixelRatio || 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Restore
      mineRows.forEach((el) => el.classList.add('slot-row-mine'));
      mineNames.forEach((el) => el.classList.add('slot-team-name-mine'));
      mineBadges.forEach((el) => (el.style.display = ''));

      const fileName = `slot-list-${(tournamentName || 'tournament').replace(/\s+/g, '-').replace(/[^a-z0-9_.-]/gi, '_')}.png`;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Slot list download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  // ── render: loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        {/* header skeleton */}
        <div className="flex items-center justify-between">
          <div className="slot-skeleton" style={{ width: '8rem', height: '1.5rem' }} />
          <div
            className="slot-skeleton"
            style={{ width: '10rem', height: '2rem', borderRadius: '0.5rem' }}
          />
        </div>
        <SkeletonRows count={8} />
      </div>
    );
  }

  // ── render: no registrations ──────────────────────────────────────────────

  if (registrations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ListOrdered size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Slot List</h2>
        </div>

        <div className="slot-empty">
          <ListOrdered className="slot-empty-icon" size={56} />
          <p className="slot-empty-title">You&apos;re not registered in any tournaments yet</p>
          <Link to="/tournaments" className="slot-empty-link">
            Browse Tournaments
          </Link>
        </div>
      </div>
    );
  }

  // ── render: main view ─────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Top header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-foreground">
          <ListOrdered size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
          Slot List
        </h2>

        {/* Tournament dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border) / 0.5)',
              color: 'hsl(var(--foreground))',
              maxWidth: '16rem',
            }}
          >
            <Gamepad2 size={13} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '11rem',
              }}
            >
              {tournamentName || 'Select Tournament'}
            </span>
            <ChevronDown
              size={12}
              style={{
                flexShrink: 0,
                transform: showDropdown ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>

          {showDropdown && (
            <div className="slot-filter-dropdown">
              {registrations.map((reg, i) => {
                const name =
                  reg.tournament?.title ||
                  reg.tournament?.name ||
                  reg.tournament_name ||
                  `Registration ${i + 1}`;
                const game = reg.tournament?.game_name || reg.tournament?.game || '';
                return (
                  <button
                    key={reg.id || i}
                    className={`slot-filter-option${i === selectedIdx ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedIdx(i);
                      setShowDropdown(false);
                    }}
                  >
                    {i === selectedIdx && <Check size={12} style={{ flexShrink: 0 }} />}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}
                    >
                      {name}
                      {game ? ` · ${game}` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Watch Live banner ─────────────────────────────────────────────── */}
      {selectedReg?.tournament?.live_link && (
        <a
          href={selectedReg.tournament.live_link}
          target="_blank"
          rel="noopener noreferrer"
          className="slot-live-banner"
        >
          <div className="slot-live-indicator">
            <Video size={16} />
            <span className="slot-live-dot" />
          </div>
          <span className="slot-live-text">Watch Live</span>
          <ExternalLink size={13} style={{ opacity: 0.7, marginLeft: 'auto' }} />
        </a>
      )}

      {/* ── Capture area: header + rows ──────────────────────────────────────── */}
      <div ref={slotCardRef}>
        {/* ── Centered sub-header block ───────────────────────────────────────── */}
        <div className="slot-header-block">
          <p className="slot-header-brand">SCRIMVERSE</p>
          <h3 className="slot-header-title">Slot List</h3>
          <p className="slot-header-subtitle">
            {tournamentName
              ? `${tournamentName} — Round ${roundNumber}`
              : 'Select a tournament above'}
          </p>
          <div className="slot-header-divider" />
        </div>

        {/* ── Slot rows ───────────────────────────────────────────────────────── */}
        {slotsLoading ? (
          <SkeletonRows count={6} />
        ) : slots.length > 0 ? (
          <>
            <div className="space-y-1.5">
              {slots.map(({ slotNumber, teamName }) => {
                const mine = isMyTeam(teamName);
                return (
                  <div key={slotNumber} className={`slot-row${mine ? ' slot-row-mine' : ''}`}>
                    {/* Slot number */}
                    <span className="slot-number">{pad2(slotNumber)}</span>

                    {/* Team name */}
                    <span className={`slot-team-name${mine ? ' slot-team-name-mine' : ''}`}>
                      {teamName}
                    </span>

                    {/* YOUR TEAM badge */}
                    {mine && (
                      <span className="slot-your-team-badge">
                        <Star size={9} fill="rgb(251,191,36)" />
                        YOUR TEAM
                      </span>
                    )}

                    {/* CONFIRMED section */}
                    <div className="slot-confirmed-badge">
                      <span className="slot-confirmed-text">CONFIRMED</span>
                      <div className="slot-confirmed-icon-wrap">
                        <CheckCircle2 size={13} style={{ color: 'rgb(74,222,128)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : /* No slots assigned yet — show countdown if available */
        slotCountdown && !slotCountdown.expired ? (
          <div className="slot-no-slots">
            <div className="credentials-countdown">
              <p className="credentials-countdown-label">
                <Clock size={12} />
                Slot List releasing in...
              </p>
              <div className="credentials-countdown-timer">
                {slotCountdown.d > 0 && (
                  <span className="credentials-countdown-unit">
                    <span className="credentials-countdown-value">{pad2(slotCountdown.d)}</span>
                    <span className="credentials-countdown-suffix">d</span>
                  </span>
                )}
                <span className="credentials-countdown-unit">
                  <span className="credentials-countdown-value">{pad2(slotCountdown.h)}</span>
                  <span className="credentials-countdown-suffix">h</span>
                </span>
                <span className="credentials-countdown-sep">:</span>
                <span className="credentials-countdown-unit">
                  <span className="credentials-countdown-value">{pad2(slotCountdown.m)}</span>
                  <span className="credentials-countdown-suffix">m</span>
                </span>
                <span className="credentials-countdown-sep">:</span>
                <span className="credentials-countdown-unit">
                  <span className="credentials-countdown-value">{pad2(slotCountdown.s)}</span>
                  <span className="credentials-countdown-suffix">s</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="slot-no-slots">
            <ClipboardList
              size={40}
              style={{ color: 'hsl(var(--muted-foreground) / 0.35)', marginBottom: '0.25rem' }}
            />
            <p className="slot-no-slots-text">
              Slot list not available yet. Check back once the host assigns groups.
            </p>
          </div>
        )}
      </div>

      {/* Download button — outside capture area */}
      {slots.length > 0 && (
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Round {roundNumber} · {slots.length} Teams
          </span>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border) / 0.5)',
              color: 'hsl(var(--foreground))',
              opacity: downloading ? 0.6 : 1,
            }}
          >
            <Download size={12} />
            {downloading ? 'Saving...' : 'Download'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerSlotListView;
