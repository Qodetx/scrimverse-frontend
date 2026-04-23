import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Users, Mail, Lock, ArrowLeft, Gamepad2, Trophy, Swords, BarChart3 } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { authAPI } from '../../../utils/api';

const PlayerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state (register only)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifiedToken, setOtpVerifiedToken] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpHighlight, setOtpHighlight] = useState(false);
  const otpInputRef = React.useRef(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = location.state?.next || '/player/dashboard';

  // Countdown timer for OTP resend
  React.useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'password' || e.target.name === 'password2') {
      setPasswordError('');
    }
    // Reset OTP state if phone number changes
    if (e.target.name === 'phone_number') {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpVerifiedToken('');
      setOtpCode('');
    }
  };

  const handleSendOTP = async () => {
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
      setOtpHighlight(false);
      setOtpCountdown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authAPI.verifyRegistrationOTP(formData.phone_number.trim(), otpCode);
      setOtpVerified(true);
      setOtpHighlight(false);
      setOtpVerifiedToken(res.data.otp_verified_token);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Login flow
      setLoading(true);
      try {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password,
          user_type: 'player',
        });

        login(response.data.user, response.data.tokens);
        // If phone not verified redirect to setup; replace:true removes auth page from history
        const destination =
          response.data.user?.user?.phone_verified === false ? '/player/setup' : nextPath;
        navigate(destination, { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Register flow
      if (formData.password !== formData.password2) {
        setPasswordError("Passwords don't match");
        setError('');
        return;
      }

      if (!otpVerified || !otpVerifiedToken) {
        setOtpHighlight(true);
        if (otpInputRef.current) {
          otpInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          otpInputRef.current.focus();
        }
        return;
      }

      setLoading(true);
      try {
        const payload = {
          ...formData,
          otp_verified_token: otpVerifiedToken,
          next: nextPath !== '/player/dashboard' ? nextPath : undefined,
        };
        const response = await authAPI.playerRegister(payload);
        if (response.data?.tokens && response.data?.user) {
          // Auto-login on successful registration
          login(response.data.user, response.data.tokens);
          navigate(nextPath, { replace: true });
        } else {
          // Registration successful but email verification required — go to login
          // Persist redirect so VerifyEmail can return user to their intended page
          if (nextPath && nextPath !== '/player/dashboard') {
            localStorage.setItem('post_verify_redirect', nextPath);
          }
          setError('');
          setIsLogin(true);
          setFormData({ email: '', username: '', password: '', password2: '', phone_number: '' });
          setOtpSent(false);
          setOtpVerified(false);
          setOtpVerifiedToken('');
          setOtpCode('');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
        const fieldErrors = err.response?.data?.field_errors || {};

        // Show password errors near the password field
        if (fieldErrors.password || errorMsg.toLowerCase().includes('password')) {
          setPasswordError(errorMsg);
          setError('');
        } else {
          setError(errorMsg);
          setPasswordError('');
        }

        if (
          errorMsg.includes('Phone verification expired') ||
          errorMsg.includes('otp_verified_token')
        ) {
          setOtpVerified(false);
          setOtpVerifiedToken('');
          setOtpCode('');
          setOtpSent(false);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const response = await authAPI.googleAuth({
          token: tokenResponse.access_token,
          user_type: 'player',
          is_signup: !isLogin,
        });
        login(response.data.user, response.data.tokens);
        // If phone not verified (new Google signup or existing user without phone),
        // redirect to setup page before allowing dashboard access.
        const destination =
          response.data.user?.user?.phone_verified === false ? '/player/setup' : nextPath;
        navigate(destination, { replace: true });
      } catch (err) {
        const data = err.response?.data;
        setError(data?.message || data?.error || 'Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
    },
  });

  const playerFeatures = [
    {
      icon: <Trophy className="w-5 h-5 text-primary" />,
      title: 'Compete in verified tournaments',
      sub: 'Join professionally organized events',
    },
    {
      icon: <Swords className="w-5 h-5 text-primary" />,
      title: 'Join scrims & practice lobbies',
      sub: 'Sharpen your skills daily',
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-primary" />,
      title: 'Track your stats & rankings',
      sub: 'Detailed performance analytics',
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: 'Build & manage your squad',
      sub: 'Team up with the best players',
    },
  ];

  return (
    <div className="fixed top-14 inset-x-0 bottom-0 flex overflow-hidden z-10">
      {/* Left panel — hidden on mobile, sticky */}
      <div
        className="hidden lg:flex flex-col justify-center px-14 py-16 flex-1 h-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(265 60% 8%) 0%, hsl(265 40% 14%) 100%)' }}
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-primary/80 border border-primary/30 rounded-full px-4 py-1.5 w-fit mb-8 uppercase">
          ⚡ Player Portal
        </span>
        <h1 className="text-5xl font-black text-white leading-tight mb-4">
          Enter The
          <br />
          <span className="text-primary">Arena</span>
        </h1>
        <p className="text-gray-400 text-base mb-10 max-w-xs leading-relaxed">
          Join thousands of competitive gamers. Your journey to the top starts here.
        </p>
        <div className="space-y-3">
          {playerFeatures.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — scrollable only if needed */}
      <div className="flex flex-col flex-1 h-full overflow-y-auto overscroll-y-contain bg-background">
        {/* Back to Home — fixed at top */}
        <div className="px-8 pt-5 pb-2 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 pb-4 max-w-xl mx-auto w-full">
          <div className="w-full">
            <div className="cyber-card border border-primary/30 p-6">
              {/* Header — no icon */}
              <div className="flex flex-col items-center mb-5">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {isLogin ? 'Player Sign In' : 'Create Player Account'}
                </h1>
                <p className="text-muted-foreground mt-1 text-center text-sm">
                  {isLogin
                    ? 'Welcome back! Sign in to access your tournaments'
                    : 'Join ScrimVerse to compete in tournaments'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Google Sign In Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => googleLogin()}
                    className="w-full py-2.5 px-4 border border-border rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-3"
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
                    {isLogin ? 'Continue with Google' : 'Sign up with Google'}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center py-1">
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
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Username field (register only) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Username</label>
                      <div className="relative">
                        <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          name="username"
                          type="text"
                          required={!isLogin}
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="Choose a username"
                          className="block w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  )}

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
                        className="block w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone field (register only) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            name="phone_number"
                            type="tel"
                            required={!isLogin}
                            value={formData.phone_number}
                            onChange={handleChange}
                            placeholder="10-digit number"
                            maxLength="10"
                            disabled={otpVerified}
                            ref={!otpSent ? otpInputRef : null}
                            className={`block w-full px-4 py-2.5 bg-secondary border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 ${otpHighlight && !otpSent ? 'border-destructive ring-2 ring-destructive/30' : 'border-border'}`}
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
                            className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                  )}

                  {/* OTP Input — only show after OTP is sent and before verified */}
                  {!isLogin && otpSent && !otpVerified && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Enter OTP</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(e) => {
                            setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setOtpHighlight(false);
                          }}
                          placeholder="6-digit OTP"
                          maxLength="6"
                          ref={otpSent ? otpInputRef : null}
                          className={`block flex-1 px-4 py-3 bg-secondary border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${otpHighlight && otpSent ? 'border-destructive ring-2 ring-destructive/30' : 'border-border'}`}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={otpLoading || otpCode.length !== 6}
                          className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {otpLoading ? '...' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        OTP sent to +91{formData.phone_number}. Valid for 10 minutes.
                      </p>
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
                        className={`block w-full pl-10 pr-4 py-3 bg-secondary border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${passwordError && !passwordError.includes('match') ? 'border-destructive' : 'border-border'}`}
                      />
                    </div>
                    {passwordError && !passwordError.includes('match') && (
                      <p className="text-xs text-destructive mt-1">{passwordError}</p>
                    )}
                  </div>

                  {/* Confirm Password field (register only) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          name="password2"
                          type="password"
                          required={!isLogin}
                          value={formData.password2}
                          onChange={handleChange}
                          placeholder="••••••••"
                          className={`block w-full pl-10 pr-4 py-3 bg-secondary border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${passwordError && passwordError.includes('match') ? 'border-destructive' : 'border-border'}`}
                        />
                      </div>
                      {passwordError && passwordError.includes('match') && (
                        <p className="text-xs text-destructive mt-1">{passwordError}</p>
                      )}
                    </div>
                  )}

                  {/* Forgot password (login only) */}
                  {isLogin && (
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password?type=player"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="gaming-button w-full py-2.5 px-4 rounded-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? isLogin
                        ? 'Signing in...'
                        : 'Creating Account...'
                      : isLogin
                        ? 'Sign In'
                        : 'Register'}
                  </button>
                </form>

                {/* Sign up/in link */}
                <div className="text-center pt-1">
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtpCode('');
                      }}
                      className="font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerAuth;
