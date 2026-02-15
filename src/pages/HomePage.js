import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { tournamentAPI } from '../utils/api';
import TournamentCard from '../components/TournamentCard';
import Footer from '../components/Footer';
import { useIsMobile } from '../hooks/use-mobile';
import './HomePage.css';

// Import game posters from assets
import posterBGMI from '../assets/poster-bgmi.png';
import posterValorant from '../assets/poster-valorant.jpg';
import posterCODM from '../assets/poster-codm.jpg';
import posterScarfall from '../assets/poster-scarfall.png';
import posterFreefire from '../assets/poster-freefire.jpg';

// --- Choose Battlefield Component ---
const ChooseBattlefield = () => {
  const games = [
    {
      id: 'bgmi',
      name: 'BGMI',
      image: posterBGMI,
      slug: 'bgmi',
      available: true,
    },
    {
      id: 'valorant',
      name: 'Valorant',
      image: posterValorant,
      slug: 'valorant',
      available: true,
    },
    {
      id: 'codm',
      name: 'COD Mobile',
      image: posterCODM,
      slug: 'codm',
      available: true,
    },
    {
      id: 'scarfall',
      name: 'Scarfall',
      image: posterScarfall,
      slug: 'scarfall',
      available: true,
    },
    {
      id: 'freefire',
      name: 'Free Fire',
      image: posterFreefire,
      slug: 'freefire',
      available: true,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center mb-12 reveal-on-scroll">
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            <span className="text-white">CHOOSE YOUR </span>
            <span className="text-[#8b5cf6]">BATTLEFIELD</span>
          </h2>
          <p className="text-gray-400 text-lg">From mobile legend to PC masters</p>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
          {games.map((game, index) =>
            game.available ? (
              <Link
                key={game.id}
                to={`/tournaments?game=${game.slug}`}
                className={`group relative flex flex-col items-center p-4 rounded-xl bg-[#111] border border-white/10 transition-all duration-300 reveal-on-scroll hover-perspective hover-neon-border`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Game Image */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden mb-4 bg-gray-800">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/128x128/1e1e1e/FFF?text=Game';
                    }}
                  />
                </div>

                {/* Game Name */}
                <span className="text-white font-bold text-sm md:text-base group-hover:text-[#8b5cf6] transition-colors duration-300">
                  {game.name}
                </span>
              </Link>
            ) : (
              <div
                key={game.id}
                className={`group relative flex flex-col items-center p-4 rounded-xl bg-[#111] border border-white/5 cursor-not-allowed grayscale opacity-60 reveal-on-scroll`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Game Image with overlay */}
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden mb-4 bg-gray-800">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover object-top opacity-60"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/128x128/1e1e1e/FFF?text=Soon';
                    }}
                  />
                </div>

                {/* Game Name */}
                <span className="text-gray-500 font-bold text-sm md:text-base">{game.name}</span>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [featuredScrims, setFeaturedScrims] = useState([]);
  /* Removed unused regularTournaments */
  const [isLoaded, setIsLoaded] = useState(false);

  const isMobile = useIsMobile();
  const shouldHideKPIs = isMobile && user;

  useEffect(() => {
    fetchStats();
    fetchFeaturedTournaments();
    fetchFeaturedScrims();
    window.scrollTo(0, 0);
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Separate effect for Scroll Observer to handle dynamic content
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [featuredTournaments, featuredScrims]);

  const fetchStats = async () => {
    try {
      const response = await tournamentAPI.getPlatformStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFeaturedTournaments = async () => {
    try {
      const response = await tournamentAPI.getTournaments({
        category: 'official', // Backend filters for featured/premium plans
        event_mode: 'TOURNAMENT',
      });
      const data = response.data.results || response.data;
      // Filter out completed tournaments
      const filtered = data.filter(
        (t) => t.status !== 'completed' && t.event_mode === 'TOURNAMENT'
      );

      // Sort by plan: Premium first, then Featured
      const sorted = filtered.sort((a, b) => {
        const planOrder = { premium: 0, featured: 1, basic: 2 };
        const aOrder = planOrder[(a.plan_type || 'basic').toLowerCase()] ?? 2;
        const bOrder = planOrder[(b.plan_type || 'basic').toLowerCase()] ?? 2;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      setFeaturedTournaments(sorted.slice(0, 6));
    } catch (error) {
      console.error('Error fetching official tournaments:', error);
    }
  };

  const fetchFeaturedScrims = async () => {
    try {
      const response = await tournamentAPI.getTournaments({
        category: 'official', // Backend filters for featured/premium plans
        event_mode: 'SCRIM',
      });
      const data = response.data.results || response.data;
      // Filter out completed scrims
      const filtered = data.filter((t) => t.status !== 'completed' && t.event_mode === 'SCRIM');

      // Sort by plan: Premium first, then Featured
      const sorted = filtered.sort((a, b) => {
        const planOrder = { premium: 0, featured: 1, basic: 2 };
        const aOrder = planOrder[(a.plan_type || 'basic').toLowerCase()] ?? 2;
        const bOrder = planOrder[(b.plan_type || 'basic').toLowerCase()] ?? 2;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      setFeaturedScrims(sorted.slice(0, 6));
    } catch (error) {
      console.error('Error fetching featured scrims:', error);
    }
  };

  return (
    <div className={`home-container particle-bg ${isLoaded ? 'home-loaded' : ''}`}>
      <div className="cyber-grid"></div>

      {/* Floating Star Animation */}
      <div className="star-field">
        {[...Array(50)].map((_, i) => {
          const left = Math.random() * 100;
          const duration = Math.random() * 20 + 10;
          const delay = Math.random() * 20;
          const opacity = Math.random() * 0.5 + 0.3;

          return (
            <div
              key={i}
              className="star-particle"
              style={{
                left: `${left}%`,
                animationDuration: `${duration}s`,
                animationDelay: `-${delay}s`,
                '--star-opacity': opacity,
              }}
            />
          );
        })}
      </div>

      <div className="floating-particles"></div>

      {/* Ambient Glow Effects */}
      <div className="hero-ambient">
        <div className="ambient-orb ambient-orb-1"></div>
        <div className="ambient-orb ambient-orb-2"></div>
        <div className="ambient-orb ambient-orb-3"></div>
      </div>

      {/* Hero Section - Premium Redesign */}
      <section className="hero-wrapper hero-animated">
        <h1 className="hero-title mb-6">
          <span className="text-[#e2d8f9]">SCRIM</span>
          <span className="text-[#8b5cf6]">VERSE</span>
        </h1>

        <p className="hero-description text-xl max-w-2xl mx-auto mb-10 text-gray-400">
          The ultimate platform for{' '}
          <span className="text-[#8b5cf6] font-bold">competitive gaming</span> tournaments and
          scrimmages. Join thousands of players competing for glory and prizes.
        </p>

        <div className="hero-ctas flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            to={user ? '/tournaments' : '/host/login'}
            className="px-8 py-3 bg-white text-black rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
          >
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
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            Host Tournament
            <span>&rarr;</span>
          </Link>
          <Link
            to={user ? '/tournaments' : '/player/login'}
            className="px-8 py-3 bg-transparent border border-[#8b5cf6] text-[#8b5cf6] rounded-lg font-bold flex items-center gap-2 hover:bg-[#8b5cf6]/10 transition-colors"
          >
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Join as Player
          </Link>
        </div>

        {/* Stats Section - Premium Redesign - Dark Cards */}
        {!shouldHideKPIs && (
          <div className="stats-container flex flex-wrap justify-center gap-6">
            <div
              className="stat-card stat-animated bg-[#111] border border-white/10 rounded-xl p-6 min-w-[200px]"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-[#8b5cf6]">
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
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="text-3xl font-black text-white">
                  {stats ? stats.total_players.toLocaleString() : '50'}
                  <span className="text-[#8b5cf6]">+</span>
                </div>
              </div>
              <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                Active Players
              </div>
            </div>

            <div
              className="stat-card stat-animated bg-[#111] border border-white/10 rounded-xl p-6 min-w-[200px]"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-[#8b5cf6]">
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
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </div>
                <div className="text-3xl font-black text-white">
                  {stats ? stats.total_tournaments.toLocaleString() : '20'}
                  <span className="text-[#8b5cf6]">+</span>
                </div>
              </div>
              <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                Tournaments Hosted
              </div>
            </div>

            <div
              className="stat-card stat-animated bg-[#111] border border-white/10 rounded-xl p-6 min-w-[200px]"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-[#8b5cf6]">
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
                    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z" />
                  </svg>
                </div>
                <div className="text-3xl font-black text-white">
                  ₹{stats ? (parseFloat(stats.total_prize_money) / 100000).toFixed(0) : '10,000'}
                  <span className="text-[#8b5cf6]">+</span>
                </div>
              </div>
              <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                Prize Pool
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Trusted By Section - Premium Redesign */}
      <section className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:px-12 md:py-10 text-center reveal-on-scroll shadow-2xl shadow-purple-900/10 select-none">
            <p className="text-xs font-extra-bold text-gray-500 uppercase tracking-[0.2em] mb-8">
              Trusted by competitive gamers across India
            </p>

            <div className="flex flex-col md:flex-row justify-between items-center gap-y-6 md:gap-x-4">
              <div className="flex items-center gap-3 group cursor-default">
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 filter drop-shadow-md">
                  🎮
                </span>
                <span className="text-sm md:text-lg font-bold text-gray-400 group-hover:text-white transition-colors duration-300">
                  BGMI Pro League
                </span>
              </div>

              <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>

              <div className="flex items-center gap-3 group cursor-default">
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 filter drop-shadow-md">
                  ⚔️
                </span>
                <span className="text-sm md:text-lg font-bold text-gray-400 group-hover:text-white transition-colors duration-300">
                  Scarfall Masters
                </span>
              </div>

              <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>

              <div className="flex items-center gap-3 group cursor-default">
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 filter drop-shadow-md">
                  🏆
                </span>
                <span className="text-sm md:text-lg font-bold text-gray-400 group-hover:text-white transition-colors duration-300">
                  100+ Hosts
                </span>
              </div>

              <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/10"></div>

              <div className="flex items-center gap-3 group cursor-default">
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 filter drop-shadow-md">
                  🌐
                </span>
                <span className="text-sm md:text-lg font-bold text-gray-400 group-hover:text-white transition-colors duration-300">
                  Pan India
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ChooseBattlefield />

      {/* Featured Tournaments Section */}
      <section className="section-wrapper relative z-10 featured-tournaments-section">
        <div className="text-center mb-16 reveal-on-scroll">
          <div className="section-badge hot-badge-premium">
            <span className="fire-icon">🔥</span>
            Hot Tournaments
          </div>
          <h2 className="featured-main-title">
            Featured <span className="title-verse">Tournaments</span>
          </h2>
          <p className="featured-subtitle">
            Join the most epic competitions. <span className="text-accent">Join the elite.</span>
          </p>
        </div>

        {featuredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTournaments.map((tournament, index) => (
              <div
                key={tournament.id}
                className="featured-card-wrapper reveal-on-scroll"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <TournamentCard tournament={tournament} />
              </div>
            ))}
          </div>
        ) : (
          <div className="gaming-card p-12 text-center rounded-2xl">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-muted-foreground">
              Stay tuned! Epic premium matches are in the works.
            </p>
          </div>
        )}
      </section>

      {/* Featured Scrims Section */}
      <section className="section-wrapper relative z-10 featured-tournaments-section">
        <div className="text-center mb-16 reveal-on-scroll">
          <h2 className="featured-main-title">
            Featured <span className="title-verse">Scrims</span>
          </h2>
          <p className="featured-subtitle">
            Sharpen your skills in practice battles.{' '}
            <span className="text-accent">Train like a pro.</span>
          </p>
        </div>

        {featuredScrims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredScrims.map((scrim, index) => (
              <div
                key={scrim.id}
                className="featured-card-wrapper reveal-on-scroll"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <TournamentCard tournament={scrim} />
              </div>
            ))}
          </div>
        ) : (
          <div className="gaming-card p-12 text-center rounded-2xl">
            <div className="text-4xl mb-4">⚔️</div>
            <p className="text-muted-foreground">
              Stay tuned! Premium practice sessions are coming soon.
            </p>
          </div>
        )}
      </section>

      {/* Why Choose ScrimVerse Section */}
      <section className="section-wrapper relative z-10 py-20">
        <div className="text-center mb-16 reveal-on-scroll">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="text-white">Why Choose </span>
            <span className="text-[#e2d8f9]">Scrim</span>
            <span className="text-white">Verse?</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need for competitive gaming, all in one platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div
            className="bg-[#111] border border-white/5 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300 relative group reveal-on-scroll hover-perspective hover-neon-border"
            style={{ transitionDelay: '100ms' }}
          >
            <div className="w-14 h-14 bg-[#1a1a2e] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2a2a4e] transition-colors">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-4 text-center">Verified Tournaments</h3>
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
              All tournaments are verified for legitimacy and fair play. Your entry fees and prizes
              are secure.
            </p>
            <div className="text-center">
              <Link
                to="/features/verified"
                className="text-[#8b5cf6] text-sm font-bold hover:text-[#a78bfa] transition-colors inline-flex items-center gap-1"
              >
                Learn More <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Feature 2 */}
          <div
            className="bg-[#111] border border-white/5 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300 relative group reveal-on-scroll hover-perspective hover-neon-border"
            style={{ transitionDelay: '200ms' }}
          >
            <div className="w-14 h-14 bg-[#1a1a2e] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2a2a4e] transition-colors">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-4 text-center">Instant Registration</h3>
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
              Quick and seamless tournament registration with real-time updates and notifications.
            </p>
            <div className="text-center">
              <Link
                to="/features/registration"
                className="text-[#8b5cf6] text-sm font-bold hover:text-[#a78bfa] transition-colors inline-flex items-center gap-1"
              >
                Learn More <span>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Feature 3 */}
          <div
            className="bg-[#111] border border-white/5 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300 relative group reveal-on-scroll hover-perspective hover-neon-border"
            style={{ transitionDelay: '300ms' }}
          >
            <div className="w-14 h-14 bg-[#1a1a2e] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2a2a4e] transition-colors">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
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
            </div>
            <h3 className="text-white font-bold text-xl mb-4 text-center">Host Benefits</h3>
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
              Powerful tools for tournament organizers. Manage brackets, prizes, and participants
              effortlessly.
            </p>
            <div className="text-center">
              <Link
                to="/features/hosting"
                className="text-[#8b5cf6] text-sm font-bold hover:text-[#a78bfa] transition-colors inline-flex items-center gap-1"
              >
                Learn More <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Revolution Section */}
      <section className="section-wrapper relative z-10 join-revolution-section">
        <div className="revolution-card cyber-card">
          <div className="revolution-glow"></div>
          <div className="revolution-icon-box">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 12h.01" />
              <path d="M10 12h.01" />
              <path d="M15 12h.01" />
              <path d="M18 12h.01" />
            </svg>
          </div>
          <h2 className="revolution-title">Join the Revolution</h2>
          <p className="revolution-description">
            Ready to be part of something bigger? Join thousands of gamers who are already building
            the future of competitive gaming
          </p>
          <div className="revolution-ctas">
            <Link to="/tournaments" className="cta-btn gaming-button find-battles-btn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              FIND BATTLES
            </Link>
            <Link to="/help" className="cta-btn secondary help-centre-btn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              HELP CENTRE
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
