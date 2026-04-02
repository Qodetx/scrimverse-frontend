import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ChevronRight,
  ChevronLeft,
  Users,
  Zap,
  ArrowRight,
  Mail,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import heroComposite from '../assets/hero-gaming-composite.png';
import heroBgmiAction from '../assets/hero-bgmi-action.jpg';
import heroBgmi from '../assets/hero-bgmi.webp';
import heroValorant from '../assets/hero-valorant.jpg';
import heroCodm from '../assets/hero-codm.png';
import heroFreefire from '../assets/hero-freefire.jpeg';
import heroPubg from '../assets/hero-pubg-mobile.png';
import { tournamentAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './HomePage.css';

const GAME_FALLBACK_IMAGES = {
  BGMI: heroBgmi,
  bgmi: heroBgmi,
  Valorant: heroValorant,
  valorant: heroValorant,
  'COD Mobile': heroCodm,
  'cod mobile': heroCodm,
  'Free Fire': heroFreefire,
  'free fire': heroFreefire,
  'PUBG Mobile': heroPubg,
  'pubg mobile': heroPubg,
};

const getFallbackImage = (gameName) => {
  if (!gameName) return heroBgmiAction;
  const key = Object.keys(GAME_FALLBACK_IMAGES).find(
    (k) => k.toLowerCase() === gameName.toLowerCase()
  );
  return key ? GAME_FALLBACK_IMAGES[key] : heroBgmiAction;
};

const STATIC_SLIDES = [
  {
    id: null,
    name: 'BGMI Championship',
    game_name: 'BGMI',
    image: heroBgmiAction,
    description:
      "India's biggest BGMI tournament with top teams competing for the ultimate championship title.",
    current_participants: 186,
    max_participants: 300,
    prize_pool: '₹10,000',
    tags: ['Battle Royale', 'Squad'],
  },
  {
    id: null,
    name: 'Valorant Masters',
    game_name: 'Valorant',
    image: heroValorant,
    description: 'Elite 5v5 Valorant tournament featuring the best tactical shooter teams.',
    current_participants: 24,
    max_participants: 32,
    prize_pool: '₹25,000',
    tags: ['5v5', 'Tactical'],
  },
  {
    id: null,
    name: 'COD Mobile Masters',
    game_name: 'COD Mobile',
    image: heroCodm,
    description: 'Intense Call of Duty Mobile multiplayer tournament with massive prize pools.',
    current_participants: 18,
    max_participants: 24,
    prize_pool: '₹15,000',
    tags: ['5v5', 'Multiplayer', 'Featured'],
  },
];

const HomePage = () => {
  const { isAuthenticated, isHost, isPlayer } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(STATIC_SLIDES);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  // Auto-advance every 4 seconds (pauses on hover)
  useEffect(() => {
    if (loadingTournaments) return;
    const timer = setInterval(() => {
      if (!isPaused.current) setCurrentSlide((p) => (p + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [loadingTournaments, slides.length]);

  const isPaused = useRef(false);
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
  };

  useEffect(() => {
    tournamentAPI
      .getTournaments({ status: 'upcoming' })
      .then((res) => {
        const data = res.data?.results || res.data || [];
        const upcoming = Array.isArray(data) ? data.slice(0, 6) : [];
        if (upcoming.length > 0) {
          setSlides(
            upcoming.map((t) => ({
              id: t.id,
              name: t.title || t.name,
              game_name: t.game_name || t.game,
              image: (() => {
                const mediaBase = (
                  process.env.REACT_APP_MEDIA_URL ||
                  process.env.REACT_APP_API_URL?.replace('/api', '') ||
                  'http://localhost:8000'
                ).replace(/\/media\/?$/, '');
                const raw = t.banner_image || t.poster_image;
                if (raw) return raw.startsWith('http') ? raw : `${mediaBase}${raw}`;
                return getFallbackImage(t.game_name || t.game);
              })(),
              description: t.description || `${t.game_name || t.game} tournament.`,
              current_participants: t.current_participants || 0,
              max_participants: t.max_participants || 0,
              prize_pool: t.prize_pool ? `₹${Number(t.prize_pool).toLocaleString('en-IN')}` : null,
              tags: [t.game_name || t.game, t.game_mode].filter(Boolean),
            }))
          );
          setCurrentSlide(0);
        }
      })
      .catch(() => {
        // Keep static slides on error
      })
      .finally(() => setLoadingTournaments(false));
  }, []);

  const handleExploreClick = () => {
    if (isAuthenticated()) {
      if (isHost()) navigate('/host/dashboard');
      else navigate('/player/dashboard');
    } else {
      navigate('/player-auth');
    }
  };

  const handleViewTournament = (slide) => {
    if (slide.id) {
      navigate(`/tournaments/${slide.id}`);
    } else {
      navigate('/tournaments');
    }
  };

  const slide = slides[currentSlide] || STATIC_SLIDES[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* TOP MARQUEE */}
      <div
        className="relative overflow-hidden z-10"
        style={{ background: 'linear-gradient(180deg, hsl(265 40% 8%) 0%, hsl(265 60% 12%) 100%)' }}
      >
        <div className="w-[120%] -ml-[10%] rotate-2 border-y border-purple/20 py-3 overflow-hidden bg-purple/[0.06]">
          <div className="flex animate-marquee whitespace-nowrap gap-12">
            {[...Array(14)].map((_, i) => (
              <span
                key={i}
                className="text-sm font-bold uppercase tracking-[0.25em] text-purple/50 shrink-0"
              >
                SCRIMVERSE ESPORTS ⚡
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, hsl(0 0% 5%) 0%, hsl(265 60% 12%) 40%, hsl(280 70% 18%) 60%, hsl(265 50% 8%) 100%)',
        }}
      >
        <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-purple/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-purple-dark/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] bg-purple-light/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 md:px-12 w-full">
          {/* Mobile */}
          <div className="block lg:hidden space-y-4 text-center py-4">
            <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
              <span className="block text-foreground">WHERE GAMERS</span>
              <span className="block bg-gradient-to-r from-purple-light via-purple to-purple-dark bg-clip-text text-transparent">
                COMPETE & CONQUER
              </span>
            </h1>
            <p className="text-sm sm:text-base text-foreground/60 max-w-md mx-auto leading-relaxed">
              The ultimate platform for competitive gaming tournaments and scrimmages. Join
              thousands of players competing for glory and prizes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple" />
                <span className="text-xs font-bold text-foreground/80">SCRIMVERSE</span>
              </div>
              <button
                onClick={handleExploreClick}
                className="px-6 py-5 text-sm font-bold rounded-full bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white border-0 shadow-lg shadow-purple/30 transition-all group inline-flex items-center"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Explore ScrimVerse
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="relative mx-auto w-full max-w-sm pt-1 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-light/20 via-purple/10 to-transparent rounded-2xl blur-3xl" />
              <img
                src={heroComposite}
                alt="Gaming Characters Composite"
                className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:grid items-center gap-10 grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl space-y-6 md:space-y-8">
              <h1 className="text-5xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
                <span className="block text-foreground">WHERE GAMERS</span>
                <span className="block bg-gradient-to-r from-purple-light via-purple to-purple-dark bg-clip-text text-transparent">
                  COMPETE & CONQUER
                </span>
              </h1>
              <p className="text-base md:text-lg text-foreground/60 max-w-xl leading-relaxed">
                The ultimate platform for competitive gaming tournaments and scrimmages. Join
                thousands of players competing for glory and prizes.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground/80">SCRIMVERSE</span>
                </div>
                <button
                  onClick={handleExploreClick}
                  className="px-6 py-3 text-sm font-bold rounded-full bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white border-0 shadow-lg shadow-purple/30 transition-all group inline-flex items-center"
                >
                  Explore ScrimVerse
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-light/20 via-purple/10 to-transparent rounded-full blur-3xl" />
              <img
                src={heroComposite}
                alt="Gaming Characters Composite"
                className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TILTED SCROLLING MARQUEE */}
      <div
        className="relative py-8 md:py-10 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, hsl(265 40% 8%) 0%, hsl(265 35% 6%) 100%)' }}
      >
        <div className="w-[120%] -ml-[10%] -rotate-3 border-y border-purple/20 py-3 overflow-hidden bg-purple/[0.04]">
          <div className="flex animate-marquee whitespace-nowrap gap-12">
            {[...Array(10)].map((_, i) => (
              <span
                key={i}
                className="text-sm font-bold uppercase tracking-[0.25em] text-purple/40 shrink-0 border-b border-transparent hover:border-purple/30 transition-colors"
              >
                SCRIMVERSE ESPORTS
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* UPCOMING TOURNAMENTS */}
      <section
        className="px-4 md:px-8 py-12 md:py-20"
        style={{ background: 'linear-gradient(180deg, hsl(265 35% 6%) 0%, hsl(0 0% 7%) 100%)' }}
      >
        <div className="max-w-5xl mx-auto text-center mb-8 md:mb-12">
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-baseline gap-[2px] sm:gap-1">
              {'JOIN THE BATTLE'.split('').map((char, i) => (
                <span
                  key={i}
                  className="text-purple text-lg sm:text-2xl md:text-3xl font-black uppercase"
                  style={{
                    display: 'inline-block',
                    animation: `floatChar 2.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.12}s`,
                    textShadow: '0 0 20px hsl(265 80% 65% / 0.4)',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground tracking-tight">
            Upcoming
            <br />
            Tournaments
          </h2>
          <p className="text-foreground/50 text-sm mt-3 max-w-md mx-auto">
            Slots are filling up fast. Secure your spot before it's too late.
          </p>
        </div>

        {/* Featured slide */}
        <div className="relative rounded-xl overflow-hidden group max-w-5xl mx-auto">
          {loadingTournaments ? (
            <div className="aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/8] flex items-center justify-center bg-card/50 rounded-xl">
              <Loader2 className="h-8 w-8 text-purple animate-spin" />
            </div>
          ) : (
            <div
              className="relative aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/8]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => {
                isPaused.current = true;
              }}
              onMouseLeave={() => {
                isPaused.current = false;
              }}
            >
              <img
                src={slide.image}
                alt={slide.name}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

              {slide.tags && slide.tags.length > 0 && (
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  {slide.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-foreground/20 backdrop-blur-sm text-foreground border border-foreground/20 text-[10px] font-semibold px-3 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2">
                  {slide.name}
                </h2>
                <p className="text-[11px] sm:text-sm text-foreground/70 max-w-lg mb-3 md:mb-4 line-clamp-2">
                  {slide.description}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-foreground/60">
                    {slide.max_participants > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {slide.current_participants}/{slide.max_participants}
                      </span>
                    )}
                    {slide.prize_pool && (
                      <span className="flex items-center gap-1 text-foreground font-semibold">
                        <Trophy className="h-3 w-3" />
                        {slide.prize_pool}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewTournament(slide)}
                    className="text-xs bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white border-0 font-semibold px-3 py-1.5 rounded"
                  >
                    View Tournament
                  </button>
                </div>
              </div>

              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/40 backdrop-blur-sm hover:bg-background/60 transition-all sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/40 backdrop-blur-sm hover:bg-background/60 transition-all sm:opacity-0 sm:group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-2 right-4 flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-purple w-5' : 'bg-foreground/30'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link to="/tournaments">
            <button className="bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white border-0 font-bold px-6 py-3 rounded-full text-sm group inline-flex items-center">
              Secure Your Slot
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* BOTTOM MARQUEE */}
      <div
        className="relative py-8 md:py-10 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, hsl(0 0% 7%) 0%, hsl(265 35% 6%) 100%)' }}
      >
        <div className="w-[120%] -ml-[10%] rotate-2 border-y border-purple/20 py-3 overflow-hidden bg-purple/[0.06]">
          <div
            className="flex animate-marquee whitespace-nowrap gap-12"
            style={{ animationDirection: 'reverse' }}
          >
            {[...Array(14)].map((_, i) => (
              <span
                key={i}
                className="text-sm font-bold uppercase tracking-[0.25em] text-purple/50 shrink-0"
              >
                SCRIMVERSE ESPORTS ⚡
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* NEWSLETTER */}
      <section
        className="py-16 md:py-24"
        style={{
          background:
            'linear-gradient(180deg, hsl(265 35% 6%) 0%, hsl(265 40% 10%) 50%, hsl(0 0% 5%) 100%)',
        }}
      >
        <div className="max-w-xl mx-auto px-4">
          <div className="relative rounded-2xl border border-purple/20 bg-gradient-to-br from-purple/[0.08] to-transparent p-8 sm:p-10 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple/15 border border-purple/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-purple" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-sm text-foreground/50 mb-6 max-w-sm mx-auto">
                Stay updated with the latest tournaments, scrims, and esports news delivered to your
                inbox.
              </p>
              <div className="flex items-center gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 bg-background/50 border border-border/30 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-purple/50 transition-colors"
                />
                <button className="bg-gradient-to-r from-purple to-purple-dark hover:from-purple-light hover:to-purple text-white font-bold px-5 py-2.5 rounded-full border-0 text-sm">
                  Subscribe
                </button>
              </div>
              <p className="text-[10px] text-foreground/30 mt-3">No spam, unsubscribe anytime.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
