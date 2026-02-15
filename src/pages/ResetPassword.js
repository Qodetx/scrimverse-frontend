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
import { AuthContext } from '../context/AuthContext';

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

    if (!validatePassword()) {
      return;
    }

    setStatus('resetting');
    setMessage('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/accounts/reset-password/${token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset successful! Logging you in...');

        if (data.tokens) {
          const tokenData = {
            access: data.tokens.access,
            refresh: data.tokens.refresh,
          };

          login(data.user, tokenData);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full z-10">
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-10 shadow-2xl">
          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="flex flex-col items-center text-center py-8">
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Reset Link...</h2>
              <p className="text-gray-400">Please wait while we verify your password reset link.</p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
                Invalid Reset Link
              </h2>
              <p className="text-red-400 font-medium mb-6">{message}</p>

              <div className="w-full bg-[#0a0a0c] border border-white/5 rounded-xl p-6 mb-6 text-left">
                <p className="text-gray-400 font-bold mb-3">This could happen if:</p>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>The link has expired (links are valid for 24 hours)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>The link has already been used</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>The link is invalid or corrupted</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full py-4 px-4 bg-white hover:bg-gray-100 text-[#0a0a0c] font-black rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-3"
              >
                Request New Reset Link
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 bg-[#0a0a0c] border border-white/10 text-white font-bold rounded-xl transition-all duration-300 hover:bg-[#1c1c21] hover:border-white/20"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Ready/Resetting State */}
          {(status === 'ready' || status === 'resetting') && (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#1c1c21] flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Reset Your Password
                </h2>
                <p className="text-gray-400 mt-2 text-center font-medium">
                  Enter your new password for{' '}
                  <span className="text-white font-bold">{userEmail}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      disabled={status === 'resetting'}
                      minLength={8}
                      className="block w-full pl-12 pr-12 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-primary-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-[#0a0a0c] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300 rounded-full"
                          style={{
                            width: `${passwordStrength.strength}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      disabled={status === 'resetting'}
                      minLength={8}
                      className="block w-full pl-12 pr-12 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-primary-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Error Messages */}
                {(passwordError || message) && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{passwordError || message}</span>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">
                    Password Requirements
                  </p>
                  <div className="space-y-2">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-600'}`}
                        ></div>
                        <span className={req.met ? 'text-green-400 font-medium' : 'text-gray-500'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'resetting' || !newPassword || !confirmPassword}
                  className="w-full py-4 px-4 bg-white hover:bg-gray-100 text-[#0a0a0c] font-black rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {status === 'resetting' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#0a0a0c]/30 border-t-[#0a0a0c] rounded-full animate-spin"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
                Password Reset Successful!
              </h2>
              <p className="text-green-400 font-medium mb-6">{message}</p>
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                <span className="font-medium">Redirecting to your dashboard...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
