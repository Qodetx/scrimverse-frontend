import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Crown,
  Settings,
  UserMinus,
  ChevronDown,
  Check,
  Gamepad2,
  Trophy,
  Clock,
  Plus,
  Camera,
  Upload,
  Send,
  MessageCircle,
  Mail,
  Phone,
  User,
  X,
  Loader2,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { teamAPI, leaderboardAPI, authAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import ConfirmModal from '../../../components/ConfirmModal';
import './PlayerTeamView.css';

const MEDIA_URL = (process.env.REACT_APP_MEDIA_URL || 'http://localhost:8000').replace(
  /\/media\/?$/,
  ''
);

const GAME_OPTIONS = ['BGMI', 'Valorant', 'Free Fire', 'COD Mobile', 'Scarfall'];
const GAME_API_VALUE = {
  'COD Mobile': 'COD',
  'Free Fire': 'Free Fire',
  BGMI: 'BGMI',
  Valorant: 'Valorant',
  Scarfall: 'Scarfall',
};

// Normalize backend game values to match GAME_API_VALUE display labels
const normalizeGameValue = (game) => {
  if (!game) return game;
  // Backend may store 'Freefire' without space — normalize to 'Free Fire'
  if (game.toLowerCase().replace(/\s/g, '') === 'freefire') return 'Free Fire';
  if (game.toLowerCase() === 'cod') return 'COD';
  return game;
};

const ROLE_OPTIONS = [
  'IGL',
  'Assaulter',
  'Support',
  'Scout',
  'Sniper',
  'Rusher',
  'Duelist',
  'Controller',
  'Sentinel',
  'Initiator',
  'Flex',
  'Member',
];

const INVITE_MODES = [
  { mode: 'phone', label: 'Phone', icon: Phone, placeholder: '+91...' },
  { mode: 'email', label: 'Email', icon: Mail, placeholder: 'player@email.com' },
  { mode: 'username', label: 'Username', icon: User, placeholder: 'Enter username' },
];

const placementColors = {
  1: 'tm-placement-1',
  2: 'tm-placement-2',
  3: 'tm-placement-3',
};

const pad2 = (n) => String(n).padStart(2, '0');

const useConversionCountdown = (deadlineStr) => {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!deadlineStr) {
      setRemaining(null);
      return;
    }
    const target = new Date(deadlineStr).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining({ expired: true, h: 0, m: 0, s: 0 });
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining({ expired: false, h, m, s });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineStr]);
  return remaining;
};

