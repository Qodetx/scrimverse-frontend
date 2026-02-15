import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './ContactPage.css';

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic to send message would go here

    alert('Thank you for your message! Our team will get back to you soon.');
  };

  return (
    <div className="contact-page-wrapper particle-bg">
      <div className="cyber-grid"></div>

      <div className="contact-container">
        {/* Hero Section */}
        <header className="contact-hero animate-fade-up">
          <h1 className="contact-title">
            Contact <span className="title-verse">Us</span>
          </h1>
          <p className="contact-subtitle">
            Get in touch for tournament listings, collaborations, or any queries
          </p>
        </header>

        <div className="contact-grid">
          {/* Left Column: Direct Contact */}
          <div className="contact-info-column animate-fade-left">
            <h2 className="column-title">Get In Touch</h2>

            <div className="contact-method-cards">
              <div className="info-card hover-lift">
                <div className="info-icon blue-glow">
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">8867495185</span>
                  <p className="info-desc">Available for calls and WhatsApp</p>
                </div>
              </div>

              <div className="info-card hover-lift">
                <div className="info-icon green-glow">
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
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">8867495185</span>
                  <p className="info-desc">Quick responses for urgent queries</p>
                </div>
              </div>

              <div className="info-card hover-lift">
                <div className="info-icon purple-glow">
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
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">support@scrimverse.space</span>
                  <p className="info-desc">For detailed inquiries and partnerships</p>
                </div>
              </div>
            </div>

            <div className="founder-block glass-card">
              <div className="founder-info">
                <h3 className="founder-name">Vamshi</h3>
                <span className="founder-title">Founder & CEO</span>
                <p className="founder-tagline">Building the future of Indian esports</p>
              </div>
            </div>
          </div>

          {/* Right Column: Support Form */}
          <div className="contact-form-column animate-fade-right">
            <div className="form-container-card cyber-card">
              <h2 className="column-title">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="support-form">
                <div className="form-row">
                  <div className="form-group half">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group half">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="Your phone number"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group full">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full">
                  <label>Subject</label>
                  <select name="subject" required value={formData.subject} onChange={handleChange}>
                    <option value="">Select a topic</option>
                    <option value="tournament">Tournament Listing</option>
                    <option value="partnership">Partnership / Collaboration</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group full">
                  <label>Message</label>
                  <textarea
                    name="message"
                    rows="5"
                    placeholder="Tell us about your tournament, collaboration idea, or any questions you have..."
                    required
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button type="submit" className="cta-btn gaming-button find-battles-btn full-width">
                  SEND MESSAGE
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Speed Action */}
        <section className="collaboration-cta glass-card animate-fade-up">
          <div className="collab-content">
            <h3>For Tournament Listings or Collaborations</h3>
            <p>Feel free to reach out via call or WhatsApp for quick responses</p>
          </div>
          <div className="collab-actions">
            <a href="tel:8867495185" className="collab-btn call-btn">
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call Now
            </a>
            <a href="https://wa.me/8867495185" className="collab-btn whatsapp-btn">
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
              WhatsApp
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;
