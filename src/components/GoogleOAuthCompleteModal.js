import React, { useState } from 'react';
import { authAPI } from '../utils/api';

const GoogleOAuthCompleteModal = ({ isOpen, onClose, googleData, userType, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.phone_number.trim()) {
      setError('Phone number is required');
      return;
    }

    if (formData.phone_number.length !== 10 || !/^\d+$/.test(formData.phone_number)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.googleAuth({
        token: googleData.credential,
        user_type: userType,
        username: formData.username,
        phone_number: formData.phone_number,
        is_signup: true, // This is a signup with additional info
      });

      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-600/10 flex items-center justify-center mx-auto mb-4">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
          <p className="text-gray-400 text-sm">We need a few more details to set up your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                className="block w-full pl-12 pr-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 ml-1">
              This will be your unique identifier on the platform
            </p>
          </div>

          <div className="space-y-2">
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
                placeholder="10-digit phone number"
                maxLength="10"
                className="block w-full pl-12 pr-4 py-3.5 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 ml-1">Enter your 10-digit phone number</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 px-4 bg-white hover:bg-gray-100 text-[#0a0a0c] font-black rounded-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#0a0a0c]/30 border-t-[#0a0a0c] rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Complete'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleOAuthCompleteModal;
