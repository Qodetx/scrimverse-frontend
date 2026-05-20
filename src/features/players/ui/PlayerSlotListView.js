import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import GuestLockedState from '../../../components/GuestLockedState';
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
  Sparkles,
} from 'lucide-react';
import { tournamentAPI, communityAPI } from '../../../utils/api';
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
    const groupName = group.group_name || '';
    teams.forEach((team) => {
      const name = team.team_name || team.player_name || team.name || '';
      if (name) {
        slots.push({ slotNumber: counter, teamName: name, groupName });
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

// Top-level wrapper picks between the locked-state placeholder for guests
// and the full authenticated view. Keeping the guest branch as its own
// component means the authenticated view's hooks list never has to include
// the guest check (which would violate Rules of Hooks if it short-circuited
// before the other useState calls below).
const PlayerSlotListView = (props) => {
  const { isGuest } = useContext(AuthContext);
  if (isGuest()) {
    return (
      <GuestLockedState
        title="Slot List"
        description="See your assigned slot and group for each round of the tournaments you've joined. Your team's slot appears here once the host releases the slot list."
      />
    );
  }
  return <PlayerSlotListViewAuthenticated {...props} />;
};

const PlayerSlotListViewAuthenticated = ({ focusTournamentId: externalFocusId } = {}) => {
  const [registrations, setRegistrations] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Open/closed state for the Download split-menu (PNG / CSV).
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef(null);

  // Community banner state
  const [communitySettings, setCommunitySettings] = useState({
    whatsapp_link: '',
    instagram_link: '',
  });
  const [waJoined, setWaJoined] = useState(false);
  const [igJoined, setIgJoined] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const communityDropdownRef = useRef(null);

  const dropdownRef = useRef(null);
  const slotCardRef = useRef(null);

  // ── close dropdowns on outside click ──────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setDownloadMenuOpen(false);
      }
      if (communityDropdownRef.current && !communityDropdownRef.current.contains(e.target)) {
        setCommunityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── fetch community settings + WhatsApp join status ──────────────────────
  useEffect(() => {
    const DISMISS_KEY = 'community_banner_dismissed_until';
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setBannerDismissed(true);
    }
    Promise.all([
      communityAPI.getSettings().catch(() => ({ data: { whatsapp_link: '', instagram_link: '' } })),
      communityAPI
        .getStatus()
        .catch(() => ({ data: { whatsapp_joined: false, instagram_joined: false } })),
    ]).then(([settingsRes, statusRes]) => {
      setCommunitySettings(settingsRes.data);
      setWaJoined(statusRes.data.whatsapp_joined);
      setIgJoined(statusRes.data.instagram_joined);
    });
  }, []);

  const handleWaBannerJoin = () => {
    if (!communitySettings.whatsapp_link) return;
    window.open(communitySettings.whatsapp_link, '_blank', 'noopener,noreferrer');
    communityAPI.recordJoin('whatsapp').catch(() => {});
    setWaJoined(true);
  };

  const handleIgBannerJoin = () => {
    if (!communitySettings.instagram_link) return;
    window.open(communitySettings.instagram_link, '_blank', 'noopener,noreferrer');
    communityAPI.recordJoin('instagram').catch(() => {});
    setIgJoined(true);
  };

  const handleBannerDismiss = () => {
    const dismissUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem('community_banner_dismissed_until', String(dismissUntil));
    setBannerDismissed(true);
  };

  // Show banner if at least one community link is set and user hasn't joined that one yet.
  const showWaBanner = communitySettings.whatsapp_link && !waJoined;
  const showIgBanner = communitySettings.instagram_link && !igJoined;
  const showCommunityBanner = (showWaBanner || showIgBanner) && !bannerDismissed;

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
        setLoading(false);
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

  const mySlotData = myTeamName
    ? slots.find((s) => s.teamName.trim().toLowerCase() === myTeamName.trim().toLowerCase())
    : null;

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

  // ── download slot list as PNG (canvas-based, matches standings image style) ──

  const handleDownload = async () => {
    if (downloading || slots.length === 0) return;
    setDownloading(true);
    try {
      // Preload fonts
      await new Promise((res) => {
        const fontLink = document.createElement('link');
        fontLink.href =
          'https://fonts.googleapis.com/css2?family=Outfit:wght@700;900&family=Inter:wght@400;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        setTimeout(res, 400);
      });

      // Try to load background image — S3 first, then local fallback, then null (pure dark)
      const tryImg = (url) =>
        new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = () => res(null);
          img.src = url;
        });
      const bgImage =
        (await tryImg(
          'https://scrimverse-public.s3.ap-south-1.amazonaws.com/media/uploaded_media_1769422838293.jpg'
        )) || (await tryImg('/standings-bg.jpeg'));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const width = 1080;
      const headerHeight = 300;
      const rowHeight = 70;
      const groupLabelHeight = 40;
      const footerHeight = 100;
      const sidePadding = 60;

      // Group slots by group name, restart slot counter per group
      const groupedSlots = [];
      let currentGroup = null;
      slots.forEach((slot) => {
        if (slot.groupName !== currentGroup) {
          currentGroup = slot.groupName;
          groupedSlots.push({ type: 'header', label: slot.groupName });
        }
        groupedSlots.push({ type: 'row', ...slot });
      });
      // Recalculate per-group slot numbers
      let groupSlotCounter = 1;
      groupedSlots.forEach((item) => {
        if (item.type === 'header') {
          groupSlotCounter = 1;
          return;
        }
        item.slotNumber = groupSlotCounter++;
      });

      const rowsH = groupedSlots.reduce(
        (sum, item) => sum + (item.type === 'header' ? groupLabelHeight : rowHeight),
        0
      );
      const totalHeight = headerHeight + rowsH + footerHeight + 20;

      canvas.width = width;
      canvas.height = totalHeight;

      // 1. Background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, totalHeight);
      if (bgImage) {
        const scale = Math.max(width / bgImage.width, totalHeight / bgImage.height);
        const imgW = bgImage.width * scale;
        const imgH = bgImage.height * scale;
        ctx.drawImage(bgImage, (width - imgW) / 2, (totalHeight - imgH) / 2, imgW, imgH);
      }
      const overlay = ctx.createLinearGradient(0, 0, 0, totalHeight);
      overlay.addColorStop(0, 'rgba(0,0,0,0.80)');
      overlay.addColorStop(0.4, 'rgba(0,0,0,0.55)');
      overlay.addColorStop(0.8, 'rgba(0,0,0,0.65)');
      overlay.addColorStop(1, 'rgba(0,0,0,0.90)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, width, totalHeight);

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // 2. SCRIMVERSE branding
      ctx.font = '900 72px "Outfit", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('SCRIMVERSE', width / 2, 90);
      ctx.shadowBlur = 0;

      // 3. SLOT LIST title
      ctx.font = '900 54px "Outfit", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('SLOT LIST', width / 2, 175);
      ctx.shadowBlur = 0;
      ctx.letterSpacing = '0px';

      // 4. Tournament + round subtitle
      const subtitle = `${(tournamentName || 'Tournament').toUpperCase()} — ROUND ${roundNumber}`;
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.letterSpacing = '2px';
      ctx.fillText(subtitle, width / 2, 232);
      ctx.letterSpacing = '0px';

      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 50, 258);
      ctx.lineTo(width / 2 + 50, 258);
      ctx.stroke();

      // 5. Grouped slot rows
      let curY = headerHeight;
      groupedSlots.forEach((item) => {
        if (item.type === 'header') {
          // Group label row
          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(139,92,246,0.85)';
          ctx.font = '700 13px "Inter", sans-serif';
          ctx.letterSpacing = '2px';
          ctx.fillText(item.label.toUpperCase(), sidePadding, curY + groupLabelHeight / 2);
          ctx.letterSpacing = '0px';
          // separator line
          ctx.strokeStyle = 'rgba(139,92,246,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sidePadding + 120, curY + groupLabelHeight / 2);
          ctx.lineTo(width - sidePadding, curY + groupLabelHeight / 2);
          ctx.stroke();
          curY += groupLabelHeight;
        } else {
          const { slotNumber, teamName: tName } = item;
          const isMine =
            myTeamName && tName.trim().toLowerCase() === myTeamName.trim().toLowerCase();
          const rowMidY = curY + rowHeight / 2;

          ctx.fillStyle = isMine ? 'rgba(245,158,11,0.15)' : 'rgba(0,0,0,0.45)';
          ctx.beginPath();
          ctx.roundRect(sidePadding, curY + 6, width - sidePadding * 2, rowHeight - 12, 8);
          ctx.fill();

          ctx.strokeStyle = isMine ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(sidePadding, curY + 6, width - sidePadding * 2, rowHeight - 12, 8);
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = '700 18px "Inter", sans-serif';
          ctx.fillText(String(slotNumber).padStart(2, '0'), sidePadding + 24, rowMidY);

          ctx.fillStyle = isMine ? '#FCD34D' : '#FFFFFF';
          ctx.font = '700 22px "Inter", sans-serif';
          const displayName = tName.length > 38 ? tName.substring(0, 36) + '...' : tName;
          ctx.fillText(displayName, sidePadding + 80, rowMidY);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#4ADE80';
          ctx.font = '700 13px "Inter", sans-serif';
          ctx.letterSpacing = '1px';
          ctx.fillText('CONFIRMED', width - sidePadding - 24, rowMidY);
          ctx.letterSpacing = '0px';
          curY += rowHeight;
        }
      });

      // 6. Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 18px "Outfit", sans-serif';
      ctx.letterSpacing = '6px';
      ctx.globalAlpha = 0.35;
      ctx.fillText('SCRIMVERSE.COM', width / 2, totalHeight - 45);
      ctx.globalAlpha = 1.0;
      ctx.letterSpacing = '0px';

      const fileName = `slot-list-${(tournamentName || 'tournament').replace(/\s+/g, '-').replace(/[^a-z0-9_.-]/gi, '_')}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Slot list download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  // CSV download — backed by a server-side streaming endpoint so the data
  // matches what a host's spreadsheet would expect (slot/group/team/captain/players).
  const handleDownloadCSV = async () => {
    const tournamentId = selectedReg?.tournament?.id || selectedReg?.tournament_id;
    if (!tournamentId) return;
    setDownloading(true);
    setDownloadMenuOpen(false);
    try {
      const res = await tournamentAPI.downloadSlotListCSV(tournamentId, roundNumber);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const fileName = `slot-list-${(tournamentName || 'tournament').replace(/\s+/g, '-').replace(/[^a-z0-9_.-]/gi, '_')}-round-${roundNumber}.csv`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Slot list CSV download error:', err);
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
      {/* ── Community Banner (WhatsApp + Instagram) ─────────────────────────── */}
      {showCommunityBanner && (
        <div className="sl-community-banner">
          <div className="sl-community-banner-left">
            <div className="sl-community-banner-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="sl-community-banner-title">Join the Scrimverse community</p>
              <p className="sl-community-banner-sub">
                Get match updates, announcements &amp; tournament news
              </p>
            </div>
          </div>
          <div className="sl-community-banner-actions">
            {showWaBanner && (
              <button className="sl-community-join-btn" onClick={handleWaBannerJoin}>
                Join WhatsApp
              </button>
            )}
            {showIgBanner && (
              <button
                className="sl-community-join-btn sl-community-ig-btn"
                onClick={handleIgBannerJoin}
              >
                Join Instagram
              </button>
            )}
            <button className="sl-community-later-btn" onClick={handleBannerDismiss}>
              Later
            </button>
          </div>
        </div>
      )}

      {/* ── Top header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-foreground">
          <ListOrdered size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
          Slot List
        </h2>

        {/* Right side controls */}
        <div className="sl-controls-row">
          {selectedReg?.tournament?.live_link && (
            <a
              href={selectedReg.tournament.live_link}
              target="_blank"
              rel="noopener noreferrer"
              className="sl-live-btn"
            >
              <Video size={13} />
              Watch Live
              <ExternalLink size={11} style={{ opacity: 0.7 }} />
            </a>
          )}

          {/* Permanent Join Community button */}
          {(communitySettings.whatsapp_link || communitySettings.instagram_link) && (
            <div className="relative" ref={communityDropdownRef}>
              <button
                onClick={() => setCommunityDropdownOpen((v) => !v)}
                className="sl-community-permanent-btn"
              >
                <Sparkles size={13} />
                Join Community
              </button>
              {communityDropdownOpen && (
                <div className="sl-community-dropdown">
                  {communitySettings.whatsapp_link && (
                    <button
                      className="sl-community-dropdown-item"
                      onClick={() => {
                        window.open(
                          communitySettings.whatsapp_link,
                          '_blank',
                          'noopener,noreferrer'
                        );
                        communityAPI.recordJoin('whatsapp').catch(() => {});
                        setCommunityDropdownOpen(false);
                      }}
                    >
                      WhatsApp
                    </button>
                  )}
                  {communitySettings.instagram_link && (
                    <button
                      className="sl-community-dropdown-item sl-community-dropdown-ig"
                      onClick={() => {
                        window.open(
                          communitySettings.instagram_link,
                          '_blank',
                          'noopener,noreferrer'
                        );
                        communityAPI.recordJoin('instagram').catch(() => {});
                        setCommunityDropdownOpen(false);
                      }}
                    >
                      Instagram
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tournament dropdown */}
          <div className="sl-tournament-dropdown-wrap" ref={dropdownRef}>
            <button onClick={() => setShowDropdown((v) => !v)} className="sl-tournament-filter-btn">
              <Gamepad2 size={13} style={{ flexShrink: 0 }} />
              <span className="sl-tournament-filter-label">
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
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0,
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
      </div>

      {/* ── My slot chip ─────────────────────────────────────────────────────── */}
      {mySlotData && (
        <div className="psl-my-slot-chip">
          <Star size={12} style={{ flexShrink: 0 }} />
          <span>
            {mySlotData.teamName}
            {mySlotData.groupName ? ` · ${mySlotData.groupName}` : ''}
            {` · Slot ${pad2(mySlotData.slotNumber)}`}
          </span>
        </div>
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

      {/* Download split-button — outside capture area.
          Made prominent (purple primary style) per client feedback that the
          original button was easy to miss. PNG is the default action; the
          dropdown adds CSV (server-side streaming export). */}
      {slots.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-3 px-1 gap-2">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Round {roundNumber} · {slots.length} Teams
          </span>
          <div ref={downloadMenuRef} style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                width: '100%',
                borderRadius: 8,
                overflow: 'hidden',
                opacity: downloading ? 0.6 : 1,
                boxShadow: '0 2px 8px hsl(var(--accent) / 0.25)',
              }}
            >
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  flex: '1 1 auto',
                  background: 'hsl(var(--accent))',
                  border: 'none',
                  color: '#fff',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                }}
              >
                <Download size={14} />
                {downloading ? 'Saving…' : 'Download Slot List'}
              </button>
              <button
                onClick={() => setDownloadMenuOpen((v) => !v)}
                disabled={downloading}
                aria-label="Choose download format"
                className="flex items-center justify-center transition-colors"
                style={{
                  width: 36,
                  background: 'hsl(var(--accent))',
                  borderLeft: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                }}
              >
                <span
                  style={{
                    transform: downloadMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                >
                  ▾
                </span>
              </button>
            </div>
            {downloadMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  borderRadius: 8,
                  minWidth: 180,
                  zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                <button
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    handleDownload();
                  }}
                  className="block w-full text-left px-3 py-2 text-xs font-medium hover:bg-[hsl(var(--secondary)/0.4)]"
                  style={{
                    color: 'hsl(var(--foreground))',
                    background: 'transparent',
                    border: 'none',
                  }}
                >
                  Image (PNG)
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="block w-full text-left px-3 py-2 text-xs font-medium hover:bg-[hsl(var(--secondary)/0.4)]"
                  style={{
                    color: 'hsl(var(--foreground))',
                    background: 'transparent',
                    border: 'none',
                    borderTop: '1px solid hsl(var(--border) / 0.3)',
                  }}
                >
                  Spreadsheet (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSlotListView;
