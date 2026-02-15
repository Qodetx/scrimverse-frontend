import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { tournamentAPI } from '../utils/api';
import EditHostProfileModal from '../components/EditHostProfileModal';
import { useIsMobile } from '../hooks/use-mobile';
import './HostDashboard.css';

const VerifiedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="verified-icon">
    <path
      d="M12 2L15.09 5.26L19.47 6.11L20 10.5L23 13.5L20 16.5L19.47 20.89L15.09 21.74L12 25L8.91 21.74L4.53 20.89L4 16.5L1 13.5L4 10.5L4.53 6.11L8.91 5.26L12 2Z"
      fill="currentColor"
    />
    <path
      d="M9 12L11 14L15 10"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrophyIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9H4a2 2 0 0 1 0-4h2" />
    <path d="M18 9h2a2 2 0 0 0 0-4h-2" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const RupeeIcon = () => <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹</span>;

const ChartIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const HostDashboard = () => {
  const { user, fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tournamentTab, setTournamentTab] = useState('upcoming'); // 'upcoming' or 'past'
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await tournamentAPI.getHostStats();
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount;
  };

  if (loading) {
    return (
      <div className="host-dashboard flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { stats, live_tournaments, upcoming_tournaments, past_tournaments, recent_activity } =
    data || {};

  return (
    <div className="host-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header" style={{ alignItems: 'center' }}>
          <div className="header-left">
            <div className="profile-section">
              <img
                src={
                  user?.user?.profile_picture ||
                  'https://ui-avatars.com/api/?name=' + user?.user?.username
                }
                alt="Avatar"
                className="profile-avatar"
              />
              <div className="profile-name-container">
                <h1 className="profile-title" style={{ margin: 0 }}>
                  {user?.user?.username}
                  {user?.profile?.verified && <VerifiedIcon />}
                </h1>
                {user?.profile?.bio && <span className="profile-bio">{user.profile.bio}</span>}
              </div>
            </div>
          </div>
          <div className="header-right">
            <button
              className="create-btn"
              onClick={() => setShowEditModal(true)}
              title="Edit Profile"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span style={{ marginLeft: '6px' }}>Edit Profile</span>
            </button>

            <div className="create-dropdown">
              <button className="create-btn">
                <span>+</span> Create
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  style={{ marginLeft: '4px' }}
                >
                  <path d="m19 9-7 7-7-7" />
                </svg>
              </button>
              <div className="dropdown-menu">
                <Link to="/host/create-tournament" className="dropdown-item">
                  <TrophyIcon />
                  New Tournament
                </Link>
                <div className="dropdown-divider"></div>
                <Link to="/host/scrims/create" className="dropdown-item">
                  <UsersIcon />
                  New Scrim
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Row (hidden on mobile) */}
        {!isMobile && (
          <div className="stats-row">
            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <TrophyIcon />
              </div>
              <div className="stat-val">{stats?.matches_hosted || 0}</div>
              <div className="stat-lbl">Matches Hosted</div>
            </div>
            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <UsersIcon />
              </div>
              <div className="stat-val">{stats?.total_participants?.toLocaleString() || 0}</div>
              <div className="stat-lbl">Total Participants</div>
            </div>
            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <RupeeIcon />
              </div>
              <div className="stat-val">₹{formatCurrency(stats?.total_prize_pool || 0)}</div>
              <div className="stat-lbl">Prize Pool</div>
            </div>
            <div className="player-stat-card holographic cyber-card hover-lift">
              <div className="stat-icon-small">
                <ChartIcon />
              </div>
              <div className="stat-val">
                {stats?.host_rating ? stats.host_rating.toFixed(1) : '0.0'}
              </div>
              <div className="stat-lbl">Host Rating</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-content">
          {/* Live Tournaments */}
          <div className="section-card cyber-card hover-lift">
            <div className="section-header">
              <h2>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Live Matches
              </h2>
            </div>
            <div className="tournament-list">
              {live_tournaments && live_tournaments.length > 0 ? (
                live_tournaments.map((t) => (
                  <div key={t.id} className="tournament-item">
                    <div className="tournament-left">
                      <div className="game-icon-wrapper">
                        <TrophyIcon />
                      </div>
                      <div className="tournament-info">
                        <h3>{t.title}</h3>
                        <div className="tournament-badge-row">
                          <span className="live-badge">LIVE</span>
                          <span className="tournament-stage">Round {t.current_round}</span>
                        </div>
                      </div>
                    </div>
                    <div className="tournament-right">
                      <div className="stats-group">
                        <span className="participants-count">
                          {t.current_participants} participants
                        </span>
                      </div>
                      <button
                        className="manage-btn"
                        onClick={() => {
                          const base =
                            (t.event_mode || '').toUpperCase() === 'SCRIM'
                              ? 'scrims'
                              : 'tournaments';
                          navigate(`/${base}/${t.id}/manage`);
                        }}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No live tournaments right now.</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="section-card cyber-card hover-lift">
            <div className="section-header">
              <h2>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                Recent Activity
              </h2>
            </div>
            <div className="activity-list">
              {recent_activity && recent_activity.length > 0 ? (
                recent_activity.map((activity, idx) => {
                  const getActivityColor = (type) => {
                    switch (type) {
                      case 'registration':
                        return 'blue';
                      case 'tournament_started':
                        return 'green';
                      case 'tournament_completed':
                        return 'purple';
                      case 'rating_received':
                        return 'yellow';
                      default:
                        return 'gray';
                    }
                  };

                  const getActivityLabel = (type) => {
                    switch (type) {
                      case 'registration':
                        return 'New Registration';
                      case 'tournament_started':
                        return 'Started';
                      case 'tournament_completed':
                        return 'Completed';
                      case 'rating_received':
                        return 'Rating';
                      default:
                        return 'Activity';
                    }
                  };

                  const getRelativeTime = (timestamp) => {
                    const now = new Date();
                    const activityTime = new Date(timestamp);
                    const diffMs = now - activityTime;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    if (diffDays < 7) return `${diffDays}d ago`;
                    return activityTime.toLocaleDateString();
                  };

                  return (
                    <div key={idx} className="activity-notification">
                      <div className="activity-notification-header">
                        <span
                          className={`activity-badge activity-badge-${getActivityColor(activity.type)}`}
                        >
                          {getActivityLabel(activity.type)}
                        </span>
                        <span className="activity-timestamp">
                          {getRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                      <div className="activity-notification-body">
                        <p className="activity-message">{activity.message}</p>
                        {activity.detail && <p className="activity-detail">{activity.detail}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="activity-empty">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Your Tournaments with Tabs */}
          <div className="section-card upcoming-section cyber-card hover-lift">
            <div className="section-header">
              <h2>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Your Matches
              </h2>
            </div>

            {/* Tabs */}
            <div className="tournament-tabs">
              <button
                className={`tournament-tab ${tournamentTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setTournamentTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`tournament-tab ${tournamentTab === 'past' ? 'active' : ''}`}
                onClick={() => setTournamentTab('past')}
              >
                Past
              </button>
            </div>

            {/* Tournament List */}
            <div className="tournament-list">
              {tournamentTab === 'upcoming' ? (
                upcoming_tournaments && upcoming_tournaments.length > 0 ? (
                  upcoming_tournaments.map((t) => (
                    <div key={t.id} className="tournament-item">
                      <div className="tournament-left">
                        <div className="game-icon-wrapper">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-calendar h-6 w-6 text-accent"
                          >
                            <path d="M8 2v4" />
                            <path d="M16 2v4" />
                            <rect width="18" height="18" x="3" y="4" rx="2" />
                            <path d="M3 10h18" />
                          </svg>
                        </div>
                        <div className="tournament-info">
                          <h3>{t.title}</h3>
                          <div className="tournament-badge-row">
                            <span
                              className="tournament-stage"
                              style={{ color: '#fff', fontWeight: '600' }}
                            >
                              {t.game_name}
                            </span>
                            <span className="tournament-stage">
                              {t.current_participants}/{t.max_participants} registrations
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="tournament-right">
                        <div className="date-time">
                          <span className="date">
                            {new Date(t.tournament_start).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="time">
                            {new Date(t.tournament_start).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <button
                          className="manage-btn dark"
                          onClick={() => {
                            const base =
                              (t.event_mode || '').toUpperCase() === 'SCRIM'
                                ? 'scrims'
                                : 'tournaments';
                            navigate(`/${base}/${t.id}/manage`);
                          }}
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming tournaments scheduled.
                  </div>
                )
              ) : past_tournaments && past_tournaments.length > 0 ? (
                past_tournaments.map((t) => (
                  <div key={t.id} className="tournament-item">
                    <div className="tournament-left">
                      <div className="game-icon-wrapper">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-check-circle h-6 w-6 text-accent"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <div className="tournament-info">
                        <h3>{t.title}</h3>
                        <div className="tournament-badge-row">
                          <span
                            className="tournament-stage"
                            style={{ color: '#fff', fontWeight: '600' }}
                          >
                            {t.game_name}
                          </span>
                          <span className="tournament-stage completed-badge">Completed</span>
                        </div>
                      </div>
                    </div>
                    <div className="tournament-right">
                      <div className="date-time">
                        <span className="date">
                          {new Date(t.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="time">Ended</span>
                      </div>
                      <button
                        className="manage-btn dark"
                        onClick={() => {
                          const base =
                            (t.event_mode || '').toUpperCase() === 'SCRIM'
                              ? 'scrims'
                              : 'tournaments';
                          navigate(`/${base}/${t.id}/manage`);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No past tournaments found.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditHostProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        host={user?.profile}
        onSuccess={async () => {
          // Refresh user data after successful edit
          await fetchUserData();
        }}
      />
    </div>
  );
};

export default HostDashboard;
