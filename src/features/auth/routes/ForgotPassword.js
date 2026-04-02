import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'player';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/accounts/request-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          user_type: userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset email sent! Please check your inbox.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send reset email. Please try again.');
        if (response.status === 429) {
          const match = data.error?.match(/(\d+) seconds/);
          if (match) setCountdown(parseInt(match[1]));
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
    }
  };

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const loginPath = userType === 'host' ? '/host/login' : '/player/login';
  const registerPath = userType === 'host' ? '/host/register' : '/player/register';
  const userTypeLabel = userType === 'host' ? 'Host' : 'Player';

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <Link
            to={loginPath}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {userTypeLabel} Login
          </Link>

          <div className="w-full">
            <div className="cyber-card border border-primary/30 p-8">
              {/* ── Success State ── */}
              {status === 'success' ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                    Check Your Email!
                  </h2>
                  <p className="text-green-400 font-medium mb-1 text-sm">{message}</p>
                  <p className="text-muted-foreground text-sm mb-6">
                    We sent an email to <span className="text-foreground font-bold">{email}</span>
                  </p>

                  <div className="w-full bg-secondary/30 border border-border rounded-lg p-5 mb-6 space-y-3 text-left">
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <span className="text-base">📧</span>
                      <span className="text-sm">Check your inbox and spam folder</span>
                    </div>
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <span className="text-base">🔗</span>
                      <span className="text-sm">Click the reset link in the email</span>
                    </div>
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <span className="text-base">⏰</span>
                      <span className="text-sm">Link expires in 24 hours</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStatus('idle');
                      setEmail('');
                      setMessage('');
                    }}
                    className="w-full py-3 px-4 bg-secondary/50 border border-border rounded-lg text-foreground font-medium hover:bg-secondary transition-colors"
                  >
                    Send to Different Email
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Header ── */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                      Forgot Password?
                    </h1>
                    <p className="text-muted-foreground mt-2 text-center text-sm">
                      Enter your {userTypeLabel.toLowerCase()} email to reset your password
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Error */}
                    {status === 'error' && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{message}</span>
                        {countdown > 0 && <span className="font-bold">({countdown}s)</span>}
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {userTypeLabel} Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={`Enter your ${userTypeLabel.toLowerCase()} email`}
                            required
                            disabled={status === 'loading'}
                            className="block w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'loading' || !email || countdown > 0}
                        className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === 'loading' ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : countdown > 0 ? (
                          `Wait ${countdown}s`
                        ) : (
                          'Send Reset Link'
                        )}
                      </button>
                    </form>

                    {/* Footer links */}
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link
                          to={registerPath}
                          className="font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          Register as {userTypeLabel}
                        </Link>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ForgotPassword;
