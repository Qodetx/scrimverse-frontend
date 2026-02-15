import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './PlayerGuidelines.css';

const PlayerGuidelines = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="guidelines-wrapper">
      <div className="glow-purple"></div>
      <div className="glow-blue"></div>
      <div className="neon-line"></div>

      <div className="guidelines-container">
        {/* Hero Section */}
        <header className="guidelines-hero">
          <span className="hero-tag">Community Standards</span>
          <h1 className="guidelines-hero-title">Player Guidelines</h1>
          <p className="guidelines-hero-subtitle">
            Rules and behavioral standards for the Scrimverse community.
          </p>
        </header>

        {/* Fundamental Principles */}
        <div className="principles-grid">
          <div className="guide-card">
            <div className="card-icon">
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
            </div>
            <h3 className="card-title">Respectful Conduct</h3>
            <p className="card-text">
              Treat all players, organizers, and staff with courtesy. Harassment or toxicity is not
              tolerated.
            </p>
          </div>
          <div className="guide-card">
            <div className="card-icon">
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
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="card-title">Fair Play</h3>
            <p className="card-text">
              Competitors must play to the best of their ability while following all game and
              tournament rules.
            </p>
          </div>
          <div className="guide-card">
            <div className="card-icon">
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </svg>
            </div>
            <h3 className="card-title">Community Safety</h3>
            <p className="card-text">
              Maintain a safe environment. Report any suspicious or harmful behavior immediately.
            </p>
          </div>
        </div>

        {/* Tournament Rules */}
        <div className="section-header">
          <span className="section-label">Regulations</span>
          <h2 className="section-main-title">Tournament Rules</h2>
        </div>
        <div className="rules-list">
          <div className="rule-item">
            <div className="rule-number">01</div>
            <div className="rule-content">
              <h4>No Cheating</h4>
              <p>Use of any third-party software, exploits, or hacks is strictly prohibited.</p>
            </div>
          </div>
          <div className="rule-item">
            <div className="rule-number">02</div>
            <div className="rule-content">
              <h4>Accurate Info</h4>
              <p>Players must provide correct IGNs and team details during registration.</p>
            </div>
          </div>
          <div className="rule-item">
            <div className="rule-number">03</div>
            <div className="rule-content">
              <h4>Punctuality</h4>
              <p>Be ready at least 15 minutes before the scheduled match time.</p>
            </div>
          </div>
          <div className="rule-item">
            <div className="rule-number">04</div>
            <div className="rule-content">
              <h4>Result Reporting</h4>
              <p>
                Winners must upload clear screenshots as proof of victory within the specified time.
              </p>
            </div>
          </div>
        </div>

        {/* Violation Levels */}
        <div className="section-header">
          <span className="section-label">Enforcement</span>
          <h2 className="section-main-title">Violation Levels & Consequences</h2>
        </div>
        <div className="violations-grid">
          <div className="guide-card violation-card low">
            <span className="severity-badge low">Level 1</span>
            <h3 className="card-title">Low Severity</h3>
            <p className="card-text">
              <b>Issues:</b> Minor rule confusion or first-time minor behavior issues.
              <br />
              <b>Consequences:</b> Warning → Temporary restrictions → Short suspension.
            </p>
          </div>
          <div className="guide-card violation-card medium">
            <span className="severity-badge medium">Level 2</span>
            <h3 className="card-title">Medium Severity</h3>
            <p className="card-text">
              <b>Issues:</b> Toxicity, unsportsmanlike conduct, or repeat minor violations.
              <br />
              <b>Consequences:</b> Immediate suspension → Tournament bans → Extended restrictions.
            </p>
          </div>
          <div className="guide-card violation-card high">
            <span className="severity-badge high">Level 3</span>
            <h3 className="card-title">High Severity</h3>
            <p className="card-text">
              <b>Issues:</b> Cheating, match fixing, Doxxing, or extreme toxicity.
              <br />
              <b>Consequences:</b> Immediate permanent ban → Account termination → Legal action.
            </p>
          </div>
        </div>

        {/* Do's and Don'ts */}
        <div className="section-header">
          <span className="section-label">Best Practices</span>
          <h2 className="section-main-title">Do's and Don'ts</h2>
        </div>
        <div className="duo-grid">
          <div className="guide-card split-card success">
            <div className="split-title-icon success">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Do's</span>
            </div>
            <div className="check-list">
              <div className="check-item">
                <span className="icon-box">✓</span>
                <p>Practice good sportsmanship win or lose.</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✓</span>
                <p>Help new players learn the ropes.</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✓</span>
                <p>Report issues constructively to organizers.</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✓</span>
                <p>Stay updated on rule changes for your games.</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✓</span>
                <p>Maintain consistent performance standards.</p>
              </div>
            </div>
          </div>
          <div className="guide-card split-card danger">
            <div className="split-title-icon danger">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Don'ts</span>
            </div>
            <div className="check-list">
              <div className="check-item">
                <span className="icon-box">✗</span>
                <p>Blame teammates or opponents for losses.</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✗</span>
                <p>Share personal information (Doxxing).</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✗</span>
                <p>Engage in arguments during live matches.</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✗</span>
                <p>Use external communication to circumvent rules.</p>
              </div>
              <div className="check-item">
                <span className="icon-box">✗</span>
                <p>Abandon matches without valid reason.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <section className="guide-footer">
          <h2 className="footer-title">Questions or Concerns?</h2>
          <div className="footer-btns">
            <Link to="/help" className="guide-btn primary">
              Visit Help Center
            </Link>
            <Link to="/contact" className="guide-btn secondary">
              Contact Support
            </Link>
            <Link to="/report-issue" className="guide-btn secondary">
              Report Violation
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PlayerGuidelines;
