import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userType, setUserType] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!hasVerified.current) {
      hasVerified.current = true;
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/accounts/verify-reset-token/${token}/`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setStatus('ready');
        setUserEmail(data.email);
        setUserType(data.user_type);
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid or expired reset link');
        setUserType(data.user_type);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying the reset link');
    }
  };

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setStatus('resetting');
    setMessage('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/accounts/reset-password/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset successful! Logging you in...');

        if (data.tokens) {
          login(data.user, { access: data.tokens.access, refresh: data.tokens.refresh });
          setTimeout(() => {
            if (data.user?.user_type === 'player') navigate('/player/dashboard');
            else if (data.user?.user_type === 'host') navigate('/host/dashboard');
            else navigate('/');
          }, 2000);
        }
      } else {
        setStatus('ready');
        setMessage(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setStatus('ready');
      setMessage('An error occurred. Please try again.');
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    if (/\d/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;
    if (strength <= 2) return { strength: 33, label: 'Weak', color: '#fc8181' };
    if (strength <= 3) return { strength: 66, label: 'Medium', color: '#f6ad55' };
    return { strength: 100, label: 'Strong', color: '#48bb78' };
  };

  const passwordStrength = getPasswordStrength();

  const requirements = [
    { met: newPassword.length >= 8, text: 'At least 8 characters' },
    {
      met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      text: 'Mix of uppercase & lowercase',
    },
    { met: /\d/.test(newPassword), text: 'At least one number' },
    { met: /[^a-zA-Z0-9]/.test(newPassword), text: 'Special character (recommended)' },
  ];

  const loginPath = userType === 'host' ? '/host/login' : '/player/login';
  const forgotPath = userType === 'host' ? '/forgot-password?type=host' : '/forgot-password';

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="w-full">
            <div className="cyber-card border border-primary/30 p-8">
              {/* Verifying State */}
              {status === 'verifying' && (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                    Verifying Reset Link...
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Please wait while we verify your password reset link.
                  </p>
                </div>
              )}

              {/* Error State */}
              {status === 'error' && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                    Invalid Reset Link
                  </h2>
                  <p className="text-destructive font-medium text-sm mb-6">{message}</p>

                  <div className="w-full bg-secondary/30 border border-border rounded-lg p-5 mb-6 space-y-3 text-left">
                    <p className="text-muted-foreground text-sm font-bold">This could happen if:</p>
                    <div className="space-y-2">
                      {[
                        'The link has expired (links are valid for 24 hours)',
                        'The link has already been used',
                        'The link is invalid or corrupted',
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-3 text-muted-foreground">
                          <span className="text-destructive mt-0.5">•</span>
                          <span className="text-sm">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(forgotPath)}
                    className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white mb-3"
                  >
                    Request New Reset Link
                  </button>
                  <button
                    onClick={() => navigate(loginPath)}
                    className="w-full py-3 px-4 bg-secondary/50 border border-border rounded-lg text-foreground font-medium hover:bg-secondary transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}

              {/* Ready / Resetting State */}
              {(status === 'ready' || status === 'resetting') && (
                <>
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                      Reset Your Password
                    </h1>
                    <p className="text-muted-foreground mt-2 text-center text-sm">
                      Enter your new password for{' '}
                      <span className="text-foreground font-bold">{userEmail}</span>
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Error / password error */}
                    {(passwordError || message) && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{passwordError || message}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* New Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            disabled={status === 'resetting'}
                            minLength={8}
                            className="block w-full pl-10 pr-12 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Strength bar */}
                        {newPassword && (
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-300 rounded-full"
                                style={{
                                  width: `${passwordStrength.strength}%`,
                                  backgroundColor: passwordStrength.color,
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-bold"
                              style={{ color: passwordStrength.color }}
                            >
                              {passwordStrength.label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            disabled={status === 'resetting'}
                            minLength={8}
                            className="block w-full pl-10 pr-12 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="bg-secondary/30 border border-border rounded-lg p-4">
                        <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">
                          Password Requirements
                        </p>
                        <div className="space-y-2">
                          {requirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-muted-foreground/40'}`}
                              />
                              <span
                                className={
                                  req.met ? 'text-green-400 font-medium' : 'text-muted-foreground'
                                }
                              >
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'resetting' || !newPassword || !confirmPassword}
                        className="gaming-button w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {status === 'resetting' ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Resetting Password...
                          </span>
                        ) : (
                          'Reset Password'
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* Success State */}
              {status === 'success' && (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                    Password Reset Successful!
                  </h2>
                  <p className="text-green-400 font-medium text-sm mb-6">{message}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Redirecting to your dashboard...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ResetPassword;
