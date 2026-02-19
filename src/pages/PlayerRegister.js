import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { GoogleLogin } from '@react-oauth/google';

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

    if (formData.password !== formData.password2) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.playerRegister(formData);
      // If backend returns tokens (auto-login), use them
      if (response.data?.tokens && response.data?.user) {
        login(response.data.user, response.data.tokens);
        navigate(nextPath);
      } else {
        // Otherwise redirect to login so user can verify and then login
        navigate('/player/login', { state: { next: nextPath } });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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

  // No additional completion step needed - backend will create account immediately

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full z-10">
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#1c1c21] flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Player Registration</h2>
            <p className="text-gray-400 mt-2 text-center font-medium">
              Create your account to join tournaments
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                size="large"
                width="100%"
                text="signup_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#111114] px-4 text-gray-500 font-bold uppercase tracking-widest">
                  Or continue with email
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-gray-400 ml-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="block w-full px-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-bold text-gray-400 ml-1">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className="block w-full px-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="phone_number" className="text-sm font-bold text-gray-400 ml-1">
                  Phone Number *
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+91..."
                  maxLength="10"
                  className="block w-full px-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-gray-400 ml-1">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="password2" className="text-sm font-bold text-gray-400 ml-1">
                  Confirm Password *
                </label>
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  required
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-white hover:bg-gray-100 text-[#0a0a0c] font-black rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0a0a0c]/30 border-t-[#0a0a0c] rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Register'
                )}
              </button>

              {/* No additional Google completion step needed */}
            </div>
          </form>

          <div className="text-center pt-6">
            <p className="text-gray-500 font-medium">
              Already have an account?{' '}
              <Link
                to="/player/login"
                className="text-white hover:text-primary-400 font-black transition-colors ml-1"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegister;
