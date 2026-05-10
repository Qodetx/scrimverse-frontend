import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Gamepad2,
  LogOut,
  Home,
  Trophy,
  Users,
  BarChart3,
  Key,
  Swords,
  TrendingUp,
  ListOrdered,
  Table2,
  DollarSign,
  Settings,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';
import logo from '../assets/scrimverse-logo-bgTransparant.png';

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
  { id: 'transaction-history', label: 'Transactions', icon: DollarSign },
];

// ── Authenticated top bar (landing page / public pages when logged in) ────────
const AuthNavbar = () => {
  const navigate = useNavigate();
  const { logout, isHost, user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dashboardPath = isHost() ? '/host/dashboard' : '/player/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-40 h-14 bg-background/95 backdrop-blur-lg border-b border-border/30 flex items-center px-4">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="h-12 flex items-center -ml-12 overflow-visible md:mr-8">
          <img
            src={logo}
            alt="ScrimVerse"
            className="h-44 w-auto object-contain transition-transform hover:scale-105 pointer-events-none"
          />
        </Link>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Link
            to="/about"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            About Us
          </Link>

          <Link
            to={dashboardPath}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-border/40 transition-all"
          >
            <Gamepad2 size={16} />
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Mobile right */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => navigate(dashboardPath)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
          >
            <Gamepad2 size={18} />
          </button>
        </div>
      </nav>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-60 bg-[hsl(0_0%_5%)] border-r border-border/50 flex flex-col h-full z-10">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                to="/"
                className="flex items-center -ml-4"
                onClick={() => setSidebarOpen(false)}
              >
                <img src={logo} alt="ScrimVerse" className="h-20 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all text-left border border-transparent"
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate(dashboardPath);
                  }}
                >
                  <Icon size={16} className="text-muted-foreground" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="border-t border-border/30 px-3 pt-3 pb-3 flex items-center justify-around gap-1">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  navigate(dashboardPath);
                }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                title="Dashboard"
              >
                <Gamepad2 size={17} />
              </button>
              <button
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                title="Settings"
              >
                <Settings size={17} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Sign Out"
              >
                <LogOut size={17} />
              </button>
            </div>

            <div className="mx-3 mb-3 flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                {user?.profile?.profile_picture ? (
                  <img
                    src={user.profile.profile_picture}
                    alt="avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (user?.user?.username || user?.username || 'U').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.user?.username || user?.username || 'Player'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.user?.email || user?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Public top bar (unauthenticated) ─────────────────────────────────────────
// Note: Tournaments / Scrims / Leaderboard / Search nav links were removed from
// this navbar as part of the guest-mode refactor. Guests now access those
// pages via the dashboard sidebar (Explore ScrimVerse → /player/dashboard).
// The routes themselves remain accessible at their direct URLs.
const PublicNavbar = () => {
  const isHostPortal = window.location.hostname.startsWith('host.');
  const enterArenaPath = isHostPortal ? '/host/login' : '/player-auth';
  const explorePath = isHostPortal ? '/host/login' : '/player/dashboard';

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="flex items-center h-16">
          {/* Logo — left */}
          <div className="flex-none">
            <Link to="/" className="h-12 flex items-center -ml-16 overflow-visible">
              <img
                src={logo}
                alt="ScrimVerse"
                className="h-48 w-auto object-contain pointer-events-none"
              />
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex flex-none items-center gap-2 sm:gap-3 ml-auto">
            {/* Login — desktop only */}
            <Link
              to={enterArenaPath}
              className="hidden md:inline-flex px-5 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white border-0 shadow-lg shadow-purple/30 transition-all items-center"
            >
              Login
            </Link>
            {/* Enter The Arena — visible on all screen sizes */}
            <Link to={explorePath}>
              <button className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-full bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white border-0 transition-all inline-flex items-center whitespace-nowrap">
                Enter The Arena
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
const Navbar = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated() ? <AuthNavbar /> : <PublicNavbar />;
};

export default Navbar;
