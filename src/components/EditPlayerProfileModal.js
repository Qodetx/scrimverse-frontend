import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { sanitizeInput, sanitizeBio, sanitizePhone } from '../utils/sanitize';

const EditPlayerProfileModal = ({ isOpen, onClose, player, onSuccess, requirePhone = false }) => {
  const [formData, setFormData] = useState({
    username: player?.username || '',
    phone_number: player?.phone_number || '',
    in_game_name: player?.player_profile?.in_game_name || '',
    game_id: player?.player_profile?.game_id || '',
    bio: player?.player_profile?.bio || '',
    preferred_games: player?.player_profile?.preferred_games || [],
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    player?.profile_picture || null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state when player prop changes or modal opens
  useEffect(() => {
    if (player) {
      setFormData({
        username: player.username || '',
        phone_number: player.phone_number || '',
        in_game_name: player.player_profile?.in_game_name || '',
        game_id: player.player_profile?.game_id || '',
        bio: player.player_profile?.bio || '',
        preferred_games: player.player_profile?.preferred_games || [],
      });
      setProfilePicturePreview(player.profile_picture || null);
      setProfilePicture(null);
      setError('');
    }
  }, [player, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
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

    const sanitizedUsername = sanitizeInput(formData.username);
    const sanitizedPhone = sanitizePhone(formData.phone_number);
    const sanitizedBio = sanitizeBio(formData.bio);

    if (!sanitizedUsername.trim()) {
      setError('Username is required');
      return;
    }

    // If this modal is being shown as mandatory (requirePhone), phone must be provided
    if (requirePhone && (!sanitizedPhone || sanitizedPhone.length !== 10)) {
      setError('Phone number is required and must be exactly 10 digits');
      return;
    }

    if (sanitizedPhone && sanitizedPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    try {
      // Update user fields
      const userFormData = new FormData();
      userFormData.append('username', sanitizedUsername);
      userFormData.append('phone_number', sanitizedPhone || '');
      if (profilePicture) {
        userFormData.append('profile_picture', profilePicture);
      }

      const userResponse = await authAPI.updateUser(userFormData);

      // Update player profile fields
      const profileResponse = await authAPI.updatePlayerProfile({
        in_game_name: formData.in_game_name || '',
        game_id: formData.game_id || '',
        bio: sanitizedBio,
        preferred_games: formData.preferred_games,
      });

      // Merge the updated data and call onSuccess
      onSuccess({
        ...userResponse.data,
        player_profile: profileResponse.data,
      });
      onClose();
    } catch (err) {
      console.error('Profile update error:', err);
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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[20001] p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-[#050505] border border-white/5 rounded-none md:rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden cyber-card max-h-screen md:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-gradient-to-r from-black via-[#080808] to-black flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary-500"
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
          <button
            onClick={() => {
              // Prevent closing if phone is required and not filled
              const ph = sanitizePhone(formData.phone_number);
              if (requirePhone && (!ph || ph.length !== 10)) {
                setError('Phone number is required before closing this form');
                return;
              }
              onClose();
            }}
            className="text-gray-500 hover:text-white transition-colors"
          >
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#050505]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Centered Profile Picture Container */}
            <div className="flex flex-col items-center justify-center space-y-3 pb-2">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden border-2 border-white/10 shadow-[0_0_30px_rgba(124,58,237,0.15)] transition-all group-hover:border-primary-500/50">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (player?.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <label
                  htmlFor="profile-picture-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-2xl border border-primary-500"
                >
                  <div className="flex flex-col items-center gap-1">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-[10px] text-white font-black uppercase tracking-tighter">
                      Change
                    </span>
                  </div>
                </label>
              </div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                Profile Picture
              </label>
            </div>

            {/* Form Fields Section */}
            <div className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  disabled={
                    player?.username_change_count > 0 &&
                    new Date(player.last_username_change) >
                      new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                  }
                  className={`block w-full px-4 py-3 bg-[#080808] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all ${player?.username_change_count > 0 && new Date(player.last_username_change) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <p className="text-[9px] text-gray-600 px-1 italic">
                  {player?.username_change_count === 0
                    ? '1 free change available.'
                    : 'Changeable every 6 months.'}
                </p>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                  Phone Number
                </label>
                <input
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  maxLength="10"
                  placeholder="10-digit number"
                  className="block w-full px-4 py-3 bg-[#080808] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>

              {/* In-Game Name Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                  In-Game Name
                </label>
                <input
                  name="in_game_name"
                  type="text"
                  value={formData.in_game_name}
                  onChange={handleChange}
                  placeholder="Your game character name"
                  className="block w-full px-4 py-3 bg-[#080808] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>

              {/* Game ID/UID Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                  Game ID/UID
                </label>
                <input
                  name="game_id"
                  type="text"
                  value={formData.game_id}
                  onChange={handleChange}
                  placeholder="Your unique game ID"
                  className="block w-full px-4 py-3 bg-[#080808] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>

              {/* Bio Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  maxLength="500"
                  placeholder="Tell us about yourself..."
                  className="block w-full px-4 py-3 bg-[#080808] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[9px] text-gray-600 italic">Visible on your public profile</p>
                  <p className="text-[9px] text-gray-600 uppercase tracking-tighter">
                    {formData.bio.length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
              <p className="text-blue-400 text-[10px] flex items-center gap-2 font-bold uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Email address cannot be changed for security</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 pb-4">
              <button
                type="button"
                onClick={() => {
                  const ph = sanitizePhone(formData.phone_number);
                  if (requirePhone && (!ph || ph.length !== 10)) {
                    setError('Phone number is required before closing this form');
                    return;
                  }
                  onClose();
                }}
                disabled={loading}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPlayerProfileModal;
