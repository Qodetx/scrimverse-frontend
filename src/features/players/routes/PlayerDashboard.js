import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Trophy,
  Users,
  BarChart3,
  Key,
  Swords,
  TrendingUp,
  ListOrdered,
  Table2,
  Bell,
  Settings,
  Gamepad2,
  Menu,
  X,
  LogOut,
  Search,
  DollarSign,
  Check,
  Clock,
  UserPlus,
  Shield,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { tournamentAPI, teamAPI, notificationAPI, authAPI } from '../../../utils/api';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/Toast';
import TeamManagementModal from '../../teams/ui/TeamManagementModal';
import EditPlayerProfileModal from '../ui/EditPlayerProfileModal';
import PlayerOverviewView from '../ui/PlayerOverviewView';
import PlayerCredentialsView from '../ui/PlayerCredentialsView';
import PlayerSlotListView from '../ui/PlayerSlotListView';
import PlayerPointsTableView from '../ui/PlayerPointsTableView';
import PlayerTournamentsView from '../ui/PlayerTournamentsView';
import PlayerScrimsView from '../ui/PlayerScrimsView';
import PlayerAnalyticsView from '../ui/PlayerAnalyticsView';
import PlayerTeamView from '../ui/PlayerTeamView';
import PlayerLeaderboardsView from '../ui/PlayerLeaderboardsView';
import PlayerTransactionHistoryView from '../ui/PlayerTransactionHistoryView';
import NotificationsPage from '../../../pages/NotificationsPage';
import NewUserIndicator from '../ui/NewUserIndicator';
import './PlayerDashboard.css';
import logo from '../../../assets/scrimverse-logo-bgTransparant.png';

// ─── helpers ────────────────────────────────────────────────────────────────

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

// ─── constants ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'credentials', label: 'ID & Passwords', icon: Key },
  { id: 'slot-list', label: 'Slot List', icon: ListOrdered },
  { id: 'points-table', label: 'Points Table', icon: Table2 },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy },
  { id: 'scrims', label: 'Scrims', icon: Swords },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'leaderboards', label: 'Leaderboards', icon: TrendingUp },
];

// Notifications are fetched from the real API — no fake data here

const ONBOARDING_STEPS = [
  {
    icon: Gamepad2,
    title: 'Welcome to ScrimVerse',
    desc: 'Your competitive gaming arena. Find tournaments, build squads, and compete across top mobile titles.',
  },
  {
    icon: Trophy,
    title: 'Explore Tournaments',
    desc: 'Browse BGMI, Valorant, Free Fire, COD Mobile and more. Register your squad, secure your slot.',
  },
  {
    icon: Key,
    title: 'Match Credentials',
    desc: 'Room ID and password are delivered here before each lobby. View the full match schedule.',
  },
  {
    icon: ListOrdered,
    title: 'Slot Assignments',
    desc: 'View your assigned slot instantly. Your team is highlighted for quick identification.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    desc: 'Track kills, wins, and placements. Monitor your progress and climb the leaderboards.',
  },
  {
    icon: Users,
    title: 'Build Your Squad',
    desc: 'Create or join teams, manage rosters, and coordinate with teammates across game titles.',
  },
];

// ─── Sidebar content (shared between desktop + mobile overlay) ────────────────

