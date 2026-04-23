import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowLeft, Trophy, Settings, UserCheck, Users } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { authAPI } from '../../../utils/api';

const HostLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ ...formData, user_type: 'host' });
      login(response.data.user, response.data.tokens);

      const userResponse = await authAPI.getCurrentUser();
      const verificationStatus = userResponse.data.profile?.verification_status;

      if (verificationStatus === 'approved') {
        navigate('/host/dashboard');
      } else {
        navigate('/host/verification-pending');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.googleAuth({
        token: credentialResponse.credential,
        user_type: 'host',
        is_signup: false,
      });

      login(response.data.user, response.data.tokens);

      const verificationStatus = response.data.profile?.verification_status;
      if (verificationStatus === 'approved') {
        navigate('/host/dashboard');
      } else {
        navigate('/host/verification-pending');
      }
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.error === 'account_not_found') {
        setError('No account found with this Google account. Redirecting to signup...');
        setTimeout(() => navigate('/host/register'), 2000);
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

  const handleGoogleClick = () => {
    setError('');
    setLoading(true);

    const { google } = window;
    if (!google) {
      setError('Google Sign-In not available. Please try again.');
      setLoading(false);
      return;
    }

    google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleSuccess,
    });

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError('Google login not available. Please use email and password.');
        setLoading(false);
      }
    });
  };

  const hostFeatures = [
    {
      icon: <Trophy className="w-5 h-5 text-accent" />,
      title: 'Create & manage tournaments',
      sub: 'Full control over your events',
    },
    {
      icon: <Settings className="w-5 h-5 text-accent" />,
      title: 'Configure match rules',
      sub: 'Custom formats and brackets',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-accent" />,
      title: 'Manage registrations',
      sub: 'Easy team and player management',
    },
    {
      icon: <Users className="w-5 h-5 text-accent" />,
      title: 'Declare winners & results',
      sub: 'Publish standings and prize info',
    },
  ];

  return (
    <div className="fixed top-14 inset-x-0 bottom-0 flex overflow-hidden z-10">
      {/* Left panel — hidden on mobile, sticky */}
      <div
        className="hidden lg:flex flex-col justify-center px-14 py-16 flex-1 h-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(265 60% 8%) 0%, hsl(265 40% 14%) 100%)' }}
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-accent/80 border border-accent/30 rounded-full px-4 py-1.5 w-fit mb-8 uppercase">
          🛡 Host Portal
        </span>
        <h1 className="text-5xl font-black text-white leading-tight mb-4">
          Organize &amp;
          <br />
          <span className="text-accent">Dominate</span>
        </h1>
        <p className="text-gray-400 text-base mb-10 max-w-xs leading-relaxed">
          Create and manage professional esports tournaments with complete control.
        </p>
        <div className="space-y-3">
          {hostFeatures.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white/5 border border-white/8 rounded-xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
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
          <div className="cyber-card border border-accent/30 p-6">
            {/* Header — no icon */}
            <div className="flex flex-col items-center mb-5">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Host Sign In</h1>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                Welcome back! Manage your tournaments
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleClick}
                className="w-full py-2.5 px-4 border border-border rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                  or continue with email
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="host@example.com"
                      className="block w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password?type=host"
                    className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Sign up link */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Don't have a host account?{' '}
                  <Link
                    to="/host/register"
                    className="font-bold text-accent hover:text-accent/80 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostLogin;
