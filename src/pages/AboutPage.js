import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './AboutPage.css';

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-wrapper">
      <div className="about-glow-purple"></div>
      <div className="about-glow-blue"></div>

      <div className="about-container">
        {/* Hero Section */}

        <header className="about-hero">
          <h1 className="about-hero-title">About ScrimVerse</h1>
          <p className="about-hero-subtitle">
            Building the ultimate gaming ecosystem where legends are born, skills are tested, and
            communities thrive in the competitive arena.
          </p>
        </header>

        {/* Mission Card */}
        <div className="mission-card">
          <div className="mission-content">
            <h2 className="mission-title">Our Mission</h2>
            <p className="mission-text">
              We're democratizing competitive gaming by creating a platform where players of all
              skill levels can compete, grow, and earn recognition. From casual scrims to
              professional tournaments, ScrimVerse provides the tools and infrastructure to make
              esports accessible to everyone.
            </p>
          </div>
          <div className="mission-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              <circle cx="8" cy="14" r="2" />
              <path d="M15 11h2" />
              <path d="M15 14h2" />
            </svg>
          </div>
        </div>

        {/* Our Values */}
        <div className="section-header">
          <span className="section-tag">Core Principles</span>
          <h2 className="section-title">Our Values</h2>
        </div>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="value-title">Fair Play</h3>
            <p className="value-desc">
              Equal opportunity for all players with strict anti-cheat measures.
            </p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="18" cy="12" r="1" />
              </svg>
            </div>
            <h3 className="value-title">Community</h3>
            <p className="value-desc">
              Building connections and friendships through competitive gaming.
            </p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className="value-title">Excellence</h3>
            <p className="value-desc">
              High-quality features and dedicated support for every user.
            </p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <h3 className="value-title">Passion</h3>
            <p className="value-desc">Built by gamers who love and understand the community.</p>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="section-header">
          <span className="section-tag">Platform Features</span>
          <h2 className="section-title">What Makes Us Different</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                <circle cx="12" cy="6" r="1.5" />
              </svg>
            </div>
            <h3 className="feature-title">Advanced Tournament System</h3>
            <p className="feature-desc">
              Custom brackets, automated scheduling, and live statistics tracking.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6" />
                <path d="M23 11h-6" />
                <path d="M17 21v-2a4 4 0 0 0-1.5-3.1" />
              </svg>
            </div>
            <h3 className="feature-title">Clan Management</h3>
            <p className="feature-desc">
              Comprehensive tools for team recruitment, coordination, and performance tracking.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h3 className="feature-title">Skill Matching</h3>
            <p className="feature-desc">
              Algorithmic matchmaking ensures balanced and competitive gameplay.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <h3 className="feature-title">Achievement System</h3>
            <p className="feature-desc">
              Detailed player statistics, rankings, and achievement badges.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h3 className="feature-title">Real-time Updates</h3>
            <p className="feature-desc">
              Instant notifications for match results, tournament updates, and team activities.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
                <path d="M16.24 7.76A6 6 0 1 0 19.07 19.07" />
              </svg>
            </div>
            <h3 className="feature-title">24/7 Support</h3>
            <p className="feature-desc">
              Dedicated support team available around the clock for technical assistance.
            </p>
          </div>
        </div>

        {/* Built by Gamers */}
        <section className="built-section">
          <h2 className="built-title">Built by Gamers, For Gamers</h2>
          <p className="built-desc">
            Our team consists of esports professionals, tournament organizers, and tech enthusiasts
            who understand the gaming community.
          </p>
          <div className="badges-container">
            <span className="badge-pill">🏆 Tournament Winners</span>
            <span className="badge-pill">👥 Community Leaders</span>
            <span className="badge-pill">💻 Tech Innovators</span>
          </div>
        </section>

        {/* Our Impact */}
        <div className="section-header">
          <span className="section-tag">Statistics</span>
          <h2 className="section-title">Our Impact</h2>
        </div>
        <div className="stats-board">
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Active Players</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Tournaments</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">₹50L+</div>
            <div className="stat-label">Prize Money</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">200+</div>
            <div className="stat-label">Active Clans</div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="cta-section">
          <h2 className="cta-title">Join the Revolution</h2>
          <p className="cta-desc">
            Be part of India's fastest-growing esports community. Compete, connect, and conquer.
          </p>
          <Link to="/player/register" className="cta-btn">
            Join Community
          </Link>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
