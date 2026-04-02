import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Users,
  Star,
  Calendar,
  Shield,
  Award,
  Clock,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { authAPI, tournamentAPI, ratingAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import Footer from '../../../components/Footer';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
  if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
  return '₹' + amount;
};

const renderStars = (rating, size = 'h-4 w-4') => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`${size} ${i < Math.floor(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
    />
  ));
};

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

  const isOwnProfile = user?.user?.user_type === 'host' && user?.host_profile?.id === parseInt(id);
  const isPlayer = user?.user?.user_type === 'player';

  useEffect(() => {
    if (isOwnProfile) navigate('/host/dashboard');
  }, [isOwnProfile, navigate]);

  const fetchHostData = useCallback(async () => {
    try {
      const [hostRes, ratingsRes] = await Promise.all([
        authAPI.getHostProfile(id),
        ratingAPI.getHostRatings(id),
      ]);
      setHost(hostRes.data);
      setRatings(ratingsRes.data.results || ratingsRes.data || []);
      try {
        const tourRes = await tournamentAPI.getHostTournaments(hostRes.data.id);
        setTournaments(tourRes.data.results || tourRes.data || []);
      } catch (_) {}
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load host profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHostData();
  }, [fetchHostData]);

  const handleSubmitRating = async () => {
    if (newRating === 0) return;
    setSubmittingRating(true);
    try {
      await ratingAPI.rateHost(id, { rating: newRating, review: newReview });
      await fetchHostData();
      setShowRatingModal(false);
      setNewRating(0);
      setNewReview('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }

  if (error || !host) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border/30 bg-card/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-sm">Host Profile</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-2">Host Not Found</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/80 transition-colors"
          >
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const averageRating = Number(host.average_rating ?? host.rating) || 0;
  const hasUserRated = host.has_user_rated || false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/30 bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm">Host Profile</span>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {/* Top Summary Card */}
        <div className="cyber-card rounded-xl mb-6 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-xl bg-gradient-to-br from-purple/30 to-blue-600/20 border-2 border-purple/30 flex items-center justify-center overflow-hidden">
                {host.user?.profile_picture ? (
                  <img
                    src={getImageUrl(host.user.profile_picture)}
                    alt={host.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Trophy className="h-10 w-10 text-purple mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-purple/80 uppercase tracking-wider">
                      Esports
                    </span>
                  </div>
                )}
              </div>
              {/* Verified circle badge on avatar — exact Lovable style */}
              {host.verified && (
                <div className="absolute -bottom-1 -right-1 bg-purple text-white rounded-full p-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Name + Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold truncate">{host.user?.username}</h1>
                {host.verified && (
                  <span className="flex items-center gap-1 text-xs bg-purple/20 text-purple border border-purple/30 px-2 py-1 rounded-full font-medium">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                {host.verified && (
                  <span className="flex items-center gap-1 text-xs bg-secondary/50 border border-border/40 px-2 py-1 rounded text-muted-foreground">
                    <Award className="h-3 w-3" /> Verified Host
                  </span>
                )}
                {(host.game_titles || []).map((game, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-xs bg-secondary/50 border border-border/40 px-2 py-1 rounded text-muted-foreground"
                  >
                    <Award className="h-3 w-3" /> {game}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Stats Grid — always 4 columns, full row */}
            <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 lg:max-w-lg">
              <div className="text-center p-4 bg-secondary/20 rounded-lg border border-border/20">
                <div className="text-2xl md:text-3xl font-bold text-purple">
                  {host.total_tournaments_hosted || 0}
                </div>
                <div className="text-xs text-muted-foreground">Tournaments</div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg border border-border/20">
                <div className="text-lg md:text-xl font-bold text-green-500">
                  {formatCurrency(host.prize_pool_distributed || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Prize Pool</div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg border border-border/20">
                <div className="text-2xl md:text-3xl font-bold text-purple">
                  {(host.total_participants || 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Participants</div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg border border-border/20">
                <div className="text-2xl md:text-3xl font-bold text-yellow-500">
                  {Number(host.success_rate || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Two column: Recent Tournaments + About/Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tournaments */}
          <div className="cyber-card rounded-xl">
            <div className="flex items-center gap-2 p-4 border-b border-border/20">
              <Calendar className="h-5 w-5 text-purple" />
              <h2 className="font-bold">Recent Tournaments</h2>
            </div>
            <div className="p-4 space-y-3">
              {tournaments.length > 0 ? (
                tournaments.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    to={
                      (t.event_mode || '').toUpperCase() === 'SCRIM'
                        ? `/scrims/${t.id}`
                        : `/tournaments/${t.id}`
                    }
                    className="block p-3 rounded-lg bg-secondary/20 hover:bg-purple/10 border border-transparent hover:border-purple/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm line-clamp-1">{t.title}</h4>
                        <p className="text-xs text-muted-foreground">{t.game_name}</p>
                      </div>
                      <span className="text-[10px] bg-secondary/60 border border-border/40 px-2 py-0.5 rounded text-muted-foreground flex-shrink-0">
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t.start_date
                          ? new Date(t.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t.current_participants}/{t.max_participants} teams
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tournaments yet</p>
                </div>
              )}
              <Link
                to="/tournaments"
                className="flex items-center justify-center gap-2 w-full mt-2 py-2 text-xs font-medium border border-border/40 rounded-lg hover:bg-secondary/40 transition-colors text-muted-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View All Tournaments
              </Link>
            </div>
          </div>

          {/* About + Reviews */}
          <div className="cyber-card rounded-xl">
            <div className="flex items-center gap-2 p-4 border-b border-border/20">
              <Shield className="h-5 w-5 text-purple" />
              <h2 className="font-bold">About</h2>
            </div>
            <div className="p-4 space-y-4">
              {host.bio && (
                <p className="text-muted-foreground text-sm leading-relaxed">{host.bio}</p>
              )}

              {/* Info rows */}
              <div className="border-t border-border/20 pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-purple" />
                  </div>
                  <div>
                    <p className="font-medium">Tournaments Hosted</p>
                    <p className="text-xs text-muted-foreground">
                      {host.total_tournaments_hosted || 0} events organized
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-purple" />
                  </div>
                  <div>
                    <p className="font-medium">Community</p>
                    <p className="text-xs text-muted-foreground">
                      {(host.total_participants || 0).toLocaleString()}+ players served
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-purple/10 flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-purple" />
                  </div>
                  <div>
                    <p className="font-medium">Rating</p>
                    <div className="flex items-center gap-1">
                      {renderStars(averageRating)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({ratings.length} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate button */}
              {isPlayer && !isOwnProfile && !hasUserRated && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="w-full py-2 text-sm font-semibold bg-purple text-white rounded-lg hover:bg-purple/80 transition-colors"
                >
                  Rate This Host
                </button>
              )}
              {isPlayer && !isOwnProfile && hasUserRated && (
                <p className="text-xs text-green-500 text-center">
                  ✓ You have already rated this host
                </p>
              )}

              {/* Reviews */}
              {ratings.length > 0 && (
                <div className="border-t border-border/20 pt-4 space-y-3">
                  <h3 className="text-sm font-semibold">Recent Reviews</h3>
                  {ratings.slice(0, 3).map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-secondary/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {renderStars(r.rating, 'h-3 w-3')}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.review && <p className="text-xs text-muted-foreground">{r.review}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRatingModal(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/40 rounded-xl shadow-2xl z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Rate {host.user?.username}</h2>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setNewRating(star)}>
                      <Star
                        className={`h-8 w-8 transition-colors ${star <= newRating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground hover:text-yellow-400'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-2 text-sm border border-border/40 rounded-lg hover:bg-secondary/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating || newRating === 0}
                className="flex-1 py-2 text-sm font-semibold bg-purple text-white rounded-lg hover:bg-purple/80 transition-colors disabled:opacity-50"
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
