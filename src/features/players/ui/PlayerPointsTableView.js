import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Table2,
  Gamepad2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Medal,
  Star,
  Download,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
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

const getRankIcon = (rank) => {
  if (rank === 1) return <Trophy size={16} style={{ color: 'rgb(234 179 8)' }} />;
  if (rank === 2) return <Medal size={16} style={{ color: 'rgb(156 163 175)' }} />;
  if (rank === 3) return <Medal size={16} style={{ color: 'rgb(180 83 9)' }} />;
  return <span className="pt-rank-num">{rank}</span>;
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

const PlayerPointsTableView = () => {
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
            wins: '-',
            position_points: 0,
            kill_points: 0,
            total_points: 0,
          };
        }
        totals[id].position_points += score.position_points || 0;
        totals[id].kill_points += score.kill_points || 0;
        totals[id].total_points += (score.position_points || 0) + (score.kill_points || 0);
      });
    });
    return Object.values(totals).sort(
      (a, b) => b.total_points - a.total_points || b.position_points - a.position_points
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
      const dataUrl = await generateStandingsImage({
        tournament,
        standings: displayStandings,
        viewMode,
        selectedRound,
        selectedMatch: selectedMatchNum,
        selectedGroup,
        getRoundLabel: (rn) => getRoundLabel(tournament, rn),
      });

      const fileName = `points-table-${(tournamentTitle || 'tournament')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_.-]/gi, '_')}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Points table downloaded!', 'success');
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
        </div>
      </div>

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
              Results
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
            {viewMode === 'results' ? 'Results' : `M${selectedMatchNum}`} &middot;{' '}
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
