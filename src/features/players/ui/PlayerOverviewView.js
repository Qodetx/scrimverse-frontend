import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Filter, ChevronDown, Users, Trophy } from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import TournamentCard from '../../tournaments/ui/TournamentCard';
import './PlayerOverviewView.css';

// Game hero images
import heroBgmi from '../../../assets/hero-bgmi.webp';
import heroBgmiAction from '../../../assets/hero-bgmi-action.jpg';
import heroValorant from '../../../assets/hero-valorant.jpg';
import heroCodm from '../../../assets/hero-codm.png';
import heroFreefire from '../../../assets/hero-freefire.jpeg';

// Matches backend GAME_CHOICES: BGMI, COD, Valorant, Freefire, Scarfall
const GAME_FILTER_OPTIONS = [
  { label: 'All Games', value: 'All' },
  { label: 'BGMI', value: 'BGMI' },
  { label: 'Scarfall', value: 'Scarfall' },
  { label: 'Free Fire', value: 'Freefire' },
  { label: 'Valorant', value: 'Valorant' },
  { label: 'COD Mobile', value: 'COD' },
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Live', value: 'ongoing' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'completed' },
];

const PAGE_SIZE = 9;

const GAME_HERO_IMAGES = {
  BGMI: heroBgmi,
  Valorant: heroValorant,
  COD: heroCodm,
  Freefire: heroFreefire,
  Scarfall: heroBgmiAction,
};

const getHeroImage = (tournament) => {
  if (tournament.poster_image) {
    if (tournament.poster_image.startsWith('http')) return tournament.poster_image;
    const base = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${base}${tournament.poster_image}`;
  }
  if (tournament.banner_image) {
    if (tournament.banner_image.startsWith('http')) return tournament.banner_image;
    const base = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${base}${tournament.banner_image}`;
  }
  return GAME_HERO_IMAGES[tournament.game_name || tournament.game] || heroBgmi;
};

const formatParticipants = (tournament) => {
  const count = tournament.registration_count || tournament.current_participants || 0;
  const max = tournament.max_teams || tournament.max_participants || '?';
  return `${count}/${max}`;
};

const formatEntryFee = (tournament) => {
  const fee = tournament.entry_fee;
  if (fee === 0 || fee === '0') return 'FREE';
  if (fee) return `₹${fee}`;
  if (tournament.prize_pool) return `₹${tournament.prize_pool} pool`;
  return 'FREE';
};

const getTournamentLink = (tournament) => {
  const mode = (tournament.event_mode || '').toUpperCase();
  return mode === 'SCRIM' ? `/scrims/${tournament.id}` : `/tournaments/${tournament.id}`;
};

// ─── Hero Carousel ────────────────────────────────────────────────────────────

