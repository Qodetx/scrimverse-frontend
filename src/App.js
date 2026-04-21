import { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PlayerAuth from './features/auth/routes/PlayerAuth';
import HostLogin from './features/auth/routes/HostLogin';
import HostRegister from './features/auth/routes/HostRegister';
import VerifyEmail from './features/auth/routes/VerifyEmail';
import TournamentsPage from './features/tournaments/routes/TournamentsPage';
import ScrimsPage from './features/scrims/routes/ScrimsPage';
import TournamentDetail from './features/tournaments/routes/TournamentDetail';
import ManageTournament from './features/tournaments/routes/ManageTournament';
import ScrimDetail from './features/scrims/routes/ScrimDetail';
import HostDashboard from './features/hosts/routes/HostDashboard';
import PlayerDashboard from './features/players/routes/PlayerDashboard';
import PlayerProfile from './features/players/routes/PlayerProfile';
import CreateTeam from './features/teams/routes/CreateTeam';
import CreateTournament from './features/tournaments/routes/CreateTournament';
import CreateScrim from './features/scrims/routes/CreateScrim';
import HostProfile from './features/hosts/routes/HostProfile';
import TournamentStats from './features/tournaments/routes/TournamentStats';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import PlayerSearchPage from './features/players/routes/PlayerSearchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import JoinTeam from './features/teams/routes/JoinTeam';
import SearchPage from './pages/SearchPage';
import TeamDashboard from './features/teams/routes/TeamDashboard';
import TeamProfile from './features/teams/routes/TeamProfile';
import TeamsBrowsePage from './features/teams/routes/TeamsBrowsePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import ReportIssuePage from './pages/ReportIssuePage';
import ForgotPassword from './features/auth/routes/ForgotPassword';
import ResetPassword from './features/auth/routes/ResetPassword';
import CheckEmail from './features/auth/routes/CheckEmail';
import HostVerificationPending from './features/auth/routes/HostVerificationPending';
import MyDataPage from './pages/MyDataPage';
import PlayerSetup from './features/auth/routes/PlayerSetup';
import PhoneSetupGuard from './features/auth/ui/PhoneSetupGuard';

// Protects host-only pages: redirects unauthenticated users to host login,
// non-host users to home, and unapproved hosts to verification-pending
const HostOnlyRoute = ({ children }) => {
  const { isAuthenticated, isHost, user } = useContext(AuthContext);

  if (!isAuthenticated()) {
    return <Navigate to="/host/login" replace />;
  }
  if (!isHost()) {
    return <Navigate to="/" replace />;
  }
  if (user?.profile?.verification_status !== 'approved') {
    return <Navigate to="/host/verification-pending" replace />;
  }
  return children;
};

// Inner shell — rendered inside <Router> so useLocation is available
function AppShell() {
  const location = useLocation();
  const isHostPortal = window.location.hostname.startsWith('host.');

  const hideNavbar =
    location.pathname === '/player/dashboard' ||
    location.pathname === '/player/setup' ||
    location.pathname === '/host/dashboard' ||
    location.pathname.startsWith('/player/profile/') ||
    location.pathname.startsWith('/team/') ||
    location.pathname.startsWith('/host/profile/') ||
    location.pathname.startsWith('/tournaments/') ||
    location.pathname.startsWith('/scrims/');

  const isDashboard =
    location.pathname === '/player/dashboard' || location.pathname === '/host/dashboard';

  // Remove purple gradient bleed on pages with custom headers
  useEffect(() => {
    if (hideNavbar) {
      document.documentElement.classList.add('no-body-gradient');
    } else {
      document.documentElement.classList.remove('no-body-gradient');
    }
    return () => document.documentElement.classList.remove('no-body-gradient');
  }, [hideNavbar]);

  return (
    <div
      className={
        isDashboard
          ? 'h-screen overflow-hidden bg-background'
          : hideNavbar
            ? 'min-h-screen bg-background'
            : 'min-h-screen bg-transparent'
      }
    >
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/report-issue" element={<ReportIssuePage />} />
        <Route path="/player-search" element={<PlayerSearchPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/my-data/:token" element={<MyDataPage />} />
        <Route path="/notifications" element={<Navigate to="/player/dashboard" replace />} />

        {/* Authentication Routes */}
        <Route path="/player-auth" element={<PlayerAuth />} />
        <Route path="/player/login" element={<PlayerAuth />} />
        <Route path="/player/register" element={<PlayerAuth />} />
        <Route path="/host/login" element={<HostLogin />} />
        <Route path="/host/register" element={<HostRegister />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        {/* Support legacy/malformed links that include the API prefix */}
        <Route path="/api/accounts/verify-email/:token" element={<VerifyEmail />} />

        {/* Tournaments & Scrims */}
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/:id/manage" element={<ManageTournament />} />
        <Route path="/tournaments/:id/stats" element={<TournamentStats />} />
        <Route path="/scrims" element={<ScrimsPage />} />
        <Route path="/scrims/:id" element={<ScrimDetail />} />

        {/* Password reset & email check */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/check-email" element={<CheckEmail />} />

        {/* Host Routes */}
        <Route
          path="/host/dashboard"
          element={
            <HostOnlyRoute>
              <HostDashboard />
            </HostOnlyRoute>
          }
        />
        <Route
          path="/host/create-tournament"
          element={
            <HostOnlyRoute>
              <CreateTournament />
            </HostOnlyRoute>
          }
        />
        <Route
          path="/host/create-scrim"
          element={
            <HostOnlyRoute>
              <CreateScrim />
            </HostOnlyRoute>
          }
        />
        <Route path="/host/profile/:id" element={<HostProfile />} />
        <Route path="/host/verification-pending" element={<HostVerificationPending />} />

        {/* Phone setup — must be outside PhoneSetupGuard so the redirect target is reachable */}
        <Route path="/player/setup" element={<PlayerSetup />} />

        {/* Player Routes — guarded: redirects to /player/setup if phone not verified */}
        <Route
          path="/player/dashboard"
          element={
            <PhoneSetupGuard>
              <PlayerDashboard />
            </PhoneSetupGuard>
          }
        />
        <Route
          path="/player/create-team"
          element={
            <PhoneSetupGuard>
              <CreateTeam />
            </PhoneSetupGuard>
          }
        />
        <Route
          path="/player/team/dashboard"
          element={
            <PhoneSetupGuard>
              <TeamDashboard />
            </PhoneSetupGuard>
          }
        />
        <Route
          path="/player/team/dashboard/:teamId"
          element={
            <PhoneSetupGuard>
              <TeamDashboard />
            </PhoneSetupGuard>
          }
        />
        <Route path="/player/profile/:id" element={<PlayerProfile />} />
        <Route path="/teams" element={<TeamsBrowsePage />} />
        <Route path="/team/:id" element={<TeamProfile />} />
        <Route path="/join-team/:token" element={<JoinTeam />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

export default App;
