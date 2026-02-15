import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authAPI, tournamentAPI, ratingAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './HostProfile.css';

const HostProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [host, setHost] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Check if viewing own host profile (only for hosts)
  const isOwnProfile = user?.user?.user_type === 'host' && user?.host_profile?.id === parseInt(id);
  const isPlayer = user?.user?.user_type === 'player';

  // Redirect hosts viewing their own profile to dashboard
  useEffect(() => {
    if (isOwnProfile) {
      navigate('/host/dashboard');
    }
  }, [isOwnProfile, navigate]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const baseUrl = process.env.REACT_APP_API_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  const fetchHostData = useCallback(async () => {
    try {
      const [hostRes, ratingsRes] = await Promise.all([
        authAPI.getHostProfile(id),
        ratingAPI.getHostRatings(id),
      ]);

      setHost(hostRes.data);
      setRatings(ratingsRes.data.results || ratingsRes.data || []);

      // Fetch tournaments for all host profiles
      try {
        const tournamentsRes = await tournamentAPI.getHostTournaments(hostRes.data.id);
        setTournaments(tournamentsRes.data.results || tournamentsRes.data || []);
      } catch (err) {
        // Tournament fetch failed silently
      }
    } catch (error) {
      console.error('Error fetching host profile:', error);
      setError(error.response?.data?.error || 'Failed to load host profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHostData();
  }, [fetchHostData]);

  const handleSubmitRating = async () => {
    if (newRating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      await ratingAPI.rateHost(id, {
        rating: newRating,
        review: newReview,
      });

      // Refresh ratings and host data
      await fetchHostData();

      setShowRatingModal(false);
      setNewRating(0);
      setNewReview('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(error.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) return (amount / 100000).toFixed(1) + 'L';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
    return amount;
  };

  if (loading) {
    return (
      <div className="host-profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !host) {
    return (
      <div className="host-profile-page">
        <div className="error-container">
          <h2>Host not found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Use average_rating from backend, fallback to rating field for backwards compatibility
  const averageRating = Number(host.average_rating ?? host.rating) || 0;
  const hasUserRated = host.has_user_rated || false;

  // Debug logging - removed for production

  return (
    <div className="host-profile-page">
      <div className="host-profile-container">
        {/* Header Section */}
        <div className="host-profile-header cyber-card hover-lift">
          <div className="host-info-section">
            {/* Avatar */}
            <div className="host-avatar">
              {host.user.profile_picture ? (
                <img
                  src={getImageUrl(host.user.profile_picture)}
                  alt={host.user.username}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-letter">
                  {host.user.username?.charAt(0).toUpperCase() || 'H'}
                </div>
              )}
            </div>

            {/* Host Details */}
            <div className="host-details">
              <div
                className="host-name-row"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: '16px',
                }}
              >
                <h1 className="host-name" style={{ margin: 0 }}>
                  {host.user.username}
                </h1>
                {host.verified && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="verified-icon"
                  >
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
                )}
                {host.bio && (
                  <span
                    className="host-bio-header"
                    style={{
                      color: '#888',
                      fontSize: '1rem',
                      fontStyle: 'italic',
                      borderLeft: '2px solid rgba(124, 58, 237, 0.3)',
                      paddingLeft: '12px',
                    }}
                  >
                    {host.bio}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="host-subtitle">
                  {host.total_tournaments_hosted || 0} Tournaments Hosted
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row - Same as Dashboard */}
          <div className="stats-row">
            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9H4a2 2 0 0 1 0-4h2m12 4h2a2 2 0 0 0 0-4h-2M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div className="stat-val">{host.total_tournaments_hosted || 0}</div>
              <div className="stat-lbl">Matches Hosted</div>
            </div>
            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-val">{(host.total_participants || 0).toLocaleString()}</div>
              <div className="stat-lbl">Total Participants</div>
            </div>
            <div className="player-stat-card cyber-card hover-lift">
              <div className="stat-icon-small">
                <span className="rupee-icon">₹</span>
              </div>
              <div className="stat-val">₹{formatCurrency(host.prize_pool_distributed || 0)}</div>
              <div className="stat-lbl">Prize Pool</div>
            </div>
            <div className="player-stat-card holographic cyber-card hover-lift">
              <div className="stat-icon-small">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3v18h18M19 9l-5 5-4-4-3 3" />
                </svg>
              </div>
              <div className="stat-val">{averageRating.toFixed(1)}</div>
              <div className="stat-lbl">Host Rating</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="host-content-grid">
          {/* Left Column: Recent Tournaments */}
          <div className="tournaments-section cyber-card hover-lift">
            <div className="section-header">
              <svg
                className="section-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
              </svg>
              <h2>Recent Tournaments</h2>
            </div>

            <div className="tournaments-list">
              {tournaments.length > 0 ? (
                tournaments.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    to={
                      (t.event_mode || '').toUpperCase() === 'SCRIM'
                        ? `/scrims/${t.id}`
                        : `/tournaments/${t.id}`
                    }
                    className="tournament-card cyber-card hover-lift"
                  >
                    <div className="tournament-info">
                      <h3>{t.title}</h3>
                      <p>
                        {t.game_name} • {t.current_participants}/{t.max_participants} Teams
                      </p>
                    </div>
                    <span className={`status-badge ${t.status}`}>{t.status}</span>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <p>No tournaments yet</p>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/tournaments')} className="view-all-btn">
              View All Tournaments
            </button>
          </div>

          {/* Right Column: About & Ratings */}
          <div className="about-section cyber-card hover-lift">
            <div className="section-header">
              <svg
                className="section-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h2>About</h2>
            </div>

            <div className="about-content">
              {/* Ratings Section */}
              <div className="ratings-section">
                <div className="rating-header">
                  <h3>Ratings & Reviews</h3>
                  <div className="rating-summary">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(averageRating) ? 'filled' : ''}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="rating-count">
                      {averageRating.toFixed(1)} ({ratings.length} reviews)
                    </span>
                  </div>
                </div>

                {/* Rate Host Button - Only for Players who haven't rated yet */}
                {isPlayer && !isOwnProfile && !hasUserRated && (
                  <button onClick={() => setShowRatingModal(true)} className="rate-host-btn">
                    Rate This Host
                  </button>
                )}

                {/* Show message if already rated */}
                {isPlayer && !isOwnProfile && hasUserRated && (
                  <div className="already-rated-message">✓ You have already rated this host</div>
                )}

                {/* Reviews List */}
                <div className="reviews-list">
                  {ratings.length > 0 ? (
                    ratings.slice(0, 3).map((rating) => (
                      <div key={rating.id} className="review-card">
                        <div className="review-header">
                          <div className="stars">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < rating.rating ? 'filled' : ''}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="review-date">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.review && <p className="review-text">{rating.review}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="no-reviews">No reviews yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rate {host.user.username}</h2>
              <button onClick={() => setShowRatingModal(false)} className="close-btn">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="rating-input">
                <label>Your Rating</label>
                <div className="star-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`star-btn ${star <= newRating ? 'active' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="review-input">
                <label>Your Review (Optional)</label>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your experience with this host..."
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowRatingModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="submit-btn"
                disabled={submittingRating || newRating === 0}
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostProfile;
