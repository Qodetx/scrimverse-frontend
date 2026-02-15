import React, { useState, useContext } from 'react';
import { teamAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const EditTeamModal = ({ team, onClose, onUpdate }) => {
  const { fetchUserData } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: team.name || '',
    description: team.description || 'WE ARE BEAST',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(team.profile_picture || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);

      if (profilePhoto) {
        submitData.append('profile_picture', profilePhoto);
      }

      await teamAPI.updateTeam(team.id, submitData);
      await fetchUserData(); // Refresh global user data
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1014] border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Edit Team</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Team Logo
            </label>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-[#1a1a1e] border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-2xl overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Team logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -inset-2 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="profile-photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="profile-photo"
                  className="inline-block px-6 py-2.5 bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-bold uppercase tracking-wider rounded-lg border border-white/5 transition-colors cursor-pointer"
                >
                  Upload Photo
                </label>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Team Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3"
            >
              Team Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={50}
              className="w-full px-4 py-3 bg-[#1a1a1e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              placeholder="Enter team name"
            />
          </div>

          {/* Team Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3"
            >
              Team Tagline
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 bg-[#1a1a1e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              placeholder="Enter team tagline or description"
            />
            <p className="text-xs text-gray-500 mt-2">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#18181b] hover:bg-[#27272a] text-white font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-red-900/20"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;
