import React, { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  Trophy,
  Calendar,
  BarChart3,
  Table2,
  ListOrdered,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
  Gamepad2,
  Shield,
  Swords,
  Users,
  Clock,
  Check,
  Receipt,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { tournamentAPI, notificationAPI, authAPI, teamAPI } from '../../../utils/api';
import EditHostProfileModal from '../ui/EditHostProfileModal';
import { useIsMobile } from '../../../hooks/use-mobile';
import HostOverviewView from '../ui/HostOverviewView';
import HostAnalyticsView from '../ui/HostAnalyticsView';
import HostTournamentsView from '../ui/HostTournamentsView';
import HostUpcomingView from '../ui/HostUpcomingView';
import HostLeaderboardsView from '../ui/HostLeaderboardsView';
import HostTransactionHistoryView from '../ui/HostTransactionHistoryView';
import HostPointsTableView from '../ui/HostPointsTableView';
import HostSlotListView from '../ui/HostSlotListView';
import ManageTournament from '../../tournaments/routes/ManageTournament';
import ManageScrim from '../../scrims/routes/ManageScrim';
import NotificationsPage from '../../../pages/NotificationsPage';
import logo from '../../../assets/scrimverse-logo-bgTransparant.png';
import './HostDashboard.css';

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'leaderboards', label: 'Leaderboards', icon: BarChart3 },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'points-table', label: 'Points Table', icon: Table2 },
  { id: 'slot-list', label: 'Slot List', icon: ListOrdered },
];

const ONBOARDING_STEPS = [
  {
    icon: Shield,
    title: 'Welcome, Host',
    desc: "You're set up as a tournament organizer on ScrimVerse. Here's a quick overview of your tools.",
  },
  {
    icon: Trophy,
    title: 'Create Tournaments',
    desc: 'Configure custom events with your rules, prize pools, entry fees, and formats across all supported titles.',
  },
  {
    icon: Swords,
    title: 'Manage Scrims',
    desc: 'Organize practice lobbies, set credentials, and manage team registrations for competitive practice sessions.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    desc: 'Monitor registrations, revenue, player engagement, and match stats with full visibility.',
  },
  {
    icon: Calendar,
    title: 'Bulk Scheduling',
    desc: 'Schedule matches across groups and rounds simultaneously. Streamline your tournament operations.',
  },
  {
    icon: Table2,
    title: 'Points and Slots',
    desc: 'Manage placement and kill point tables. Assign slots, publish credentials, and control every match detail.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    // Host-specific
    case 'new_registration':
      return <Users className="h-3.5 w-3.5 text-green-400" />;
    case 'slots_full':
      return <Trophy className="h-3.5 w-3.5 text-yellow-400" />;
    case 'verification_approved':
      return <Shield className="h-3.5 w-3.5 text-green-400" />;
    case 'verification_rejected':
      return <Shield className="h-3.5 w-3.5 text-red-400" />;
    case 'tournament_start_reminder':
      return <Clock className="h-3.5 w-3.5 text-orange-400" />;
    case 'payment_received':
      return <Receipt className="h-3.5 w-3.5 text-green-400" />;
    // Shared / player types
    case 'match_start':
      return <Clock className="h-3.5 w-3.5 text-red-400" />;
    case 'team_invite':
    case 'teammate_joined':
    case 'registration_confirmed':
      return <Users className="h-3.5 w-3.5 text-green-400" />;
    case 'tournament_update':
    case 'results':
      return <Trophy className="h-3.5 w-3.5 text-yellow-500" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
  }
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'registration':
      return <Users className="h-3 w-3 text-green-400" />;
    case 'match':
      return <Trophy className="h-3 w-3 text-yellow-400" />;
    case 'update':
      return <Bell className="h-3 w-3 text-blue-400" />;
    case 'scrim':
      return <Swords className="h-3 w-3 text-purple-400" />;
    case 'tournament_started':
      return <Swords className="h-3 w-3 text-orange-400" />;
    case 'tournament_completed':
      return <Trophy className="h-3 w-3 text-yellow-400" />;
    case 'rating_received':
      return <Bell className="h-3 w-3 text-blue-400" />;
    default:
      return <Bell className="h-3 w-3 text-muted-foreground" />;
  }
};

