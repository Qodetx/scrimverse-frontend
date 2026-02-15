import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

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
        headers: {
          'Content-Type': 'application/json',
        },
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
        if (response.status === 429) {
          setStatus('error');
          setMessage(data.error || 'Please wait before requesting another reset email.');
          const match = data.error?.match(/(\d+) seconds/);
          if (match) {
            setCountdown(parseInt(match[1]));
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to send reset email. Please try again.');
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
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
  const iconColor = userType === 'host' ? 'text-primary-500' : 'text-gray-400';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full z-10">
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-10 shadow-2xl">
          {/* Success State */}
          {status === 'success' ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
                Check Your Email!
              </h2>
              <p className="text-green-400 font-medium mb-2">{message}</p>
              <p className="text-gray-400 mb-6">
                We sent an email to <span className="text-white font-bold">{email}</span>
              </p>

              <div className="w-full bg-[#0a0a0c] border border-white/5 rounded-xl p-6 mb-6 space-y-3">
                <div className="flex items-start gap-3 text-gray-300">
                  <span className="text-primary-500 text-lg">📧</span>
                  <span className="text-sm">Check your inbox and spam folder</span>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <span className="text-primary-500 text-lg">🔗</span>
                  <span className="text-sm">Click the reset link in the email</span>
                </div>
                <div className="flex items-start gap-3 text-gray-300">
                  <span className="text-primary-500 text-lg">⏰</span>
                  <span className="text-sm">Link expires in 24 hours</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setStatus('idle');
                  setEmail('');
                  setMessage('');
                }}
                className="w-full py-3.5 px-4 bg-[#0a0a0c] border border-white/10 text-white font-bold rounded-xl transition-all duration-300 hover:bg-[#1c1c21] hover:border-white/20"
              >
                Send to Different Email
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#1c1c21] flex items-center justify-center mb-6">
                  <Lock className={`w-8 h-8 ${iconColor}`} />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h2>
                <p className="text-gray-400 mt-2 text-center font-medium">
                  Enter your {userTypeLabel.toLowerCase()} email to reset your password
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {status === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{message}</span>
                    {countdown > 0 && <span className="font-bold">({countdown}s)</span>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">
                    {userTypeLabel} Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`Enter your ${userTypeLabel.toLowerCase()} email`}
                      required
                      disabled={status === 'loading'}
                      className="block w-full pl-12 pr-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || !email || countdown > 0}
                  className="w-full py-4 px-4 bg-white hover:bg-gray-100 text-[#0a0a0c] font-black rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {status === 'loading' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#0a0a0c]/30 border-t-[#0a0a0c] rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : countdown > 0 ? (
                    `Wait ${countdown}s`
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6">
                <Link
                  to={loginPath}
                  className="flex items-center justify-center gap-2 text-gray-400 hover:text-white font-bold transition-colors py-3 rounded-xl hover:bg-[#0a0a0c]"
                >
                  <ArrowLeft size={18} />
                  <span>Back to {userTypeLabel} Login</span>
                </Link>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 mt-6 border-t border-white/5">
                <p className="text-gray-500 font-medium mb-2">Don't have an account?</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Link
                    to={registerPath}
                    className="text-white hover:text-primary-400 font-black transition-colors"
                  >
                    Register as {userTypeLabel}
                  </Link>
                  <span className="text-gray-600">•</span>
                  <Link
                    to={userType === 'player' ? '/host/register' : '/player/register'}
                    className="text-gray-400 hover:text-white font-bold transition-colors"
                  >
                    {userType === 'player' ? 'Host' : 'Player'}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
