import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table2,
  Gamepad2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Medal,
  Download,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../hooks/useToast';
import './HostPointsTableView.css';

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

const getRankIcon = (rank) => {
  if (rank === 1) return <Trophy size={16} style={{ color: 'rgb(234 179 8)' }} />;
  if (rank === 2) return <Medal size={16} style={{ color: 'rgb(156 163 175)' }} />;
  if (rank === 3) return <Medal size={16} style={{ color: 'rgb(180 83 9)' }} />;
  return <span className="hpt-rank-num">{rank}</span>;
};

// ─── Custom dropdown ──────────────────────────────────────────────────────────

const CustomDropdown = ({ trigger, children, align = 'right' }) => {
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
          className="hpt-dropdown-menu"
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
      <div key={i} className="hpt-skeleton" style={{ height: '2.5rem', borderRadius: '0.5rem' }} />
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const HostPointsTableView = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // ── state ─────────────────────────────────────────────────────────────────
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentIdx, setSelectedTournamentIdx] = useState(0);
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedMatchNum, setSelectedMatchNum] = useState(1);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [groupsData, setGroupsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cardRef = useRef(null);

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
        // Only show tournaments that have started or completed (have data)
        const filtered = Array.isArray(all) ? all.filter((t) => t.status !== 'upcoming') : [];
        setTournaments(filtered);
        setSelectedTournamentIdx(0);
      } catch (err) {
        console.error('Error fetching host tournaments for points table:', err);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── fetch groups when tournament or round changes ─────────────────────────

  useEffect(() => {
    if (tournaments.length === 0) return;
    const tournament = tournaments[selectedTournamentIdx];
    if (!tournament) return;

    const tournamentId = tournament.id;
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
  }, [tournaments, selectedTournamentIdx, selectedRound]);

  // ── derived values ────────────────────────────────────────────────────────

  const tournament = tournaments[selectedTournamentIdx] || null;
  const tournamentTitle = tournament?.title || tournament?.name || '';

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

  // match navigation
  const matchNumbers = matchList.map((m) => m.match_number).sort((a, b) => a - b);
  const currentMatchIdx = matchNumbers.indexOf(selectedMatchNum);

  // ── download ──────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: window.devicePixelRatio || 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const fileName = `points-table-${(tournamentTitle || 'tournament')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_.-]/gi, '_')}.png`;

      const byteString = atob(dataUrl.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      showToast('Points table downloaded!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download points table', 'error');
    } finally {
      setDownloading(false);
    }
  }, [cardRef, downloading, tournamentTitle, showToast]);

  // ── loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="hpt-skeleton" style={{ width: '9rem', height: '1.5rem' }} />
          <div className="flex gap-2">
            <div
              className="hpt-skeleton"
              style={{ width: '7rem', height: '2rem', borderRadius: '0.5rem' }}
            />
            <div
              className="hpt-skeleton"
              style={{ width: '10rem', height: '2rem', borderRadius: '0.5rem' }}
            />
          </div>
        </div>
        <div className="hpt-card">
          <SkeletonRows count={8} />
        </div>
      </div>
    );
  }

  // ── no tournaments ────────────────────────────────────────────────────────

  if (tournaments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Table2 size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Points Table</h2>
        </div>
        <div className="hpt-card">
          <div className="hpt-empty">
            <Table2 size={48} className="hpt-empty-icon" />
            <p className="hpt-empty-title">You haven&apos;t created any active tournaments yet</p>
            <button onClick={() => navigate('/host/tournaments/create')} className="hpt-empty-link">
              Create Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Top header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-foreground">
          <Table2 size={20} style={{ color: 'hsl(var(--purple))' }} />
          Points Table
        </h2>

        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {/* Group dropdown */}
          <CustomDropdown
            align="right"
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
                <div className="hpt-dropdown-option" style={{ opacity: 0.5, cursor: 'default' }}>
                  No groups available
                </div>
              ) : (
                groupsData.map((group, i) => (
                  <button
                    key={group.id || i}
                    className={`hpt-dropdown-option${i === selectedGroupIdx ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedGroupIdx(i);
                      setSelectedMatchNum(1);
                      close();
                    }}
                  >
                    {i === selectedGroupIdx && <Check size={12} style={{ flexShrink: 0 }} />}
                    <span className="hpt-dropdown-option-label">{group.group_name}</span>
                  </button>
                ))
              )
            }
          </CustomDropdown>

          {/* Tournament dropdown */}
          <CustomDropdown
            align="right"
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
              tournaments.map((t, i) => {
                const name = t.title || t.name || `Tournament ${i + 1}`;
                const game = t.game_name || t.game || '';
                return (
                  <button
                    key={t.id || i}
                    className={`hpt-dropdown-option${i === selectedTournamentIdx ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedTournamentIdx(i);
                      setSelectedRound(1);
                      setSelectedMatchNum(1);
                      setSelectedGroupIdx(0);
                      close();
                    }}
                  >
                    {i === selectedTournamentIdx && <Check size={12} style={{ flexShrink: 0 }} />}
                    <span className="hpt-dropdown-option-label">
                      {name}
                      {game ? ` · ${game}` : ''}
                    </span>
                  </button>
                );
              })
            }
          </CustomDropdown>
        </div>
      </div>

      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div className="hpt-card" ref={cardRef}>
        {/* ── Card header ──────────────────────────────────────────────────── */}
        <div className="hpt-header">
          <p className="hpt-header-brand">SCRIMVERSE</p>
          <h3 className="hpt-header-title">OVERALL STANDINGS</h3>
          <span className="hpt-header-badge">
            {groupName || 'Group'} {groupName ? '—' : ''} {getRoundLabel(tournament, selectedRound)}
          </span>

          {/* Round pills */}
          <div className="hpt-round-pills">
            <div className="hpt-round-pills-inner">
              {roundNumbers.map((roundNum) => (
                <button
                  key={roundNum}
                  className={`hpt-round-pill${selectedRound === roundNum ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedRound(roundNum);
                    setSelectedMatchNum(1);
                    setSelectedGroupIdx(0);
                  }}
                >
                  {getRoundLabel(tournament, roundNum)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Match tabs ───────────────────────────────────────────────────── */}
        <div className="hpt-match-tabs">
          <button
            className="hpt-nav-arrow"
            disabled={currentMatchIdx <= 0}
            onClick={() => {
              if (currentMatchIdx > 0) {
                setSelectedMatchNum(matchNumbers[currentMatchIdx - 1]);
              }
            }}
          >
            <ChevronLeft size={14} />
          </button>

          <div className="hpt-match-tabs-scroll">
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
                  className={`hpt-match-tab${selectedMatchNum === matchNum ? ' active' : ''}`}
                  onClick={() => setSelectedMatchNum(matchNum)}
                >
                  M{matchNum}
                </button>
              ))
            )}
          </div>

          <button
            className="hpt-nav-arrow"
            disabled={matchNumbers.length === 0 || currentMatchIdx >= matchNumbers.length - 1}
            onClick={() => {
              if (currentMatchIdx < matchNumbers.length - 1) {
                setSelectedMatchNum(matchNumbers[currentMatchIdx + 1]);
              }
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* ── Table header ─────────────────────────────────────────────────── */}
        <div className="hpt-table-header">
          <div className="hpt-table-header-cell">#</div>
          <div className="hpt-table-header-cell left">TEAM</div>
          <div className="hpt-table-header-cell">W</div>
          <div className="hpt-table-header-cell">PP</div>
          <div className="hpt-table-header-cell">KP</div>
          <div className="hpt-table-header-cell">TOT</div>
        </div>

        {/* ── Teams list ───────────────────────────────────────────────────── */}
        {groupsLoading ? (
          <SkeletonRows count={6} />
        ) : standings.length === 0 ? (
          <div className="hpt-empty" style={{ padding: '2rem 1rem' }}>
            <Table2 size={36} className="hpt-empty-icon" />
            <p className="hpt-empty-title">
              {groupsData.length === 0
                ? 'No groups assigned yet for this round'
                : 'No scores entered for this match yet'}
            </p>
          </div>
        ) : (
          <div className="hpt-teams-scroll">
            <div className="hpt-teams-inner">
              {standings.map((team, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;

                return (
                  <div
                    key={team.team_id || index}
                    className={`hpt-team-row${isTop3 ? ' hpt-team-row-top3' : ''}`}
                  >
                    {/* Rank */}
                    <div className="hpt-team-cell">{getRankIcon(rank)}</div>

                    {/* Team name */}
                    <div className="hpt-team-cell left">
                      <span className="hpt-team-name">{team.team_name}</span>
                    </div>

                    {/* Wins */}
                    <div className="hpt-team-cell">
                      <span className={`hpt-stat${team.wins > 0 ? ' hpt-stat-wins-positive' : ''}`}>
                        {team.wins}
                      </span>
                    </div>

                    {/* Position points */}
                    <div className="hpt-team-cell">
                      <span className="hpt-stat">{team.position_points}</span>
                    </div>

                    {/* Kill points */}
                    <div className="hpt-team-cell">
                      <span className="hpt-stat">{team.kill_points}</span>
                    </div>

                    {/* Total */}
                    <div className="hpt-team-cell">
                      <span
                        className={`hpt-tot-pill${isTop3 ? ' hpt-tot-pill-top3' : ' hpt-tot-pill-default'}`}
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
        <div className="hpt-footer" data-html2canvas-ignore="true">
          <span className="hpt-footer-info">
            {getRoundLabel(tournament, selectedRound)} &middot; M{selectedMatchNum} &middot;{' '}
            {groupName || 'Group'}
          </span>
          <div className="hpt-footer-actions">
            <button
              className="hpt-download-btn"
              onClick={handleDownload}
              disabled={downloading || standings.length === 0}
            >
              <Download size={11} />
              {downloading ? 'Saving...' : 'Download'}
            </button>
            {standings.length > 0 && (
              <span className="hpt-team-count-badge">{standings.length} Teams</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostPointsTableView;
