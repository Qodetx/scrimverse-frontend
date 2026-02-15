import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './ReportIssuePage.css';

const ReportIssuePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    issueType: '',
    priority: '',
    title: '',
    description: '',
    steps: '',
    anonymous: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic here

    alert('Thank you for reporting this issue. Our team will investigate it within 24-48 hours.');
  };

  const issueTypes = [
    {
      id: 'bug',
      title: 'Technical Bug',
      desc: 'App crashes, errors, broken features',
      icon: (
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
          <path d="m8 2 1.88 1.88" />
          <path d="M14.12 3.88 16 2" />
          <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
          <path d="M12 20c-3.31 0-6-2.69-6-6v-1h4v2" />
          <path d="M14 15h4v-1c0-3.31-2.69-6-6-6" />
          <path d="M6 13c-1.1 0-2 .9-2 2 0 1.1.9 2 2 2" />
          <path d="M18 13c1.1 0 2 .9 2 2 0 1.1-.9 2 2 2" />
          <path d="M12 20v2" />
          <path d="M7 14h10" />
        </svg>
      ),
    },
    {
      id: 'behavior',
      title: 'Inappropriate Behavior',
      desc: 'Harassment, cheating, rule violations',
      icon: (
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
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'tournament',
      title: 'Tournament Issues',
      desc: 'Match disputes, scoring problems',
      icon: (
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
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
  ];

  return (
    <div className="report-issue-wrapper particle-bg">
      <div className="cyber-grid"></div>

      <div className="report-container">
        {/* Hero Section */}
        <header className="report-hero animate-fade-up">
          <h1 className="report-title">
            Report an <span className="title-verse">Issue</span>
          </h1>
          <p className="report-subtitle">
            Help us improve ScrimVerse by reporting bugs, inappropriate behavior, or other issues
            you encounter.
          </p>
        </header>

        <div className="report-grid">
          {/* Left Column: Quick Info */}
          <div className="report-info-column animate-fade-left">
            <div className="info-section-card glass-card">
              <div className="section-header-row">
                <div className="header-icon warning-glow">
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
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className="section-card-title">Issue Types</h2>
                  <p className="section-card-desc">Select the type of issue you're experiencing</p>
                </div>
              </div>

              <div className="issue-type-list">
                {issueTypes.map((type) => (
                  <div key={type.id} className="issue-type-item hover-lift">
                    <div className="type-icon-box">{type.icon}</div>
                    <div className="type-text">
                      <span className="type-title">{type.title}</span>
                      <p className="type-desc">{type.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="help-links-card glass-card">
              <h3 className="card-small-title">Need Help?</h3>
              <div className="help-btn-grid">
                <Link to="/help" className="help-action-btn">
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
                  Visit Help Center
                </Link>
                <Link to="/contact" className="help-action-btn">
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
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" />
                  </svg>
                  Contact Support
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="report-form-column animate-fade-right">
            <div className="form-card cyber-card">
              <h2 className="column-title">Report Details</h2>
              <p className="column-subtitle">
                Please provide as much detail as possible to help us investigate.
              </p>

              <form onSubmit={handleSubmit} className="report-form">
                <div className="form-row">
                  <div className="form-group half">
                    <label>Issue Type</label>
                    <select
                      name="issueType"
                      required
                      value={formData.issueType}
                      onChange={handleChange}
                    >
                      <option value="">Select issue type</option>
                      <option value="bug">Technical Bug</option>
                      <option value="behavior">Inappropriate Behavior</option>
                      <option value="tournament">Tournament Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>Priority Level</label>
                    <select
                      name="priority"
                      required
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      <option value="">Select priority</option>
                      <option value="low">Low - Minor issue</option>
                      <option value="medium">Medium - Affects gameplay</option>
                      <option value="high">High - Critical/Blocking</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full">
                  <label>Issue Title</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Brief description of the issue"
                    required
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full">
                  <label>Detailed Description</label>
                  <textarea
                    name="description"
                    rows="5"
                    placeholder="Please describe the issue in detail..."
                    required
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="form-group full">
                  <label>Steps to Reproduce (for bugs)</label>
                  <textarea
                    name="steps"
                    rows="3"
                    placeholder="1. Go to... 2. Click on... 3. The issue occurs..."
                    value={formData.steps}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="form-group full">
                  <label>Screenshots/Evidence</label>
                  <div className="upload-zone">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p>Drag and drop files here or click to browse</p>
                    <span>PNG, JPG, GIF up to 10MB</span>
                  </div>
                </div>

                <div className="form-check-group">
                  <input
                    type="checkbox"
                    id="anonymous"
                    name="anonymous"
                    checked={formData.anonymous}
                    onChange={handleChange}
                  />
                  <label htmlFor="anonymous">Submit this report anonymously</label>
                </div>

                <button
                  type="submit"
                  className="cta-btn gaming-button find-battles-btn full-width destructive-btn"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '8px' }}
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  SUBMIT REPORT
                </button>

                <p className="form-note">
                  Reports are reviewed within 24-48 hours. We'll contact you if we need additional
                  information.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReportIssuePage;