// ─── Verified badge (Instagram-style 12-point burst with checkmark) ──────────
const VerifiedBadge = () => (
  <svg
    className="hd-verified-badge"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path
      d="M12 1l2.39 3.42L18 3.27l.73 3.73 3.73.73-1.15 3.61L24 14l-3.42 2.39.88 3.84-3.84.88L15.61 24 12 22.15 8.39 24l-2.03-2.89-3.84-.88.88-3.84L0 14l2.69-2.66L1.54 7.73l3.73-.73L6 3.27l3.61 1.15L12 1z"
      fill="#0095F6"
    />
    <path
      d="M8.5 12.5l2.5 2.5 5-5"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Notification click navigation helper ────────────────────────────────────
const getNotifAction = (n) => {
  const type = n.notification_type || n.type;
  if (
    type === 'new_registration' ||
    type === 'slots_full' ||
    type === 'tournament_start_reminder'
  ) {
    return { tab: 'tournaments' };
  }
  if (type === 'verification_approved' || type === 'verification_rejected') {
    return { openSettings: true };
  }
  if (type === 'payment_received') {
    return { tab: 'transactions' };
  }
  return null;
};

// ─── Notification Dropdown ────────────────────────────────────────────────────
const NotifDropdown = ({
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNotifAction,
  onViewAll,
  anchorRef,
}) => {
  const ref = useRef(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Compute position from anchor (bell button) rect
  const getStyle = () => {
    if (!anchorRef?.current) return { top: 60, right: 16 };
    const rect = anchorRef.current.getBoundingClientRect();
    return { top: rect.bottom + 8, right: window.innerWidth - rect.right };
  };
  const pos = getStyle();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed w-80 bg-[hsl(0_0%_8%)] border border-border/60 rounded-xl shadow-2xl z-[99999] overflow-hidden pointer-events-auto"
      style={{ top: pos.top, right: pos.right }}
    >
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
            <Check size={10} /> Mark all read
          </button>
        )}
      </div>
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
            return (
              <div
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!n.is_read) onMarkRead(n.id);
                  const action = getNotifAction(n);
                  if (action) {
                    onNotifAction(action);
                    onClose();
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
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="px-3 py-2.5 border-t border-border/30 bg-secondary/10">
        <button
          onClick={() => {
            onClose();
            onViewAll && onViewAll();
          }}
          className="w-full py-2 text-xs font-semibold text-purple-400 hover:text-purple-300 rounded-lg hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/35 transition-all"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
};

// ─── Onboarding Modal ─────────────────────────────────────────────────────────
const OnboardingModal = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[hsl(0_0%_7%)] border border-border/60 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground font-medium mb-4">
          Step {step + 1} of {total}
        </p>
        <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mb-4">
          <Icon size={26} className="text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.desc}</p>
        <div className="flex items-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${i === step ? 'w-6 h-2 bg-purple-500' : 'w-2 h-2 bg-secondary'}`}
            />
          ))}
        </div>
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

