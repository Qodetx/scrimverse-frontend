import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { sanitizeInput, sanitizeBio, sanitizePhone, sanitizeURL } from '../utils/sanitize';

const EditHostProfileModal = ({ isOpen, onClose, host, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: host?.user?.username || '',
    phone_number: host?.user?.phone_number || '',
    bio: host?.bio || '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    host?.user?.profile_picture || null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state when host prop changes or modal opens
  useEffect(() => {
    if (host) {
      setFormData({
        username: host.user?.username || '',
        phone_number: host.user?.phone_number || '',
        bio: host.bio || '',
      });
      setProfilePicturePreview(host.user?.profile_picture || null);
      setProfilePicture(null);
      setError('');
    }
  }, [host, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(formData.username);
    const sanitizedPhone = sanitizePhone(formData.phone_number);
    const sanitizedBio = sanitizeBio(formData.bio);

    if (!sanitizedUsername.trim()) {
      setError('Username is required');
      return;
    }

    if (sanitizedPhone && sanitizedPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    try {
      // Update user data (username, phone, profile_picture)
      const userFormData = new FormData();
      userFormData.append('username', sanitizedUsername);
      userFormData.append('phone_number', sanitizedPhone || '');
      if (profilePicture) {
        userFormData.append('profile_picture', profilePicture);
      }

      const userResponse = await authAPI.updateUser(userFormData);

      // Update host profile data
      const profileResponse = await authAPI.updateHostProfile({
        bio: sanitizedBio,
      });

      onSuccess({
        ...profileResponse.data,
        user: userResponse.data,
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.username?.[0] ||
        'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-20">
      <div className="bg-[#111114] border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Profile
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Profile Picture */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (host?.user?.username || 'H').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="host-profile-picture-upload"
                />
                <label
                  htmlFor="host-profile-picture-upload"
                  className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Choose Image
                </label>
                <p className="text-xs text-gray-500 mt-2">Max size: 5MB. Formats: JPG, PNG, GIF</p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">Username *</label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              disabled={
                host?.user?.username_change_count > 0 &&
                new Date(host.user.last_username_change) >
                new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
              }
              className={`block w-full px-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all ${host?.user?.username_change_count > 0 && new Date(host.user.last_username_change) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <p className="text-xs text-gray-500 ml-1 italic">
              {host?.user?.username_change_count === 0
                ? 'You have 1 chance to change your username. Subsequent changes allowed every 6 months.'
                : 'Username can only be changed once every 6 months.'}
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">Phone Number</label>
            <input
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              maxLength="10"
              placeholder="10-digit phone number"
              className="block w-full px-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              maxLength="500"
              placeholder="Tell us about your organization..."
              className="block w-full px-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all resize-none"
            />
            <p className="text-xs text-gray-500 ml-1">{formData.bio.length}/500 characters</p>
          </div>

          {/* Note about email */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Email address cannot be changed. Contact support if you need to update your email.
              </span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHostProfileModal;
