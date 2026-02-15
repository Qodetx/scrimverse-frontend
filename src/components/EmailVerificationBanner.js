import React, { useState } from 'react';
import './EmailVerificationBanner.css';

const EmailVerificationBanner = ({ user, onEmailSent }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sendVerificationEmail = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/accounts/send-verification-email/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Verification email sent! Check your inbox.');
        if (onEmailSent) onEmailSent();
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Verification email error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show banner if email is already verified
  if (user?.is_email_verified) {
    return null;
  }

  return (
    <div className="email-verification-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="banner-text">
          <h4>Verify Your Email Address</h4>
          <p>
            Please verify your email address to access all features and participate in tournaments.
            {message && <span className="success-message"> {message}</span>}
            {error && <span className="error-message"> {error}</span>}
          </p>
        </div>

        <button className="verify-button" onClick={sendVerificationEmail} disabled={loading}>
          {loading ? 'Sending...' : 'Send Verification Email'}
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
