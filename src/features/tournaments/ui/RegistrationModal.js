import { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { tournamentAPI, teamAPI, authAPI, paymentsAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import useToast from '../../../hooks/useToast';
import Toast from '../../../components/Toast';
import {
  Users,
  UserPlus,
  Sparkles,
  Mail,
  Phone,
  AtSign,
  Check,
  X,
  Loader2,
  ChevronLeft,
  User,
  Info,
} from 'lucide-react';
import './RegistrationModal.css';

const RegistrationModal = ({ event, type = 'tournament', onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();

  // ── Core screen state ──
  const [screen, setScreen] = useState('loading'); // 'loading'|'choose'|'existing'|'new-team'|'br-flow'
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [noCancelAgreed, setNoCancelAgreed] = useState(false);

  // ── Existing team: select players via dropdowns ──
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  // ── New team / BR flow form state ──
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteMode, setInviteMode] = useState('phone');
  const [teammates, setTeammates] = useState([]);
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const searchCounter = useRef(0);
  const inputRefs = useRef({});
  const focusedIndex = useRef(null);

  const requiredPlayers =
    { Squad: 4, Duo: 2, Solo: 1, '5v5': 5, '4v4': 4, '2v2': 2 }[
      event.game_mode || event.event_mode
    ] || 1;
  const hasEntryFee = parseFloat(event.entry_fee) > 0;
  const teammateCount = Math.max(0, requiredPlayers - 1);

  useEffect(() => {
    setTeammates(Array(teammateCount).fill(''));
    setSelectedUsernames(Array(teammateCount).fill(null));
    setSelectedPlayers(Array(teammateCount).fill(''));
  }, [teammateCount]);

  // ── Fetch teams filtered by game ──
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamAPI.getTeams({ mine: 'true' });
        const allTeams = res.data?.results || res.data || [];
        const currentUserId = user?.user?.id;
        const tournamentGame = (event.game_name || event.game || '')
          .toLowerCase()
          .replace(/\s+/g, '');
        const normalizeGame = (g = '') => g.toLowerCase().replace(/\s+/g, '');

        const matchingTeams = allTeams.filter((t) => {
          if (t.is_temporary) return false;
          const teamGame = normalizeGame(t.game || '');
          const gameMatch = !t.game || teamGame === tournamentGame;
          // Captain entry in members has no user wrapper — its id IS the user id
          const isMember =
            t.captain === currentUserId ||
            t.members?.some((m) => {
              const mid = typeof m.user === 'object' ? m.user?.id : m.user;
              return mid === currentUserId;
            });
          return gameMatch && isMember;
        });

        if (matchingTeams.length > 0) {
          setTeams(matchingTeams);
          setSelectedTeam(matchingTeams[0]);
          setScreen('choose');
        } else {
          setTeams([]);
          setScreen('br-flow');
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
        setTeams([]);
        setScreen('br-flow');
      }
    };
    fetchTeams();
  }, [event, user]);

  // ── Invite mode toggle resets inputs ──
  const handleInviteModeChange = (mode) => {
    setInviteMode(mode);
    setTeammates(Array(teammateCount).fill(''));
    setSelectedUsernames(Array(teammateCount).fill(null));
    setSuggestions({});
    setShowSuggestions({});
    setFieldErrors({});
  };

  // Restore focus to the active input after re-renders
  useEffect(() => {
    if (focusedIndex.current !== null && inputRefs.current[focusedIndex.current]) {
      const el = inputRefs.current[focusedIndex.current];
      el.focus();
      // Move cursor to end (email inputs don't support setSelectionRange)
      if (el.type !== 'email') {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  });

  // ── Username autocomplete with debounce ──
  const debounceTimers = useRef({});

  const handleTeammateChange = (index, value) => {
    const updated = [...teammates];
    updated[index] = value;
    setTeammates(updated);

    const newSelected = [...selectedUsernames];
    newSelected[index] = null;
    setSelectedUsernames(newSelected);

    const newErrors = { ...fieldErrors };
    delete newErrors[index];
    setFieldErrors(newErrors);

    // Track which input should keep focus
    focusedIndex.current = index;

    if (inviteMode !== 'username') return;

    // Clear previous debounce timer for this index
    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index]);
    }

    if (value.length >= 1) {
      searchCounter.current += 1;
      const myToken = searchCounter.current;
      debounceTimers.current[index] = setTimeout(async () => {
        try {
          const res = await authAPI.searchPlayerUsernames(value, false);
          if (myToken !== searchCounter.current) return;
          const currentUsername = user?.user?.username || '';
          const alreadySelected = [currentUsername, ...newSelected.filter((u) => u !== null)];
          const filtered = (res.data.results || []).filter(
            (u) => !alreadySelected.includes(u.username)
          );
          setSuggestions((prev) => ({ ...prev, [index]: filtered }));
          setShowSuggestions((prev) => ({ ...prev, [index]: filtered.length > 0 }));
        } catch {
          setShowSuggestions((prev) => ({ ...prev, [index]: false }));
        }
      }, 300);
    } else {
      setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      setSuggestions((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const handleTeammateSelect = (index, username) => {
    focusedIndex.current = null;
    const updated = [...teammates];
    updated[index] = username;
    setTeammates(updated);
    const newSelected = [...selectedUsernames];
    newSelected[index] = username;
    setSelectedUsernames(newSelected);
    setShowSuggestions((prev) => ({ ...prev, [index]: false }));
    const newErrors = { ...fieldErrors };
    delete newErrors[index];
    setFieldErrors(newErrors);
  };

  const handleTeammateBlur = (index) => {
    focusedIndex.current = null;
    setTimeout(() => {
      setShowSuggestions((prev) => ({ ...prev, [index]: false }));
      if (inviteMode === 'username' && teammates[index] && !selectedUsernames[index]) {
        const updated = [...teammates];
        updated[index] = '';
        setTeammates(updated);
        setFieldErrors((prev) => ({ ...prev, [index]: 'Please select from the dropdown' }));
      }
    }, 200);
  };

  // ── Validation ──
  const validateForm = () => {
    if (!newTeamName.trim()) {
      showToast('Please enter a team name', 'error');
      return false;
    }
    const validContacts = teammates.filter((t) => t.trim());
    if (requiredPlayers > 1 && validContacts.length === 0) {
      showToast('Please add at least 1 teammate', 'error');
      return false;
    }
    if (inviteMode === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const val of validContacts) {
        if (!emailRegex.test(val)) {
          showToast(`Invalid email: ${val}`, 'error');
          return false;
        }
      }
    } else if (inviteMode === 'phone') {
      for (const val of validContacts) {
        const stripped = val.replace(/\s/g, '');
        // Accept: +91XXXXXXXXXX or plain 10-digit Indian number
        if (!/^\+\d{10,15}$/.test(stripped) && !/^\d{10}$/.test(stripped)) {
          showToast(`Invalid phone: ${val}. Enter a 10-digit number or +91XXXXXXXXXX`, 'error');
          return false;
        }
      }
    } else if (inviteMode === 'username') {
      const errs = {};
      teammates.forEach((val, idx) => {
        if (val.trim() && !selectedUsernames[idx]) errs[idx] = 'Select from dropdown';
      });
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        showToast('Please select all players from the dropdown', 'error');
        return false;
      }
    }
    if (validContacts.length > 0 && new Set(validContacts).size !== validContacts.length) {
      showToast('Duplicate entries not allowed', 'error');
      return false;
    }
    return true;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setFormError('');
    if (screen === 'new-team' || screen === 'br-flow') {
      if (!validateForm()) return;
      setSubmitting(true);
      try {
        const validContacts = teammates.filter((t) => t.trim());
        const payload = { team_name: newTeamName.trim(), invite_mode: inviteMode };
        if (inviteMode === 'username') {
          payload.teammate_usernames = validContacts;
        } else if (inviteMode === 'phone') {
          // Normalize 10-digit numbers to +91 format
          payload.teammate_phones = validContacts.map((p) =>
            /^\d{10}$/.test(p.replace(/\s/g, '')) ? `+91${p.replace(/\s/g, '')}` : p
          );
        } else {
          payload.teammate_emails = validContacts;
        }
        const initResp = await tournamentAPI.registerInitiate(event.id, payload);
        const registration = initResp.data;

        if (hasEntryFee) {
          const regId =
            registration?.registration_id || registration?.registrationId || registration?.id;
          if (!regId) {
            showToast('Registration created but missing ID. Please refresh.', 'error');
            setSubmitting(false);
            return;
          }
          const payResp = await paymentsAPI.startPayment({
            payment_type: 'entry_fee',
            amount: Number(event.entry_fee) || 0,
            registration_id: regId,
            tournament_id: event.id,
          });
          const redirect = payResp.data.redirect_url || payResp.data.payment_url;
          if (redirect) {
            window.location.href = redirect;
            return;
          }
          showToast('Registration initiated. Complete payment from next screen.', 'info');
          setSubmitting(false);
          onSuccess();
        } else {
          showToast('Registration successful!', 'success');
          setSubmitting(false);
          setTimeout(() => onSuccess(), 1500);
        }
      } catch (err) {
        const errData = err.response?.data;
        const msg =
          errData?.error ||
          errData?.team_name?.[0] ||
          errData?.teammate_emails?.[0] ||
          errData?.teammate_usernames?.[0] ||
          errData?.teammate_phones?.[0] ||
          errData?.message ||
          'Registration failed';
        const msgStr = typeof msg === 'string' ? msg : JSON.stringify(msg);
        setFormError(msgStr);
        showToast(msgStr, 'error');
        setSubmitting(false);
      }
      return;
    }

    // existing team path
    if (screen === 'existing') {
      const picked = selectedPlayers.filter(Boolean);
      if (picked.length < teammateCount) {
        showToast(
          `Please select ${teammateCount} teammate${teammateCount !== 1 ? 's' : ''}`,
          'error'
        );
        return;
      }
      setSubmitting(true);
      try {
        const allUsernames = [user?.user?.username, ...picked];
        const payload = { team_id: selectedTeam.id, player_usernames: allUsernames };
        const regResp = await tournamentAPI.registerForTournament(event.id, payload);
        const paymentRequired = regResp.data?.payment_required;
        const redirectUrl = regResp.data?.redirect_url;

        if (paymentRequired && redirectUrl) {
          showToast(`Processing payment of ₹${event.entry_fee}...`, 'info');
          if (!window.PhonePeCheckout) {
            window.location.href = redirectUrl;
            return;
          }
          window.PhonePeCheckout.transact({
            tokenUrl: redirectUrl,
            callback: async (response) => {
              if (response === 'USER_CANCEL') {
                showToast('Payment cancelled.', 'error');
                setSubmitting(false);
              } else if (response === 'CONCLUDED') {
                showToast('Checking registration status...', 'info');
                const checkStatus = async () => {
                  try {
                    const statusResp = await tournamentAPI.checkPaymentStatus({
                      merchant_order_id: regResp.data.merchant_order_id,
                    });
                    if (statusResp.data.status === 'completed' && statusResp.data.registration_id) {
                      showToast('Registration successful!', 'success');
                      setSubmitting(false);
                      setTimeout(() => onSuccess(), 1500);
                    } else if (statusResp.data.status === 'failed') {
                      showToast('Payment failed. Please try again.', 'error');
                      setSubmitting(false);
                    } else {
                      setTimeout(checkStatus, 2000);
                    }
                  } catch {
                    setTimeout(checkStatus, 2000);
                  }
                };
                setTimeout(checkStatus, 1000);
              }
            },
            type: 'IFRAME',
          });
        } else {
          showToast('Registration successful!', 'success');
          setTimeout(() => onSuccess(), 1500);
        }
      } catch (err) {
        const errData = err.response?.data;
        const msg =
          errData?.error || errData?.player_usernames || errData?.message || 'Registration failed';
        showToast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
        setSubmitting(false);
      }
    }
  };

  // ── Entry Fee Row ──
  const EntryFeeRow = () => (
    <div className="jt-entry-fee-row">
      <span className="jt-entry-fee-label">Entry Fee</span>
      {hasEntryFee ? (
        <span className="jt-entry-fee-amount">₹{event.entry_fee}</span>
      ) : (
        <span className="jt-entry-fee-free">FREE</span>
      )}
    </div>
  );

  // ── Invite Mode Toggle ──
  const InviteModeToggle = ({ mode, setMode }) => (
    <div className="jt-invite-toggle">
      {[
        { mode: 'phone', icon: Phone, label: 'Phone' },
        { mode: 'email', icon: Mail, label: 'Email' },
        { mode: 'username', icon: AtSign, label: 'Username' },
      ].map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          type="button"
          className={`jt-invite-btn${mode === m ? ' active' : ''}`}
          onClick={() => setMode(m)}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );

  // ── Teammate invite inputs ──
  const TeammateInputs = () => (
    <div className="space-y-2">
      <label className="jt-label">
        {inviteMode === 'email' ? (
          <Mail size={14} className="jt-label-icon" />
        ) : inviteMode === 'phone' ? (
          <Phone size={14} className="jt-label-icon" />
        ) : (
          <AtSign size={14} className="jt-label-icon" />
        )}
        Teammate{' '}
        {inviteMode === 'email'
          ? 'Email IDs'
          : inviteMode === 'phone'
            ? 'Phone Numbers'
            : 'Usernames'}{' '}
        <span className="jt-required">*</span>
      </label>
      {Array.from({ length: teammateCount }).map((_, i) => (
        <div key={`${inviteMode}-${i}`} style={{ position: 'relative' }}>
          <input
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type={inviteMode === 'email' ? 'email' : 'text'}
            className={`jt-input${fieldErrors[i] ? ' input-error' : ''}${selectedUsernames[i] ? ' input-selected' : ''}`}
            placeholder={
              inviteMode === 'phone'
                ? `Teammate ${i + 2} phone (+91...)`
                : inviteMode === 'email'
                  ? `Teammate ${i + 2} email`
                  : `@teammate${i + 2}_username`
            }
            value={teammates[i] || ''}
            onChange={(e) => {
              if (inviteMode === 'username' && selectedUsernames[i]) return;
              handleTeammateChange(i, e.target.value);
            }}
            onFocus={() => {
              focusedIndex.current = i;
            }}
            onBlur={() => handleTeammateBlur(i)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && inviteMode === 'username' && selectedUsernames[i]) {
                e.preventDefault();
                const u = [...teammates];
                u[i] = '';
                setTeammates(u);
                const s = [...selectedUsernames];
                s[i] = null;
                setSelectedUsernames(s);
                const err = { ...fieldErrors };
                delete err[i];
                setFieldErrors(err);
              }
            }}
          />
          {inviteMode === 'username' && showSuggestions[i] && suggestions[i]?.length > 0 && (
            <div className="jt-suggestions">
              {suggestions[i].map((s) => (
                <div
                  key={s.id}
                  className="jt-suggestion-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleTeammateSelect(i, s.username);
                  }}
                >
                  {s.username}
                </div>
              ))}
            </div>
          )}
          {fieldErrors[i] && <div className="jt-field-error">{fieldErrors[i]}</div>}
        </div>
      ))}

      <div className="jt-info-box">
        <Info size={14} className="jt-info-icon" />
        <p>
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>First time only.</span>{' '}
          Once teammates join, future registrations take 30 seconds.
        </p>
      </div>
      {inviteMode === 'phone' && (
        <div className="jt-warn-box">
          Phone invites require teammates to have a registered Scrimverse account linked to that
          number.
        </div>
      )}
    </div>
  );

  // ── Loading ──
  if (screen === 'loading')
    return createPortal(
      <div className="jt-overlay">
        <div className="jt-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}
          >
            <Loader2
              size={28}
              style={{ color: 'hsl(265,80%,60%)', animation: 'spin 1s linear infinite' }}
            />
          </div>
        </div>
      </div>,
      document.body
    );

  // ── Choose screen ──
  const renderChoose = () => (
    <div className="jt-body space-y-4">
      <div className="space-y-3">
        {/* Use existing team card */}
        <button
          className="jt-choose-card jt-choose-card--amber"
          onClick={() => setScreen('existing')}
        >
          <div className="jt-choose-icon jt-choose-icon--amber">
            <Sparkles size={20} />
          </div>
          <div className="jt-choose-text">
            <p className="jt-choose-title jt-choose-title--amber">Use Team {selectedTeam?.name}</p>
            <p className="jt-choose-sub">
              Select {teammateCount} player{teammateCount !== 1 ? 's' : ''} from your roster
            </p>
          </div>
        </button>

        {/* OR divider */}
        <div className="jt-or-divider">
          <div className="jt-or-line" />
          <span className="jt-or-text">OR</span>
          <div className="jt-or-line" />
        </div>

        {/* Create new team card */}
        <button className="jt-choose-card" onClick={() => setScreen('new-team')}>
          <div className="jt-choose-icon jt-choose-icon--muted">
            <UserPlus size={20} />
          </div>
          <div className="jt-choose-text">
            <p className="jt-choose-title">Create a New Team</p>
            <p className="jt-choose-sub">Temporary team for this match only</p>
          </div>
        </button>
      </div>

      {/* Info note */}
      <div className="jt-note-box">
        <p>
          New teams exist only for this match. For a permanent team, exit and create one from your
          dashboard.
        </p>
      </div>

      <EntryFeeRow />

      <button onClick={onClose} className="jt-btn-cancel" style={{ width: '100%' }}>
        Cancel
      </button>
    </div>
  );

  // ── Existing team: select teammates via card grid ──
  const renderExisting = () => {
    const members = selectedTeam?.members || [];
    const currentUsername = user?.user?.username || '';
    const pickedCount = selectedPlayers.filter(Boolean).length;
    const canConfirm = pickedCount >= teammateCount;

    const togglePlayer = (uname) => {
      setSelectedPlayers((prev) => {
        if (prev.includes(uname)) return prev.filter((u) => u !== uname);
        if (prev.filter(Boolean).length < teammateCount) return [...prev, uname];
        return prev;
      });
    };

    return (
      <div className="jt-body space-y-4">
        {/* Team header card */}
        <div className="jt-team-header-card jt-team-header-card--amber">
          <div className="jt-team-header-icon jt-team-header-icon--amber">
            <Sparkles size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <p className="jt-team-header-name">{selectedTeam?.name}</p>
            <p className="jt-team-header-sub">
              {pickedCount}/{teammateCount} teammate{teammateCount !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        {/* Player card grid */}
        {members.length === 0 ? (
          <p
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 13,
              textAlign: 'center',
              padding: '16px 0',
            }}
          >
            No members in this team yet.
          </p>
        ) : (
          <div className="jt-player-grid">
            {members.map((m) => {
              const uname = m.username || m.user?.username || '';
              if (uname === currentUsername) return null; // skip self
              const initials = uname.slice(0, 2).toUpperCase();
              const isSelected = selectedPlayers.includes(uname);
              const isDisabled = !isSelected && pickedCount >= teammateCount;
              return (
                <button
                  key={uname}
                  className={`jt-player-card${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                  onClick={() => !isDisabled && togglePlayer(uname)}
                >
                  <div className="jt-player-avatar">{initials}</div>
                  <span className="jt-player-name">{uname}</span>
                  <div className={`jt-player-check${isSelected ? ' checked' : ''}`}>
                    {isSelected && <Check size={10} color="white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <EntryFeeRow />
        <NoCancelWarning />

        <div className="jt-footer-row">
          <button
            onClick={handleSubmit}
            disabled={!canConfirm || !noCancelAgreed || submitting}
            className="jt-btn-primary"
            style={{ flex: 1 }}
          >
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
              </span>
            ) : hasEntryFee ? (
              `Confirm & Pay ₹${event.entry_fee}`
            ) : (
              'Confirm Registration'
            )}
          </button>
          <button onClick={() => setScreen('choose')} className="jt-btn-back">
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
    );
  };

  // ── New team (from choose, has back button + temp badge) ──
  const renderNewTeam = () => (
    <div className="jt-body space-y-4">
      {/* New team header card */}
      <div className="jt-team-header-card">
        <div className="jt-team-header-icon jt-team-header-icon--muted">
          <UserPlus size={20} />
        </div>
        <div>
          <p className="jt-team-header-name">Create New Team</p>
          <p className="jt-team-header-sub">This team exists only for the current match</p>
        </div>
      </div>

      {/* Team name */}
      <div className="space-y-1.5">
        <label className="jt-label-plain">
          Team Name <span className="jt-required">*</span>
        </label>
        <input
          type="text"
          className="jt-input"
          placeholder="Enter team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
        />
      </div>

      {/* Invite mode toggle */}
      <InviteModeToggle mode={inviteMode} setMode={handleInviteModeChange} />

      {teammateCount > 0 && <TeammateInputs />}

      <EntryFeeRow />
      <NoCancelWarning />

      {formError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {formError}
        </div>
      )}

      <div className="jt-footer-row">
        <button
          onClick={handleSubmit}
          disabled={!newTeamName.trim() || !noCancelAgreed || submitting}
          className="jt-btn-primary"
          style={{ flex: 1 }}
        >
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
            </span>
          ) : hasEntryFee ? (
            `Register & Pay ₹${event.entry_fee}`
          ) : (
            'Confirm Registration'
          )}
        </button>
        <button onClick={() => setScreen('choose')} className="jt-btn-back">
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );

  // ── BR Flow (no existing team — goes direct to form) ──
  const renderBRFlow = () => (
    <div className="jt-body space-y-4">
      {/* Your Username */}
      <div className="space-y-1.5">
        <label className="jt-label">
          <User size={14} className="jt-label-icon" /> Your Username
        </label>
        <input
          type="text"
          className="jt-input"
          style={{ opacity: 0.6, cursor: 'not-allowed' }}
          value={user?.user?.username || ''}
          readOnly
        />
        <p className="jt-hint">You'll be the team leader</p>
      </div>

      {/* Team Name */}
      <div className="space-y-1.5">
        <label className="jt-label-plain">
          Team Name <span className="jt-required">*</span>
        </label>
        <input
          type="text"
          className="jt-input"
          placeholder="Enter your team name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
        />
      </div>

      {/* Invite mode toggle */}
      {teammateCount > 0 && <InviteModeToggle mode={inviteMode} setMode={handleInviteModeChange} />}

      {teammateCount > 0 && <TeammateInputs />}

      <EntryFeeRow />
      <NoCancelWarning />

      {formError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {formError}
        </div>
      )}

      <div className="jt-footer-row">
        <button
          onClick={handleSubmit}
          disabled={!newTeamName.trim() || !noCancelAgreed || submitting}
          className="jt-btn-primary"
          style={{ flex: 1 }}
        >
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
            </span>
          ) : hasEntryFee ? (
            `Continue to Payment`
          ) : (
            'Confirm Registration'
          )}
        </button>
        <button onClick={onClose} className="jt-btn-cancel" style={{ padding: '0 20px' }}>
          Cancel
        </button>
      </div>
    </div>
  );

  // ── No cancel warning component ──
  const NoCancelWarning = () => (
    <div className="jt-no-cancel">
      <div className="jt-no-cancel-banner">
        <span>⚠</span>
        <span>Registration is final. No cancellations or refunds.</span>
      </div>
      <label className="jt-no-cancel-check">
        <input
          type="checkbox"
          hidden
          checked={noCancelAgreed}
          onChange={(e) => setNoCancelAgreed(e.target.checked)}
        />
        <div className={`jt-checkbox${noCancelAgreed ? ' checked' : ''}`}>
          {noCancelAgreed && (
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
        <span className="jt-no-cancel-text">I understand registration cannot be cancelled</span>
      </label>
    </div>
  );

  return createPortal(
    <div className="jt-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="jt-card">
        {/* Header */}
        <div className="jt-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} style={{ color: 'rgba(255,255,255,0.5)' }} />
            <div>
              <h2 className="jt-title">Join {type === 'scrim' ? 'Scrim' : 'Tournament'}</h2>
              <p className="jt-subtitle">Register for &ldquo;{event.title || event.name}&rdquo;</p>
            </div>
          </div>
          <button className="jt-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {screen === 'choose' && renderChoose()}
        {screen === 'existing' && renderExisting()}
        {screen === 'new-team' && renderNewTeam()}
        {screen === 'br-flow' && renderBRFlow()}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>,
    document.body
  );
};

export default RegistrationModal;
