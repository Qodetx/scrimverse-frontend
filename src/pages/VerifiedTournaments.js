import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './VerifiedTournaments.css';

const VerifiedTournaments = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const verificationSteps = [
    {
      number: '01',
      title: 'Host Verification',
      description:
        'Tournament organizers undergo identity verification and background checks to ensure legitimacy.',
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Prize Pool Security',
      description:
        'All prize money is held in secure escrow until tournament completion, protecting both players and hosts.',
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
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Rule Compliance',
      description:
        'Tournament rules are reviewed for fairness and competitive integrity before the event starts.',
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      number: '04',
      title: 'Live Monitoring',
      description:
        'Real-time oversight of matches to ensure adherence to professional standards and fair play.',
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
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  const benefits = [
    {
      title: 'Guaranteed Payouts',
      description:
        'Winners receive their prizes within 7 days, guaranteed by our secure escrow system.',
      icon: '🏆',
    },
    {
      title: 'Fair Play Assurance',
      description: 'Anti-cheat measures and fair play monitoring ensure competitive integrity.',
      icon: '🛡️',
    },
    {
      title: 'Professional Standards',
      description: 'All verified tournaments meet professional esports standards for hosting.',
      icon: '⭐',
    },
  ];

  return (
    <div className="verified-page-container particle-bg">
      <div className="cyber-grid"></div>

      {/* Hero Section */}
      <section className="verified-hero animate-fade-up">
        <div className="verified-main-icon shield-glow">
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 className="verified-hero-title">
          Verified <span className="title-verse">Tournaments</span>
        </h1>
        <p className="verified-hero-subtitle">
          Play with confidence knowing every tournament is verified for legitimacy, fair play, and
          guaranteed prize distribution.
        </p>
      </section>

      {/* Process Section */}
      <section className="verified-section">
        <div className="text-center mb-16">
          <h2 className="verified-section-title">
            OUR VERIFICATION <span className="title-verse">PROCESS</span>
          </h2>
          <p className="verified-section-subtitle">
            A rigorous multi-step check to ensure the highest standards
          </p>
        </div>

        <div className="verification-steps-grid">
          {verificationSteps.map((step) => (
            <div key={step.number} className="step-card cyber-card hover-lift">
              <div className="step-number-badge">{step.number}</div>
              <div className="step-icon-wrapper shield-glow">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="verified-stats-section">
        <div className="stats-inner-grid">
          <div className="stat-item">
            <span className="stat-number">₹50L+</span>
            <span className="stat-label">Total Prize Pool</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">250+</span>
            <span className="stat-label">Verified Events</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">Payout Success</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="verified-section">
        <div className="text-center mb-16">
          <h2 className="verified-section-title">
            WHY CHOOSE <span className="title-verse">VERIFIED?</span>
          </h2>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="benefit-card glass-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="verified-cta-section">
        <div className="revolution-card cyber-card">
          <h2 className="revolution-title">Ready to Compete Safely?</h2>
          <p className="revolution-description">
            Join thousands of players who trust ScrimVerse for secure, verified tournament
            experiences.
          </p>
          <div className="revolution-ctas">
            <Link to="/tournaments" className="cta-btn gaming-button find-battles-btn">
              BROWSE TOURNAMENTS
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VerifiedTournaments;
