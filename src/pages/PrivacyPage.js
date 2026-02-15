import React from 'react';
import Footer from '../components/Footer';
import './PrivacyPage.css';

const PrivacyPage = () => {
  return (
    <div className="privacy-page-wrapper">
      {/* Background Decorations */}
      <div className="cyber-grid"></div>
      <div className="glow-accent-top"></div>
      <div className="glow-accent-bottom"></div>
      <div className="scanlines"></div>

      <div className="privacy-container">
        {/* Hero Section */}
        <header className="privacy-hero">
          <div className="shield-icon-box">
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h1 className="privacy-title">
            Privacy <span className="text-accent">Policy</span>
          </h1>
          <p className="effective-date">Last Updated: January 11, 2026</p>
          <p className="privacy-intro">
            Your privacy matters to us. Learn how ScrimVerse collects, uses, and protects your
            information to provide a secure and competitive gaming experience.
          </p>
        </header>

        <div className="privacy-content-grid">
          {/* Section 1 */}
          <section className="privacy-section-card">
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                  <polyline points="10 9 15 14 25 4"></polyline>
                </svg>
              </div>
              <h2>1. Information We Collect</h2>
            </div>
            <div className="section-body">
              <ul>
                <li>
                  <strong>Account Information:</strong> Email address, username, and authentication
                  credentials.
                </li>
                <li>
                  <strong>Gaming Data:</strong> In-game statistics, match history, team
                  affiliations, and tournament performance.
                </li>
                <li>
                  <strong>Device Information:</strong> IP address, browser type, operating system,
                  and device identifiers.
                </li>
                <li>
                  <strong>Usage Data:</strong> Pages visited, features used, and time spent on the
                  platform.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="privacy-section-card">
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
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h2>2. How We Use Your Information</h2>
            </div>
            <div className="section-body">
              <p>We use your data to power the ScrimVerse experience:</p>
              <ul>
                <li>
                  <strong>Service Delivery:</strong> Managing tournaments, scrimmages, and account
                  features.
                </li>
                <li>
                  <strong>Leaderboards:</strong> Calculating and displaying player rankings and
                  statistics globally.
                </li>
                <li>
                  <strong>Communication:</strong> Sending updates, security alerts, and platform
                  announcements.
                </li>
                <li>
                  <strong>Analytics:</strong> Improving our platform features and understanding user
                  behavior.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="privacy-section-card">
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
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
              </div>
              <h2>3. Information Sharing</h2>
            </div>
            <div className="section-body">
              <p>
                We respect your data. We never sell your personal information. Sharing occurs only
                for:
              </p>
              <ul>
                <li>
                  <strong>Public Profiles:</strong> Your username and gaming stats are visible to
                  other community members.
                </li>
                <li>
                  <strong>Tournament Data:</strong> Results and team info shared with relevant
                  tournament organizers.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> Sharing required by law or to protect our
                  community from fraud.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="privacy-section-card">
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h2>4. Data Security</h2>
            </div>
            <div className="section-body">
              <p>
                We implement industry-standard security measures, including SSL/TLS encryption and
                secure database storage, to protect your data from unauthorized access or
                disclosure.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="privacy-section-card">
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
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
              <h2>5. Your Rights & Choices</h2>
            </div>
            <div className="section-body">
              <p>You have full control over your data:</p>
              <ul>
                <li>
                  <strong>Access & Correction:</strong> View and update your profile details at any
                  time.
                </li>
                <li>
                  <strong>Data Deletion:</strong> Request the permanent removal of your account and
                  personal data.
                </li>
                <li>
                  <strong>Email Opt-out:</strong> Unsubscribe from marketing communications via
                  account settings.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="privacy-section-card">
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
                  <line x1="12" y1="22" x2="12" y2="10"></line>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20z"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
              <h2>6. Cookies & Tracking</h2>
            </div>
            <div className="section-body">
              <p>
                We use essential cookies to keep you logged in and analytics cookies to improve our
                services. You can manage cookie preferences through your browser settings.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="privacy-section-card">
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
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h2>7. Children's Privacy</h2>
            </div>
            <div className="section-body">
              <p>
                ScrimVerse is not intended for users under the age of 13. We do not knowingly
                collect personal information from children. If we discover such data, we will delete
                it immediately.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="privacy-section-card">
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
              <h2>8. Changes to This Policy</h2>
            </div>
            <div className="section-body">
              <p>
                We may update this Privacy Policy periodically. Significant changes will be
                announced on our platform or sent to your registered email address.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Contact */}
        <section className="privacy-contact-foot">
          <h3>Need more information?</h3>
          <p>Our privacy team is available to answer any questions regarding your personal data.</p>
          <div className="contact-btns">
            <a href="mailto:privacy@scrimverse.com" className="contact-btn-primary">
              Email Privacy Team
            </a>
            <a href="mailto:support@scrimverse.com" className="contact-btn-secondary">
              General Support
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
