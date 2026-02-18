import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';

// Public pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ReportIssuePage from './pages/ReportIssuePage';
import PlayerSearchPage from './pages/PlayerSearchPage';
import SearchPage from './pages/SearchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import VerifiedTournaments from './pages/VerifiedTournaments';
import PlayerGuidelines from './pages/PlayerGuidelines';

// Auth
import PlayerLogin from './pages/PlayerLogin';
import PlayerRegister from './pages/PlayerRegister';
import HostLogin from './pages/HostLogin';
import HostRegister from './pages/HostRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import CheckEmail from './pages/CheckEmail';
import HostVerificationPending from './pages/HostVerificationPending';

// Tournaments & Scrims
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetail from './pages/TournamentDetail';
import ManageTournament from './pages/ManageTournament';
import TournamentStats from './pages/TournamentStats';
import InstantRegistration from './pages/InstantRegistration';
import ScrimsPage from './pages/ScrimsPage';
import ScrimDetail from './pages/ScrimDetail';
import ManageScrim from './pages/ManageScrim';

// Host pages
import HostDashboard from './pages/HostDashboard';
import CreateTournament from './pages/CreateTournament';
import CreateScrim from './pages/CreateScrim';
import HostProfile from './pages/HostProfile';

// Player pages
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerProfile from './pages/PlayerProfile';

// Team pages
import CreateTeam from './pages/CreateTeam';
import JoinTeam from './pages/JoinTeam';
import TeamDashboard from './pages/TeamDashboard';
import TeamProfile from './pages/TeamProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-transparent">
          <Navbar />
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/report-issue" element={<ReportIssuePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/player-search" element={<PlayerSearchPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/verified-tournaments" element={<VerifiedTournaments />} />
            <Route path="/guidelines" element={<PlayerGuidelines />} />

            {/* ── Auth ── */}
            <Route path="/player/login" element={<PlayerLogin />} />
            <Route path="/player/register" element={<PlayerRegister />} />
            <Route path="/host/login" element={<HostLogin />} />
            <Route path="/host/register" element={<HostRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/host/verification-pending" element={<HostVerificationPending />} />

            {/* ── Tournaments ── */}
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/tournaments/:id/manage" element={<ManageTournament />} />
            <Route path="/tournaments/:id/stats" element={<TournamentStats />} />
            <Route path="/instant-registration/:id" element={<InstantRegistration />} />

            {/* ── Scrims ── */}
            <Route path="/scrims" element={<ScrimsPage />} />
            <Route path="/scrims/:id" element={<ScrimDetail />} />
            <Route path="/scrims/:id/manage" element={<ManageScrim />} />

            {/* ── Host ── */}
            <Route path="/host/dashboard" element={<HostDashboard />} />
            <Route path="/host/create-tournament" element={<CreateTournament />} />
            <Route path="/host/create-scrim" element={<CreateScrim />} />
            <Route path="/host/profile/:id" element={<HostProfile />} />

            {/* ── Player ── */}
            <Route path="/player/dashboard" element={<PlayerDashboard />} />
            <Route path="/player/profile/:id" element={<PlayerProfile />} />

            {/* ── Teams ── */}
            <Route path="/create-team" element={<CreateTeam />} />
            <Route path="/join-team/:token" element={<JoinTeam />} />
            <Route path="/team/dashboard" element={<TeamDashboard />} />
            <Route path="/team/profile/:id" element={<TeamProfile />} />
            <Route path="/teams/:id" element={<TeamProfile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
