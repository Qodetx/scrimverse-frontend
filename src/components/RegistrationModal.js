import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { tournamentAPI, teamAPI, authAPI, scrimAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import Toast from '../components/Toast';
import './RegistrationModal.css';

const RegistrationModal = ({ event, type = 'tournament', onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [useExistingTeam, setUseExistingTeam] = useState(false);

  const [formData, setFormData] = useState({
    team_name: '',
    player_usernames: [],
    teammate_emails: [],
    save_as_team: false,
    team_id: null,
  });

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [usernameSuggestions, setUsernameSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});

  const requiredPlayers =
    {
      Squad: 4,
      Duo: 2,
      Solo: 1,
      '5v5': 5,
      '4v4': 4,
      '2v2': 2,
    }[event.game_mode] || 1;
  const hasEntryFee = parseFloat(event.entry_fee) > 0;

  useEffect(() => {
    fetchTeams();
  }, [event, user]);

  const fetchTeams = async () => {
    try {
      // Use mine=true to get teams where the user is a member
      const res = await teamAPI.getTeams({ mine: 'true' });
      const currentUserId = user?.user?.id || user?.id;

      const userPermanentTeams = (res.data.results || res.data || []).filter((t) => {
        // Only show non-temporary teams where the user is a member
        return (
          !t.is_temporary &&
          t.members &&
          t.members.some((m) => {
            const memberUserId = typeof m.user === 'object' ? m.user?.id : m.user;
            return memberUserId === currentUserId;
          })
        );
      });

      setTeams(userPermanentTeams);

      if (userPermanentTeams.length > 0) {
        setUseExistingTeam(true);
        setSelectedTeam(userPermanentTeams[0]);
        setFormData((prev) => ({
          ...prev,
          team_id: userPermanentTeams[0].id,
          team_name: userPermanentTeams[0].name,
        }));
      } else {
        setUseExistingTeam(false);
        const initialUsernames = Array(requiredPlayers).fill('');
        if (user?.user?.username || user?.username) {
          initialUsernames[0] = user?.user?.username || user?.username;
        }
        const initialEmails = Array(Math.max(0, requiredPlayers - 1)).fill('');
        setFormData((prev) => ({
          ...prev,
          player_usernames: initialUsernames,
          teammate_emails: initialEmails,
        }));
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setUseExistingTeam(false);
      const initialUsernames = Array(requiredPlayers).fill('');
      if (user?.user?.username || user?.username) {
        initialUsernames[0] = user?.user?.username || user?.username;
      }
      setFormData((prev) => ({ ...prev, player_usernames: initialUsernames }));
    }
  };

  const handleUseExistingTeam = () => {
    if (selectedTeam) {
      setFormData({
        ...formData,
        team_name: selectedTeam.name,
        team_id: selectedTeam.id,
      });
      setStep(2);
    }
  };

  const handleCreateNewTeam = () => {
    setUseExistingTeam(false);
    const initialUsernames = Array(requiredPlayers).fill('');
    if (user?.user?.username) initialUsernames[0] = user.user.username;
    const initialEmails = Array(Math.max(0, requiredPlayers - 1)).fill('');
    setFormData({
      team_name: '',
      player_usernames: initialUsernames,
      teammate_emails: initialEmails,
      save_as_team: false,
      team_id: null,
    });
  };

  const togglePlayerSelection = (username) => {
    const current = [...selectedPlayers];
    const index = current.indexOf(username);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      if (current.length < requiredPlayers) {
        current.push(username);
      }
    }
    setSelectedPlayers(current);
  };

  const handleUsernameChange = async (index, value) => {
    const updated = [...formData.player_usernames];
    updated[index] = value;
    setFormData({ ...formData, player_usernames: updated });

    if (value.length >= 2) {
      try {
        const res = await authAPI.searchPlayerUsernames(value);
        setUsernameSuggestions({ ...usernameSuggestions, [index]: res.data.results || [] });
        setShowSuggestions({ ...showSuggestions, [index]: true });
      } catch (err) {
        console.error(err);
      }
    } else {
      setShowSuggestions({ ...showSuggestions, [index]: false });
    }
  };

  const selectSuggestion = (index, username) => {
    const updated = [...formData.player_usernames];
    updated[index] = username;
    setFormData({ ...formData, player_usernames: updated });
    setShowSuggestions({ ...showSuggestions, [index]: false });
  };

  const handleTeammateEmailChange = (index, email) => {
    const updated = [...formData.teammate_emails];
    updated[index] = email;
    setFormData({ ...formData, teammate_emails: updated });
  };

  const validateEmails = () => {
    const emails = formData.teammate_emails.filter((e) => e.trim() !== '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let email of emails) {
      if (!emailRegex.test(email)) {
        showToast(`Invalid email format: ${email}`, 'error');
        return false;
      }
    }

    // Check for duplicates
    if (new Set(emails).size !== emails.length) {
      showToast('Duplicate teammate emails not allowed', 'error');
      return false;
    }

    // Check if email count matches required players - 1
    if (emails.length !== requiredPlayers - 1) {
      showToast(`Please enter exactly ${requiredPlayers - 1} teammate emails`, 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validate emails for invite flow
    if (!validateEmails()) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        // Include captain username as first player
        player_usernames: [user?.user?.username || user?.username],
        // Include teammate emails for invite
        teammate_emails: formData.teammate_emails.filter((e) => e.trim() !== ''),
      };

      // Create registration first
      let registrationResponse;
      if (type === 'scrim') {
        if (event.event_mode === 'SCRIM') {
          registrationResponse = await tournamentAPI.registerForTournament(event.id, payload);
        } else {
          registrationResponse = await scrimAPI.registerForScrim(event.id, payload);
        }
      } else {
        registrationResponse = await tournamentAPI.registerForTournament(event.id, payload);
      }

      const regId = registrationResponse.data?.id;
      const paymentRequired = registrationResponse.data?.payment_required;
      const redirectUrl = registrationResponse.data?.redirect_url;

      // Check if payment is required
      if (paymentRequired && redirectUrl) {
        showToast(`Processing payment of ₹${event.entry_fee}...`, 'info');

        // Open PhonePe IFrame
        if (!window.PhonePeCheckout) {
          showToast('Payment system not loaded. Please refresh the page.', 'error');
          setLoading(false);
          return;
        }

        window.PhonePeCheckout.transact({
          tokenUrl: redirectUrl,
          callback: async (response) => {
            if (response === 'USER_CANCEL') {
              showToast('Payment cancelled. Registration not completed.', 'error');
              setLoading(false);
            } else if (response === 'CONCLUDED') {
              // Payment concluded - check status via API
              showToast('Checking registration status...', 'info');

              try {
                // Poll for payment status (webhook might not work on localhost)
                const checkStatus = async () => {
                  try {
                    const statusResponse = await tournamentAPI.checkPaymentStatus({
                      merchant_order_id: registrationResponse.data.merchant_order_id,
                    });

                    if (
                      statusResponse.data.status === 'completed' &&
                      statusResponse.data.registration_id
                    ) {
                      showToast('Registration successful!', 'success');
                      setLoading(false);
                      setTimeout(() => {
                        onSuccess();
                      }, 1500);
                    } else if (statusResponse.data.status === 'failed') {
                      showToast('Payment failed. Please try again.', 'error');
                      setLoading(false);
                    } else {
                      // Still pending, wait and check again
                      setTimeout(checkStatus, 2000);
                    }
                  } catch (err) {
                    console.error('Error in status check poll:', err);
                    // Continue polling even on temporary API error
                    setTimeout(checkStatus, 2000);
                  }
                };

                // Start checking after a short delay
                setTimeout(checkStatus, 1000);
              } catch (err) {
                console.error('Error starting status check:', err);
                showToast('Payment completed! Click Close if redirect fails.', 'success');
                setLoading(false);
              }
            }
          },
          type: 'IFRAME',
        });
      } else if (regId) {
        // Free entry with registration ID, no payment needed
        showToast('Registration successful!', 'success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        // Free entry, no payment needed
        showToast('Registration successful!', 'success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Registration failed', 'error');
      setLoading(false);
    }
  };

  const canProceedStep1 = useExistingTeam
    ? selectedTeam !== null
    : formData.team_name.trim() !== '' &&
      formData.teammate_emails.filter((e) => e.trim() !== '').length ===
        Math.max(0, requiredPlayers - 1);

  const SparkleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
    </svg>
  );

  const ShieldIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  const UserIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  return createPortal(
    <div className="scrimverse-reg-modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="scrimverse-reg-card cyber-card">
        {/* Header */}
        <div className="scrimverse-reg-header">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-blue/10 rounded-xl border border-accent-blue/20 text-accent-blue">
              <ShieldIcon />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tighter uppercase leading-none mb-1">
                {type === 'scrim' ? 'Scrim Registration' : 'Tournament Registration'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="scrimverse-reg-stepper">
          <div
            className={`scrimverse-step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
          >
            {step > 1 ? '✓' : '1'}
          </div>
          <div className={`scrimverse-step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`scrimverse-step-node ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {/* Content */}
        <div className="scrimverse-reg-content">
          {step === 1 && (
            <div className="space-y-4">
              {useExistingTeam && teams.length > 0 ? (
                <div className="space-y-4">
                  <div className="scrimverse-team-banner">
                    <div className="flex flex-col items-center justify-center w-full text-center">
                      <h3 className="scrimverse-team-banner-title flex items-center justify-center gap-2">
                        <SparkleIcon /> Use {selectedTeam?.name} for this Tournament <SparkleIcon />
                      </h3>
                      <p className="scrimverse-team-banner-subtitle">
                        Quick register with your existing team roster
                      </p>
                    </div>
                  </div>

                  {teams.length > 1 && (
                    <div className="scrimverse-input-group">
                      <label className="scrimverse-label">Select Task Force</label>
                      <div className="scrimverse-input-wrapper">
                        <select
                          value={selectedTeam?.id || ''}
                          onChange={(e) => {
                            const team = teams.find((t) => t.id === parseInt(e.target.value));
                            setSelectedTeam(team);
                            setFormData({ ...formData, team_name: team.name, team_id: team.id });
                          }}
                          className="scrimverse-input pl-4 h-10"
                        >
                          {teams.map((team) => (
                            <option key={team.id} value={team.id} className="bg-[#18191c]">
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCreateNewTeam}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all border border-white/5"
                  >
                    OR CREATE A NEW TEAM
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="scrimverse-input-group">
                    <label className="scrimverse-label">
                      Team Name <span className="text-accent-blue">*</span>
                    </label>
                    <div className="scrimverse-input-wrapper relative">
                      <span className="scrimverse-input-icon">
                        <ShieldIcon />
                      </span>
                      <input
                        type="text"
                        value={formData.team_name}
                        onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                        placeholder="ENTER TEAM NAME"
                        className="scrimverse-input h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Your Username (Read-only - Captain) */}
                    <div className="scrimverse-input-group">
                      <label className="scrimverse-label">
                        Your Username <span className="text-accent-blue">*</span>
                      </label>
                      <div className="scrimverse-input-wrapper relative">
                        <span className="scrimverse-input-icon">
                          <UserIcon />
                        </span>
                        <input
                          type="text"
                          value={user?.user?.username || user?.username || 'player1'}
                          readOnly
                          placeholder="YOUR USERNAME"
                          className="scrimverse-input h-10 bg-white/5 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[8px] text-gray-600 mt-1">
                        You'll be registered as the team leader
                      </p>
                    </div>

                    {/* Teammate Email IDs */}
                    {requiredPlayers > 1 && (
                      <div className="scrimverse-input-group">
                        <label className="scrimverse-label">
                          Teammate Email IDs <span className="text-accent-blue">*</span>
                        </label>
                        <div className="space-y-2">
                          {Array.from({ length: requiredPlayers - 1 }).map((_, i) => (
                            <div key={i} className="scrimverse-input-wrapper relative">
                              <input
                                type="email"
                                placeholder={`Teammate ${i + 2} email`}
                                value={formData.teammate_emails[i] || ''}
                                onChange={(e) => handleTeammateEmailChange(i, e.target.value)}
                                className="scrimverse-input h-10"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] font-bold text-purple-400 mt-2 bg-purple-500/10 p-2 rounded border border-purple-500/20">
                          First time only. Once your teammates join and you're part of a team, you
                          can register for future tournaments in 30 seconds by selecting players
                          directly.
                        </p>
                      </div>
                    )}
                  </div>

                  <label className="scrimverse-checkbox-group flex items-center gap-3 p-3 bg-white/20 border border-white/5 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      hidden
                      checked={formData.save_as_team}
                      onChange={(e) => setFormData({ ...formData, save_as_team: e.target.checked })}
                    />
                    <div
                      className={`scrimverse-checkbox-custom flex-shrink-0 ${formData.save_as_team ? 'bg-accent-blue border-accent-blue' : 'border-white/10'}`}
                    >
                      {formData.save_as_team && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-tight">
                      PERSIST ROSTER FOR FUTURE OPERATIONS
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {step === 2 && useExistingTeam && selectedTeam && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">
                    Select Team Members
                  </h3>
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                    Assign {requiredPlayers} players
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest"
                >
                  ← BACK
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedTeam.members.map((member) => {
                  const isSelected = selectedPlayers.includes(member.username);
                  const isDisabled = !isSelected && selectedPlayers.length >= requiredPlayers;

                  return (
                    <button
                      key={member.id}
                      onClick={() => !isDisabled && togglePlayerSelection(member.username)}
                      disabled={isDisabled}
                      className={`scrimverse-player-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="scrimverse-checkbox-custom">
                        {isSelected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="4"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-black text-white">{member.username}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="scrimverse-reg-footer">
          <button onClick={onClose} className="scrimverse-btn-cancel">
            Cancel
          </button>
          <button
            onClick={step === 1 && useExistingTeam ? handleUseExistingTeam : handleSubmit}
            disabled={
              loading ||
              (step === 1 && !canProceedStep1) ||
              (step === 2 && selectedPlayers.length !== requiredPlayers)
            }
            className="scrimverse-btn-primary"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin-custom"></div>
                <span>PROCESSING...</span>
              </div>
            ) : step === 1 && useExistingTeam ? (
              'Continue'
            ) : hasEntryFee ? (
              `Register & Pay ₹${event.entry_fee}`
            ) : (
              'CONFIRM REGISTRATION'
            )}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>,
    document.body
  );
};

export default RegistrationModal;
