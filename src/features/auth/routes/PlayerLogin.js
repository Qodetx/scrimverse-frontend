import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, Mail, Lock, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { authAPI } from '../../../utils/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const PlayerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = location.state?.next || '/player/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({
        ...formData,
        user_type: 'player',
      });

      login(response.data.user, response.data.tokens);
      navigate(nextPath);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setError('');
    setLoading(true);

    try {
      // Initialize Google Sign-In
      const { google } = window;
      if (!google) {
        setError('Google Sign-In not available. Please try again.');
        setLoading(false);
        return;
      }

      google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      });

      google.accounts.id.renderButton(document.getElementById('google-button'), {
        type: 'standard',
        size: 'large',
        text: 'continue_with',
        logo_alignment: 'left',
      });

      // Trigger the sign-in flow
      google.accounts.id.prompt(async (notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use One Tap or redirect to Google login
          try {
            const response = await new Promise((resolve, reject) => {
              google.accounts.id.renderButton(document.getElementById('google-button-fallback'), {
                type: 'standard',
                size: 'large',
                text: 'continue_with',
              });
            });
          } catch (err) {
            setError('Google login not available. Please use email and password.');
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.googleAuth({
        token: credentialResponse.credential,
        user_type: 'player',
        is_signup: false,
      });

      login(response.data.user, response.data.tokens);
      navigate(nextPath);
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.error === 'account_not_found') {
        setError('No account found with this Google account. Redirecting to signup...');
        setTimeout(() => {
          navigate('/player/register', { state: { next: nextPath } });
        }, 2000);
      } else {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Google login failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="w-full">
            <div className="cyber-card border border-primary/30 p-8">
              {/* Header with icon */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Player Sign In
                </h1>
                <p className="text-muted-foreground mt-2 text-center text-sm">
                  Welcome back! Sign in to access your tournaments
                </p>
              </div>

              <div className="space-y-6">
                {/* Google Sign In Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    className="w-full py-3 px-4 border border-border rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>
                  <div id="google-button" style={{ display: 'none' }}></div>
                  <div id="google-button-fallback" style={{ display: 'none' }}></div>
                </div>

                {/* Divider */}
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                    or continue with email
                  </span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Forgot password */}
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password?type=player"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                {/* Sign up link */}
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link
                      to="/player/register"
                      state={{ next: nextPath }}
                      className="font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PlayerLogin;
