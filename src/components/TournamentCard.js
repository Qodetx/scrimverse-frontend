import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PointsTableModal from './PointsTableModal';
import ScrimPointsTableModal from './ScrimPointsTableModal';
import RegistrationModal from './RegistrationModal';
import './TournamentCard.css';

const TournamentCard = ({ tournament, activeTab }) => {
  const { isHost, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegisteredInternal, setIsRegisteredInternal] = useState(tournament.is_registered);

  const isGuest = !isAuthenticated();
  const hostProfileId = user?.profile?.id || user?.host_profile?.id;
  const isTournamentHost = isHost() && Number(hostProfileId) === Number(tournament.host?.id);

  const getBaseLink = () => {
    const mode = (tournament.event_mode || '').toUpperCase();
    return mode === 'SCRIM' ? `/scrims/${tournament.id}` : `/tournaments/${tournament.id}`;
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on a button or an existing link
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(getBaseLink());
  };

  const handleGuestClick = (e) => {
    if (isGuest) {
      e.preventDefault();
      navigate('/player/login');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const TrophyIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const UsersIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const EntryIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );

  const getRegistrationStatus = () => {
    // Check both snake_case and camelCase to be safe
    const start = tournament.registration_start || tournament.registrationStart;
    const end = tournament.registration_end || tournament.registrationEnd;

    if (!start || !end) {
      return 'ended';
    }

    const now = new Date();
    const regStart = new Date(start);
    const regEnd = new Date(end);

    if (isNaN(regStart.getTime()) || isNaN(regEnd.getTime())) {
      return 'ended';
    }

    const isFull =
      Number(tournament.current_participants || 0) >= Number(tournament.max_participants || 0);
    if (isFull) return 'full';

    if (now < regStart) return 'not_started';
    if (now > regEnd) return 'ended';
    return 'open';
  };

  // Determine effective tab if not provided (e.g. on Homepage)
  const effectiveTab =
    activeTab ||
    (tournament.status === 'ongoing'
      ? 'active'
      : tournament.status === 'completed'
        ? 'past'
        : 'upcoming');

  // Check if current user/team is registered
  const isRegistered =
    isRegisteredInternal ||
    tournament.is_registered ||
    (user &&
      user.profile &&
      tournament.participants?.some((p) => {
        // Check if user is the player or part of the team
        const isPlayer = p.player_id === user.profile.id;
        const isTeamMember =
          user.profile.current_team && p.team_id === user.profile.current_team.id;
        return isPlayer || isTeamMember;
      }));

  const renderButtons = () => {
    // 1. Logic for UPCOMING section
    if (effectiveTab === 'upcoming') {
      const userIsHost = isHost && isHost();
      const regStatus = getRegistrationStatus();

      return (
        <div className="card-footer-actions">
          {/* BOTTOM LEFT: Always View Details (Accessible to everyone) */}
          <Link to={getBaseLink()} className="details-link-text">
            View Details <span>→</span>
          </Link>

          {/* BOTTOM RIGHT: Registration Logic (ONLY for Players/Guests) */}
          {!userIsHost && (
            <div className="registration-status-wrapper">
              {isRegistered ? (
                <span className="registration-status-text registration-success">✓ Registered</span>
              ) : (
                <>
                  {regStatus === 'not_started' && (
                    <span className="registration-status-text registration-soon">
                      Registration Starts Soon
                    </span>
                  )}

                  {regStatus === 'open' && (
                    <button
                      className="primary-register-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isGuest) {
                          navigate('/player/login');
                        } else {
                          // Navigate to tournament detail page which contains the new invite-based registration form
                          navigate(getBaseLink());
                        }
                      }}
                    >
                      Register Now
                    </button>
                  )}

                  {regStatus === 'full' && (
                    <span className="registration-status-text registration-ended">Slots Full</span>
                  )}

                  {regStatus === 'ended' && (
                    <span className="registration-status-text registration-ended">
                      Registration Ended
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    // 2. Logic for ACTIVE (Ongoing) section
    if (effectiveTab === 'active') {
      return (
        <div className="card-footer-actions">
          <Link to={getBaseLink()} className="details-link-text">
            View Details <span>→</span>
          </Link>
          {isRegistered && (
            <span className="registration-status-text registration-success text-[10px] font-bold">
              ✓ Registered
            </span>
          )}
        </div>
      );
    }

    // 3. Logic for PAST (Completed) section
    if (effectiveTab === 'past') {
      return (
        <div className="card-footer-actions">
          <Link to={getBaseLink()} className="details-link-text">
            View Details <span>→</span>
          </Link>
          <button
            className="secondary-action-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isGuest) {
                navigate('/player/login');
              } else {
                setShowPointsTable(true);
              }
            }}
          >
            Points Table
          </button>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="card-footer-actions">
        <Link to={getBaseLink()} className="details-link-text">
          View Details <span>→</span>
        </Link>
      </div>
    );
  };

  return (
    <div
      className="tournament-card-modern cursor-pointer hover:scale-[1.02] transition-transform duration-300"
      onClick={handleCardClick}
    >
      <div className="card-banner">
        {tournament.banner_image ? (
          <img src={tournament.banner_image} alt={tournament.title} className="banner-img" />
        ) : (
          <div className="banner-placeholder" />
        )}
        <div className="card-badges">
          <div className="badge-left">
            {/* Status Badges - Top Left */}
            {tournament.status === 'upcoming' && (
              <span className="status-badge upcoming-badge">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                UPCOMING
              </span>
            )}
            {tournament.status === 'ongoing' && (
              <span className="status-badge active-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" />
                </svg>
                LIVE
              </span>
            )}
            {tournament.status === 'completed' && (
              <span className="status-badge completed-badge">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                COMPLETED
              </span>
            )}
          </div>
          <div className="badge-right">
            {/* Plan Type Badges - Top Right */}
            {tournament.plan_type === 'basic' && (
              <span className="status-badge basic-badge">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                BASIC
              </span>
            )}
            {tournament.plan_type === 'featured' && (
              <span className="status-badge featured-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                FEATURED
              </span>
            )}
            {tournament.plan_type === 'premium' && (
              <span className="status-badge premium-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.18l6 3.75v7.14l-6 3.75-6-3.75V7.93l6-3.75z" />
                  <path d="M12 8l-3 5h2v3l3-5h-2V8z" />
                </svg>
                PREMIUM
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card-content">
        <div className="game-info-row">
          <div className="game-icon-container">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c0 0-5 5.5-5 9.5a5 5 0 0 0 10 0C17 7.5 12 2 12 2z" />
            </svg>
          </div>
          <span className="game-name-text">{tournament.game_name}</span>
          <div className="verified-check">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>

        <h3 className="card-primary-title">{tournament.title}</h3>
        <p className="card-host-text">
          by{' '}
          <Link
            to={`/host/profile/${tournament.host?.id || tournament.host_id}`}
            className="host-profile-link"
            onClick={handleGuestClick}
          >
            {tournament.host_name || 'Scrimverse'}
          </Link>
        </p>

        <div className="tournament-stats-grid">
          <div className="stat-node">
            <span className="node-icon gold-text">
              <TrophyIcon />
            </span>
            <span className="node-value gold-text">₹{tournament.prize_pool}</span>
          </div>

          <div className="stat-node">
            <span className="node-icon muted-text">
              <ClockIcon />
            </span>
            <span className="node-value muted-text">{formatDate(tournament.tournament_start)}</span>
          </div>

          <div className="stat-node">
            <span className="node-icon muted-text">
              <UsersIcon />
            </span>
            <span className="node-value muted-text">{tournament.max_participants} teams</span>
          </div>

          <div className="stat-node">
            <span className="node-icon green-text">
              <EntryIcon />
            </span>
            <span className="node-value green-text">
              {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
            </span>
          </div>
        </div>

        {renderButtons()}
      </div>

      {/* Points Table Modal */}
      {showPointsTable &&
        ((tournament.event_mode || '').toUpperCase() === 'SCRIM' ? (
          <ScrimPointsTableModal
            isOpen={showPointsTable}
            onClose={() => setShowPointsTable(false)}
            tournament={tournament}
            currentRound={tournament.current_round || 1}
          />
        ) : (
          <PointsTableModal
            isOpen={showPointsTable}
            onClose={() => setShowPointsTable(false)}
            tournament={tournament}
            currentRound={tournament.current_round || 1}
          />
        ))}
      {/* Registration Modal */}
      {showRegistrationModal && (
        <RegistrationModal
          event={tournament}
          type={(tournament.event_mode || '').toLowerCase() === 'scrim' ? 'scrim' : 'tournament'}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => {
            setIsRegisteredInternal(true);
            setShowRegistrationModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TournamentCard;
