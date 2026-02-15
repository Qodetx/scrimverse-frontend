import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Home, UserPlus, Mail } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Get login function from AuthContext
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [userType, setUserType] = useState(null); // 'player' or 'host'
  const hasVerified = useRef(false); // Prevent double verification in React Strict Mode

  useEffect(() => {
    // Only verify once, even if useEffect runs twice (React 18 Strict Mode)
    if (!hasVerified.current) {
      hasVerified.current = true;
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/accounts/verify-email/${token}/`);

      const data = await response.json();

      if (response.ok) {
        // Check if already verified
        if (data.already_verified) {
          setStatus('success');
          setMessage('Your email was already verified! Logging you in...');
          setUserData(data.user);
          setUserType(data.user?.user_type || null);
        } else {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! Your account is now active.');
          setUserData(data.user);
          setUserType(data.user?.user_type || null);
        }

        // Auto-login: Use AuthContext's login function to properly update auth state
        if (data.tokens) {
          const tokenData = {
            access: data.tokens.access,
            refresh: data.tokens.refresh,
          };

          // Use AuthContext's login function to update both localStorage AND state
          login(data.user, tokenData);

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            if (data.user?.user_type === 'player') {
              navigate('/player/dashboard');
            } else if (data.user?.user_type === 'host') {
              navigate('/host/dashboard');
            } else {
              navigate('/');
            }
          }, 2000);
        }
      } else {
        // Only show error if we haven't already succeeded
        // (This prevents showing errors from duplicate requests in Strict Mode)
        if (status !== 'success') {
          setStatus('error');
          setMessage(data.error || data.message || 'Verification failed');
          // Extract user_type from error response if available
          if (data.user_type) {
            setUserType(data.user_type);
          }
        }
      }
    } catch (err) {
      // Only show error if we haven't already succeeded
      if (status !== 'success') {
        console.error('💥 Verification error:', err);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        {status === 'verifying' && (
          <div className="verify-status verifying">
            <div className="spinner-wrapper">
              <div className="spinner"></div>
            </div>
            <h2>Verifying Your Email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-status success">
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <CheckCircle2 size={60} strokeWidth={2.5} />
              </div>
            </div>
            <h2>Email Verified Successfully! ✅</h2>
            <p>{message}</p>
            {userData && (
              <div className="user-info">
                <p>
                  <strong>Email:</strong> {userData.email}
                </p>
                <p>
                  <strong>Username:</strong> {userData.username}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: 'hsl(142 76% 60%)', fontWeight: 'bold' }}>Active ✓</span>
                </p>
              </div>
            )}
            <p className="success-note">
              🎉 Your account is now active! Redirecting you to your dashboard...
            </p>
            <div className="redirect-message">
              <div className="redirect-spinner"></div>
              <span>Preparing your dashboard...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-status error">
            <div className="error-icon-wrapper">
              <div className="error-icon">
                <XCircle size={60} strokeWidth={2.5} />
              </div>
            </div>
            <h2>Verification Failed ❌</h2>
            <p>{message}</p>
            <div className="error-actions">
              <button className="home-button" onClick={() => navigate('/')}>
                <Home size={18} />
                Go to Home
              </button>
              {userType && (
                <button
                  className="register-button"
                  onClick={() => navigate(`/${userType}/register`)}
                >
                  <UserPlus size={18} />
                  Register Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
