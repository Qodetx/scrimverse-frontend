import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamAPI, authAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';
import './CreateTeam.css';

const CreateTeam = () => {
  const navigate = useNavigate();
  const { user, fetchUserData } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [playerUsernames, setPlayerUsernames] = useState(['', '', '']);
  const [selectedUsernames, setSelectedUsernames] = useState([null, null, null]); // Track if username was selected from dropdown
  const [isLoading, setIsLoading] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const searchCounter = useRef(0);

  // Get current user's username for the first (locked) field
  const currentUsername = user?.user?.username || '';

  const handleUsernameChange = async (index, value) => {
    const newUsernames = [...playerUsernames];
    newUsernames[index] = value;
    setPlayerUsernames(newUsernames);

    // Mark as not selected when typing
    const newSelected = [...selectedUsernames];
    newSelected[index] = null;
    setSelectedUsernames(newSelected);

    // Clear any previous error for this field
    const newErrors = { ...fieldErrors };
    delete newErrors[index];
    setFieldErrors(newErrors);

    // Debounce / race-safety: only consider latest request result
    if (value.length >= 2) {
      // increment search token
      searchCounter.current += 1;
      const myToken = searchCounter.current;

      try {
        const res = await authAPI.searchPlayerUsernames(value, true); // forTeam=true

        // ignore if a newer request started
        if (myToken !== searchCounter.current) return;

        // Filter using the most up-to-date selected list (newSelected)
        const alreadySelected = [currentUsername, ...newSelected.filter((u) => u !== null)];
        const filteredResults = (res.data.results || []).filter(
          (user) => !alreadySelected.includes(user.username)
        );

        setUsernameSuggestions((prev) => ({ ...prev, [index]: filteredResults }));
        setShowSuggestions((prev) => ({ ...prev, [index]: filteredResults.length > 0 }));
      } catch (err) {
        console.error(err);
        setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      }
    } else {
      setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      setUsernameSuggestions((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const selectSuggestion = (index, username) => {
    const newUsernames = [...playerUsernames];
    newUsernames[index] = username;
    setPlayerUsernames(newUsernames);

    // Mark as selected
    const newSelected = [...selectedUsernames];
    newSelected[index] = username;
    setSelectedUsernames(newSelected);

    setShowSuggestions({ ...showSuggestions, [index]: false });

    // Clear any error for this field
    const newErrors = { ...fieldErrors };
    delete newErrors[index];
    setFieldErrors(newErrors);
  };

  const handleFieldBlur = (index) => {
    setTimeout(() => {
      setShowSuggestions({ ...showSuggestions, [index]: false });

      // If user typed but didn't select from dropdown, clear the field
      // Check if the field has a value but wasn't selected
      if (playerUsernames[index] && !selectedUsernames[index]) {
        const newUsernames = [...playerUsernames];
        newUsernames[index] = '';
        setPlayerUsernames(newUsernames);

        setFieldErrors({
          ...fieldErrors,
          [index]: 'Please select a player from the dropdown',
        });
      }
    }, 300); // Increased delay to allow click event to fire first
  };

  const addPlayerField = () => {
    if (playerUsernames.length < 15) {
      setPlayerUsernames([...playerUsernames, '']);
      setSelectedUsernames([...selectedUsernames, null]);
    }
  };

  const removePlayerField = (index) => {
    if (playerUsernames.length > 1) {
      const newUsernames = playerUsernames.filter((_, i) => i !== index);
      setPlayerUsernames(newUsernames);

      const newSelected = selectedUsernames.filter((_, i) => i !== index);
      setSelectedUsernames(newSelected);

      const newErrors = { ...fieldErrors };
      delete newErrors[index];
      setFieldErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation 1: Team name required
    if (!teamName.trim()) {
      showToast('Please enter a team name', 'warning');
      return;
    }

    // Validation 2: Check that all filled fields are selected from dropdown
    const invalidFields = [];
    playerUsernames.forEach((username, index) => {
      if (username.trim() !== '' && !selectedUsernames[index]) {
        invalidFields.push(index);
      }
    });

    if (invalidFields.length > 0) {
      showToast(
        'Please select all players from the dropdown. You cannot manually type usernames.',
        'error'
      );
      // Highlight the invalid fields
      const newErrors = {};
      invalidFields.forEach((index) => {
        newErrors[index] = 'Please select from dropdown';
      });
      setFieldErrors(newErrors);
      return;
    }

    // Validation 3: Get only selected usernames (not manually typed)
    const selectedPlayers = selectedUsernames.filter((u) => u !== null && u.trim() !== '');

    // Validation 4: Check for duplicate players
    const allPlayers = [currentUsername, ...selectedPlayers];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      showToast('Duplicate players detected. Each player can only be added once.', 'error');
      return;
    }

    // Validation 5: At least captain (already included)
    const allUsernames = [currentUsername, ...selectedPlayers];

    setIsLoading(true);

    try {
      await teamAPI.createTeam({
        name: teamName.trim(),
        description: description.trim() || undefined,
        player_usernames: allUsernames,
      });

      await fetchUserData(); // Refresh global user data
      showToast(`Team "${teamName}" created successfully!`, 'success');
      navigate('/player/dashboard');
    } catch (error) {
      console.error('Error creating team:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.player_usernames ||
        'Failed to create team';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const validPlayerCount = playerUsernames.filter((u) => u.trim() !== '').length;

  return (
    <div className="create-team-page">
      <div className="create-team-container">
        <div className="create-team-header">
          <div className="header-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="header-title">Create New Team</h1>
            <p className="header-subtitle">Enter your team details and add player usernames</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="create-team-form">
          {/* Team Name */}
          <div className="form-group">
            <label htmlFor="teamName" className="form-label">
              Team Name <span className="required">*</span>
            </label>
            <input
              id="teamName"
              type="text"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              placeholder="Brief team description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={2}
            />
          </div>

          {/* Player Usernames */}
          <div className="form-group">
            <div className="players-header">
              <label className="form-label">
                Team Members <span className="required">*</span> ({validPlayerCount + 1}/15)
              </label>
              {playerUsernames.length < 15 && (
                <button type="button" onClick={addPlayerField} className="add-player-btn">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Player
                </button>
              )}
            </div>
            <div className="players-list">
              {/* First player - Current User (Locked) */}
              <div className="player-input-group">
                <div className="player-input-wrapper">
                  <input
                    type="text"
                    placeholder="Captain (You)"
                    value={currentUsername}
                    disabled
                    className="form-input locked-input"
                  />
                  <span className="captain-badge">Captain</span>
                </div>
              </div>

              {/* Other players */}
              {playerUsernames.map((username, index) => (
                <div key={index} className="player-input-group">
                  <div className="player-input-wrapper">
                    <input
                      type="text"
                      placeholder={`Player ${index + 2} username`}
                      value={username}
                      onChange={(e) => {
                        // Only allow changes if not already selected
                        if (!selectedUsernames[index]) {
                          handleUsernameChange(index, e.target.value);
                        }
                      }}
                      onBlur={() => handleFieldBlur(index)}
                      onKeyDown={(e) => {
                        // If backspace is pressed on a selected field, clear it
                        if (e.key === 'Backspace' && selectedUsernames[index]) {
                          e.preventDefault();
                          const newUsernames = [...playerUsernames];
                          newUsernames[index] = '';
                          setPlayerUsernames(newUsernames);

                          const newSelected = [...selectedUsernames];
                          newSelected[index] = null;
                          setSelectedUsernames(newSelected);

                          // Clear any errors
                          const newErrors = { ...fieldErrors };
                          delete newErrors[index];
                          setFieldErrors(newErrors);
                        }
                      }}
                      className={`form-input ${fieldErrors[index] ? 'input-error' : ''} ${selectedUsernames[index] ? 'selected-input' : ''}`}
                    />
                    {showSuggestions[index] && usernameSuggestions[index]?.length > 0 && (
                      <div className="username-suggestions">
                        {usernameSuggestions[index].map((user) => (
                          <div
                            key={user.id}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent blur from firing
                              selectSuggestion(index, user.username);
                            }}
                            className="suggestion-item"
                          >
                            <div className="suggestion-username">{user.username}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {fieldErrors[index] && <div className="field-error">{fieldErrors[index]}</div>}
                  </div>
                  {playerUsernames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayerField(index)}
                      className="remove-player-btn"
                      title="Remove player"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/player/dashboard')}
              className="btn-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default CreateTeam;