const HeroCarousel = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const autoRef = useRef(null);

  const total = slides.length;

  const goTo = useCallback(
    (idx) => {
      setCurrent(((idx % total) + total) % total);
    },
    [total]
  );

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (total <= 1) return;
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => clearInterval(autoRef.current);
  }, [total]);

  const resetTimer = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
  };

  const handlePrev = () => {
    prev();
    resetTimer();
  };

  const handleNext = () => {
    next();
    resetTimer();
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      if (delta < 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  if (total === 0) return null;

  const slide = slides[current];

  return (
    <div
      className="overview-hero-carousel overview-hero-aspect"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image */}
      <img
        src={getHeroImage(slide)}
        alt={slide.title}
        className="overview-hero-image absolute inset-0"
        draggable={false}
      />

      {/* Gradient overlay */}
      <div className="overview-hero-overlay" />

      {/* Top-left game tags */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
        {(slide.game_name || slide.game) && (
          <span className="overview-game-tag">{slide.game_name || slide.game}</span>
        )}
        {slide.event_mode && (
          <span className="overview-game-tag capitalize">
            {(slide.event_mode || '').toLowerCase() === 'scrim' ? 'Scrim' : 'Tournament'}
          </span>
        )}
        {slide.status === 'ongoing' && (
          <span
            className="overview-game-tag"
            style={{ background: 'rgba(239,68,68,0.5)', borderColor: 'rgba(239,68,68,0.5)' }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* Bottom content */}
      <div className="overview-hero-content z-10">
        <h2 className="text-white font-bold text-xl sm:text-2xl md:text-3xl leading-tight mb-1 drop-shadow-lg line-clamp-2">
          {slide.title}
        </h2>

        {/* Participants + entry fee row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
            <Users size={12} />
            {formatParticipants(slide)} teams
          </span>
          <span className="text-white/40 text-xs">•</span>
          <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
            <Trophy size={12} />
            {formatEntryFee(slide)}
          </span>
          {(slide.host_name || slide.host?.username) && (
            <>
              <span className="text-white/40 text-xs hidden sm:inline">•</span>
              <span className="text-white/60 text-xs hidden sm:inline">
                by {slide.host_name || slide.host.username}
              </span>
            </>
          )}
        </div>

        {/* CTA row */}
        <div className="flex items-center justify-between">
          <Link to={getTournamentLink(slide)} className="overview-view-btn">
            View Tournament
            <ChevronRight size={14} />
          </Link>

          {/* Dot indicators */}
          {total > 1 && (
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`overview-dot${i === current ? ' active' : ''}`}
                  onClick={() => {
                    goTo(i);
                    resetTimer();
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prev / Next nav buttons */}
      {total > 1 && (
        <>
          <button
            className="overview-nav-btn overview-nav-btn-left"
            onClick={handlePrev}
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="overview-nav-btn overview-nav-btn-right"
            onClick={handleNext}
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
};

// ─── Hero Skeleton ────────────────────────────────────────────────────────────

const HeroSkeleton = () => <div className="overview-hero-skeleton overview-hero-aspect" />;

// ─── Card Skeleton ────────────────────────────────────────────────────────────

const CardSkeleton = () => <div className="overview-card-skeleton" />;

// ─── Main Component ───────────────────────────────────────────────────────────

const PlayerOverviewView = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const filterRef = useRef(null);
  const statusFilterRef = useRef(null);

  // Fetch all tournaments (all statuses so filters work client-side)
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await tournamentAPI.getTournaments();
        const data = res.data?.results || res.data || [];
        setTournaments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching tournaments for overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  // Reset to page 1 when either filter changes
  useEffect(() => {
    setPage(1);
  }, [gameFilter, statusFilter]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target)) {
        setStatusFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Carousel: first 5 upcoming/active non-scrim tournaments
  const heroSlides = tournaments
    .filter((t) => (t.event_mode || '').toUpperCase() !== 'SCRIM' && t.status !== 'completed')
    .slice(0, 5);

  // Filtered grid (game + status)
  // API returns game_name (not game) per TournamentListSerializer
  const filteredTournaments = tournaments.filter((t) => {
    const gameMatch = gameFilter === 'All' || (t.game_name || t.game) === gameFilter;
    const statusMatch = statusFilter === 'all' || t.status === statusFilter;
    return gameMatch && statusMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTournaments.length / PAGE_SIZE);
  const paginatedTournaments = filteredTournaments.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filteredTournaments.length;

  // Active filter labels for display
  const activeGameLabel =
    GAME_FILTER_OPTIONS.find((o) => o.value === gameFilter)?.label || 'All Games';
  const activeStatusLabel =
    STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label || 'All';

  return (
    <div className="space-y-6">
      {/* ── Hero Carousel ──────────────────────────────────────────────────── */}
      {loading ? (
        <HeroSkeleton />
      ) : heroSlides.length > 0 ? (
        <HeroCarousel slides={heroSlides} />
      ) : (
        <div className="overview-hero-skeleton overview-hero-aspect flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No featured tournaments</p>
        </div>
      )}

      {/* ── All Tournaments Section ─────────────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="text-foreground font-bold text-lg">All Tournaments</h2>

          {/* Filters row */}
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <div className="relative" ref={statusFilterRef}>
              <button
                onClick={() => {
                  setStatusFilterOpen((v) => !v);
                  setFilterOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <span>{activeStatusLabel}</span>
                <ChevronDown
                  size={13}
                  className={
                    statusFilterOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                  }
                />
              </button>

              {statusFilterOpen && (
                <div className="overview-filter-dropdown overview-filter-dropdown-left">
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`overview-filter-option${statusFilter === option.value ? ' selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setStatusFilterOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Game filter */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => {
                  setFilterOpen((v) => !v);
                  setStatusFilterOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{
                  background:
                    'linear-gradient(to right, hsl(var(--purple) / 0.8), hsl(var(--purple-dark) / 0.8))',
                }}
              >
                <Filter size={13} />
                <span>{activeGameLabel}</span>
                <ChevronDown
                  size={13}
                  className={
                    filterOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                  }
                />
              </button>

              {filterOpen && (
                <div className="overview-filter-dropdown">
                  {GAME_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      className={`overview-filter-option${gameFilter === option.value ? ' selected' : ''}`}
                      onClick={() => {
                        setGameFilter(option.value);
                        setFilterOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTournaments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  activeTab={
                    tournament.status === 'ongoing'
                      ? 'active'
                      : tournament.status === 'completed'
                        ? 'past'
                        : 'upcoming'
                  }
                />
              ))}
            </div>

            {/* Load More / pagination info */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <span className="text-muted-foreground text-xs">
                  Showing {paginatedTournaments.length} of {filteredTournaments.length} tournaments
                </span>
                {hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    Load More
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              No tournaments found
              {gameFilter !== 'All' ? ` for ${activeGameLabel}` : ''}
              {statusFilter !== 'all' ? ` (${activeStatusLabel})` : ''}
            </p>
            {(gameFilter !== 'All' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setGameFilter('All');
                  setStatusFilter('all');
                }}
                className="mt-3 text-xs hover:underline"
                style={{ color: 'hsl(var(--purple))' }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerOverviewView;
