import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, Mail, Lock, Phone, User, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { authAPI } from '../../../utils/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const PlayerRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifiedToken, setOtpVerifiedToken] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const phoneFieldRef = React.useRef(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = location.state?.next || '/player/dashboard';

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset OTP state if phone number changes
    if (e.target.name === 'phone_number') {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpVerifiedToken('');
      setOtpCode('');
    }
  };

  const handleSendOTP = useCallback(async () => {
    setError('');
    const phone = formData.phone_number.trim();
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setOtpLoading(true);
    try {
      await authAPI.sendRegistrationOTP(phone);
      setOtpSent(true);
      setOtpCountdown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  }, [formData.phone_number]);

  const handleVerifyOTP = useCallback(async () => {
    setError('');
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authAPI.verifyRegistrationOTP(formData.phone_number.trim(), otpCode);
      setOtpVerified(true);
      setOtpVerifiedToken(res.data.otp_verified_token);
      setOtpError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  }, [formData.phone_number, otpCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password2) {
      setError("Passwords don't match");
      return;
    }

    if (!otpVerified || !otpVerifiedToken) {
      const msg = otpSent
        ? 'Please enter the OTP sent to your phone and click Verify.'
        : 'Please send and verify the OTP for your phone number.';
      setOtpError(msg);
      phoneFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setOtpError('');

    setLoading(true);

    try {
      const payload = { ...formData, otp_verified_token: otpVerifiedToken };
      console.log('[DEBUG] Registration payload:', payload); // Debug log
      const response = await authAPI.playerRegister(payload);
      // If backend returns tokens (auto-login), use them
      if (response.data?.tokens && response.data?.user) {
        login(response.data.user, response.data.tokens);
        navigate(nextPath);
      } else {
        // Otherwise redirect to login so user can verify and then login
        navigate('/player/login', { state: { next: nextPath } });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMsg);

      // If token expired, allow user to resend OTP without losing form data
      if (
        errorMsg.includes('Phone verification expired') ||
        errorMsg.includes('otp_verified_token')
      ) {
        setOtpVerified(false);
        setOtpVerifiedToken('');
        setOtpCode('');
        setOtpSent(false);
        // Phone field will unlock, user can click "Send OTP" again
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      // Call backend to create Google account immediately. Backend will generate username if needed.
      const response = await authAPI.googleAuth({
        token: credentialResponse.credential,
        user_type: 'player',
        is_signup: true,
      });

      if (response.data?.tokens && response.data?.user) {
        login(response.data.user, response.data.tokens);
        if (!response.data.profile?.in_game_name || !response.data.profile?.game_id) {
          // Pass nextPath so after profile edit the user gets back to e.g. /join-team/:token
          navigate('/player/dashboard', { state: { showProfileEdit: true, next: nextPath } });
        } else {
          navigate(nextPath);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed. Please try again.');
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
                  Create Player Account
                </h1>
                <p className="text-muted-foreground mt-2 text-center text-sm">
                  Join ScrimVerse to compete in tournaments
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Google Sign Up Button */}
                <div className="relative">
                  <button
                    type="button"
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
                    Sign up with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                    or continue with email
                  </span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div className="space-y-4">
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

                  {/* Username field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number + OTP */}
                  <div className="space-y-2" ref={phoneFieldRef}>
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          name="phone_number"
                          type="tel"
                          required
                          value={formData.phone_number}
                          onChange={handleChange}
                          placeholder="10-digit number"
                          maxLength="10"
                          disabled={otpVerified}
                          className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                        />
                      </div>
                      {!otpVerified && (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={
                            otpLoading ||
                            otpCountdown > 0 ||
                            formData.phone_number.trim().length !== 10
                          }
                          className="px-4 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {otpLoading
                            ? '...'
                            : otpCountdown > 0
                              ? `${otpCountdown}s`
                              : otpSent
                                ? 'Resend'
                                : 'Send OTP'}
                        </button>
                      )}
                      {otpVerified && (
                        <div className="flex items-center px-3 text-green-500 text-sm font-bold whitespace-nowrap">
                          Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OTP Input — only show after OTP is sent and before verified */}
                  {otpSent && !otpVerified && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Enter OTP</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(e) => {
                            setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                            if (otpError) setOtpError('');
                          }}
                          placeholder="6-digit OTP"
                          maxLength="6"
                          className={`block flex-1 px-4 py-3 bg-secondary border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${otpError ? 'border-destructive' : 'border-border'}`}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={otpLoading || otpCode.length !== 6}
                          className="px-4 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {otpLoading ? '...' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        OTP sent to +91{formData.phone_number}. Valid for 10 minutes.
                      </p>
                    </div>
                  )}

                  {/* Inline OTP error — shown when Register clicked without verifying */}
                  {otpError && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-medium">
                      <span>⚠</span> {otpError}
                    </div>
                  )}

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

                  {/* Confirm Password field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        name="password2"
                        type="password"
                        required
                        value={formData.password2}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !otpVerified}
                  className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </form>

              {/* Sign in link */}
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/player/login"
                    state={{ next: nextPath }}
                    className="font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PlayerRegister;