// Inline hook wrapper used inside ConversionBanner
const ConversionBanner = ({ conversionNotif, team, busy, result, onKeep, onDiscard }) => {
  const countdown = useConversionCountdown(conversionNotif?.conversion_deadline);
  const tournamentMatch = conversionNotif?.message?.match(/for '(.+?)'/);
  const tournamentName = tournamentMatch ? tournamentMatch[1] : '';

  if (result === 'kept') {
    return (
      <div
        className="rounded-xl p-4 mb-4 text-center space-y-2"
        style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
      >
        <div className="text-2xl">🏆</div>
        <p className="font-bold text-foreground text-sm">{team.name} is now a permanent team!</p>
        <p className="text-xs text-muted-foreground">Your team will stay on Scrimverse.</p>
      </div>
    );
  }
  if (result === 'discarded') {
    return (
      <div
        className="rounded-xl p-4 mb-4 text-center space-y-2"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <div className="text-2xl">🗑</div>
        <p className="font-bold text-foreground text-sm">Team discarded.</p>
        <p className="text-xs text-muted-foreground">{team.name} has been removed.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 mb-4 space-y-3"
      style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.25)' }}
    >
      <div className="flex items-start gap-2">
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            This team competed in a tournament.
          </p>
          {tournamentName && (
            <p className="text-xs text-muted-foreground mt-0.5">Tournament: {tournamentName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            Keep this team permanently or discard it.
          </p>
        </div>
        {countdown && !countdown.expired && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground">Time left</p>
            <p className="font-mono text-sm font-bold text-yellow-400">
              {pad2(countdown.h)}:{pad2(countdown.m)}:{pad2(countdown.s)}
            </p>
          </div>
        )}
        {countdown?.expired && <p className="text-xs text-red-400 shrink-0">Expired</p>}
      </div>
      {result === 'error' && (
        <p className="text-xs text-red-400">Something went wrong. Try again.</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onKeep}
          disabled={busy || countdown?.expired}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: 'hsl(var(--accent))',
            color: '#000',
            opacity: busy || countdown?.expired ? 0.5 : 1,
            cursor: busy || countdown?.expired ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Processing...' : 'Keep Permanently'}
        </button>
        <button
          onClick={onDiscard}
          disabled={busy}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: 'transparent',
            border: '1px solid hsl(var(--border) / 0.5)',
            color: 'hsl(var(--muted-foreground))',
            opacity: busy ? 0.5 : 1,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          Discard Team
        </button>
      </div>
    </div>
  );
};

const TempTeamMiniCard = ({
  team,
  busy,
  result,
  conflict,
  onKeep,
  onDiscard,
  onLeaveAndKeep,
  isCaptain,
  style,
}) => {
  const deadline = team.conversion_deadline;
  const countdown = useConversionCountdown(deadline);
  const memberCount = team.members?.length || 0;
  const expired = countdown?.expired;

  // Result states
  if (result === 'kept') {
    return (
      <div
        style={{
          ...style,
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          textAlign: 'center',
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: '24px' }}>🏆</span>
        <p
          style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}
        >
          {team.name} is now permanent!
        </p>
      </div>
    );
  }
  if (result === 'discarded') {
    return (
      <div
        style={{
          ...style,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          textAlign: 'center',
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: '24px' }}>🗑</span>
        <p
          style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}
        >
          Team discarded
        </p>
      </div>
    );
  }

  // Conflict state — player already has a permanent team for this game
  if (conflict) {
    const isCaptain = conflict.is_captain_of_conflict;
    return (
      <div
        style={{
          ...style,
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <X size={14} style={{ color: 'hsl(var(--destructive))', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'hsl(var(--destructive))',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Conflict
          </span>
        </div>
        <div>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'hsl(var(--foreground))',
              margin: 0,
            }}
          >
            Already in "{conflict.conflict_team_name}"
          </p>
          <p
            style={{
              fontSize: '11px',
              color: 'hsl(var(--muted-foreground))',
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            {isCaptain
              ? 'You are captain. Transfer captaincy before you can leave and convert this team.'
              : `Leave "${conflict.conflict_team_name}" to convert this team.`}
          </p>
        </div>
        {!isCaptain && (
          <button
            onClick={onLeaveAndKeep}
            disabled={busy}
            style={{
              padding: '7px 8px',
              borderRadius: '8px',
              background: 'hsl(var(--destructive))',
              color: '#fff',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? '...' : `Leave "${conflict.conflict_team_name}" & Keep`}
          </button>
        )}
        <button
          onClick={onDiscard}
          disabled={busy}
          style={{
            padding: '7px 8px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid rgba(239,68,68,0.4)',
            color: 'hsl(var(--destructive))',
            cursor: busy ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            opacity: busy ? 0.6 : 1,
          }}
        >
          Discard Temp Team
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        background: expired ? 'rgba(239,68,68,0.06)' : 'rgba(234,179,8,0.06)',
        border: `1px solid ${expired ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.25)'}`,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock
          size={14}
          style={{ color: expired ? 'hsl(var(--destructive))' : '#eab308', flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: expired ? 'hsl(var(--destructive))' : '#eab308',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {expired ? 'Expired' : 'Temporary Team'}
        </span>
      </div>

      {/* Team info */}
      <div>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {team.name}
        </p>
        <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', margin: '2px 0 0' }}>
          {memberCount} member{memberCount !== 1 ? 's' : ''} · {team.game}
        </p>
      </div>

      {/* Timer */}
      {countdown && !expired && (
        <div
          style={{
            background: 'rgba(234,179,8,0.1)',
            borderRadius: '8px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
            Deleted in
          </span>
          <span
            style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#eab308' }}
          >
            {pad2(countdown.h)}:{pad2(countdown.m)}:{pad2(countdown.s)}
          </span>
        </div>
      )}
      {expired && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            borderRadius: '8px',
            padding: '6px 10px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: 'hsl(var(--destructive))' }}>
            Conversion window expired
          </span>
        </div>
      )}

      {/* Actions — only shown after tournament ends and Celery sets conversion_deadline */}
      {deadline && !expired && isCaptain && (
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button
            onClick={onKeep}
            disabled={busy}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: '8px',
              background: 'hsl(var(--accent))',
              color: '#000',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? '...' : 'Keep'}
          </button>
          <button
            onClick={onDiscard}
            disabled={busy}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.4)',
              color: 'hsl(var(--destructive))',
              cursor: busy ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              opacity: busy ? 0.6 : 1,
            }}
          >
            Discard
          </button>
        </div>
      )}
      {deadline && !expired && !isCaptain && (
        <p
          style={{
            fontSize: '11px',
            color: 'hsl(var(--muted-foreground))',
            margin: '8px 0 0',
            textAlign: 'center',
          }}
        >
          Only the team captain can convert this team.
        </p>
      )}
    </div>
  );
};

const PlayerTeamView = ({ conversionNotif, onConversionDone, openRequests }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(() => {
    const g = searchParams.get('game');
    return GAME_OPTIONS.includes(g) ? g : GAME_OPTIONS[0];
  });

  // Persist selectedGame to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('game') !== selectedGame) {
      params.set('game', selectedGame);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(window.history.state, '', newUrl);
    }
  }, [selectedGame]);
  const [activeTab, setActiveTab] = useState('members');
  const [teamHistory, setTeamHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteSelected, setInviteSelected] = useState([]); // multi-select chips
  const [inviteSuggestions, setInviteSuggestions] = useState([]);
  const [inviteSearchLoading, setInviteSearchLoading] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteEmailMode, setInviteEmailMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmailLoading, setInviteEmailLoading] = useState(false);
  const [inviteEmailError, setInviteEmailError] = useState('');
  const inviteSearchRef = useRef(null);
  const inviteSearchCounter = useRef(0);

  // Dropdown
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Member action dropdown
  const [memberMenuOpen, setMemberMenuOpen] = useState(null);
  const memberMenuRef = useRef(null);

  // Role picker sub-menu (stores member idx)
  const [rolePickerOpen, setRolePickerOpen] = useState(null);

  // Photo upload
  const fileInputRef = useRef(null);

  // Conversion state
  const [conversionBusy, setConversionBusy] = useState(false);
  const [conversionResult, setConversionResult] = useState(null); // 'kept' | 'discarded' | 'error'
  const [conversionConflict, setConversionConflict] = useState(null); // {conflict_team_id, conflict_team_name, is_captain_of_conflict}

  // Temp/Perm toggle — 'perm' | 'temp'
  const [teamMode, setTeamMode] = useState('perm');

  // Create team dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createGame, setCreateGame] = useState('BGMI');
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createInviteMode, setCreateInviteMode] = useState('phone');
  const [createPlayers, setCreatePlayers] = useState(['', '', '', '']);
  const [createSelectedUsernames, setCreateSelectedUsernames] = useState([null, null, null, null]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createGameDropdownOpen, setCreateGameDropdownOpen] = useState(false);
  const createGameRef = useRef(null);

  // Username autocomplete for create dialog
  const [createSuggestions, setCreateSuggestions] = useState({});
  const [createShowSuggestions, setCreateShowSuggestions] = useState({});
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const createSearchCounter = useRef(0);

  // Join requests dropdown
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsActioning, setRequestsActioning] = useState({}); // { [requestId]: 'accepting'|'rejecting' }
  const requestsDropdownRef = useRef(null);

  // ── Fetch teams ──
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamAPI.getTeams({ mine: true });
        const data = res.data.results || res.data;
        const list = Array.isArray(data) ? data : [];
        setTeams(list);
        // Auto-select the first team's game on load (normalize backend value to display label)
        if (list.length > 0 && list[0].game) {
          const normalized = normalizeGameValue(list[0].game);
          const label =
            Object.entries(GAME_API_VALUE).find(([, v]) => v === normalized)?.[0] || normalized;
          setSelectedGame(label);
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // ── Auto-select game from conversion notification ──
  useEffect(() => {
    if (!conversionNotif) return;
    const teamId = conversionNotif.related_id;
    const matchedTeam = teams.find((t) => t.id === teamId);
    if (matchedTeam?.game) {
      const normalized = normalizeGameValue(matchedTeam.game);
      const label =
        Object.entries(GAME_API_VALUE).find(([, v]) => v === normalized)?.[0] || normalized;
      setSelectedGame(label);
    }
  }, [conversionNotif, teams]);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setTeamDropdownOpen(false);
      }
      if (memberMenuRef.current && !memberMenuRef.current.contains(e.target)) {
        setMemberMenuOpen(null);
      }
      if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(e.target)) {
        setRequestsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derive current team from selectedGame (map display label to backend game value)
  const gameValue = GAME_API_VALUE[selectedGame] || selectedGame;
  const permanentTeam =
    teams.find((t) => normalizeGameValue(t.game) === gameValue && !t.is_temporary) || null;
  const tempTeamForGame =
    teams.find((t) => normalizeGameValue(t.game) === gameValue && t.is_temporary) || null;

  // Auto-set teamMode when game changes: default to perm if it exists, else temp
  useEffect(() => {
    if (permanentTeam) setTeamMode('perm');
    else if (tempTeamForGame) setTeamMode('temp');
    setConversionResult(null);
    setConversionConflict(null);
  }, [selectedGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active team is determined by teamMode
  const team = teamMode === 'temp' ? tempTeamForGame : permanentTeam;
  const isTempView = teamMode === 'temp' && !!tempTeamForGame;

  const registrationEnd = isTempView
    ? tempTeamForGame?.linked_tournament_info?.registration_end
      ? new Date(tempTeamForGame.linked_tournament_info.registration_end)
      : null
    : team?.linked_tournament_info?.registration_end
      ? new Date(team.linked_tournament_info.registration_end)
      : null;
  const registrationClosed = registrationEnd ? registrationEnd < new Date() : false;

  // ── Fetch team history when tab or team changes ──
  useEffect(() => {
    if (activeTab === 'history' && team) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const res = await teamAPI.getPastTournaments(team.id);
          setTeamHistory(res.data.results || res.data || []);
        } catch (err) {
          console.error('Failed to fetch team history:', err);
          setTeamHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, team]);
  const members = team?.members || [];
  const isCaptain = members.some(
    (m) => m.is_captain && (m.user?.id === user?.user?.id || m.username === user?.user?.username)
  );

  // ── Fetch join requests count when captain has a team ──
  const teamId = team?.id;
  useEffect(() => {
    if (!teamId || !isCaptain) return;
    teamAPI
      .getJoinRequests(teamId)
      .then((res) => setJoinRequests(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [teamId, isCaptain]);

  // ── Auto-open requests dropdown when navigated from notification ──
  // Step 1: when tick fires, mark pending open immediately
  const pendingOpenRef = useRef(false);
  useEffect(() => {
    if (!openRequests) return;
    pendingOpenRef.current = true;
    setRequestsOpen(true);
  }, [openRequests]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: once team is available and pending, fetch requests
  useEffect(() => {
    if (!pendingOpenRef.current || !team || !isCaptain) return;
    pendingOpenRef.current = false;
    setRequestsLoading(true);
    teamAPI
      .getJoinRequests(team.id)
      .then((res) => setJoinRequests(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setRequestsLoading(false));
  }, [team?.id, isCaptain]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──
  // Live search for invite username
  const handleInviteUsernameChange = async (val) => {
    setInviteUsername(val);
    setInviteSuggestions([]);
    if (val.trim().length < 2) return;
    const counter = ++inviteSearchCounter.current;
    setInviteSearchLoading(true);
    try {
      const res = await teamAPI.searchPlayers(val.trim(), team?.game || null);
      if (counter !== inviteSearchCounter.current) return;
      const results = res.data.results || res.data || [];
      // Filter out already existing members
      const memberUsernames = (team?.members || []).map((m) =>
        (m.username || m.user?.username || '').toLowerCase()
      );
      setInviteSuggestions(
        results.filter((p) => !memberUsernames.includes((p.username || '').toLowerCase()))
      );
    } catch {
      // ignore
    } finally {
      setInviteSearchLoading(false);
    }
  };

  // Add player to chip selection (don't send yet)
  const handleSelectInvitePlayer = (player) => {
    const uname = player.username || player;
    if (!uname) return;
    if (inviteSelected.find((p) => p.username === uname)) return; // already added
    setInviteSelected((prev) => [...prev, { username: uname, id: player.id || uname }]);
    setInviteUsername('');
    setInviteSuggestions([]);
  };

  const handleRemoveInviteChip = (username) => {
    setInviteSelected((prev) => prev.filter((p) => p.username !== username));
  };

  // Send all selected players at once
  const handleSendInvites = async () => {
    if (!team) return;
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
        team.id,
        targets.map((p) => ({ type: 'username', value: p.username }))
      );
      const names = targets.map((p) => p.username).join(', ');
      showToast(`Invite sent to ${names}`, 'success');
      setInviteSelected([]);
      setInviteUsername('');
      setInviteSuggestions([]);
    } catch (err) {
      showToast(
        err.response?.data?.detail || err.response?.data?.error || 'Failed to send invite',
        'error'
      );
    } finally {
      setInviteSending(false);
    }
  };

  const handleInviteByWhatsApp = async () => {
    if (!team) return;
    try {
      // Generate a real invite token on the backend
      const res = await teamAPI.generateInviteLink(team.id);
      const token = res.data.invite_token;
      const link = `${window.location.origin}/join-team/${token}`;
      const msg = encodeURIComponent(
        `Hey! Join my ${team.game ? `${team.game} ` : ''}team "${team.name}" on ScrimVerse!\n\nClick to join: ${link}`
      );
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    } catch {
      showToast('Failed to generate invite link', 'error');
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || !team) return;
    setInviteEmailLoading(true);
    setInviteEmailError('');
    try {
      const res = await teamAPI.sendInvites(team.id, [
        { type: 'email', value: inviteEmail.trim() },
      ]);
      const result = (res.data.results || [])[0];
      if (result?.status === 'error') {
        setInviteEmailError(result.message);
      } else {
        showToast(`Invite email sent to ${inviteEmail}`, 'success');
        setInviteEmail('');
        setInviteEmailMode(false);
        setInviteEmailError('');
      }
    } catch (err) {
      setInviteEmailError(
        err.response?.data?.detail || err.response?.data?.error || 'Failed to send email invite'
      );
    } finally {
      setInviteEmailLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!team) return;
    try {
      await teamAPI.removeMember(team.id, memberId);
      showToast('Member removed', 'success');
      setMemberMenuOpen(null);
      refreshTeam();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to remove member', 'error');
    }
  };

  const handleMakeCaptain = async (memberId) => {
    if (!team) return;
    try {
      await teamAPI.transferCaptaincy(team.id, memberId);
      showToast('Captaincy transferred', 'success');
      setMemberMenuOpen(null);
      refreshTeam();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to transfer captaincy', 'error');
    }
  };

  const handleLeaveTeam = () => {
    if (!team) return;
    setLeaveConfirmOpen(true);
  };

  const handleLeaveConfirmed = async () => {
    setLeaveConfirmOpen(false);
    try {
      await teamAPI.leaveTeam(team.id);
      showToast(`Left ${team.name}`, 'success');
      refreshTeams();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to leave team', 'error');
    }
  };

  const fetchJoinRequests = async () => {
    if (!team) return;
    setRequestsLoading(true);
    try {
      const res = await teamAPI.getJoinRequests(team.id);
      setJoinRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setJoinRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleToggleRequests = () => {
    if (!requestsOpen) {
      fetchJoinRequests();
    }
    setRequestsOpen((v) => !v);
  };

  const handleAcceptRequest = async (requestId) => {
    setRequestsActioning((prev) => ({ ...prev, [requestId]: 'accepting' }));
    try {
      await teamAPI.acceptRequest(team.id, requestId);
      showToast('Join request accepted', 'success');
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      refreshTeam();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to accept request', 'error');
    } finally {
      setRequestsActioning((prev) => {
        const n = { ...prev };
        delete n[requestId];
        return n;
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    setRequestsActioning((prev) => ({ ...prev, [requestId]: 'rejecting' }));
    try {
      await teamAPI.rejectRequest(team.id, requestId);
      showToast('Join request declined', 'success');
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to decline request', 'error');
    } finally {
      setRequestsActioning((prev) => {
        const n = { ...prev };
        delete n[requestId];
        return n;
      });
    }
  };

  const handleSetRole = async (memberId, role) => {
    if (!team) return;
    try {
      await teamAPI.setMemberRole(team.id, memberId, role);
      showToast(`Role set to ${role}`, 'success');
      setMemberMenuOpen(null);
      setRolePickerOpen(null);
      refreshTeam();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to set role', 'error');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    const formData = new FormData();
    formData.append('profile_picture', file);
    try {
      await teamAPI.partialUpdateTeam(team.id, formData);
      showToast('Team photo updated', 'success');
      refreshTeam();
    } catch (err) {
      showToast('Failed to upload photo', 'error');
    }
  };

  const refreshTeam = async () => {
    try {
      const res = await teamAPI.getTeams({ mine: true });
      const data = res.data.results || res.data;
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshTeams = async (switchToGame = null) => {
    try {
      const res = await teamAPI.getTeams({ mine: true });
      const data = res.data.results || res.data;
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      if (switchToGame) {
        setSelectedGame(switchToGame);
      } else if (list.length > 0 && list[0].game) {
        setSelectedGame(list[0].game);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Username autocomplete for create dialog ──
  const handleCreatePlayerChange = async (index, value) => {
    const updated = [...createPlayers];
    updated[index] = value;
    setCreatePlayers(updated);

    // Clear selection when typing
    const newSelected = [...createSelectedUsernames];
    newSelected[index] = null;
    setCreateSelectedUsernames(newSelected);

    // Clear field error
    const newErrors = { ...createFieldErrors };
    delete newErrors[index];
    setCreateFieldErrors(newErrors);

    // Only search in username mode
    if (createInviteMode !== 'username') return;

    if (value.length >= 1) {
      createSearchCounter.current += 1;
      const myToken = createSearchCounter.current;
      try {
        const res = await authAPI.searchPlayerUsernames(value, true);
        if (myToken !== createSearchCounter.current) return;
        const currentUsername = user?.user?.username || '';
        const alreadySelected = [currentUsername, ...newSelected.filter((u) => u !== null)];
        const filtered = (res.data.results || []).filter(
          (u) => !alreadySelected.includes(u.username)
        );
        setCreateSuggestions((prev) => ({ ...prev, [index]: filtered }));
        setCreateShowSuggestions((prev) => ({ ...prev, [index]: filtered.length > 0 }));
      } catch {
        setCreateShowSuggestions((prev) => ({ ...prev, [index]: false }));
      }
    } else {
      setCreateShowSuggestions((prev) => ({ ...prev, [index]: false }));
      setCreateSuggestions((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const handleCreatePlayerSelect = (index, username) => {
    const updated = [...createPlayers];
    updated[index] = username;
    setCreatePlayers(updated);

    const newSelected = [...createSelectedUsernames];
    newSelected[index] = username;
    setCreateSelectedUsernames(newSelected);

    setCreateShowSuggestions((prev) => ({ ...prev, [index]: false }));
    const newErrors = { ...createFieldErrors };
    delete newErrors[index];
    setCreateFieldErrors(newErrors);
  };

  const handleCreatePlayerBlur = (index) => {
    setTimeout(() => {
      setCreateShowSuggestions((prev) => ({ ...prev, [index]: false }));
      // In username mode, must select from dropdown
      if (
        createInviteMode === 'username' &&
        createPlayers[index] &&
        !createSelectedUsernames[index]
      ) {
        const updated = [...createPlayers];
        updated[index] = '';
        setCreatePlayers(updated);
        setCreateFieldErrors((prev) => ({
          ...prev,
          [index]: 'Please select a player from the dropdown',
        }));
      }
    }, 300);
  };

  // ── Create Team ──
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast('Please enter a team name', 'error');
      return;
    }

    const validPlayers = createPlayers.filter((p) => p.trim() !== '');

    // Validation per mode
    if (createInviteMode === 'username') {
      // All filled fields must be selected from dropdown
      const invalidFields = [];
      createPlayers.forEach((val, idx) => {
        if (val.trim() !== '' && !createSelectedUsernames[idx]) {
          invalidFields.push(idx);
        }
      });
      if (invalidFields.length > 0) {
        showToast('Please select all players from the dropdown', 'error');
        const newErrors = {};
        invalidFields.forEach((idx) => {
          newErrors[idx] = 'Please select from dropdown';
        });
        setCreateFieldErrors(newErrors);
        return;
      }
    } else if (createInviteMode === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const val of validPlayers) {
        if (!emailRegex.test(val)) {
          showToast(`Invalid email: ${val}`, 'error');
          return;
        }
      }
    } else if (createInviteMode === 'phone') {
      for (const val of validPlayers) {
        if (!/^\+\d{10,15}$/.test(val.replace(/\s/g, ''))) {
          showToast(
            `Invalid phone number: ${val}. Must start with + and have 10-15 digits.`,
            'error'
          );
          return;
        }
      }
    }

    setCreateLoading(true);
    try {
      // Step 1: Create the team (with game field, captain only)
      const currentUsername = user?.user?.username || '';
      const res = await teamAPI.createTeam({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        game: createGame,
        player_usernames: [currentUsername],
      });

      const newTeamId = res.data.id;

      // Step 2: Send invites if there are valid players
      if (validPlayers.length > 0 && newTeamId) {
        const invites = validPlayers.map((val) => ({
          type: createInviteMode,
          value: val.trim(),
        }));

        try {
          const inviteRes = await teamAPI.sendInvites(newTeamId, invites);
          const results = inviteRes.data.results || [];
          const successCount = results.filter((r) => r.status === 'success').length;
          const errorResults = results.filter((r) => r.status === 'error');

          if (errorResults.length > 0) {
            showToast(
              `Team created! ${successCount} invite(s) sent. ${errorResults.length} failed: ${errorResults.map((r) => r.message).join(', ')}`,
              successCount > 0 ? 'success' : 'error'
            );
          } else {
            showToast(`Team "${createName}" created! ${successCount} invite(s) sent.`, 'success');
          }
        } catch (inviteErr) {
          // Team was created but invites failed
          showToast(
            `Team created but invites failed: ${inviteErr.response?.data?.error || 'Unknown error'}`,
            'error'
          );
        }
      } else {
        showToast(`Team "${createName}" created!`, 'success');
      }

      // Reset form
      setCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      setCreatePlayers(['', '', '', '']);
      setCreateSelectedUsernames([null, null, null, null]);
      setCreateFieldErrors({});
      refreshTeams(createGame);
    } catch (err) {
      showToast(
        err.response?.data?.error || err.response?.data?.detail || 'Failed to create team',
        'error'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Create Team Dialog ──
  const currentInviteMode = INVITE_MODES.find((m) => m.mode === createInviteMode);

  const renderCreateTeamDialog = () => (
    <div className="tm-invite-overlay" onClick={() => setCreateOpen(false)}>
      <div className="tm-create-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tm-invite-header">
          <h3 className="tm-invite-title">
            <Users size={18} className="tm-icon-purple" />
            Create New Team
          </h3>
          <button className="tm-invite-close" onClick={() => setCreateOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <p className="tm-create-subtitle">
          Set up your squad — pick a game, name your team, and add your crew
        </p>

        <form onSubmit={handleCreateTeam} className="tm-create-form">
          {/* Game selector */}
          <div className="tm-create-field">
            <label className="tm-create-label">Game *</label>
            <div style={{ position: 'relative' }} ref={createGameRef}>
              <button
                type="button"
                className="tm-create-game-btn"
                onClick={() => setCreateGameDropdownOpen((v) => !v)}
              >
                <span className="tm-create-game-text">
                  <Gamepad2 size={14} /> {createGame}
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: createGameDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              {createGameDropdownOpen && (
                <div className="tm-dropdown-menu" style={{ left: 0, right: 0 }}>
                  {GAME_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`tm-dropdown-item${createGame === g ? ' selected' : ''}`}
                      onClick={() => {
                        setCreateGame(g);
                        setCreateGameDropdownOpen(false);
                      }}
                    >
                      {createGame === g && <Check size={12} />}
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team name */}
          <div className="tm-create-field">
            <label className="tm-create-label">Team Name *</label>
            <input
              type="text"
              placeholder="Enter team name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="tm-create-input"
            />
          </div>

          {/* Description */}
          <div className="tm-create-field">
            <label className="tm-create-label">Description (Optional)</label>
            <textarea
              placeholder="Brief team description..."
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              className="tm-create-input"
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Invite mode selector */}
          <div className="tm-create-field">
            <div className="tm-create-players-header">
              <label className="tm-create-label">
                Add Players * ({createPlayers.filter((p) => p.trim()).length}/15)
              </label>
              {createPlayers.length < 15 && (
                <button
                  type="button"
                  className="tm-create-add-player"
                  onClick={() => {
                    setCreatePlayers([...createPlayers, '']);
                    setCreateSelectedUsernames([...createSelectedUsernames, null]);
                  }}
                >
                  <Plus size={14} /> Add Player
                </button>
              )}
            </div>

            <div className="tm-create-mode-toggle">
              {INVITE_MODES.map(({ mode, label, icon: ModeIcon }) => (
                <button
                  key={mode}
                  type="button"
                  className={`tm-create-mode-btn${createInviteMode === mode ? ' active' : ''}`}
                  onClick={() => setCreateInviteMode(mode)}
                >
                  <ModeIcon size={12} /> {label}
                </button>
              ))}
            </div>

            <div className="tm-create-players-list">
              {createPlayers.map((val, idx) => (
                <div key={idx} className="tm-create-player-row">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      placeholder={`Player ${idx + 1} ${currentInviteMode?.placeholder || ''}`}
                      value={val}
                      onChange={(e) => {
                        if (createInviteMode === 'username' && createSelectedUsernames[idx]) {
                          return; // Don't allow typing if already selected
                        }
                        handleCreatePlayerChange(idx, e.target.value);
                      }}
                      onBlur={() => handleCreatePlayerBlur(idx)}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Backspace' &&
                          createInviteMode === 'username' &&
                          createSelectedUsernames[idx]
                        ) {
                          e.preventDefault();
                          const updated = [...createPlayers];
                          updated[idx] = '';
                          setCreatePlayers(updated);
                          const newSelected = [...createSelectedUsernames];
                          newSelected[idx] = null;
                          setCreateSelectedUsernames(newSelected);
                          const newErrors = { ...createFieldErrors };
                          delete newErrors[idx];
                          setCreateFieldErrors(newErrors);
                        }
                      }}
                      className={`tm-create-input${createFieldErrors[idx] ? ' input-error' : ''}${createSelectedUsernames[idx] ? ' selected-input' : ''}`}
                    />
                    {/* Username autocomplete dropdown */}
                    {createInviteMode === 'username' &&
                      createShowSuggestions[idx] &&
                      createSuggestions[idx]?.length > 0 && (
                        <div className="tm-create-suggestions">
                          {createSuggestions[idx].map((s) => (
                            <div
                              key={s.id}
                              className="tm-create-suggestion-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCreatePlayerSelect(idx, s.username);
                              }}
                            >
                              {s.username}
                            </div>
                          ))}
                        </div>
                      )}
                    {createFieldErrors[idx] && (
                      <div className="tm-create-field-error">{createFieldErrors[idx]}</div>
                    )}
                  </div>
                  {createPlayers.length > 1 && (
                    <button
                      type="button"
                      className="tm-create-remove-btn"
                      onClick={() => {
                        setCreatePlayers(createPlayers.filter((_, i) => i !== idx));
                        setCreateSelectedUsernames(
                          createSelectedUsernames.filter((_, i) => i !== idx)
                        );
                        const newErrors = { ...createFieldErrors };
                        delete newErrors[idx];
                        setCreateFieldErrors(newErrors);
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="tm-create-actions">
            <button
              type="button"
              className="tm-create-cancel"
              onClick={() => setCreateOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </button>
            <button type="submit" className="tm-create-submit" disabled={createLoading}>
              {createLoading ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2
          size={32}
          className="tm-icon-purple"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
    );
  }

  const teamPhoto = team?.profile_picture
    ? team.profile_picture.startsWith('http')
      ? team.profile_picture
      : `${MEDIA_URL}${team.profile_picture}`
    : null;

  // Game-based switcher: always show all 5 games, mark which ones have a team
  const gameTeamMap = {};
  const GAME_DISPLAY_LABEL = Object.fromEntries(
    Object.entries(GAME_API_VALUE).map(([k, v]) => [v, k])
  );
  teams.forEach((t) => {
    if (t.game) {
      const label = GAME_DISPLAY_LABEL[t.game] || t.game;
      gameTeamMap[label] = t;
    }
  });

  return (
    <div className="tm-container">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="tm-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="tm-title-main" style={{ margin: 0 }}>
              {team ? team.name : `${selectedGame} Team`}
            </h2>
            {isTempView && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: 'rgba(234,179,8,0.15)',
                  color: 'rgb(234,179,8)',
                  border: '1px solid rgba(234,179,8,0.3)',
                  letterSpacing: '0.05em',
                }}
              >
                TEMPORARY
              </span>
            )}
          </div>
          <p className="tm-subtitle">
            {team
              ? `${members.length} member${members.length !== 1 ? 's' : ''} · ${selectedGame}`
              : `No team yet`}
          </p>
          {isTempView && registrationEnd && (
            <p
              className="text-xs mt-1"
              style={{
                color: registrationClosed ? 'rgb(248,113,113)' : 'hsl(var(--muted-foreground))',
              }}
            >
              {registrationClosed
                ? 'Registration closed · Invites locked'
                : `Registration closes ${registrationEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          )}
          {/* TEMP / PERM toggle — only shown when both exist for this game */}
          {permanentTeam && tempTeamForGame && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setTeamMode('perm');
                  setConversionResult(null);
                  setConversionConflict(null);
                }}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 12px',
                  borderRadius: '99px',
                  border: 'none',
                  cursor: 'pointer',
                  background: teamMode === 'perm' ? 'hsl(var(--accent))' : 'hsl(var(--secondary))',
                  color: teamMode === 'perm' ? '#000' : 'hsl(var(--muted-foreground))',
                }}
              >
                Permanent
              </button>
              <button
                onClick={() => {
                  setTeamMode('temp');
                  setConversionResult(null);
                  setConversionConflict(null);
                }}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 12px',
                  borderRadius: '99px',
                  border: 'none',
                  cursor: 'pointer',
                  background: teamMode === 'temp' ? 'rgba(234,179,8,0.2)' : 'hsl(var(--secondary))',
                  color: teamMode === 'temp' ? 'rgb(234,179,8)' : 'hsl(var(--muted-foreground))',
                }}
              >
                Temporary
              </button>
            </div>
          )}
        </div>

        <div className="tm-header-actions">
          {/* Game switcher — always shows all 5 games */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button className="tm-dropdown-trigger" onClick={() => setTeamDropdownOpen((v) => !v)}>
              <Gamepad2 size={13} />
              {selectedGame}
              <ChevronDown
                size={12}
                style={{
                  transform: teamDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            {teamDropdownOpen && (
              <div className="tm-dropdown-menu tm-game-switcher-dropdown">
                {GAME_OPTIONS.map((g) => {
                  const hasTeam = !!gameTeamMap[g];
                  return (
                    <button
                      key={g}
                      className={`tm-dropdown-item${selectedGame === g ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedGame(g);
                        setTeamDropdownOpen(false);
                        setActiveTab('members');
                      }}
                    >
                      {selectedGame === g && <Check size={12} />}
                      {g}
                      {!hasTeam && (
                        <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.5 }}>
                          No team
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button className="tm-action-btn" onClick={() => setCreateOpen(true)}>
            <Plus size={13} /> Create
          </button>
          <button
            className="tm-action-btn"
            onClick={() => setInviteOpen(true)}
            disabled={registrationClosed && team?.is_temporary}
            title={
              registrationClosed && team?.is_temporary
                ? 'Registration closed — invites locked'
                : undefined
            }
            style={
              registrationClosed && team?.is_temporary
                ? { opacity: 0.4, cursor: 'not-allowed' }
                : undefined
            }
          >
            <UserPlus size={13} /> Invite
          </button>
          {/* Bug 5: Browse Teams link when user has a team */}
          {team && (
            <button className="tm-action-btn" onClick={() => navigate('/teams')}>
              <Users size={13} /> Browse
            </button>
          )}
          {/* Join Requests dropdown — captain only */}
          {team && isCaptain && (
            <div style={{ position: 'relative' }} ref={requestsDropdownRef}>
              <button
                className="tm-action-btn"
                onClick={handleToggleRequests}
                style={{ position: 'relative' }}
              >
                <Users size={13} /> Requests
                {joinRequests.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-7px',
                      right: '-7px',
                      background: 'hsl(var(--destructive))',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      boxShadow: '0 0 0 2px hsl(var(--destructive) / 0.3)',
                    }}
                  >
                    {joinRequests.length}
                  </span>
                )}
              </button>
              {requestsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '280px',
                    maxHeight: '320px',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border) / 0.3)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid hsl(var(--border) / 0.2)',
                      fontWeight: 700,
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    Join Requests{' '}
                    {joinRequests.length > 0 && (
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                        ({joinRequests.length})
                      </span>
                    )}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {requestsLoading ? (
                      <div
                        style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: 'hsl(var(--muted-foreground))',
                          fontSize: '12px',
                        }}
                      >
                        <Loader2
                          size={16}
                          style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}
                        />
                      </div>
                    ) : joinRequests.length === 0 ? (
                      <div
                        style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: 'hsl(var(--muted-foreground))',
                          fontSize: '12px',
                        }}
                      >
                        No pending requests
                      </div>
                    ) : (
                      joinRequests.map((req) => {
                        const playerDetails = req.player_details || {};
                        const username = playerDetails.username || req.player_username || 'Unknown';
                        const picPath =
                          playerDetails.profile?.profile_picture || playerDetails.profile_picture;
                        const picUrl = picPath
                          ? picPath.startsWith('http')
                            ? picPath
                            : `${MEDIA_URL}${picPath}`
                          : null;
                        const playerId = playerDetails.id || req.player;
                        const actioning = requestsActioning[req.id];
                        return (
                          <div
                            key={req.id}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid hsl(var(--border) / 0.15)',
                            }}
                          >
                            {/* Row 1: avatar + name (clickable) */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                marginBottom: '8px',
                              }}
                              onClick={() => {
                                setRequestsOpen(false);
                                navigate(`/player/profile/${playerId}`);
                              }}
                            >
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background:
                                    'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary) / 0.5))',
                                  border: '1px solid hsl(var(--border) / 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: 'hsl(var(--foreground))',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                }}
                              >
                                {picUrl ? (
                                  <img
                                    src={picUrl}
                                    alt={username}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  username.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: 'hsl(var(--foreground))',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {username}
                              </span>
                            </div>
                            {/* Row 2: Allow / Decline */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                disabled={!!actioning}
                                onClick={() => handleAcceptRequest(req.id)}
                                style={{
                                  flex: 1,
                                  padding: '5px 0',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background:
                                    actioning === 'accepting'
                                      ? 'hsl(var(--accent) / 0.5)'
                                      : 'hsl(var(--accent))',
                                  color: '#000',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: actioning ? 'not-allowed' : 'pointer',
                                  opacity: actioning ? 0.7 : 1,
                                }}
                              >
                                {actioning === 'accepting' ? '...' : 'Allow'}
                              </button>
                              <button
                                disabled={!!actioning}
                                onClick={() => handleRejectRequest(req.id)}
                                style={{
                                  flex: 1,
                                  padding: '5px 0',
                                  borderRadius: '6px',
                                  border: '1px solid hsl(var(--destructive) / 0.4)',
                                  background: 'transparent',
                                  color: 'hsl(var(--destructive))',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: actioning ? 'not-allowed' : 'pointer',
                                  opacity: actioning ? 0.7 : 1,
                                }}
                              >
                                {actioning === 'rejecting' ? '...' : 'Decline'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Team Photo + Temp Team Banner (side by side when temp view) ── */}
      {team && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'stretch',
            flexWrap: 'wrap',
            marginBottom: '4px',
          }}
        >
          {/* Photo card — half width when temp banner visible, full width otherwise */}
          <div
            className="tm-photo-card"
            style={{
              flex:
                isTempView && user?.user?.id === tempTeamForGame?.captain
                  ? '1 1 240px'
                  : '1 1 auto',
            }}
          >
            <div className="tm-photo-preview" onClick={() => fileInputRef.current?.click()}>
              {teamPhoto ? (
                <img src={teamPhoto} alt="Team" className="tm-photo-img" />
              ) : (
                <Camera size={24} className="tm-icon-purple" style={{ opacity: 0.6 }} />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div className="tm-photo-info">
              <h3 className="tm-photo-label">Team Photo</h3>
              <p className="tm-photo-desc">Upload your team logo or group photo</p>
              <button className="tm-upload-btn" onClick={() => fileInputRef.current?.click()}>
                <Upload size={12} />
                {teamPhoto ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>
          </div>

          {/* ── Temp Team Keep/Discard Banner (captain only, temp view, only after tournament ends) ── */}
          {isTempView &&
            user?.user?.id === tempTeamForGame?.captain &&
            tempTeamForGame?.conversion_deadline && (
              <div
                style={{
                  flex: '1 1 240px',
                  borderRadius: '12px',
                  border: '1px solid rgba(234,179,8,0.3)',
                  background: 'rgba(234,179,8,0.07)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  justifyContent: 'center',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'rgb(234,179,8)',
                      margin: 0,
                    }}
                  >
                    Temporary Team
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'hsl(var(--muted-foreground))',
                      margin: '2px 0 0',
                    }}
                  >
                    Convert window open · Keep or discard before deadline
                  </p>
                </div>

                {conversionResult === 'kept' ? (
                  <span style={{ fontSize: '12px', color: 'rgb(74,222,128)', fontWeight: 700 }}>
                    ✓ Team is now permanent!
                  </span>
                ) : conversionResult === 'discarded' ? (
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'hsl(var(--muted-foreground))',
                      fontWeight: 700,
                    }}
                  >
                    Team discarded
                  </span>
                ) : conversionConflict ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Conflict message — prominent warning box */}
                    <div
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'hsl(var(--destructive))',
                          margin: '0 0 2px',
                        }}
                      >
                        Conflict detected
                      </p>
                      <p
                        style={{
                          fontSize: '11px',
                          color: 'hsl(var(--foreground))',
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {conversionConflict.is_captain_of_conflict
                          ? `You are captain of "${conversionConflict.conflict_team_name}". Transfer captaincy before converting this team.`
                          : `You already belong to "${conversionConflict.conflict_team_name}". Leave it first to keep this team.`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!conversionConflict.is_captain_of_conflict && (
                        <button
                          onClick={async () => {
                            setConversionBusy(true);
                            try {
                              await teamAPI.leaveTeam(conversionConflict.conflict_team_id);
                              setConversionConflict(null);
                              await teamAPI.convertPermanent(tempTeamForGame.id);
                              setConversionResult('kept');
                              onConversionDone && onConversionDone();
                              const res = await teamAPI.getTeams({ mine: true });
                              setTeams(
                                Array.isArray(res.data.results || res.data)
                                  ? res.data.results || res.data
                                  : []
                              );
                              setTeamMode('perm');
                            } catch (err) {
                              showToast(
                                err?.response?.data?.message || 'Something went wrong',
                                'error'
                              );
                            } finally {
                              setConversionBusy(false);
                            }
                          }}
                          disabled={conversionBusy}
                          style={{
                            flex: 1,
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '5px 8px',
                            borderRadius: '8px',
                            background: 'hsl(var(--accent))',
                            color: '#000',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {conversionBusy ? '...' : 'Leave & Keep'}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          setConversionBusy(true);
                          setConversionConflict(null);
                          try {
                            await teamAPI.declineConversion(tempTeamForGame.id);
                            setConversionResult('discarded');
                            onConversionDone && onConversionDone();
                            const res = await teamAPI.getTeams({ mine: true });
                            setTeams(
                              Array.isArray(res.data.results || res.data)
                                ? res.data.results || res.data
                                : []
                            );
                          } catch {
                            setConversionResult('error');
                          } finally {
                            setConversionBusy(false);
                          }
                        }}
                        disabled={conversionBusy}
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '5px 8px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: '1px solid rgba(239,68,68,0.4)',
                          color: 'hsl(var(--destructive))',
                          cursor: conversionBusy ? 'not-allowed' : 'pointer',
                          opacity: conversionBusy ? 0.6 : 1,
                        }}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={async () => {
                        setConversionBusy(true);
                        setConversionResult(null);
                        setConversionConflict(null);
                        try {
                          await teamAPI.convertPermanent(tempTeamForGame.id);
                          setConversionResult('kept');
                          onConversionDone && onConversionDone();
                          const res = await teamAPI.getTeams({ mine: true });
                          setTeams(
                            Array.isArray(res.data.results || res.data)
                              ? res.data.results || res.data
                              : []
                          );
                          setTeamMode('perm');
                        } catch (err) {
                          if (
                            err?.response?.status === 409 &&
                            err?.response?.data?.error === 'conflict'
                          ) {
                            setConversionConflict(err.response.data);
                          } else {
                            showToast(
                              err?.response?.data?.message ||
                                err?.response?.data?.error ||
                                'Something went wrong',
                              'error'
                            );
                          }
                        } finally {
                          setConversionBusy(false);
                        }
                      }}
                      disabled={conversionBusy}
                      style={{
                        flex: 1,
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '7px 8px',
                        borderRadius: '8px',
                        background: 'hsl(var(--accent))',
                        color: '#000',
                        border: 'none',
                        cursor: conversionBusy ? 'not-allowed' : 'pointer',
                        opacity: conversionBusy ? 0.6 : 1,
                      }}
                    >
                      {conversionBusy ? '...' : 'Keep Permanently'}
                    </button>
                    <button
                      onClick={async () => {
                        setConversionBusy(true);
                        setConversionResult(null);
                        setConversionConflict(null);
                        try {
                          await teamAPI.declineConversion(tempTeamForGame.id);
                          setConversionResult('discarded');
                          onConversionDone && onConversionDone();
                          const res = await teamAPI.getTeams({ mine: true });
                          setTeams(
                            Array.isArray(res.data.results || res.data)
                              ? res.data.results || res.data
                              : []
                          );
                        } catch {
                          setConversionResult('error');
                        } finally {
                          setConversionBusy(false);
                        }
                      }}
                      disabled={conversionBusy}
                      style={{
                        flex: 1,
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '7px 8px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.4)',
                        color: 'hsl(var(--destructive))',
                        cursor: conversionBusy ? 'not-allowed' : 'pointer',
                        opacity: conversionBusy ? 0.6 : 1,
                      }}
                    >
                      Discard
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* ── No team for this game ────────────────────────────────── */}
      {!permanentTeam && !tempTeamForGame && (
        <div className="tm-empty-card">
          <div className="tm-empty-icon-wrap">
            <Gamepad2 size={32} style={{ opacity: 0.6 }} className="tm-icon-purple" />
          </div>
          <div>
            <h3 className="tm-empty-title">No {selectedGame} Team Yet</h3>
            <p className="tm-empty-desc">
              You don't have a {selectedGame} team. Create one or join an existing team to get
              started.
            </p>
          </div>
          <button
            className="tm-create-btn"
            onClick={() => {
              setCreateGame(selectedGame);
              setCreateOpen(true);
            }}
          >
            <Plus size={16} />
            Create {selectedGame} Team
          </button>
          {/* Bug 5: Browse & Join a Team button in empty state */}
          <button
            className="tm-action-btn"
            style={{ marginTop: 8, fontSize: 13, padding: '8px 16px' }}
            onClick={() => navigate('/teams')}
          >
            <Users size={14} />
            Browse &amp; Join a Team
          </button>
        </div>
      )}
      {/* ── Quick Stats ───────────────────────────────────────────── */}
      {team && (
        <div className="tm-stats-grid">
          {(() => {
            const os = team?.overall_stats;
            const wins = os?.total_wins || os?.matches_won || team?.wins || 0;
            const matches = os?.matches_played || os?.total_matches || team?.total_matches || 0;
            const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
            const kd =
              matches > 0
                ? (['Valorant', 'COD'].includes(team?.game)
                    ? (os?.total_points || 0) / matches
                    : (os?.total_kills || 0) / matches
                  ).toFixed(2)
                : '0.00';
            const rank = os?.rank > 0 ? `#${os.rank}` : 'N/A';

            return [
              { label: 'Wins', value: wins, color: 'tm-stat-yellow' },
              { label: 'Matches', value: matches, color: 'tm-stat-white' },
              { label: 'Win %', value: `${winRate}%`, color: 'tm-stat-green' },
              { label: 'Ranking', value: rank, color: 'tm-stat-purple' },
              {
                label: ['Valorant', 'COD'].includes(team?.game) ? 'Pts/Match' : 'KD Ratio',
                value: kd,
                color: 'tm-stat-orange',
              },
            ].map((stat) => (
              <div key={stat.label} className="tm-stat-item">
                <div className={`tm-stat-value ${stat.color}`}>{stat.value}</div>
                <div className="tm-stat-label">{stat.label}</div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      {team && (
        <>
          <div className="tm-tabs-bar">
            <button
              className={`tm-tab-btn${activeTab === 'members' ? ' active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Active Members
            </button>
            <button
              className={`tm-tab-btn${activeTab === 'history' ? ' active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Team History
            </button>
          </div>

          {/* ── Members Tab ───────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <div className="tm-members-grid">
              {members.map((member, idx) => {
                const username = member.username || member.user?.username || 'Unknown';
                const initials = username.slice(0, 2).toUpperCase();
                const profilePic = member.profile_picture || member.user?.profile_picture;

                return (
                  <div
                    key={idx}
                    className="tm-member-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      // Captain entry: id = user ID directly; member entry: user.id
                      const userId = member.is_captain ? member.id : member.user?.id;
                      if (userId) navigate(`/player/profile/${userId}`);
                    }}
                  >
                    <div className="tm-member-avatar">
                      {profilePic ? (
                        <img
                          src={
                            profilePic.startsWith('http') ? profilePic : `${MEDIA_URL}${profilePic}`
                          }
                          alt={username}
                          className="tm-member-avatar-img"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="tm-member-info">
                      <div className="tm-member-name-row">
                        <p className="tm-member-name">{username}</p>
                        {member.is_captain && <Crown size={14} className="tm-icon-amber" />}
                      </div>
                      <p className="tm-member-role">
                        {member.is_captain
                          ? 'Captain'
                          : member.role && member.role !== 'Member'
                            ? member.role
                            : 'Member'}
                      </p>
                    </div>

                    {/* Settings gear — captain's own card */}
                    {isCaptain && member.is_captain && (
                      <div
                        style={{ position: 'relative' }}
                        ref={memberMenuOpen === idx ? memberMenuRef : null}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="tm-member-settings-btn"
                          onClick={() => setMemberMenuOpen(memberMenuOpen === idx ? null : idx)}
                        >
                          <Settings size={14} />
                        </button>
                        {memberMenuOpen === idx && (
                          <div className="tm-member-menu">
                            {members.length === 1 ? (
                              <button
                                className="tm-member-menu-item destructive"
                                onClick={() => {
                                  setMemberMenuOpen(null);
                                  handleLeaveTeam();
                                }}
                              >
                                <UserMinus size={12} /> Leave Team
                              </button>
                            ) : registrationClosed && team?.is_temporary ? (
                              <button
                                className="tm-member-menu-item"
                                disabled
                                title="Registration closed"
                                style={{ opacity: 0.4, cursor: 'not-allowed' }}
                              >
                                <UserMinus size={12} /> Transfer locked
                              </button>
                            ) : (
                              <button
                                className="tm-member-menu-item"
                                disabled
                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                              >
                                <UserMinus size={12} /> Transfer captaincy to leave
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Settings gear — captain managing other members */}
                    {isCaptain && !member.is_captain && (
                      <div
                        style={{ position: 'relative' }}
                        ref={memberMenuOpen === idx ? memberMenuRef : null}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="tm-member-settings-btn"
                          onClick={() => setMemberMenuOpen(memberMenuOpen === idx ? null : idx)}
                        >
                          <Settings size={14} />
                        </button>
                        {memberMenuOpen === idx && (
                          <div className="tm-member-menu">
                            <button
                              className="tm-member-menu-item"
                              onClick={() => handleMakeCaptain(member.id)}
                              disabled={registrationClosed && team?.is_temporary}
                              title={
                                registrationClosed && team?.is_temporary
                                  ? 'Registration closed'
                                  : undefined
                              }
                              style={
                                registrationClosed && team?.is_temporary
                                  ? { opacity: 0.4, cursor: 'not-allowed' }
                                  : undefined
                              }
                            >
                              <Crown size={12} /> Make Captain
                            </button>
                            <button
                              className="tm-member-menu-item"
                              onClick={() => setRolePickerOpen(rolePickerOpen === idx ? null : idx)}
                            >
                              <Gamepad2 size={12} /> Set Role
                              <ChevronDown
                                size={10}
                                style={{
                                  marginLeft: 'auto',
                                  transform: rolePickerOpen === idx ? 'rotate(180deg)' : 'none',
                                  transition: 'transform 0.15s',
                                }}
                              />
                            </button>
                            {rolePickerOpen === idx && (
                              <div className="tm-role-picker">
                                {ROLE_OPTIONS.map((r) => (
                                  <button
                                    key={r}
                                    className={`tm-role-option${member.role === r ? ' active' : ''}`}
                                    onClick={() => handleSetRole(member.user?.id || member.id, r)}
                                  >
                                    {member.role === r ? '✓ ' : ''}
                                    {r}
                                  </button>
                                ))}
                              </div>
                            )}
                            <button
                              className="tm-member-menu-item destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <UserMinus size={12} /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Settings gear — non-captain sees Leave on their own card */}
                    {!isCaptain &&
                      (member.user?.id === user?.user?.id ||
                        member.username === user?.user?.username) && (
                        <div
                          style={{ position: 'relative' }}
                          ref={memberMenuOpen === idx ? memberMenuRef : null}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="tm-member-settings-btn"
                            onClick={() => setMemberMenuOpen(memberMenuOpen === idx ? null : idx)}
                          >
                            <Settings size={14} />
                          </button>
                          {memberMenuOpen === idx && (
                            <div className="tm-member-menu">
                              <button
                                className="tm-member-menu-item destructive"
                                onClick={() => {
                                  setMemberMenuOpen(null);
                                  handleLeaveTeam();
                                }}
                              >
                                <UserMinus size={12} /> Leave Team
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── History Tab ───────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="tm-history-list">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2
                    size={24}
                    className="tm-icon-purple"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                </div>
              ) : teamHistory.length === 0 ? (
                <div className="tm-history-empty">No tournament history yet</div>
              ) : (
                teamHistory.map((entry, idx) => {
                  const placement = entry.placement || entry.final_placement || 0;
                  const dateStr = entry.date || entry.end_date || entry.created_at || '';
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '';
                  return (
                    <div key={idx} className="tm-history-row">
                      <div className="tm-history-left">
                        <div className="tm-history-trophy-wrap">
                          <Trophy
                            size={16}
                            className={placementColors[placement] || 'tm-placement-default'}
                          />
                        </div>
                        <div>
                          <p className="tm-history-event">
                            {entry.tournament_title || entry.title || entry.name || 'Tournament'}
                          </p>
                          <p className="tm-history-date">
                            <Clock size={12} /> {formattedDate}
                          </p>
                        </div>
                      </div>
                      <div className="tm-history-right">
                        <p className={`tm-history-placement ${placementColors[placement] || ''}`}>
                          #{placement}
                        </p>
                        {entry.prize_pool && (
                          <p className="tm-history-prize">₹{entry.prize_pool}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ── Invite Dialog ─────────────────────────────────────────── */}
      {inviteOpen && (
        <div
          className="tm-invite-overlay"
          onClick={() => {
            setInviteOpen(false);
            setInviteEmailMode(false);
            setInviteEmail('');
            setInviteEmailError('');
            setInviteUsername('');
            setInviteSuggestions([]);
            setInviteSelected([]);
          }}
        >
          <div className="tm-invite-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="tm-invite-header">
              <h3 className="tm-invite-title">
                <UserPlus size={18} className="tm-icon-purple" />
                Invite Player to {team?.name}
              </h3>
              <button
                className="tm-invite-close"
                onClick={() => {
                  setInviteOpen(false);
                  setInviteEmailMode(false);
                  setInviteEmail('');
                  setInviteEmailError('');
                  setInviteUsername('');
                  setInviteSuggestions([]);
                  setInviteSelected([]);
                }}
              >
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
                  fontStyle: 'normal',
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
                <div style={{ position: 'relative' }} ref={inviteSearchRef}>
                  {/* Selected chips */}
                  {inviteSelected.length > 0 && (
                    <div className="tm-invite-chips">
                      {inviteSelected.map((p) => (
                        <span key={p.username} className="tm-invite-chip">
                          {p.username}
                          <button
                            className="tm-invite-chip-remove"
                            onClick={() => handleRemoveInviteChip(p.username)}
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
                      onChange={(e) => handleInviteUsernameChange(e.target.value)}
                      className="tm-invite-input"
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        inviteSuggestions.length > 0 &&
                        handleSelectInvitePlayer(inviteSuggestions[0])
                      }
                      autoComplete="off"
                    />
                    <button
                      className="tm-invite-send-btn"
                      onClick={handleSendInvites}
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
                            onClick={() => handleSelectInvitePlayer(p)}
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
                <span className="tm-invite-divider-text">or share invite via</span>
                <span className="tm-invite-divider-line" />
              </div>

              {/* Share buttons */}
              <div className="tm-invite-share-grid">
                <button className="tm-invite-share whatsapp" onClick={handleInviteByWhatsApp}>
                  <div className="tm-invite-share-icon whatsapp">
                    <MessageCircle size={20} />
                  </div>
                  <span className="tm-invite-share-label whatsapp">WhatsApp</span>
                  <span className="tm-invite-share-desc">Share invite link</span>
                </button>

                <button
                  className="tm-invite-share email"
                  onClick={() => setInviteEmailMode((v) => !v)}
                >
                  <div className="tm-invite-share-icon email">
                    <Mail size={20} />
                  </div>
                  <span className="tm-invite-share-label email">Email</span>
                  <span className="tm-invite-share-desc">Send email invite</span>
                </button>
              </div>

              {/* Email input — shown when email mode is active */}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleInviteByEmail()}
                      autoFocus
                    />
                    <button
                      className="tm-invite-send-btn"
                      onClick={handleInviteByEmail}
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
      )}

      {/* ── Create Team Dialog ───────────────────────────────────── */}
      {createOpen && renderCreateTeamDialog()}

      {/* ── Leave Team Confirm ───────────────────────────────────── */}
      <ConfirmModal
        isOpen={leaveConfirmOpen}
        onConfirm={handleLeaveConfirmed}
        onClose={() => setLeaveConfirmOpen(false)}
        title="Leave Team"
        message={`Are you sure you want to leave ${team?.name}? You cannot undo this.`}
      />
    </div>
  );
};

export default PlayerTeamView;
