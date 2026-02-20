import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PlayerLogin from './pages/PlayerLogin';
import PlayerRegister from './pages/PlayerRegister';
import HostLogin from './pages/HostLogin';
import HostRegister from './pages/HostRegister';
import VerifyEmail from './pages/VerifyEmail';
import TournamentsPage from './pages/TournamentsPage';
import ScrimsPage from './pages/ScrimsPage';
import TournamentDetail from './pages/TournamentDetail';
import ManageTournament from './pages/ManageTournament';
import ScrimDetail from './pages/ScrimDetail';
import HostDashboard from './pages/HostDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerProfile from './pages/PlayerProfile';
import CreateTeam from './pages/CreateTeam';
import CreateTournament from './pages/CreateTournament';
import CreateScrim from './pages/CreateScrim';
import HostProfile from './pages/HostProfile';
import TournamentStats from './pages/TournamentStats';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import PlayerSearchPage from './pages/PlayerSearchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import JoinTeam from './pages/JoinTeam';
import SearchPage from './pages/SearchPage';
import TeamDashboard from './pages/TeamDashboard';
import TeamProfile from './pages/TeamProfile';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import ReportIssuePage from './pages/ReportIssuePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CheckEmail from './pages/CheckEmail';

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
