import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Home, LogIn, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import './CheckEmail.css';

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email || email === 'your email') {
      setError('Email address not found. Please try registering again.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/accounts/resend-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Verification email resent successfully!');
      } else {
        setError(data.error || 'Failed to resend email. Please try again later.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="check-email-page">
      <div className="check-email-container">
        <div className="email-icon-wrapper">
          <div className="email-icon">
            <Mail size={60} strokeWidth={2} />
          </div>
        </div>

        <h1>Check Your Email 📧</h1>

        <p className="main-message">We've sent a verification link to:</p>

        <div className="email-display">
          <strong>{email}</strong>
        </div>

        {message && (
          <p className="success-message-inline">
            <CheckCircle2
              size={16}
              style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}
            />
            {message}
          </p>
        )}
        {error && (
          <p className="error-message-inline">
            <AlertCircle
              size={16}
              style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}
            />
            {error}
          </p>
        )}

        <div className="instructions">
          <h3>Next Steps:</h3>
          <ol>
            <li>Open your email inbox</li>
            <li>Look for an email from Scrimverse</li>
            <li>Click the verification link in the email</li>
            <li>Your account will be activated automatically</li>
            <li>You'll be redirected to your dashboard!</li>
          </ol>
        </div>

        <div className="info-box">
          <p>
            <Clock
              size={16}
              style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}
            />
            <strong>Link expires in 24 hours</strong>
          </p>
          <p>
            Didn't receive the email? Check your spam folder or{' '}
            <button className="resend-link-btn" onClick={handleResend} disabled={loading}>
              {loading ? 'Resending...' : 'click here to resend'}
            </button>
          </p>
        </div>

        <div className="actions">
          <button className="home-btn" onClick={() => navigate('/')}>
            <Home
              size={18}
              style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}
            />
            Go to Home
          </button>
          <button className="login-btn" onClick={() => navigate('/player/login')}>
            <LogIn
              size={18}
              style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}
            />
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;
