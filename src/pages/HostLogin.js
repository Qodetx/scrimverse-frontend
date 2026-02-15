import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { GoogleLogin } from '@react-oauth/google';

const HostLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
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
      const response = await authAPI.login({
        ...formData,
        user_type: 'host',
      });

      login(response.data.user, response.data.tokens);

      // Fetch user profile to check verification status
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
        is_signup: false, // This is a login attempt
      });

      login(response.data.user, response.data.tokens);

      // Check verification status from response
      const verificationStatus = response.data.profile?.verification_status;

      if (verificationStatus === 'approved') {
        navigate('/host/dashboard');
      } else {
        navigate('/host/verification-pending');
      }
    } catch (err) {
      // Check if account doesn't exist
      if (err.response?.status === 404 && err.response?.data?.error === 'account_not_found') {
        setError('No account found with this Google account. Redirecting to signup...');
        setTimeout(() => {
          navigate('/host/register');
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

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full z-10">
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#1c1c21] flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Host Sign In</h2>
            <p className="text-gray-400 mt-2 text-center font-medium">
              Start hosting and organizing tournaments
            </p>
          </div>

          <div className="space-y-6">
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-widest font-bold">
                or continue with email
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Work Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-12 pr-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password?type=host"
                  className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-white hover:bg-gray-100 text-[#0a0a0c] font-black rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0a0a0c]/30 border-t-[#0a0a0c] rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="text-center pt-4">
              <p className="text-gray-500 font-medium">
                Don't have an account?{' '}
                <Link
                  to="/host/register"
                  className="text-white hover:text-primary-400 font-black transition-colors ml-1"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostLogin;
