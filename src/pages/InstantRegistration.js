import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './InstantRegistration.css';

const InstantRegistration = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fastFeatures = [
    {
      title: 'One-Click Registration',
      description:
        'Register for tournaments with a single click using your saved profile and payment symbols.',
      icon: (
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
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      color: 'blue',
    },
    {
      title: 'Instant Confirmations',
      description:
        'Receive immediate confirmation via email, and in-app notifications the moment you join.',
      icon: (
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      color: 'green',
    },
    {
      title: 'Secure Processing',
      description:
        'Lightning-fast payment processing with multiple options and bank-grade security.',
      icon: (
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
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
      color: 'purple',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Find Tournament',
      description: 'Browse and select your preferred gaming event from our vast listing.',
      icon: '🌐',
    },
    {
      number: '02',
      title: 'Quick Register',
      description: 'Click register and confirm your gaming details in one tap.',
      icon: '⚡',
    },
    {
      number: '03',
      title: 'Instant Payment',
      description: 'Pay securely with saved UPI, cards or wallets in seconds.',
      icon: '💳',
    },
    {
      number: '04',
      title: 'Ready to Play',
      description: 'Get instant bracket placement and join the tournament Discord.',
      icon: '✅',
    },
  ];

  return (
    <div className="instant-registration-page particle-bg">
      <div className="cyber-grid"></div>

      {/* Hero Section */}
      <section className="instant-hero animate-fade-up">
        <div className="instant-main-icon bolt-glow">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h1 className="instant-hero-title">
          Instant <span className="title-verse">Registration</span>
        </h1>
        <p className="instant-hero-subtitle">
          Register for tournaments in seconds, not explorer. Our streamlined process gets you from
          discovery to competition faster than ever.
        </p>
      </section>

      {/* Features Grid */}
      <section className="instant-section">
        <div className="fast-features-grid">
          {fastFeatures.map((feature) => (
            <div key={feature.title} className="fast-feature-card cyber-card hover-lift">
              <div className={`fast-feature-icon-box ${feature.color}-glow`}>{feature.icon}</div>
              <h3 className="fast-feature-title">{feature.title}</h3>
              <p className="fast-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="instant-section">
        <div className="text-center mb-16">
          <h2 className="instant-section-title">
            THE 30-SECOND <span className="title-verse">FLOW</span>
          </h2>
          <p className="instant-section-subtitle">Speed defined by four simple steps</p>
        </div>

        <div className="steps-flow-grid">
          {steps.map((step) => (
            <div key={step.number} className="flow-step-item">
              <div className="flow-step-badge">{step.number}</div>
              <div className="flow-step-icon">{step.icon}</div>
              <h3 className="flow-step-title">{step.title}</h3>
              <p className="flow-step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Speed Comparison */}
      <section className="instant-section">
        <div className="comparison-container">
          <div className="comparison-card traditional">
            <div className="comparison-header">
              <span className="time-label">5-10 MIN</span>
              <h3>Traditional Platforms</h3>
            </div>
            <ul className="comparison-list">
              <li>Manual form filling every time</li>
              <li>Slow manual verification</li>
              <li>Multiple payment redirects</li>
              <li>Delayed slot confirmation</li>
            </ul>
          </div>

          <div className="comparison-card scrimverse glow-border-purple">
            <div className="comparison-header">
              <span className="time-label highlight">30 SEC</span>
              <h3>ScrimVerse Platform</h3>
            </div>
            <ul className="comparison-list">
              <li>One-click automated registration</li>
              <li>Instant profile data sync</li>
              <li>Integrated fast checkout</li>
              <li>Immediate slot confirmation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Mobile Optimization */}
      <section className="instant-section mobile-promo">
        <div className="glass-card promo-card">
          <div className="promo-content">
            <h2 className="promo-title">Mobile-First Experience</h2>
            <p className="promo-text">
              Register for tournaments on the go. Whether you're on your phone, tablet, or desktop,
              the experience is seamless and optimized for speed.
            </p>
            <div className="promo-badges">
              <span className="promo-badge">Touch Optimized</span>
              <span className="promo-badge">Fast Checkout</span>
              <span className="promo-badge">Real-time Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="instant-cta-section">
        <div className="revolution-card cyber-card animated-glow-border">
          <h2 className="revolution-title">Experience the Speed</h2>
          <p className="revolution-description">
            Join the fastest-growing esports platform and experience tournament registration like
            never before.
          </p>
          <div className="revolution-ctas">
            <Link to="/tournaments" className="cta-btn gaming-button find-battles-btn">
              TRY INSTANT REGISTRATION
            </Link>
            <Link to="/player/register" className="cta-btn secondary help-centre-btn">
              CREATE PROFILE
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InstantRegistration;
