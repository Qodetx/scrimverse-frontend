import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListOrdered,
  Gamepad2,
  ChevronDown,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import './HostSlotListView.css';

// ─── helpers ─────────────────────────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Flatten all groups returned by getRoundGroups into a single ordered list.
 * Each entry: { slotNumber, teamName }
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

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const SkeletonRows = ({ count = 3 }) => (
  <div className="space-y-1.5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="hsl-skeleton" />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const HostSlotListView = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
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

  // ── fetch host's tournaments on mount ─────────────────────────────────────

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const hostId = user?.profile?.id;
        if (!hostId) {
          setTournaments([]);
          setLoading(false);
          return;
        }
        const res = await tournamentAPI.getHostTournaments(hostId);
        const all = res.data?.results || res.data || [];
        const filtered = Array.isArray(all) ? all.filter((t) => t.status !== 'upcoming') : [];
        setTournaments(filtered);
        setSelectedIdx(0);
      } catch (err) {
        console.error('Error fetching host tournaments for slot list:', err);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── derived values ────────────────────────────────────────────────────────

  const tournament = tournaments[selectedIdx] || null;
  const tournamentName = tournament?.title || tournament?.name || '';
  const roundNumber = tournament?.current_round || 1;

  // ── fetch groups when selected tournament changes ─────────────────────────
  // Host always sees slot list — no countdown gate

  useEffect(() => {
    if (tournaments.length === 0) return;
    const t = tournaments[selectedIdx];
    if (!t) return;

    const tournamentId = t.id;
    const round = t.current_round || 1;
    if (!tournamentId) return;

    const fetchGroups = async () => {
      setSlotsLoading(true);
      setSlots([]);
      try {
        const res = await tournamentAPI.getRoundGroups(tournamentId, round);
        const groups =
          res.data?.groups || res.data?.results || (Array.isArray(res.data) ? res.data : []);
        setSlots(flattenGroups(groups));
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error fetching round groups for slot list:', err);
        }
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchGroups();
  }, [tournaments, selectedIdx]);

  // ── download slot list as PNG ─────────────────────────────────────────────

  const handleDownload = async () => {
    if (!slotCardRef.current || downloading || slots.length === 0) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(slotCardRef.current, {
        backgroundColor: null,
        scale: window.devicePixelRatio || 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const fileName = `slot-list-${(tournamentName || 'tournament')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_.-]/gi, '_')}.png`;
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
        <div className="flex items-center justify-between">
          <div className="hsl-skeleton" style={{ width: '8rem', height: '1.5rem' }} />
          <div
            className="hsl-skeleton"
            style={{ width: '10rem', height: '2rem', borderRadius: '0.5rem' }}
          />
        </div>
        <SkeletonRows count={8} />
      </div>
    );
  }

  // ── render: no tournaments ─────────────────────────────────────────────────

  if (tournaments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ListOrdered size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Slot List</h2>
        </div>

        <div className="hsl-empty">
          <ListOrdered className="hsl-empty-icon" size={56} />
          <p className="hsl-empty-title">You haven&apos;t created any active tournaments yet</p>
          <button onClick={() => navigate('/host/tournaments/create')} className="hsl-empty-link">
            Create Tournament
          </button>
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
            <div className="hsl-filter-dropdown">
              {tournaments.map((t, i) => {
                const name = t.title || t.name || `Tournament ${i + 1}`;
                const game = t.game_name || t.game || '';
                return (
                  <button
                    key={t.id || i}
                    className={`hsl-filter-option${i === selectedIdx ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedIdx(i);
                      setShowDropdown(false);
                    }}
                  >
                    {i === selectedIdx && <Check size={12} style={{ flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
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

      {/* ── Capture area: header + rows ──────────────────────────────────────── */}
      <div ref={slotCardRef}>
        {/* ── Centered sub-header block ─────────────────────────────────────── */}
        <div className="hsl-header-block">
          <p className="hsl-header-brand">SCRIMVERSE</p>
          <h3 className="hsl-header-title">SLOT LIST</h3>
          <p className="hsl-header-subtitle">
            {tournamentName
              ? `${tournamentName} — Round ${roundNumber}`
              : 'Select a tournament above'}
          </p>
          <div className="hsl-header-divider" />
        </div>

        {/* ── Slot rows ─────────────────────────────────────────────────────── */}
        {slotsLoading ? (
          <SkeletonRows count={6} />
        ) : slots.length > 0 ? (
          <div className="space-y-1.5">
            {slots.map(({ slotNumber, teamName }) => (
              <div key={slotNumber} className="hsl-row">
                {/* Slot number */}
                <span className="hsl-number">{pad2(slotNumber)}</span>

                {/* Team name */}
                <span className="hsl-team-name">{teamName}</span>

                {/* CONFIRMED badge */}
                <div className="hsl-confirmed-badge">
                  <span className="hsl-confirmed-text">CONFIRMED</span>
                  <div className="hsl-confirmed-icon-wrap">
                    <CheckCircle2 size={13} style={{ color: 'rgb(74,222,128)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hsl-no-slots">
            <ClipboardList
              size={40}
              style={{ color: 'hsl(var(--muted-foreground) / 0.35)', marginBottom: '0.25rem' }}
            />
            <p className="hsl-no-slots-text">
              No groups assigned yet for this round. Assign teams to groups in Manage Tournament.
            </p>
          </div>
        )}
      </div>

      {/* Download button — outside capture area */}
      {slots.length > 0 && (
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Round {roundNumber} &middot; {slots.length} Teams
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

export default HostSlotListView;
