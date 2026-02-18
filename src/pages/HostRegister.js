import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { GoogleLogin } from '@react-oauth/google';
import GoogleOAuthCompleteModal from '../components/GoogleOAuthCompleteModal';

const HostRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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
      const response = await authAPI.hostRegister(formData);

      // Check if email verification is required
      if (response.data.verification_required) {
        // Redirect to check email page
        navigate('/check-email', { state: { email: response.data.email } });
      } else {
        // Old flow for Google OAuth (has tokens)
        login(response.data.user, response.data.tokens);
        navigate('/host/verification-pending');
      }
    } catch (err) {
      console.error('Host register error:', err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        const userFriendlyErrors = [];

        Object.entries(data).forEach(([field, messages]) => {
          // Normalize to an array
          const msgsArray = Array.isArray(messages)
            ? messages
            : typeof messages === 'string'
              ? [messages]
              : typeof messages === 'object'
                ? Object.values(messages).flat()
                : ['An unexpected error occurred.'];

          let label = field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

          msgsArray.forEach((msg) => {
            // Basic friendly rewrite
            if (msg.includes('already exists')) {
              msg = `This ${label.toLowerCase()} is already in use. Try another one.`;
            } else if (msg.includes('too short')) {
              msg = 'Your password must be at least 8 characters long.';
            } else if (msg.includes("didn't match")) {
              msg = 'Passwords do not match.';
            }

            userFriendlyErrors.push(`⚠️ ${msg}`);
          });
        });

        setError(userFriendlyErrors.join('\n'));
      } else {
        const errDetail = err?.response?.data || err?.message || err;
        setError(
          typeof errDetail === 'object' ? JSON.stringify(errDetail, null, 2) : String(errDetail)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setGoogleCredential(credentialResponse);
    setShowGoogleModal(true);
  };

  const handleGoogleError = () => {
    setError('Google signup failed. Please try again.');
  };

  const handleGoogleComplete = (data) => {
    login(data.user, data.tokens);
    setShowGoogleModal(false);
    navigate('/host/verification-pending');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      {/* Floating Star Field (copied from HomePage) */}
      <div className="star-field">
        {[...Array(50)].map((_, i) => {
          const left = Math.random() * 100;
          const duration = Math.random() * 20 + 10;
          const delay = Math.random() * 20;
          const opacity = Math.random() * 0.5 + 0.3;

          return (
            <div
              key={i}
              className="star-particle"
              style={{
                left: `${left}%`,
                animationDuration: `${duration}s`,
                animationDelay: `-${delay}s`,
                '--star-opacity': opacity,
              }}
            />
          );
        })}
      </div>

      <div className="max-w-2xl w-full z-10">
        <div className="gaming-card border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
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
            <h2 className="text-3xl font-bold text-white tracking-tight">Create Host Account</h2>
            <p className="text-gray-400 mt-2 text-center font-medium">
              Join as a verified host to organize tournaments.
            </p>
          </div>

          <div className="space-y-6">
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-widest font-bold">
                or sign up with email
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium animate-shake whitespace-pre-wrap">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Email Address *</label>
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
                      className="block w-full pl-12 pr-4 py-3 bg-white border border-white/10 rounded-xl text-[#0a0a0c] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Username *</label>
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 0 00-7 7h14a7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      className="block w-full pl-12 pr-4 py-3 bg-white border border-white/10 rounded-xl text-[#0a0a0c] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Phone Number *</label>
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <input
                      name="phone_number"
                      type="tel"
                      required
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="block w-full pl-12 pr-4 py-3 bg-white border border-white/10 rounded-xl text-[#0a0a0c] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Password *</label>
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
                      className="block w-full pl-12 pr-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 ml-1">Confirm Password *</label>
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <input
                      name="password2"
                      type="password"
                      required
                      value={formData.password2}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="block w-full pl-12 pr-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-white hover:bg-gray-100 text-[#0a0a0c] font-black rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0a0a0c]/30 border-t-[#0a0a0c] rounded-full animate-spin"></div>
                    Registering...
                  </div>
                ) : (
                  'Create Host Account'
                )}
              </button>
            </form>

            <div className="text-center pt-8">
              <p className="text-gray-500 font-medium">
                Already have an account?{' '}
                <Link
                  to="/host/login"
                  className="text-white hover:text-primary-400 font-black transition-colors ml-1"
                >
                  Login here
                </Link>
              </p>
            </div>

            <p className="text-center text-gray-600 text-xs mt-8">
              By registering, you agree to Scrimverse's{' '}
              <Link
                to="/terms"
                className="text-gray-500 hover:text-white transition-colors underline"
              >
                Terms & Conditions
              </Link>
            </p>
          </div>
        </div>
      </div>

      <GoogleOAuthCompleteModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        googleData={googleCredential}
        userType="host"
        onSuccess={handleGoogleComplete}
      />
    </div>
  );
};

export default HostRegister;
