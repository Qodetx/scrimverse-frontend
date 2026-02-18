import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import EditPlayerProfileModal from './EditPlayerProfileModal';
import EditHostProfileModal from './EditHostProfileModal';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, isHost, logout, user, fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isMobileMenuOpen]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${baseUrl}${path}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Tournaments', path: '/tournaments' },
    { title: 'Scrims', path: '/scrims' },
    { title: 'Leaderboard', path: '/leaderboard' },
    { title: 'Search', path: '/search' },
  ];

  const handleMyTeams = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/player/dashboard', { state: { scrollTo: 'team-section' } });
  };

  const handleEditProfile = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setShowEditProfileModal(true);
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className={`navbar-wrapper ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
            ScrimVerse
          </Link>

          {/* Desktop Links */}
          <div className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.title}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            {/* Mobile User Avatar Trigger */}
            {isAuthenticated() && (
              <div
                className="mobile-avatar-trigger mobile-only"
                onClick={() => navigate(isHost() ? '/host/dashboard' : '/player/dashboard')}
              >
                <div className="nav-avatar w-8 h-8 overflow-hidden border border-white/10">
                  {user?.user?.profile_picture ? (
                    <img
                      src={getImageUrl(user.user.profile_picture)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.user?.username?.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'hidden' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <div className="hamburger">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>

            {!isAuthenticated() ? (
              <div className="relative desktop-only">
                <button className="btn-signin" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  Sign In
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    style={{ marginLeft: '6px' }}
                  >
                    <path d="m19 9-7 7-7-7" />
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-4 w-48 glass-card p-2 z-50 shadow-2xl">
                    <Link
                      to="/player/login"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Player Login
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative desktop-only" ref={userMenuRef}>
                <div
                  className="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="nav-avatar overflow-hidden">
                    {user?.user?.profile_picture ? (
                      <img
                        src={getImageUrl(user.user.profile_picture)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.user?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-bold text-white hidden lg:block">
                    {user?.user?.username}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-500"
                  >
                    <path d="m19 9-7 7-7-7" />
                  </svg>
                </div>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-4 w-56 glass-card p-2 z-50 shadow-2xl">
                    <div className="p-3 border-b border-white/5 mb-2">
                      <p className="text-white font-bold text-sm">{user?.user?.username}</p>
                      <p className="text-gray-500 text-xs">{user?.user?.email}</p>
                    </div>

                    {/* Player-specific menu */}
                    {!isHost() && (
                      <>
                        <Link
                          to="/player/dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Profile
                        </Link>
                        <button
                          onClick={handleMyTeams}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                          My Teams
                        </button>
                        <button
                          onClick={handleEditProfile}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                          Edit Profile
                        </button>
                        <Link
                          to="/help"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Help
                        </Link>
                      </>
                    )}

                    {/* Host-specific menu */}
                    {isHost() && (
                      <>
                        <Link
                          to="/host/dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/host/create-tournament"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Create Tournament
                        </Link>
                        <Link
                          to="/host/create-scrim"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Create Scrim
                        </Link>
                        <button
                          onClick={handleEditProfile}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                          Edit Profile
                        </button>
                        <Link
                          to="/help"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Help
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-all mt-1"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
          {/* Close Button */}
          <button
            className="mobile-nav-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="mobile-menu-content">
            {/* Explore Group */}
            <div className="mobile-menu-section">
              <h4 className="menu-group-title">EXPLORE</h4>
              <div className="menu-links-list">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="menu-section-divider"></div>

            {/* Account Group */}
            <div className="mobile-menu-section">
              <h4 className="menu-group-title">ACCOUNT</h4>
              <div className="menu-links-list">
                {!isAuthenticated() ? (
                  <>
                    <Link
                      to="/player/login"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Player Login
                    </Link>
                  </>
                ) : (
                  <>
                    {!isHost() ? (
                      <>
                        <Link
                          to="/player/dashboard"
                          className="mobile-nav-link"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          My Profile
                        </Link>
                        <button onClick={handleMyTeams} className="mobile-nav-link text-left">
                          My Teams
                        </button>
                        <button onClick={handleEditProfile} className="mobile-nav-link text-left">
                          Edit Profile
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/host/dashboard"
                          className="mobile-nav-link"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/host/create-tournament"
                          className="mobile-nav-link"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Create Tournament
                        </Link>
                        <Link
                          to="/host/create-scrim"
                          className="mobile-nav-link"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Create Scrim
                        </Link>
                        <button onClick={handleEditProfile} className="mobile-nav-link text-left">
                          Edit Profile
                        </button>
                      </>
                    )}
                    <Link
                      to="/help"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Help
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="mobile-nav-link text-red-500 text-left"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {!isHost() && isAuthenticated() && (
        <EditPlayerProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          player={user?.user}
          onSuccess={async () => {
            await fetchUserData();
            setShowEditProfileModal(false);
          }}
        />
      )}
      {isHost() && isAuthenticated() && (
        <EditHostProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          host={user?.profile}
          onSuccess={async () => {
            await fetchUserData();
            setShowEditProfileModal(false);
          }}
        />
      )}
    </>
  );
};

export default Navbar;
