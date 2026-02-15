import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo">
              <span className="logo-text">
                Scrim<span className="text-purple">Verse</span>
              </span>
            </div>
            <p className="desc">
              The ultimate platform for competitive gaming tournaments and scrimmages. Join
              thousands of players competing for glory and prizes.
            </p>
            <div className="social-links-brand">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
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
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
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
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/tournaments">Tournaments</Link>
              </li>
              <li>
                <Link to="/scrims">Scrims</Link>
              </li>
              <li>
                <Link to="/leaderboard">Leaderboards</Link>
              </li>
              <li>
                <Link to="/search">Teams</Link>
              </li>
              <li>
                <Link to="/host/register">Host Tournament</Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <ul className="footer-links">
              <li>
                <Link to="/help">Help Center</Link>
              </li>
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              <li>
                <Link to="/report-issue">Report Issue</Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <ul className="contact-info-list">
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a href="mailto:support@scrimverse.com">support@scrimverse.com</a>
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>+91 8867495185</span>
              </li>
              <li>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/about">About Us</Link>
          </div>
          <div className="footer-bottom-right">
            <p className="copyright-text">
              © {new Date().getFullYear()} ScrimVerse. All rights reserved.{' '}
              <span className="powered-by">Powered by ScrimVerse</span> • Built for the community,
              powered by competition.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
