import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './TermsPage.css';

const TermsPage = () => {
  return (
    <div className="terms-page-wrapper">
      {/* Background Decorations */}
      <div className="cyber-grid"></div>
      <div className="glow-accent-top"></div>
      <div className="glow-accent-bottom"></div>
      <div className="scanlines"></div>

      <div className="terms-container">
        {/* Hero Section */}
        <header className="terms-hero">
          <div className="doc-icon-box">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </div>
          <h1 className="terms-title">
            Terms of <span className="text-accent">Service</span>
          </h1>
          <p className="effective-date">Effective Date: January 11, 2026</p>
          <p className="terms-intro">
            Please read these terms carefully. By using ScrimVerse, you agree to follow the rules
            outlined below. We build these standards to ensure a fair, competitive, and respectful
            environment for every gamer.
          </p>
        </header>

        <div className="terms-content-grid">
          {/* Section 1 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h2>1. Account Registration & Eligibility</h2>
            </div>
            <div className="section-body">
              <ul>
                <li>
                  <strong>Age Requirement:</strong> You must be at least 13 years old to use
                  ScrimVerse. If you are under 18, you must have parental consent.
                </li>
                <li>
                  <strong>Account Responsibility:</strong> You are responsible for maintaining the
                  security of your account and password. ScrimVerse cannot and will not be liable
                  for any loss from your failure to comply.
                </li>
                <li>
                  <strong>One Account Policy:</strong> Each player is allowed only one ScrimVerse
                  account. Multi-accounting to exploit rewards or bypass bans will result in
                  permanent suspension.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
              <h2>2. Tournament & Competition Rules</h2>
            </div>
            <div className="section-body">
              <ul>
                <li>
                  <strong>Binding Schedules:</strong> By registering for a tournament, you commit to
                  the scheduled match times. Failing to show up may result in disqualification and
                  rank penalties.
                </li>
                <li>
                  <strong>Prize Distribution:</strong> Prizes are distributed after result
                  verification. Any taxes or fees associated with prizes are the responsibility of
                  the winner.
                </li>
                <li>
                  <strong>Dispute Timelines:</strong> Any protests or disputes regarding match
                  results must be raised through the proper channels within 24 hours of the match
                  completion.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
                </svg>
              </div>
              <h2>3. Fair Play & Anti-Cheat Policy</h2>
            </div>
            <div className="section-body">
              <p>Integrity is the core of ScrimVerse. We have a zero-tolerance policy towards:</p>
              <ul>
                <li>
                  <strong>Hacks & Exploits:</strong> Use of aimbots, wallhacks, or any third-party
                  software that provides an unfair advantage.
                </li>
                <li>
                  <strong>Match Fixing:</strong> Intentionally losing or manipulating results for
                  gain.
                </li>
                <li>
                  <strong>Smurfing:</strong> High-level players playing on low-rank accounts to
                  exploit lower-tier competitions.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2>4. Code of Conduct</h2>
            </div>
            <div className="section-body">
              <p>
                All users must maintain a high standard of sportsmanship. Prohibited behaviors
                include:
              </p>
              <ul>
                <li>Toxicity, harassment, or hate speech directed at any community member.</li>
                <li>Doxxing or sharing personal information of others without consent.</li>
                <li>Impersonating ScrimVerse staff or other prominent players.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <h2>5. Intellectual Property</h2>
            </div>
            <div className="section-body">
              <p>
                All content provided on the ScrimVerse platform, including logos, designs, text, and
                software, is the property of ScrimVerse. You are granted a limited, non-exclusive
                license to use the platform for its intended competitive purposes.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <rect x="9" y="8" width="6" height="6" rx="1"></rect>
                </svg>
              </div>
              <h2>6. Prohibited Activities</h2>
            </div>
            <div className="section-body">
              <ul>
                <li>Attempting to hack or breach the security of the ScrimVerse platform.</li>
                <li>
                  Selling, trading, or transferring your ScrimVerse account to another individual.
                </li>
                <li>
                  Engaging in "Real Money Trading" (RMT) for platform-exclusive digital assets.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7 - Penalties */}
          <section className="terms-section-card wide-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h2>7. Penalties & Enforcement</h2>
            </div>
            <div className="section-body">
              <div className="penalties-grid">
                <div className="penalty-tier low">
                  <span className="tier-badge">Level 1</span>
                  <h4>Minor Violations</h4>
                  <p>First-time behavior issues or minor rule confusion.</p>
                  <p className="consequence">Consequence: Warning & Rank Deduction</p>
                </div>
                <div className="penalty-tier medium">
                  <span className="tier-badge">Level 2</span>
                  <h4>Moderate Violations</h4>
                  <p>Toxicity, repeat offending, or unsportsmanlike conduct.</p>
                  <p className="consequence">Consequence: Temporary Ban (3-30 Days)</p>
                </div>
                <div className="penalty-tier high">
                  <span className="tier-badge">Level 3</span>
                  <h4>Critical Violations</h4>
                  <p>Cheating, match-fixing, or extreme harassment.</p>
                  <p className="consequence">Consequence: Permanent IP & Account Ban</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h2>8. Limitation of Liability</h2>
            </div>
            <div className="section-body">
              <p>
                ScrimVerse provides its services on an "as is" and "as available" basis. We are not
                liable for service interruptions, lost data, or match results affected by technical
                issues beyond our immediate control (e.g., ISP failures, game server outages).
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="M8 11h8"></path>
                  <path d="M8 15h8"></path>
                  <path d="M8 7h8"></path>
                </svg>
              </div>
              <h2>9. Dispute Resolution</h2>
            </div>
            <div className="section-body">
              <ol className="dispute-list">
                <li>
                  <span className="step-num">1</span>
                  <p>
                    Informal Resolution: Contact support and attempt to resolve the issue within 30
                    days.
                  </p>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <p>
                    Arbitration: If informal resolution fails, disputes will be settled via binding
                    arbitration.
                  </p>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <p>
                    Jurisdiction: Standard operations follow the legal jurisdiction of Bengaluru,
                    India.
                  </p>
                </li>
              </ol>
            </div>
          </section>

          {/* Section 10 */}
          <section className="terms-section-card">
            <div className="section-header">
              <div className="section-icon">
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
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <h2>10. Changes to Terms</h2>
            </div>
            <div className="section-body">
              <p>
                We may update our Terms from time to time. We will notify users of any significant
                changes via the platform or registered email. Continued use of the platform
                constitutes acceptance of the new terms.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Contact */}
        <section className="terms-contact-foot">
          <h3>Questions about our Terms?</h3>
          <p>Our legal team is here to help you understand your rights and responsibilities.</p>
          <div className="contact-btns">
            <Link to="/contact" className="contact-btn-primary">
              Contact Support
            </Link>
            <a href="mailto:legal@scrimverse.com" className="contact-btn-secondary">
              Email Legal Team
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