const SidebarContent = ({
  activeView,
  setActiveView,
  user,
  onOpenOnboarding,
  onOpenSettings,
  onToggleNotif,
  onOpenSearch,
  onClose,
  unreadCount,
  onLogout,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Logo + close button (close only shown in mobile overlay) */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/" className="h-10 flex items-center -ml-8 overflow-visible">
          <img src={logo} alt="ScrimVerse" className="h-32 w-auto object-contain" />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search — visible on mobile only (desktop has right panel search) */}
      {onClose && (
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              onOpenSearch();
              if (onClose) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-secondary/20 border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/35 transition-all"
          >
            <Search size={14} className="shrink-0" />
            <span>Search ScrimVerse…</span>
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item${activeView === id ? ' active' : ''}`}
            onClick={() => {
              setActiveView(id);
              if (onClose) onClose();
            }}
          >
            <Icon
              size={16}
              className={activeView === id ? 'text-purple' : 'text-muted-foreground'}
            />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom action row — icons only */}
      <div className="border-t border-border/30 px-3 pt-3 pb-3 flex items-center justify-around gap-1">
        <button
          onClick={onOpenOnboarding}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent transition-all"
          title="Onboarding"
        >
          <Gamepad2 size={17} />
        </button>

        {/* Bell with badge */}
        <div className="relative">
          <button
            onClick={onToggleNotif}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent transition-all"
            title="Notifications"
          >
            <Bell size={17} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
              {unreadCount}
            </span>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent transition-all"
          title="Settings"
        >
          <Settings size={17} />
        </button>

        <button
          onClick={onLogout}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent transition-all"
          title="Sign Out"
        >
          <LogOut size={17} />
        </button>
      </div>

      {/* User card */}
      <button
        onClick={onOpenSettings}
        className="mx-3 mb-3 flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/40 transition-all text-left"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
          {user?.user?.profile_picture ? (
            <img
              src={user.user.profile_picture}
              alt="avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            (user?.user?.username || 'U').slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.user?.username || 'Player'}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {user?.user?.email || user?.user?.phone_number || ''}
          </p>
        </div>
      </button>
    </div>
  );
};

// ─── Notification dropdown ────────────────────────────────────────────────────

const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getNotifIcon = (type) => {
  switch (type) {
    case 'match_start':
      return <Clock className="h-3.5 w-3.5 text-red-400" />;
    case 'credential_release':
      return <Clock className="h-3.5 w-3.5 text-purple-400" />;
    case 'slot_list_release':
      return <Clock className="h-3.5 w-3.5 text-blue-400" />;
    case 'team_invite':
    case 'teammate_joined':
      return <UserPlus className="h-3.5 w-3.5 text-green-400" />;
    case 'tournament_update':
    case 'result_published':
    case 'tournament_result':
      return <Trophy className="h-3.5 w-3.5 text-yellow-500" />;
    case 'payment_confirmed':
      return <DollarSign className="h-3.5 w-3.5 text-green-400" />;
    case 'points_entered':
      return <TrendingUp className="h-3.5 w-3.5 text-blue-400" />;
    case 'registration_confirmed':
      return <Users className="h-3.5 w-3.5 text-purple-400" />;
    case 'team_conversion_offer':
    case 'team_conversion_reminder':
      return <Users className="h-3.5 w-3.5 text-yellow-400" />;
    case 'team_deleted':
      return <Users className="h-3.5 w-3.5 text-red-400" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

const NotifDropdown = ({
  onClose,
  onViewAll,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNotifClick,
  onInviteAction,
  captainTeamIds,
}) => {
  const ref = useRef(null);
  const [actedIds, setActedIds] = useState(new Set());
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    // Close on click outside — use 'click' not 'mousedown' so buttons inside fire first
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    // Close on scroll outside the dropdown
    const handleScroll = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      onClose();
    };

    // Use setTimeout so this listener attaches after the current click event finishes
    const t = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed w-80 bg-[hsl(0_0%_8%)] border border-border/60 rounded-xl shadow-2xl z-[9999] overflow-hidden pointer-events-auto"
      style={{
        top: '60px',
        right: '16px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-purple-400" />
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllRead();
            }}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Check size={10} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div
        className="max-h-[60vh] overflow-y-auto"
        onScroll={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={24} className="mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-xs text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const type = n.notification_type || n.type;
            const isInvite = type === 'team_invite';
            const isJoinRequest = type === 'general' && n.title === 'New Join Request';
            return (
              <div
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!n.is_read) onMarkRead(n.id);
                  if (
                    (type === 'team_conversion_offer' || type === 'team_conversion_reminder') &&
                    onNotifClick
                  ) {
                    onNotifClick(n);
                  } else if (type === 'credential_release' && onNotifClick) {
                    onNotifClick({ ...n, _nav: 'credentials' });
                  } else if (type === 'slot_list_release' && onNotifClick) {
                    onNotifClick({ ...n, _nav: 'slots' });
                  } else if (type === 'points_entered' && onNotifClick) {
                    onNotifClick({ ...n, _nav: 'points-table' });
                  } else if (type === 'tournament_result' && onNotifClick) {
                    onNotifClick({ ...n, _nav: 'tournaments' });
                  } else if (type === 'payment_confirmed' && onNotifClick) {
                    onNotifClick({ ...n, _nav: 'tournaments' });
                  }
                }}
                className={`flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-all cursor-pointer${!n.is_read ? ' bg-blue-500/5' : ''}`}
              >
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center">
                  {getNotifIcon(type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1.5">
                    <p
                      className={`text-xs font-semibold truncate ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="shrink-0 w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {getTimeAgo(n.created_at)}
                  </p>
                  {/* Inline Accept/Decline for team invites — hide only after user clicks Accept/Decline */}
                  {isInvite && n.related_id && !actedIds.has(n.id) && (
                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="px-3 py-1 rounded-md text-[11px] font-semibold bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/40 transition-colors"
                        onClick={() => {
                          setActedIds((prev) => new Set(prev).add(n.id));
                          onInviteAction(n.related_id, 'accept');
                          onMarkRead(n.id);
                        }}
                      >
                        Accept
                      </button>
                      <button
                        className="px-3 py-1 rounded-md text-[11px] font-semibold bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40 transition-colors"
                        onClick={() => {
                          setActedIds((prev) => new Set(prev).add(n.id));
                          onInviteAction(n.related_id, 'reject');
                          onMarkRead(n.id);
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {/* Join request — redirect to Team tab → Requests dropdown */}
                  {isJoinRequest && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="px-3 py-1 rounded-md text-[11px] font-semibold text-purple border border-purple/30 hover:bg-purple/10 transition-colors"
                        onClick={() => {
                          onMarkRead(n.id);
                          onNotifClick && onNotifClick({ ...n, _nav: 'team-requests' });
                        }}
                      >
                        View Requests →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer — View all */}
      <div className="px-2 py-2 border-t border-border/30 bg-secondary/10">
        <button
          onClick={() => {
            onClose();
            onViewAll && onViewAll();
          }}
          className="block w-full py-1.5 text-[10px] font-medium text-center text-purple-400 hover:text-purple-300 rounded-md hover:bg-secondary/30 transition-colors"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
};

// ─── Team Conversion Modal ────────────────────────────────────────────────────

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

const TeamConversionModal = ({ notification, onClose, onConverted, onDeclined }) => {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // 'kept' | 'discarded'
  const teamId = notification?.related_id;
  const countdown = useConversionCountdown(notification?.conversion_deadline);

  const handleKeep = async () => {
    if (!teamId) return;
    setBusy(true);
    try {
      await teamAPI.convertPermanent(teamId);
      setResult('kept');
      onConverted && onConverted();
    } catch (err) {
      // show error inline
      setResult('error');
    } finally {
      setBusy(false);
    }
  };

  const handleDiscard = async () => {
    if (!teamId) return;
    setBusy(true);
    try {
      await teamAPI.declineConversion(teamId);
      setResult('discarded');
      onDeclined && onDeclined();
    } catch (err) {
      setResult('error');
    } finally {
      setBusy(false);
    }
  };

  // Extract team name from notification message
  const teamNameMatch = notification?.message?.match(/team '(.+?)'/);
  const teamName = teamNameMatch ? teamNameMatch[1] : 'your team';
  const tournamentMatch = notification?.message?.match(/for '(.+?)'/);
  const tournamentName = tournamentMatch ? tournamentMatch[1] : '';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="max-w-sm w-full rounded-2xl p-7 space-y-5"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border) / 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {result === 'kept' ? (
          <div className="text-center space-y-3">
            <div className="text-3xl">🏆</div>
            <p className="font-bold text-foreground">Team kept permanently!</p>
            <p className="text-sm text-muted-foreground">
              <strong style={{ color: 'hsl(var(--accent))' }}>{teamName}</strong> is now a permanent
              team.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'hsl(var(--accent))', color: '#000' }}
            >
              Done
            </button>
          </div>
        ) : result === 'discarded' ? (
          <div className="text-center space-y-3">
            <div className="text-3xl">🗑</div>
            <p className="font-bold text-foreground">Team discarded</p>
            <p className="text-sm text-muted-foreground">
              <strong>{teamName}</strong> has been removed.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg text-sm font-semibold"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold tracking-widest text-yellow-400">TEAM DECISION</p>
              <h3 className="text-xl font-bold text-foreground">Keep this team?</h3>
            </div>

            <div
              className="rounded-xl p-4 space-y-1.5 text-sm"
              style={{ background: 'hsl(var(--secondary) / 0.4)' }}
            >
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team</span>
                <span className="font-semibold text-foreground">{teamName}</span>
              </div>
              {tournamentName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tournament</span>
                  <span className="font-semibold text-foreground truncate max-w-[160px]">
                    {tournamentName}
                  </span>
                </div>
              )}
            </div>

            {/* Countdown */}
            {countdown && !countdown.expired && (
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground mb-1.5">Time remaining to decide</p>
                <div className="flex items-center justify-center gap-1 font-mono">
                  <span className="text-xl font-bold text-yellow-400">{pad2(countdown.h)}</span>
                  <span className="text-yellow-400">h</span>
                  <span className="text-muted-foreground mx-0.5">:</span>
                  <span className="text-xl font-bold text-yellow-400">{pad2(countdown.m)}</span>
                  <span className="text-yellow-400">m</span>
                  <span className="text-muted-foreground mx-0.5">:</span>
                  <span className="text-xl font-bold text-yellow-400">{pad2(countdown.s)}</span>
                  <span className="text-yellow-400">s</span>
                </div>
              </div>
            )}
            {countdown?.expired && (
              <p className="text-center text-xs text-red-400">Conversion window has expired.</p>
            )}

            {result === 'error' && (
              <p className="text-center text-xs text-red-400">
                Something went wrong. Please try again.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleKeep}
                disabled={busy || countdown?.expired}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background: 'hsl(var(--accent))',
                  color: '#000',
                  opacity: busy || countdown?.expired ? 0.5 : 1,
                }}
              >
                {busy ? '...' : '⭐ Keep Team'}
              </button>
              <button
                onClick={handleDiscard}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background: 'transparent',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  color: 'hsl(var(--muted-foreground))',
                  opacity: busy ? 0.5 : 1,
                }}
              >
                Discard
              </button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground">
              No response within 48h = team automatically deleted
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Onboarding modal ─────────────────────────────────────────────────────────

const OnboardingModal = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[hsl(0_0%_7%)] border border-border/60 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        {/* progress bar */}
        <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        {/* step counter */}
        <p className="text-[11px] text-muted-foreground font-medium mb-4">
          Step {step + 1} of {total}
        </p>

        {/* icon */}
        <div className="w-14 h-14 rounded-2xl bg-purple/15 border border-purple/25 flex items-center justify-center mb-4">
          <Icon size={26} className="text-purple" />
        </div>

        {/* title + desc */}
        <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.desc}</p>

        {/* dot indicators */}
        <div className="flex items-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i === step ? 'w-6 h-2 bg-purple' : 'w-2 h-2 bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-border/40 transition-all"
          >
            Skip
          </button>
          <button
            onClick={() => {
              if (step < total - 1) setStep(step + 1);
              else onClose();
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all"
          >
            {step < total - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const PlayerDashboard = () => {
  const { user, fetchUserData, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();

  // existing state
  const [tournamentRegistrations, setTournamentRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manageTeamId, setManageTeamId] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('profile');
  const [invitations, setInvitations] = useState([]);
  const [gameFilter, setGameFilter] = useState('ALL');

  // new shell state
  const [activeView, setActiveView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversionNotif, setConversionNotif] = useState(null); // open TeamConversionModal
  const [openTeamRequestsTick, setOpenTeamRequestsTick] = useState(0);
  const [slotFocusTournamentId, setSlotFocusTournamentId] = useState(null);
  const [hasSeenOnboardingIndicator, setHasSeenOnboardingIndicator] = useState(false); // track if indicator was dismissed

  // search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState('players'); // 'players' | 'teams' | 'hosts'
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Add dashboard-active class to html to remove gap/scrollbar ──────────────
  useEffect(() => {
    document.documentElement.classList.add('dashboard-active');
    return () => document.documentElement.classList.remove('dashboard-active');
  }, []);

  // Sync activeView to URL query parameter for persistence across refresh/back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') !== activeView) {
      params.set('view', activeView);
      // Use replaceState to avoid cluttering history with tab clicks,
      // but preserve URL for back navigation from other pages.
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(window.history.state, '', newUrl);
    }
  }, [activeView]);

  // ── helper: detect if user is new ────────────────────────────────────────────
  // A user is new if last_login is null (first time logging in after signup)
  const isUserNew = () => {
    return !user?.user?.last_login;
  };

  // ── data fetching ────────────────────────────────────────────────────────

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications({ limit: 6, offset: 0 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      // fail silently — notifications are non-critical
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // fail silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // fail silently
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchInvitations();
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && location.state?.showProfileEdit) {
      if (!user?.profile?.in_game_name || !user?.profile?.game_id || !user?.user?.phone_number) {
        setShowEditProfileModal(true);
      } else if (location.state?.next) {
        const dest = location.state.next;
        window.history.replaceState({}, document.title);
        navigate(dest);
      }
    }
    if (location.state?.openSettings) {
      setSettingsInitialTab(location.state.openSettings);
      setShowEditProfileModal(true);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, location.state, user]);

  useEffect(() => {
    if (!loading) {
      fetchUserData(gameFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFilter]);

  useEffect(() => {
    if (location.state?.openView) {
      setActiveView(location.state.openView);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openView]);

  useEffect(() => {
    if (!loading && location.state?.scrollTo === 'team-section') {
      const teamSection = document.getElementById('team-section');
      if (teamSection) {
        setTimeout(() => {
          teamSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.replaceState({}, document.title);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, location.state]);

  const fetchDashboardData = async () => {
    try {
      const [regRes, teamRes] = await Promise.all([
        tournamentAPI.getMyRegistrations(),
        teamAPI.getTeams({ mine: true }),
      ]);
      setTournamentRegistrations(regRes.data.results || regRes.data);
      setTeams(teamRes.data.results || teamRes.data);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await teamAPI.getMyInvites();
      setInvitations(res.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleInviteAction = async (teamOrInviteId, action) => {
    try {
      // notification related_id is the team ID, not the invite ID
      // fetch my pending invites and find the one matching this team
      const invitesRes = await teamAPI.getMyInvites();
      const invites = invitesRes.data || [];
      const match = invites.find(
        (inv) =>
          inv.team === teamOrInviteId || inv.team_id === teamOrInviteId || inv.id === teamOrInviteId
      );
      const inviteId = match?.id ?? teamOrInviteId;
      await teamAPI.handleInvite(inviteId, action);
      fetchInvitations();
      if (action === 'accept') {
        fetchUserData();
        fetchDashboardData();
      }
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to process invitation';
      showToast(msg, 'error');
    }
  };

  const handleJoinRequestAction = async (notification, action) => {
    try {
      const teamId = notification.related_id;
      const requestsRes = await teamAPI.getJoinRequests(teamId);
      const requests = requestsRes.data || [];
      // Message format: "{username} has requested to join your team {teamName}."
      const usernameMatch = notification.message?.match(/^(.+?) has requested/);
      const username = usernameMatch?.[1];
      const match = requests.find(
        (r) => r.player_details?.username === username || r.username === username
      );
      if (!match) {
        // Request may have already been handled
        fetchNotifications();
        return;
      }
      if (action === 'accept') {
        await teamAPI.acceptRequest(teamId, match.id);
        fetchUserData();
      } else {
        await teamAPI.rejectRequest(teamId, match.id);
      }
      fetchNotifications();
    } catch (err) {
      console.error('Error handling join request:', err);
    }
  };

  const handleCreateTeam = () => navigate('/player/create-team');

  const syncTeams = async () => {
    try {
      const teamRes = await teamAPI.getTeams({ mine: true });
      setTeams(teamRes.data.results || teamRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Search handler with debounce
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      let results = [];

      if (searchTab === 'players') {
        const res = await authAPI.searchPlayerUsernames(query);
        results = res.data.results || res.data || [];
      } else if (searchTab === 'teams') {
        const res = await teamAPI.getTeams({ search: query });
        results = res.data.results || res.data || [];
      } else if (searchTab === 'hosts') {
        const res = await authAPI.searchHosts(query);
        results = res.data.results || res.data || [];
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── derived data ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="dashboard-shell items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple" />
      </div>
    );
  }

  const profile = user?.profile || {};
  const teamsArray = Array.isArray(teams) ? teams : teams?.results || [];
  const activeTeams = teamsArray;
  const isInTeam = activeTeams.length > 0 || !!profile.current_team;

  // Right panel team members
  const rightPanelMembers = activeTeams.length > 0 ? activeTeams[0].members || [] : [];

  // ── sidebar props ─────────────────────────────────────────────────────────

  const sidebarProps = {
    activeView,
    setActiveView,
    user,
    onOpenOnboarding: () => setOnboardingOpen(true),
    onOpenSettings: () => setShowEditProfileModal(true),
    onToggleNotif: () => setNotifOpen((v) => !v),
    onOpenSearch: () => setSearchOpen(true),
    unreadCount,
    onLogout: handleLogout,
  };

  // ── grid-bg pages ────────────────────────────────────────────────────────
  const gridPages = [
    'credentials',
    'tournaments',
    'scrims',
    'analytics',
    'team',
    'management',
    'upcoming',
  ];
  const showGrid = gridPages.includes(activeView);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      {/* ── MOBILE TOP BAR ─────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur-sm border-b border-border/30 flex items-center px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1 flex justify-center">
          <Link to="/" className="h-10 flex items-center -ml-4 overflow-visible">
            <img
              src={logo}
              alt="ScrimVerse"
              className="h-28 w-auto object-contain pointer-events-none"
            />
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
            >
              <Bell size={18} />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setOnboardingOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
          >
            <Gamepad2 size={18} />
          </button>
        </div>
      </div>

      {/* ── NOTIFICATION DROPDOWN (shared mobile + desktop) ────────────────── */}
      {notifOpen && (
        <NotifDropdown
          onClose={() => setNotifOpen(false)}
          onViewAll={() => {
            setNotifOpen(false);
            setActiveView('notifications');
          }}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onNotifClick={(n) => {
            setNotifOpen(false);
            if (n._nav === 'credentials') {
              setActiveView('credentials');
            } else if (n._nav === 'slots') {
              setSlotFocusTournamentId(n.related_id || null);
              setActiveView('slot-list');
            } else if (n._nav === 'points-table') {
              setActiveView('points-table');
            } else if (n._nav === 'tournaments') {
              setActiveView('tournaments');
            } else if (n._nav === 'team-requests') {
              setActiveView('team');
              setOpenTeamRequestsTick((t) => t + 1);
            } else {
              setConversionNotif(n);
              setActiveView('team');
            }
          }}
          captainTeamIds={teams.filter((t) => t.captain === user?.user?.id).map((t) => t.id)}
          onInviteAction={(inviteId, action) => {
            handleInviteAction(inviteId, action);
            setNotifOpen(false);
          }}
          onJoinRequestAction={(notif, action) => {
            handleJoinRequestAction(notif, action);
            setNotifOpen(false);
          }}
        />
      )}

      {/* ── MOBILE SIDEBAR OVERLAY ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* sidebar panel */}
          <div className="relative w-60 bg-[hsl(0_0%_5%)] border-r border-border/50 flex flex-col h-full z-10">
            <SidebarContent {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── MAIN SHELL ─────────────────────────────────────────────────────── */}
      <div className="dashboard-shell">
        {/* ── DESKTOP LEFT SIDEBAR ─────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 bg-[hsl(0_0%_5%)] border-r border-border/50 h-full">
          <SidebarContent {...sidebarProps} onClose={null} />
        </aside>

        {/* ── CENTER CONTENT ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* desktop top action bar */}
          <div className="hidden md:flex items-center justify-between gap-2 border-b border-border/20 bg-background/80 backdrop-blur-sm px-6 py-3.5 shrink-0 relative z-50">
            <span className="text-base font-semibold text-foreground capitalize">
              {NAV_ITEMS.find((n) => n.id === activeView)?.label || 'Overview'}
            </span>
            <div className="flex items-center gap-2">
              {/* Onboarding button with new user indicator */}
              <div className="relative">
                <button
                  onClick={() => {
                    setOnboardingOpen(true);
                    setHasSeenOnboardingIndicator(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-border/40 transition-all"
                >
                  <Gamepad2 size={16} />
                  Onboarding
                </button>
                <NewUserIndicator
                  isNew={isUserNew() && !hasSeenOnboardingIndicator}
                  onDismiss={() => setHasSeenOnboardingIndicator(true)}
                />
              </div>

              {/* Bell with notification dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-border/40 transition-all"
                >
                  <Bell size={16} />
                </button>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none pointer-events-none">
                    {unreadCount}
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40 transition-all"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>

          {/* scrollable content area */}
          <div className="flex-1 overflow-y-auto pt-14 md:pt-0">
            <div className={`p-4 md:p-6 lg:p-8 relative${showGrid ? ' grid-bg' : ''}`}>
              {activeView === 'overview' ? (
                <PlayerOverviewView />
              ) : activeView === 'credentials' ? (
                <PlayerCredentialsView />
              ) : activeView === 'slot-list' ? (
                <PlayerSlotListView focusTournamentId={slotFocusTournamentId} />
              ) : activeView === 'points-table' ? (
                <PlayerPointsTableView />
              ) : activeView === 'tournaments' ? (
                <PlayerTournamentsView />
              ) : activeView === 'scrims' ? (
                <PlayerScrimsView />
              ) : activeView === 'analytics' ? (
                <PlayerAnalyticsView />
              ) : activeView === 'team' ? (
                <PlayerTeamView
                  conversionNotif={conversionNotif}
                  onConversionDone={() => {
                    fetchNotifications();
                    setConversionNotif(null);
                  }}
                  openRequests={openTeamRequestsTick}
                />
              ) : activeView === 'leaderboards' ? (
                <PlayerLeaderboardsView />
              ) : activeView === 'transaction-history' ? (
                <PlayerTransactionHistoryView />
              ) : activeView === 'notifications' ? (
                <NotificationsPage
                  onUnreadChange={(count) => setUnreadCount(count)}
                  onOpenAlerts={() => {
                    setSettingsInitialTab('alerts');
                    setShowEditProfileModal(true);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p className="text-sm">{activeView} — coming soon</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (xl only) ─────────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col w-60 lg:w-64 shrink-0 bg-[hsl(0_0%_6%)] border-l border-border/50 h-full">
          {/* Search button */}
          <div className="px-4 pt-4 pb-3 border-b border-border/40">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 h-9 rounded-lg border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:border-border/60 transition-all bg-secondary/10"
            >
              <Search size={13} />
              Search players, teams...
            </button>
          </div>

          {/* Team Members */}
          <div className="flex-1 overflow-y-auto px-4 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Team Members
            </p>
            {rightPanelMembers.length > 0 ? (
              <div className="space-y-2">
                {rightPanelMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                      {member.user?.profile_picture ? (
                        <img
                          src={member.user.profile_picture}
                          alt={member.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        (member.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs text-foreground truncate">{member.username}</span>
                    {member.is_captain && (
                      <span className="ml-auto text-[9px] text-amber-400 font-semibold shrink-0">
                        CAP
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* placeholder rows when no team */}
                {['Player One', 'Player Two', 'Player Three'].map((name) => (
                  <div key={name} className="flex items-center gap-3 py-1.5 opacity-30">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {name.charAt(0)}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{name}</span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground mt-2">
                  No team yet. Create or join one!
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {onboardingOpen && <OnboardingModal onClose={() => setOnboardingOpen(false)} />}

      {manageTeamId && (
        <TeamManagementModal
          teamId={manageTeamId}
          onClose={() => setManageTeamId(null)}
          onUpdate={syncTeams}
        />
      )}

      <EditPlayerProfileModal
        isOpen={showEditProfileModal}
        onClose={() => {
          setShowEditProfileModal(false);
          setSettingsInitialTab('profile');
        }}
        player={{ ...user?.user, player_profile: user?.profile }}
        requirePhone={!user?.user?.phone_number}
        initialTab={settingsInitialTab}
        onSuccess={async () => {
          await fetchUserData();
          setShowEditProfileModal(false);
          setSettingsInitialTab('profile');
          const redirectNext = location.state?.next;
          if (redirectNext) {
            window.history.replaceState({}, document.title);
            navigate(redirectNext);
          }
        }}
        onViewAllTransactions={() => {
          setShowEditProfileModal(false);
          setActiveView('transaction-history');
        }}
      />

      {/* Search Dialog - Exact Lovable DashboardLayout Design */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
              setSearchResults([]);
              setSearchTab('players');
            }}
          />

          {/* Dialog card */}
          <div className="relative w-full max-w-lg bg-card border border-border/50 rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-border/30 flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-bold">Search ScrimVerse</h3>
                <p className="text-[11px] text-muted-foreground">Find players, teams, and hosts</p>
              </div>
            </div>

            {/* Tabs row */}
            <div className="flex border-b border-border/30">
              {[
                { key: 'players', label: 'Players', icon: Gamepad2 },
                { key: 'teams', label: 'Teams', icon: Users },
                { key: 'hosts', label: 'Hosts', icon: Shield },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setSearchTab(key);
                    setSearchResults([]);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 h-9 text-xs font-medium transition-all ${
                    searchTab === key
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 h-10 bg-secondary/30 border border-border/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-purple/50 transition-all text-sm"
                />
              </div>
            </div>

            {/* Results area - scrollable */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 mt-0">
              {searchLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple" />
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-1.5">
                  {searchResults.map((result, idx) => {
                    const displayName = result.username || result.name || result.email || 'Unknown';
                    const displaySubtitle =
                      (searchTab === 'teams' ? `${result.members?.length || 0} members` : null) ||
                      (searchTab === 'hosts' ? result.game_titles?.join(', ') || 'Host' : null) ||
                      (result.player_profile?.in_game_name
                        ? `IGN: ${result.player_profile.in_game_name}`
                        : null) ||
                      'Player';

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/20 hover:border-foreground/10 transition-colors gap-2 cursor-pointer"
                        onClick={() => {
                          if (searchTab === 'players') navigate(`/player/profile/${result.id}`);
                          else if (searchTab === 'teams') navigate(`/team/${result.id}`);
                          else if (searchTab === 'hosts') navigate(`/host/profile/${result.id}`);
                          setSearchOpen(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar or Icon */}
                          {searchTab === 'players' ? (
                            <div className="w-10 h-10 rounded-full bg-secondary border border-border/30 flex items-center justify-center text-foreground text-xs font-bold shrink-0 overflow-hidden">
                              {result.profile_picture ? (
                                <img
                                  src={result.profile_picture}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                displayName.charAt(0).toUpperCase()
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-purple/15 flex items-center justify-center shrink-0">
                              {searchTab === 'teams' ? (
                                <Users className="h-5 w-5 text-purple" />
                              ) : (
                                <Shield className="h-5 w-5 text-purple" />
                              )}
                            </div>
                          )}

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">{displayName}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {displaySubtitle}
                            </p>
                          </div>
                        </div>

                        {/* View Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (searchTab === 'players') navigate(`/player/profile/${result.id}`);
                            else if (searchTab === 'teams') navigate(`/team/${result.id}`);
                            else if (searchTab === 'hosts') navigate(`/host/profile/${result.id}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="text-[10px] h-7 px-2 border border-border/40 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors shrink-0"
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && !searchQuery.trim() && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Start typing to search...</p>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && searchQuery.trim() && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No {searchTab} found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerDashboard;
