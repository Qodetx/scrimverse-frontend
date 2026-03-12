import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PlayerLogin from './features/auth/routes/PlayerLogin';
import PlayerRegister from './features/auth/routes/PlayerRegister';
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
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import ReportIssuePage from './pages/ReportIssuePage';
import ForgotPassword from './features/auth/routes/ForgotPassword';
import ResetPassword from './features/auth/routes/ResetPassword';
import CheckEmail from './features/auth/routes/CheckEmail';

// Guard: only allows access to host login/register via the secret link
const HostAccessGuard = ({ children }) => {
const { isAuthenticated, isHost } = useContext(AuthContext);
const location = useLocation();
const params = new URLSearchParams(location.search);
const keyFromUrl = params.get('access');
const hostKey = process.env.REACT_APP_HOST_ACCESS_KEY;

// Already logged in as host → go straight to dashboard
if (isAuthenticated() && isHost()) {
return <Navigate to="/host/dashboard" replace />;
}

if (keyFromUrl && keyFromUrl === hostKey) {
sessionStorage.setItem('host_access_granted', 'true');
}

if (sessionStorage.getItem('host_access_granted') !== 'true') {
return <Navigate to="/" replace />;
}

return children;
};

// Protects host-only pages: redirects unauthenticated users to host login,
// and non-host (player) users back to home
const HostOnlyRoute = ({ children }) => {
const { isAuthenticated, isHost } = useContext(AuthContext);
const hostKey = process.env.REACT_APP_HOST_ACCESS_KEY;

if (!isAuthenticated()) {
return <Navigate to={`/host/login?access=${hostKey}`} replace />;
}
if (!isHost()) {
return <Navigate to="/" replace />;
}
return children;
};

function App() {
return (
<AuthProvider>
<Router>
<div className="min-h-screen bg-transparent">
<Navbar />
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

{/* Authentication Routes */}
<Route path="/player/login" element={<PlayerLogin />} />
<Route path="/player/register" element={<PlayerRegister />} />
<Route
path="/host/login"
element={
<HostAccessGuard>
<HostLogin />
</HostAccessGuard>
}
/>
<Route
path="/host/register"
element={
<HostAccessGuard>
<HostRegister />
</HostAccessGuard>
}
/>
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

{/* Player Routes */}
<Route path="/player/dashboard" element={<PlayerDashboard />} />
<Route path="/player/create-team" element={<CreateTeam />} />
<Route path="/player/team/dashboard" element={<TeamDashboard />} />
<Route path="/player/team/dashboard/:teamId" element={<TeamDashboard />} />
<Route path="/player/profile/:id" element={<PlayerProfile />} />
<Route path="/team/:id" element={<TeamProfile />} />
<Route path="/join-team/:token" element={<JoinTeam />} />
</Routes>
</div>
</Router>
</AuthProvider>
);
}

export default App;