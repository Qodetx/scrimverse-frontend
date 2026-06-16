import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import GuestLockedState from '../../../components/GuestLockedState';
import {
  Table2,
  Gamepad2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Star,
  Download,
  Video,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { tournamentAPI, communityAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import { generateStandingsImage } from '../../tournaments/ui/standingsImageGenerator';
import './PlayerPointsTableView.css';

// ─── helpers ─────────────────────────────────────────────────────────────────

const getRoundLabel = (tournament, roundNum) => {
  if (tournament?.round_names && tournament.round_names[String(roundNum)]) {
    return tournament.round_names[String(roundNum)];
  }
  const totalRounds = tournament?.rounds_count || tournament?.rounds?.length || 1;
  if (roundNum === totalRounds && totalRounds > 1) {
    return 'Finals';
  }
  return `R${roundNum}`;
};

const getRoundCount = (tournament) => {
  if (tournament?.rounds_count) return tournament.rounds_count;
  if (Array.isArray(tournament?.rounds)) return tournament.rounds.length;
  if (tournament?.current_round) return tournament.current_round;
  return 1;
};

// Rank display: explicit number for ALL ranks. Top-3 get a colored accent
// via inline style; rank 4+ uses default white. Per client request, no medal
// icons or emoji — just clear "1, 2, 3..." labels.
const getRankIcon = (rank) => {
  let color;
  if (rank === 1)
    color = 'rgb(234 179 8)'; // gold
  else if (rank === 2)
    color = 'rgb(192 192 192)'; // silver
  else if (rank === 3) color = 'rgb(205 127 50)'; // bronze
  return (
    <span className="pt-rank-num" style={color ? { color, fontWeight: 800 } : undefined}>
      {rank}
    </span>
  );
};

// ─── Custom dropdown ──────────────────────────────────────────────────────────

const CustomDropdown = ({ trigger, children, align = 'right', menuClassName = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger(open)}</div>
      {open && (
        <div
          className={`pt-dropdown-menu ${menuClassName}`}
          style={align === 'left' ? { right: 'auto', left: 0 } : {}}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
};

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const SkeletonRows = ({ count = 6 }) => (
  <div
    style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="pt-skeleton" style={{ height: '2.5rem', borderRadius: '0.5rem' }} />
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

// Wrapper splits guest vs authenticated rendering — keeps the heavy hook list
// of the authenticated view from being conditionally invoked.
const PlayerPointsTableView = () => {
  const { isGuest } = useContext(AuthContext);
  if (isGuest()) {
    return (
      <GuestLockedState
        title="Points Table"
        description="Live standings for your tournaments — kills, position points, and totals per round, updated as scores are submitted."
      />
    );
  }
  return <PlayerPointsTableViewAuthenticated />;
};

const PlayerPointsTableViewAuthenticated = () => {
  const { showToast } = useToast();

  // ── state ─────────────────────────────────────────────────────────────────
  const [registrations, setRegistrations] = useState([]);
  const [selectedTournamentIdx, setSelectedTournamentIdx] = useState(0);
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedMatchNum, setSelectedMatchNum] = useState(1);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);

  const [groupsData, setGroupsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState('match'); // 'match' | 'results'

  // Community state (mirrors PlayerSlotListView)
  const [communitySettings, setCommunitySettings] = useState({
    whatsapp_link: '',
    instagram_link: '',
  });
  const [waJoined, setWaJoined] = useState(false);
  const [igJoined, setIgJoined] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ── fetch registrations on mount ──────────────────────────────────────────

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await tournamentAPI.getMyRegistrations();
        const all = res.data?.results || res.data || [];
        const filtered = Array.isArray(all)
          ? all.filter((r) => r.status === 'confirmed' || r.status === 'pending')
          : [];
        setRegistrations(filtered);
        setSelectedTournamentIdx(0);
      } catch (err) {
        console.error('Error fetching registrations for points table:', err);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  // ── community settings + join status ──────────────────────────────────────

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

  // ── fetch groups when tournament or round changes ─────────────────────────

  useEffect(() => {
    if (registrations.length === 0) return;
    const reg = registrations[selectedTournamentIdx];
    if (!reg) return;

    const tournamentId = reg.tournament?.id || reg.tournament_id;
    if (!tournamentId) return;

    const fetchGroups = async () => {
      setGroupsLoading(true);
      setGroupsData([]);
      setSelectedGroupIdx(0);
      setSelectedMatchNum(1);
      try {
        const res = await tournamentAPI.getRoundGroups(tournamentId, selectedRound);
        const groups =
          res.data?.groups || res.data?.results || (Array.isArray(res.data) ? res.data : []);
        setGroupsData(groups);
        // Auto-select player's own group
        const teamName = reg.team_name || '';
        if (teamName && groups.length > 0) {
          const myIdx = groups.findIndex((g) =>
            (g.teams || []).some(
              (t) => (t.team_name || '').toLowerCase() === teamName.toLowerCase()
            )
          );
          if (myIdx !== -1) setSelectedGroupIdx(myIdx);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error fetching round groups:', err);
        }
        setGroupsData([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrations, selectedTournamentIdx, selectedRound]);

  // ── derived values ────────────────────────────────────────────────────────

  const selectedReg = registrations[selectedTournamentIdx] || null;
  const tournament = selectedReg?.tournament || null;
  const tournamentTitle =
    selectedReg?.tournament?.title ||
    selectedReg?.tournament?.name ||
    selectedReg?.tournament_name ||
    '';
  const myTeamName = selectedReg?.team_name || '';

  const roundCount = tournament ? getRoundCount(tournament) : 1;
  const roundNumbers = Array.from({ length: roundCount }, (_, i) => i + 1);

  const selectedGroup = groupsData[selectedGroupIdx] || null;
  const groupName = selectedGroup?.group_name || '';

  const matchList = selectedGroup?.matches || [];

  // Build the sorted standings for the selected match
  const getMatchScores = useCallback(() => {
    if (!selectedGroup?.matches) return [];
    const match = selectedGroup.matches.find((m) => m.match_number === selectedMatchNum);
    if (!match) return [];
    const scores = match.scores || match.match_scores || [];
    if (!scores.length) return [];

    const standings = scores.map((score) => ({
      team_id: score.team_id || score.team,
      team_name: score.team_name || score.name || '',
      wins: score.wins || 0,
      position_points: score.position_points || 0,
      kill_points: score.kill_points || 0,
      total_points: (score.position_points || 0) + (score.kill_points || 0),
    }));

    standings.sort(
      (a, b) =>
        b.total_points - a.total_points || b.wins - a.wins || b.position_points - a.position_points
    );
    return standings;
  }, [selectedGroup, selectedMatchNum]);

  const standings = getMatchScores();

  // Build cumulative standings across all matches in the selected group
  const getCumulativeStandings = useCallback(() => {
    if (!selectedGroup?.matches) return [];
    const totals = {};
    selectedGroup.matches.forEach((match) => {
      const scores = match.scores || match.match_scores || [];
      scores.forEach((score) => {
        const id = score.team_id || score.team;
        if (!totals[id]) {
          totals[id] = {
            team_id: id,
            team_name: score.team_name || score.name || '',
            wins: 0,
            position_points: 0,
            kill_points: 0,
            total_points: 0,
          };
        }
        totals[id].wins += score.wins || 0;
        totals[id].position_points += score.position_points || 0;
        totals[id].kill_points += score.kill_points || 0;
        totals[id].total_points += (score.position_points || 0) + (score.kill_points || 0);
      });
    });
    return Object.values(totals).sort(
      (a, b) =>
        b.total_points - a.total_points || b.wins - a.wins || b.position_points - a.position_points
    );
  }, [selectedGroup]);

  const displayStandings = viewMode === 'results' ? getCumulativeStandings() : standings;

  const isMyTeam = (teamName) =>
    myTeamName && teamName.trim().toLowerCase() === myTeamName.trim().toLowerCase();

  // match navigation
  const matchNumbers = matchList.map((m) => m.match_number).sort((a, b) => a - b);
  const currentMatchIdx = matchNumbers.indexOf(selectedMatchNum);

  // ── download ──────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (downloading || displayStandings.length === 0) return;
    setDownloading(true);
    try {
      const dataUrls = await generateStandingsImage({
        tournament,
        standings: displayStandings,
        viewMode,
        selectedRound,
        selectedMatch: selectedMatchNum,
        selectedGroup,
        getRoundLabel: (rn) => getRoundLabel(tournament, rn),
      });

      const baseFileName = `points-table-${(tournamentTitle || 'tournament')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_.-]/gi, '_')}`;

      const totalPages = dataUrls.length;
      for (let idx = 0; idx < totalPages; idx++) {
        const fileName =
          totalPages === 1 ? baseFileName + '.png' : `${baseFileName}_p${idx + 1}.png`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrls[idx];
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (idx < totalPages - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      showToast(
        totalPages > 1 ? `Downloaded ${totalPages} pages!` : 'Points table downloaded!',
        'success'
      );
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download points table', 'error');
    } finally {
      setDownloading(false);
    }
  }, [
    downloading,
    displayStandings,
    tournament,
    viewMode,
    selectedRound,
    selectedMatchNum,
    selectedGroup,
    tournamentTitle,
    showToast,
  ]);

  // ── loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="pt-skeleton" style={{ width: '9rem', height: '1.5rem' }} />
          <div className="flex gap-2">
            <div
              className="pt-skeleton"
              style={{ width: '7rem', height: '2rem', borderRadius: '0.5rem' }}
            />
            <div
              className="pt-skeleton"
              style={{ width: '10rem', height: '2rem', borderRadius: '0.5rem' }}
            />
          </div>
        </div>
        <div className="pt-card">
          <SkeletonRows count={8} />
        </div>
      </div>
    );
  }

  // ── no registrations ──────────────────────────────────────────────────────

  if (registrations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Table2 size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Points Table</h2>
        </div>
        <div className="pt-card">
          <div className="pt-empty">
            <Table2 size={48} className="pt-empty-icon" />
            <p className="pt-empty-title">You&apos;re not registered in any tournaments yet</p>
            <Link to="/tournaments" className="pt-empty-link">
              Browse Tournaments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── community derived values ──────────────────────────────────────────────
  const showWaBanner = communitySettings.whatsapp_link && !waJoined;
  const showIgBanner = communitySettings.instagram_link && !igJoined;
  const showCommunityBanner = (showWaBanner || showIgBanner) && !bannerDismissed;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Community Banner ───────────────────────────────────────────────── */}
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
              <button
                className="sl-community-join-btn"
                onClick={() => {
                  window.open(communitySettings.whatsapp_link, '_blank', 'noopener,noreferrer');
                  communityAPI.recordJoin('whatsapp').catch(() => {});
                  setWaJoined(true);
                }}
              >
                <svg viewBox="0 0 32 32" width="13" height="13" fill="currentColor">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.472 2.027 7.77L0 32l8.43-2.007A15.934 15.934 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.77-1.853l-.485-.288-5.003 1.192 1.213-4.873-.317-.5A13.28 13.28 0 012.667 16C2.667 8.637 8.637 2.667 16 2.667S29.333 8.637 29.333 16 23.363 29.333 16 29.333zm7.27-9.97c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.63-.2-.896.2s-1.028 1.294-1.26 1.56c-.232.266-.464.3-.862.1-.398-.2-1.68-.62-3.2-1.977-1.183-1.056-1.98-2.36-2.213-2.758-.232-.398-.025-.613.175-.812.18-.178.398-.464.597-.697.2-.232.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.2-.896-2.16-1.228-2.958-.323-.776-.65-.67-.896-.683l-.763-.013c-.266 0-.697.1-1.063.498-.365.398-1.394 1.362-1.394 3.322s1.427 3.853 1.626 4.12c.2.265 2.808 4.287 6.806 6.013.951.41 1.693.655 2.272.838.954.303 1.823.26 2.51.158.766-.114 2.355-.963 2.687-1.893.332-.93.332-1.727.232-1.893-.1-.166-.365-.266-.763-.465z" />
                </svg>
                Join WhatsApp
              </button>
            )}
            {showIgBanner && (
              <button
                className="sl-community-join-btn sl-community-ig-btn"
                onClick={() => {
                  window.open(communitySettings.instagram_link, '_blank', 'noopener,noreferrer');
                  communityAPI.recordJoin('instagram').catch(() => {});
                  setIgJoined(true);
                }}
              >
                <svg viewBox="0 0 32 32" width="13" height="13" fill="currentColor">
                  <path d="M16 2.882c4.27 0 4.776.016 6.46.093 1.56.071 2.407.332 2.97.55a4.956 4.956 0 011.84 1.196 4.956 4.956 0 011.196 1.84c.219.563.48 1.41.55 2.97.077 1.685.094 2.19.094 6.46s-.017 4.776-.094 6.46c-.07 1.56-.331 2.407-.55 2.97a4.956 4.956 0 01-1.196 1.84 4.956 4.956 0 01-1.84 1.196c-.563.219-1.41.48-2.97.55-1.684.077-2.19.094-6.46.094s-4.776-.017-6.46-.094c-1.56-.07-2.407-.331-2.97-.55a4.956 4.956 0 01-1.84-1.196 4.956 4.956 0 01-1.196-1.84c-.219-.563-.48-1.41-.55-2.97C2.898 20.776 2.88 20.27 2.88 16s.017-4.776.094-6.46c.07-1.56.331-2.407.55-2.97a4.956 4.956 0 011.196-1.84 4.956 4.956 0 011.84-1.196c.563-.219 1.41-.48 2.97-.55 1.684-.077 2.19-.093 6.46-.093M16 0c-4.344 0-4.888.018-6.592.096C7.71.174 6.546.444 5.535.84a7.836 7.836 0 00-2.833 1.844A7.836 7.836 0 00.858 5.517C.462 6.528.192 7.692.114 9.39.036 11.094 0 11.638 0 16s.018 4.906.096 6.61c.078 1.698.348 2.862.744 3.873a7.836 7.836 0 001.844 2.833 7.836 7.836 0 002.833 1.844c1.011.396 2.175.666 3.873.744C11.094 31.982 11.638 32 16 32s4.906-.018 6.61-.096c1.698-.078 2.862-.348 3.873-.744a7.836 7.836 0 002.833-1.844 7.836 7.836 0 001.844-2.833c.396-1.011.666-2.175.744-3.873C31.982 20.906 32 20.362 32 16s-.018-4.906-.096-6.61c-.078-1.698-.348-2.862-.744-3.873a7.836 7.836 0 00-1.844-2.833A7.836 7.836 0 0026.483.84C25.472.444 24.308.174 22.61.096 20.906.018 20.362 0 16 0zm0 7.784a8.216 8.216 0 100 16.432 8.216 8.216 0 000-16.432zm0 13.549a5.333 5.333 0 110-10.666 5.333 5.333 0 010 10.666zm8.538-13.878a1.92 1.92 0 11-3.84 0 1.92 1.92 0 013.84 0z" />
                </svg>
                Join Instagram
              </button>
            )}
            <button
              className="sl-community-later-btn"
              onClick={() => {
                const dismissUntil = Date.now() + 24 * 60 * 60 * 1000;
                localStorage.setItem('community_banner_dismissed_until', String(dismissUntil));
                setBannerDismissed(true);
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* ── Top header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-foreground">
          <Table2 size={20} style={{ color: 'hsl(var(--purple))' }} />
          Points Table
        </h2>

        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {/* Community buttons */}
          {communitySettings.whatsapp_link && (
            <button
              className="sl-community-permanent-btn sl-community-whatsapp-btn"
              onClick={() => {
                window.open(communitySettings.whatsapp_link, '_blank', 'noopener,noreferrer');
                communityAPI.recordJoin('whatsapp').catch(() => {});
              }}
            >
              <svg viewBox="0 0 32 32" width="13" height="13" fill="currentColor">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.472 2.027 7.77L0 32l8.43-2.007A15.934 15.934 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.77-1.853l-.485-.288-5.003 1.192 1.213-4.873-.317-.5A13.28 13.28 0 012.667 16C2.667 8.637 8.637 2.667 16 2.667S29.333 8.637 29.333 16 23.363 29.333 16 29.333zm7.27-9.97c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.63-.2-.896.2s-1.028 1.294-1.26 1.56c-.232.266-.464.3-.862.1-.398-.2-1.68-.62-3.2-1.977-1.183-1.056-1.98-2.36-2.213-2.758-.232-.398-.025-.613.175-.812.18-.178.398-.464.597-.697.2-.232.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.2-.896-2.16-1.228-2.958-.323-.776-.65-.67-.896-.683l-.763-.013c-.266 0-.697.1-1.063.498-.365.398-1.394 1.362-1.394 3.322s1.427 3.853 1.626 4.12c.2.265 2.808 4.287 6.806 6.013.951.41 1.693.655 2.272.838.954.303 1.823.26 2.51.158.766-.114 2.355-.963 2.687-1.893.332-.93.332-1.727.232-1.893-.1-.166-.365-.266-.763-.465z" />
              </svg>
              Join WhatsApp
            </button>
          )}
          {communitySettings.instagram_link && (
            <button
              className="sl-community-permanent-btn sl-community-instagram-btn"
              onClick={() => {
                window.open(communitySettings.instagram_link, '_blank', 'noopener,noreferrer');
                communityAPI.recordJoin('instagram').catch(() => {});
              }}
            >
              <svg viewBox="0 0 32 32" width="13" height="13" fill="currentColor">
                <path d="M16 2.882c4.27 0 4.776.016 6.46.093 1.56.071 2.407.332 2.97.55a4.956 4.956 0 011.84 1.196 4.956 4.956 0 011.196 1.84c.219.563.48 1.41.55 2.97.077 1.685.094 2.19.094 6.46s-.017 4.776-.094 6.46c-.07 1.56-.331 2.407-.55 2.97a4.956 4.956 0 01-1.196 1.84 4.956 4.956 0 01-1.84 1.196c-.563.219-1.41.48-2.97.55-1.684.077-2.19.094-6.46.094s-4.776-.017-6.46-.094c-1.56-.07-2.407-.331-2.97-.55a4.956 4.956 0 01-1.84-1.196 4.956 4.956 0 01-1.196-1.84c-.219-.563-.48-1.41-.55-2.97C2.898 20.776 2.88 20.27 2.88 16s.017-4.776.094-6.46c.07-1.56.331-2.407.55-2.97a4.956 4.956 0 011.196-1.84 4.956 4.956 0 011.84-1.196c.563-.219 1.41-.48 2.97-.55 1.684-.077 2.19-.093 6.46-.093M16 0c-4.344 0-4.888.018-6.592.096C7.71.174 6.546.444 5.535.84a7.836 7.836 0 00-2.833 1.844A7.836 7.836 0 00.858 5.517C.462 6.528.192 7.692.114 9.39.036 11.094 0 11.638 0 16s.018 4.906.096 6.61c.078 1.698.348 2.862.744 3.873a7.836 7.836 0 001.844 2.833 7.836 7.836 0 002.833 1.844c1.011.396 2.175.666 3.873.744C11.094 31.982 11.638 32 16 32s4.906-.018 6.61-.096c1.698-.078 2.862-.348 3.873-.744a7.836 7.836 0 002.833-1.844 7.836 7.836 0 001.844-2.833c.396-1.011.666-2.175.744-3.873C31.982 20.906 32 20.362 32 16s-.018-4.906-.096-6.61c-.078-1.698-.348-2.862-.744-3.873a7.836 7.836 0 00-1.844-2.833A7.836 7.836 0 0026.483.84C25.472.444 24.308.174 22.61.096 20.906.018 20.362 0 16 0zm0 7.784a8.216 8.216 0 100 16.432 8.216 8.216 0 000-16.432zm0 13.549a5.333 5.333 0 110-10.666 5.333 5.333 0 010 10.666zm8.538-13.878a1.92 1.92 0 11-3.84 0 1.92 1.92 0 013.84 0z" />
              </svg>
              Join Instagram
            </button>
          )}

          {/* Group dropdown */}
          <CustomDropdown
            align="right"
            menuClassName="pt-dropdown-group-mobile"
            trigger={(open) => (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <span
                  style={{
                    maxWidth: '8rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {groupName || 'Group'}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    flexShrink: 0,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>
            )}
          >
            {(close) =>
              groupsData.length === 0 ? (
                <div className="pt-dropdown-option" style={{ opacity: 0.5, cursor: 'default' }}>
                  No groups available
                </div>
              ) : (
                groupsData.map((group, i) => (
                  <button
                    key={group.id || i}
                    className={`pt-dropdown-option${i === selectedGroupIdx ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedGroupIdx(i);
                      setSelectedMatchNum(1);
                      setViewMode('match');
                      close();
                    }}
                  >
                    {i === selectedGroupIdx && <Check size={12} style={{ flexShrink: 0 }} />}
                    <span className="pt-dropdown-option-label">{group.group_name}</span>
                  </button>
                ))
              )
            }
          </CustomDropdown>

          {/* Tournament dropdown */}
          <CustomDropdown
            align="right"
            menuClassName="pt-dropdown-tournament-mobile"
            trigger={(open) => (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  color: 'hsl(var(--foreground))',
                  maxWidth: '14rem',
                }}
              >
                <Gamepad2 size={13} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '9rem',
                  }}
                >
                  {tournamentTitle || 'Select Tournament'}
                </span>
                <ChevronDown
                  size={12}
                  style={{
                    flexShrink: 0,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>
            )}
          >
            {(close) =>
              registrations.map((reg, i) => {
                const name =
                  reg.tournament?.title ||
                  reg.tournament?.name ||
                  reg.tournament_name ||
                  `Registration ${i + 1}`;
                const game = reg.tournament?.game_name || reg.tournament?.game || '';
                return (
                  <button
                    key={reg.id || i}
                    className={`pt-dropdown-option${i === selectedTournamentIdx ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedTournamentIdx(i);
                      setSelectedRound(1);
                      setSelectedMatchNum(1);
                      setSelectedGroupIdx(0);
                      setViewMode('match');
                      close();
                    }}
                  >
                    {i === selectedTournamentIdx && <Check size={12} style={{ flexShrink: 0 }} />}
                    <span className="pt-dropdown-option-label">
                      {name}
                      {game ? ` · ${game}` : ''}
                    </span>
                  </button>
                );
              })
            }
          </CustomDropdown>

          {/* Watch Live button */}
          {tournament?.live_link && (
            <a
              href={tournament.live_link}
              target="_blank"
              rel="noopener noreferrer"
              className="pt-live-btn"
            >
              <Video size={13} />
              Watch Live
              <ExternalLink size={11} style={{ opacity: 0.7 }} />
            </a>
          )}
        </div>
      </div>

      {/* ── My group chip ──────────────────────────────────────────────────── */}
      {myTeamName && groupName && (
        <div className="pt-my-group-chip">
          <Star size={12} style={{ flexShrink: 0 }} />
          <span>
            {myTeamName} · {groupName}
          </span>
        </div>
      )}

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div className="pt-card">
        {/* ── Card header ──────────────────────────────────────────────────── */}
        <div className="pt-header">
          <p className="pt-header-brand">SCRIMVERSE</p>
          <h3 className="pt-header-title">OVERALL STANDINGS</h3>
          <span className="pt-header-badge">
            {groupName || 'Group'} {groupName ? '—' : ''} {getRoundLabel(tournament, selectedRound)}
          </span>

          {/* Round pills */}
          <div className="pt-round-pills">
            <div className="pt-round-pills-inner">
              {roundNumbers.map((roundNum) => (
                <button
                  key={roundNum}
                  className={`pt-round-pill${selectedRound === roundNum ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedRound(roundNum);
                    setSelectedMatchNum(1);
                    setSelectedGroupIdx(0);
                    setViewMode('match');
                  }}
                >
                  {getRoundLabel(tournament, roundNum)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Match tabs ───────────────────────────────────────────────────── */}
        <div className="pt-match-tabs">
          <button
            className="pt-nav-arrow"
            disabled={currentMatchIdx <= 0 || viewMode === 'results'}
            onClick={() => {
              if (currentMatchIdx > 0) {
                setSelectedMatchNum(matchNumbers[currentMatchIdx - 1]);
              }
            }}
          >
            <ChevronLeft size={14} />
          </button>

          <div className="pt-match-tabs-scroll">
            {matchNumbers.length === 0 ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'hsl(var(--muted-foreground))',
                  padding: '0 0.5rem',
                }}
              >
                No matches
              </span>
            ) : (
              matchNumbers.map((matchNum) => (
                <button
                  key={matchNum}
                  className={`pt-match-tab${selectedMatchNum === matchNum && viewMode === 'match' ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedMatchNum(matchNum);
                    setViewMode('match');
                  }}
                >
                  M{matchNum}
                </button>
              ))
            )}
          </div>

          <button
            className="pt-nav-arrow"
            disabled={
              matchNumbers.length === 0 ||
              currentMatchIdx >= matchNumbers.length - 1 ||
              viewMode === 'results'
            }
            onClick={() => {
              if (currentMatchIdx < matchNumbers.length - 1) {
                setSelectedMatchNum(matchNumbers[currentMatchIdx + 1]);
              }
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Results tab */}
        {matchNumbers.length > 0 && (
          <div className="pt-results-tab-row">
            <button
              className={`pt-results-tab${viewMode === 'results' ? ' active' : ''}`}
              onClick={() => setViewMode(viewMode === 'results' ? 'match' : 'results')}
            >
              <Trophy size={11} />
              Final Round Results
            </button>
          </div>
        )}

        {/* ── Table header ─────────────────────────────────────────────────── */}
        <div className="pt-table-header">
          <div className="pt-table-header-cell">#</div>
          <div className="pt-table-header-cell left">TEAM</div>
          <div className="pt-table-header-cell">W</div>
          <div className="pt-table-header-cell">PP</div>
          <div className="pt-table-header-cell">KP</div>
          <div className="pt-table-header-cell">TOT</div>
        </div>

        {/* ── Teams list ───────────────────────────────────────────────────── */}
        {groupsLoading ? (
          <SkeletonRows count={6} />
        ) : displayStandings.length === 0 ? (
          <div className="pt-empty" style={{ padding: '2rem 1rem' }}>
            <Table2 size={36} className="pt-empty-icon" />
            <p className="pt-empty-title">
              {groupsData.length === 0
                ? 'No groups assigned yet for this round'
                : viewMode === 'results'
                  ? 'No scores entered yet'
                  : 'No scores entered for this match yet'}
            </p>
          </div>
        ) : (
          <div className="pt-teams-scroll">
            <div className="pt-teams-inner">
              {displayStandings.map((team, index) => {
                const rank = index + 1;
                const mine = isMyTeam(team.team_name);
                const isTop3 = rank <= 3;

                return (
                  <div
                    key={team.team_id || index}
                    className={`pt-team-row${mine ? ' pt-team-row-mine' : isTop3 ? ' pt-team-row-top3' : ''}`}
                  >
                    {/* Rank */}
                    <div className="pt-team-cell">{getRankIcon(rank)}</div>

                    {/* Team name */}
                    <div className="pt-team-cell left">
                      <span className={`pt-team-name${mine ? ' pt-team-name-mine' : ''}`}>
                        {team.team_name}
                      </span>
                      {mine && (
                        <Star
                          size={13}
                          className="pt-mine-star"
                          style={{
                            color: 'rgb(251 191 36)',
                            fill: 'rgb(251 191 36)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>

                    {/* Wins */}
                    <div className="pt-team-cell">
                      <span className={`pt-stat${team.wins > 0 ? ' pt-stat-wins-positive' : ''}`}>
                        {team.wins}
                      </span>
                    </div>

                    {/* Position points */}
                    <div className="pt-team-cell">
                      <span className="pt-stat">{team.position_points}</span>
                    </div>

                    {/* Kill points */}
                    <div className="pt-team-cell">
                      <span className="pt-stat">{team.kill_points}</span>
                    </div>

                    {/* Total */}
                    <div className="pt-team-cell">
                      <span
                        className={`pt-tot-pill${
                          mine
                            ? ' pt-tot-pill-mine'
                            : isTop3
                              ? ' pt-tot-pill-top3'
                              : ' pt-tot-pill-default'
                        }`}
                      >
                        {team.total_points}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="pt-footer" data-html2canvas-ignore="true">
          <span className="pt-footer-info">
            {getRoundLabel(tournament, selectedRound)} &middot;{' '}
            {viewMode === 'results' ? 'Final Round Results' : `M${selectedMatchNum}`} &middot;{' '}
            {groupName || 'Group'}
          </span>
          <div className="pt-footer-actions">
            <button
              className="pt-download-btn"
              onClick={handleDownload}
              disabled={downloading || displayStandings.length === 0}
            >
              <Download size={11} />
              {downloading ? 'Saving...' : 'Download'}
            </button>
            {displayStandings.length > 0 && (
              <span className="pt-team-count-badge">{displayStandings.length} Teams</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPointsTableView;