// ─── Sidebar content ──────────────────────────────────────────────────────────
const SidebarContent = ({
  activeView,
  setActiveView,
  user,
  onOpenOnboarding,
  onOpenSettings,
  onToggleNotif,
  onClose,
  unreadCount,
}) => {
  const username = user?.user?.username || 'Host';
  const email = user?.user?.email || '';
  const isVerified = user?.profile?.verified;
  const profilePicture = user?.user?.profile_picture;
  const avatarInitials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Logo + close */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/" className="h-10 flex items-center -ml-8 overflow-visible">
          <img
            src={logo}
            alt="ScrimVerse"
            className="h-32 w-auto object-contain transition-transform hover:scale-105 pointer-events-none"
          />
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

      {/* Search — mobile only */}
      {onClose && (
        <div className="px-3 pb-3">
          <div className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-secondary/20 border border-border/30 text-sm text-muted-foreground">
            <Search size={14} className="shrink-0" />
            <span>Search ScrimVerse…</span>
          </div>
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
              className={activeView === id ? 'text-purple-400' : 'text-muted-foreground'}
            />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom action row */}
      <div className="border-t border-border/30 px-3 pt-3 pb-3 flex items-center gap-2">
        <button
          onClick={() => {
            onOpenOnboarding();
            if (onClose) onClose();
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent transition-all flex-1"
          title="Onboarding"
        >
          <Gamepad2 size={15} />
          <span>Onboarding</span>
        </button>

        <div className="relative">
          <button
            onClick={onToggleNotif}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent transition-all"
            title="Notifications"
          >
            <Bell size={15} />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
              {unreadCount}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            onOpenSettings();
            if (onClose) onClose();
          }}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent transition-all"
          title="Settings"
        >
          <Settings size={15} />
        </button>
      </div>

      {/* User card */}
      <button
        onClick={() => {
          onOpenSettings();
          if (onClose) onClose();
        }}
        className="mx-3 mb-3 flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/40 transition-all text-left"
      >
        <div className="hd-user-avatar shrink-0">
          {profilePicture ? (
            <img src={profilePicture} alt="avatar" className="hd-user-avatar-img" />
          ) : (
            avatarInitials
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
            {username}
            {isVerified && <VerifiedBadge />}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{email}</p>
        </div>
      </button>
    </div>
  );
};

// ─── HostDashboard ────────────────────────────────────────────────────────────
const HostDashboard = () => {
  const { user, logout, fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(() => {
    const tab = searchParams.get('tab');
    const validTabs = NAV_ITEMS.map((n) => n.id);
    return validTabs.includes(tab) ? tab : 'overview';
  });
  const [managingTournamentId, setManagingTournamentId] = useState(null);
  const [managingType, setManagingType] = useState('tournament');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState('players');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dashboard-active');
    return () => document.documentElement.classList.remove('dashboard-active');
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await tournamentAPI.getHostStats();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching host dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getNotifications({ limit: 6, offset: 0 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      /* fail silently */
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      /* fail silently */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      /* fail silently */
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const recentActivity = data?.recent_activity || [];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="hd-loading">
          <div className="hd-spinner" />
        </div>
      );
    }
    // Inline tournament/scrim manage view — stays inside the dashboard shell
    if (managingTournamentId) {
      if (managingType === 'scrim') {
        return (
          <ManageScrim
            inlineId={managingTournamentId}
            onBack={() => setManagingTournamentId(null)}
          />
        );
      }
      return (
        <ManageTournament
          inlineId={managingTournamentId}
          onBack={() => setManagingTournamentId(null)}
          onStarted={() => {
            setManagingTournamentId(null);
            setActiveView('tournaments');
          }}
        />
      );
    }
    switch (activeView) {
      case 'overview':
        return <HostOverviewView />;
      case 'analytics':
        return <HostAnalyticsView />;
      case 'tournaments':
        return (
          <HostTournamentsView
            onManage={(id, type) => {
              setManagingTournamentId(id);
              setManagingType(type);
            }}
          />
        );
      case 'upcoming':
        return (
          <HostUpcomingView
            onManage={(id, type) => {
              setManagingTournamentId(id);
              setManagingType(type);
            }}
          />
        );
      case 'leaderboards':
        return <HostLeaderboardsView />;
      case 'transactions':
        return <HostTransactionHistoryView />;
      case 'points-table':
        return <HostPointsTableView />;
      case 'slot-list':
        return <HostSlotListView />;
      case 'notifications':
        return <NotificationsPage onUnreadChange={(count) => setUnreadCount(count)} />;
      default:
        return (
          <div className="hd-view-placeholder">
            <p className="text-sm text-muted-foreground">
              {NAV_ITEMS.find((n) => n.id === activeView)?.label} — coming soon
            </p>
          </div>
        );
    }
  };

  const handleSetActiveView = (view) => {
    setManagingTournamentId(null);
    setActiveView(view);
    setSearchParams(view === 'overview' ? {} : { tab: view }, { replace: true });
  };

  const sidebarProps = {
    activeView,
    setActiveView: handleSetActiveView,
    user,
    onOpenOnboarding: () => setOnboardingOpen(true),
    onOpenSettings: () => setShowEditModal(true),
    onToggleNotif: () => setNotifOpen((o) => !o),
    unreadCount,
  };

  return (
    <div className="hd-shell">
      {/* MOBILE HEADER */}
      {isMobile && (
        <div className="hd-mobile-header">
          <button onClick={() => setSidebarOpen(true)} className="hd-mobile-menu-btn">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1">
            <Link to="/" className="h-10 flex items-center -ml-8 overflow-visible">
              <img
                src={logo}
                alt="ScrimVerse"
                className="h-28 w-auto object-contain transition-transform hover:scale-105 pointer-events-none"
              />
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <button className="hd-mobile-menu-btn" onClick={() => setOnboardingOpen(true)}>
              <Gamepad2 size={16} />
            </button>
            <div className="relative">
              <button className="hd-mobile-menu-btn" onClick={() => setNotifOpen((o) => !o)}>
                <Bell size={16} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && sidebarOpen && (
        <div className="hd-mobile-overlay">
          <div className="hd-mobile-overlay-bg" onClick={() => setSidebarOpen(false)} />
          <aside className="hd-sidebar hd-sidebar-mobile">
            <SidebarContent {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* DESKTOP LEFT SIDEBAR */}
      {!isMobile && (
        <aside className="hd-sidebar">
          <SidebarContent {...sidebarProps} onClose={null} />
        </aside>
      )}

      {/* MAIN CONTENT */}
      <main className={`hd-main${isMobile ? ' hd-main-mobile' : ''}`}>
        {/* Top action bar — desktop only */}
        {!isMobile && (
          <div className="hd-topbar">
            <div className="hd-topbar-right">
              <button className="hd-topbar-btn" onClick={() => setOnboardingOpen(true)}>
                <Gamepad2 size={14} /> Onboarding
              </button>
              <div className="relative">
                <button
                  ref={bellRef}
                  className="hd-topbar-icon-btn"
                  title="Notifications"
                  onClick={() => setNotifOpen((o) => !o)}
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen &&
                  createPortal(
                    <NotifDropdown
                      anchorRef={bellRef}
                      onClose={() => setNotifOpen(false)}
                      notifications={notifications}
                      onMarkRead={handleMarkRead}
                      onMarkAllRead={handleMarkAllRead}
                      onNotifAction={(action) => {
                        if (action.tab) handleSetActiveView(action.tab);
                        if (action.openSettings) setShowEditModal(true);
                      }}
                      onViewAll={() => {
                        setNotifOpen(false);
                        handleSetActiveView('notifications');
                      }}
                    />,
                    document.body
                  )}
              </div>
              <button className="hd-topbar-btn" onClick={handleLogout} title="Sign Out">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}

        <div
          className={`hd-content-area${activeView === 'transactions' ? ' hd-tab-transactions' : ''}`}
        >
          {renderContent()}
        </div>
      </main>

      {/* RIGHT PANEL — desktop xl only */}
      {!isMobile && (
        <aside className="hd-right-panel">
          <div className="hd-right-panel-inner">
            {/* Search bar */}
            <div className="mb-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-secondary/10 text-xs text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors"
              >
                <Search size={13} /> Search players, teams...
              </button>
            </div>

            <h3 className="hd-right-panel-title">Recent Activity</h3>
            <div className="hd-activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/20 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-secondary/50 flex items-center justify-center mt-0.5 shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="hd-activity-msg">{activity.message || activity.text}</p>
                      <p className="hd-activity-time">
                        {activity.timestamp ? getTimeAgo(activity.timestamp) : activity.time || ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="hd-activity-empty">No recent activity</p>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ONBOARDING MODAL */}
      {onboardingOpen && <OnboardingModal onClose={() => setOnboardingOpen(false)} />}

      {/* Edit Profile Modal */}
      <EditHostProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        host={user?.profile}
        onSuccess={async () => {
          await fetchUserData();
        }}
      />

      {/* SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
              setSearchResults([]);
              setSearchTab('players');
            }}
          />
          <div className="relative w-full max-w-lg bg-card border border-border/50 rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border/30 flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-bold">Search ScrimVerse</h3>
                <p className="text-[11px] text-muted-foreground">Find players, teams, and hosts</p>
              </div>
            </div>
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
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
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
            <div className="flex-1 overflow-y-auto px-3 pb-3">
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
                    const closeSearch = () => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    };
                    const handleNav = () => {
                      if (searchTab === 'players') navigate(`/player/profile/${result.id}`);
                      else if (searchTab === 'teams') navigate(`/team/${result.id}`);
                      else if (searchTab === 'hosts') navigate(`/host/profile/${result.id}`);
                      closeSearch();
                    };
                    return (
                      <div
                        key={idx}
                        onClick={handleNav}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/20 hover:border-foreground/10 transition-colors gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
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
                          <div className="min-w-0">
                            <span className="text-sm font-semibold truncate block">
                              {displayName}
                            </span>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {displaySubtitle}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNav();
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
    </div>
  );
};

export default HostDashboard;
