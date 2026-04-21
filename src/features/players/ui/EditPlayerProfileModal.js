import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Camera,
  User,
  Gamepad2,
  Bell,
  Shield,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { authAPI, paymentsAPI } from '../../../utils/api';
import { sanitizeInput, sanitizeBio } from '../../../utils/sanitize';
import './EditPlayerProfileModal.css';

const NOTIF_STORAGE_KEY = 'scrimverse_notif_prefs';

const DEFAULT_NOTIF_PREFS = {
  enableNotifications: true,
  matchReminders: true,
  tournamentUpdates: true,
  teamInvites: true,
  marketingEmails: false,
};

function loadNotifPrefs() {
  try {
    const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (stored) return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(stored) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_NOTIF_PREFS };
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
];

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`ps-switch${checked ? ' active' : ''}`}
  >
    <span className="ps-switch-thumb" />
  </button>
);

const EditPlayerProfileModal = ({
  isOpen,
  onClose,
  player,
  onSuccess,
  requirePhone = false,
  onPhoneVerified,
  onViewAllTransactions,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');
  const [phoneVerifiedLocally, setPhoneVerifiedLocally] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  // ── Profile picture ──────────────────────────────────────────────────────
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    player?.profile_picture || null
  );

  // ── Profile fields ───────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    username: player?.username || '',
    phone_number: player?.phone_number || '',
    in_game_name: player?.player_profile?.in_game_name || '',
    game_id: player?.player_profile?.game_id || '',
    bio: player?.player_profile?.bio || '',
    preferred_games: player?.player_profile?.preferred_games || [],
    game_profiles: player?.player_profile?.game_profiles || {},
  });

  // ── Security fields ──────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

  // ── Notification toggles ─────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState(loadNotifPrefs);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state for phone change
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [isChangingPhone, setIsChangingPhone] = useState(false);

  // OTP state for password change
  const [passOtpSent, setPassOtpSent] = useState(false);
  const [passOtp, setPassOtp] = useState('');
  const [passOtpCountdown, setPassOtpCountdown] = useState(0);
  const [passOtpLoading, setPassOtpLoading] = useState(false);

  // Transactions tab
  const [txPayments, setTxPayments] = useState([]);
  const [txEarnings, setTxEarnings] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // Export / delete account
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && player) {
      setFormData({
        username: player.username || '',
        phone_number: player.phone_number || '',
        in_game_name: player.player_profile?.in_game_name || '',
        game_id: player.player_profile?.game_id || '',
        bio: player.player_profile?.bio || '',
        preferred_games: player.player_profile?.preferred_games || [],
        game_profiles: player.player_profile?.game_profiles || {},
      });
      setProfilePicturePreview(player.profile_picture || null);
      setProfilePicture(null);
      const backendPrefs = player.player_profile?.notification_preferences;
      if (backendPrefs && Object.keys(backendPrefs).length > 0) {
        setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...backendPrefs });
      } else {
        setNotifPrefs(loadNotifPrefs());
      }
      setPasswords({ current: '', newPass: '', confirm: '' });
      setIsChangingPhone(false);
      setPhoneOtpSent(false);
      setPhoneOtp('');
      setError('');
      setSuccess('');
      setActiveTab('profile');
      setPhoneVerifiedLocally(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  // OTP countdown tickers
  useEffect(() => {
    const timers = [];
    if (phoneOtpCountdown > 0) {
      const t = setTimeout(() => setPhoneOtpCountdown((c) => c - 1), 1000);
      timers.push(t);
    }
    if (passOtpCountdown > 0) {
      const t = setTimeout(() => setPassOtpCountdown((c) => c - 1), 1000);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, [phoneOtpCountdown, passOtpCountdown]);

  useEffect(() => {
    if (activeTab !== 'transactions') return;
    let cancelled = false;
    setTxLoading(true);
    Promise.all([paymentsAPI.listPayments(), paymentsAPI.getEarnings()])
      .then(([payRes, earnRes]) => {
        if (cancelled) return;
        setTxPayments(payRes.data?.results ?? payRes.data ?? []);
        setTxEarnings(earnRes.data?.earnings ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const recentTransactions = useMemo(() => {
    const spent = txPayments
      .filter((p) => p.status === 'completed')
      .map((p) => ({
        id: `pay-${p.id}`,
        type: 'spent',
        name: p.tournament_title || 'Entry Fee',
        game: p.tournament_game_name || '',
        amount: Number(p.amount) || 0,
        date: p.created_at,
      }));
    const earned = txEarnings.map((e, i) => ({
      id: `earn-${e.tournament_id || i}`,
      type: 'earned',
      name: e.tournament_title || 'Prize Money',
      game: e.game_name || '',
      amount: Number(e.amount) || 0,
      date: e.date,
    }));
    return [...spent, ...earned].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [txPayments, txEarnings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const toggleNotif = (key) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicture(file);
    setProfilePicturePreview(URL.createObjectURL(file));
  };

  const handleClose = () => {
    if (requirePhone && !player?.phone_verified && !phoneVerifiedLocally) {
      setError('Please verify your phone number to continue');
      return;
    }
    onClose();
  };

  const handleSendPhoneOTP = async () => {
    setPhoneOtpLoading(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.sendOTP('phone_change', formData.phone_number);
      setPhoneOtpSent(true);
      setPhoneOtpCountdown(600);
      setPhoneOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleSendPassOTP = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      setError('Please fill all three password fields before requesting OTP');
      return;
    }
    if (passwords.newPass.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }
    setPassOtpLoading(true);
    setError('');
    setSuccess('');
    try {
      const currentPhone = formData.phone_number || '';
      await authAPI.sendOTP('password_change', currentPhone);
      setPassOtpSent(true);
      setPassOtpCountdown(600);
      setPassOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setPassOtpLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    const sanitizedUsername = sanitizeInput(formData.username);
    const sanitizedBio = sanitizeBio(formData.bio);
    if (!sanitizedUsername.trim()) {
      setError('Username is required');
      return;
    }
    setLoading(true);
    try {
      const userFormData = new FormData();
      userFormData.append('username', sanitizedUsername);
      if (profilePicture) userFormData.append('profile_picture', profilePicture);
      await authAPI.updateUser(userFormData);

      const profileResponse = await authAPI.updatePlayerProfile({
        in_game_name: formData.game_profiles?.BGMI?.ign || formData.in_game_name || '',
        game_id: formData.game_profiles?.BGMI?.game_id || formData.game_id || '',
        bio: sanitizedBio,
        preferred_games: formData.preferred_games,
        game_profiles: formData.game_profiles || {},
      });

      await authAPI.updatePlayerProfile({ notification_preferences: notifPrefs });
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifPrefs));

      setSuccess('Profile updated successfully!');
      onSuccess({
        ...{ username: sanitizedUsername },
        player_profile: profileResponse.data,
      });
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

  const handleExportData = async () => {
    setError('');
    setSuccess('');
    setExportLoading(true);
    try {
      await authAPI.requestDataExport();
      setSuccess('Your data export is being prepared -- check your email shortly!');
    } catch (err) {
      if (err.response?.status === 429) {
        const retryStr = err.response.data?.retry_after_str;
        setError(
          retryStr
            ? `You already requested a data export recently. Check your email (or retry in ${retryStr}).`
            : 'You already requested a data export recently. Check your email.'
        );
      } else {
        setError('Failed to request data export. Please try again.');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setSuccess('');
    if (!deletePassword.trim()) {
      setError('Please enter your password to confirm deletion.');
      return;
    }
    setDeleteLoading(true);
    try {
      await authAPI.deleteAccount(deletePassword);
      localStorage.removeItem('tokens');
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  const isUsernameDisabled =
    player?.username_change_count > 0 &&
    new Date(player.last_username_change) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const avatarLetter = (player?.username || 'P').charAt(0).toUpperCase();

  const NOTIF_TOGGLES = [
    {
      key: 'enableNotifications',
      label: 'Enable Notifications',
      desc: 'Receive push notifications',
    },
    { key: 'matchReminders', label: 'Match Reminders', desc: 'Get alerts before matches start' },
    {
      key: 'tournamentUpdates',
      label: 'Tournament Updates',
      desc: 'Registration & results notifications',
    },
    { key: 'teamInvites', label: 'Team Invites', desc: 'Get notified when invited to teams' },
    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional content and offers' },
  ];

  return (
    <div className="ps-overlay" onClick={handleClose}>
      <div className="ps-dialog" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="ps-header">
          <div className="flex items-center gap-2">
            <User size={16} className="text-purple-400" />
            <h2 className="ps-header-title">Player Settings</h2>
          </div>
          <button className="ps-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="ps-tabs">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`ps-tab${activeTab === id ? ' ps-tab-active' : ''}`}
              onClick={() => {
                setActiveTab(id);
                setError('');
                setSuccess('');
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Scrollable Body ── */}
        <div className="ps-body">
          {error && <div className="ps-error">{error}</div>}
          {success && <div className="ps-success">{success}</div>}

          {/* ══════════════ PROFILE TAB ══════════════ */}
          {activeTab === 'profile' && (
            <div className="ps-section-gap">
              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                <label
                  htmlFor="player-profile-picture-upload"
                  className="ps-avatar-wrap ps-avatar-clickable"
                >
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" className="ps-avatar-img" />
                  ) : (
                    <span className="ps-avatar-letter">{avatarLetter}</span>
                  )}
                  <span
                    className={`ps-avatar-overlay${!profilePicturePreview ? ' ps-avatar-overlay-always' : ''}`}
                  >
                    <Camera size={16} style={{ color: '#fff' }} />
                  </span>
                  <input
                    id="player-profile-picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div>
                  <p className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {player?.username || 'Player'}
                  </p>
                  <p className="ps-input-hint" style={{ marginTop: '0.25rem' }}>
                    Click to upload · Max 5MB · JPG, PNG
                  </p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="ps-field-label">Username</label>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isUsernameDisabled}
                  className="ps-input"
                />
                {isUsernameDisabled && <p className="ps-input-hint">Changeable every 6 months.</p>}
                {!isUsernameDisabled && formData.username && formData.username.includes('@') && (
                  <p className="ps-input-hint" style={{ color: 'hsl(var(--accent))' }}>
                    Your display name is currently set to your email. Update it to a gaming
                    username.
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="ps-field-label">Email</label>
                <input type="email" value={player?.email || ''} readOnly className="ps-input" />
              </div>

              {/* Phone */}
              <div>
                <label className="ps-field-label">Phone Number</label>
                {player?.phone_verified && !isChangingPhone ? (
                  <>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        readOnly
                        className="ps-input"
                        style={{ paddingRight: 90 }}
                      />
                      <span
                        className="ps-verified-badge"
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        ✓ Verified
                      </span>
                    </div>
                    <p className="ps-input-hint" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        className="ps-link-btn"
                        onClick={() => setIsChangingPhone(true)}
                      >
                        Change phone number
                      </button>
                    </p>
                  </>
                ) : !phoneOtpSent ? (
                  <>
                    {isChangingPhone && (
                      <p className="ps-input-hint" style={{ marginBottom: 6 }}>
                        Enter your new phone number. You'll need to verify it with an OTP.
                      </p>
                    )}
                    <input
                      name="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => {
                        handleChange(e);
                        setPhoneOtpSent(false);
                        setPhoneOtp('');
                      }}
                      maxLength="15"
                      placeholder="10-digit number (e.g. 9876543210)"
                      className="ps-input"
                    />
                    <p className="ps-input-hint">Enter 10 digits without country code.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="ps-otp-btn"
                        onClick={handleSendPhoneOTP}
                        disabled={phoneOtpLoading || !formData.phone_number}
                      >
                        {phoneOtpLoading ? 'Sending...' : 'Send OTP to verify'}
                      </button>
                      {isChangingPhone && (
                        <button
                          type="button"
                          className="ps-link-btn"
                          onClick={() => {
                            setIsChangingPhone(false);
                            setFormData((prev) => ({
                              ...prev,
                              phone_number: player?.phone_number || '',
                            }));
                            setPhoneOtpSent(false);
                            setPhoneOtp('');
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="ps-input-hint" style={{ marginBottom: 8 }}>
                      OTP sent to {formData.phone_number}.{' '}
                      <button
                        type="button"
                        className="ps-link-btn"
                        onClick={() => {
                          setPhoneOtpSent(false);
                          setPhoneOtp('');
                        }}
                      >
                        Change number
                      </button>
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="ps-input"
                    />
                    <div className="ps-otp-action-row">
                      <button
                        type="button"
                        className="ps-otp-btn ps-otp-btn--narrow"
                        onClick={async () => {
                          setPhoneOtpLoading(true);
                          setError('');
                          try {
                            await authAPI.updatePhone(formData.phone_number, phoneOtp);
                            setSuccess('Phone number verified successfully!');
                            setPhoneOtpSent(false);
                            setPhoneOtp('');
                            setIsChangingPhone(false);
                            setPhoneVerifiedLocally(true);
                            onPhoneVerified?.();
                          } catch (err) {
                            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
                          } finally {
                            setPhoneOtpLoading(false);
                          }
                        }}
                        disabled={phoneOtpLoading || phoneOtp.length !== 6}
                      >
                        {phoneOtpLoading ? 'Verifying...' : 'Verify & Save Phone'}
                      </button>
                      <span className="ps-otp-timer">
                        {phoneOtpCountdown > 0 ? (
                          `Resend in ${Math.floor(phoneOtpCountdown / 60)}:${String(phoneOtpCountdown % 60).padStart(2, '0')}`
                        ) : (
                          <button
                            type="button"
                            className="ps-link-btn"
                            onClick={handleSendPhoneOTP}
                          >
                            Resend OTP
                          </button>
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="ps-field-label">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="ps-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* ── Preferences (moved here) ── */}
              <div className="ps-subsection">
                <div className="ps-subsection-title">Preferences</div>
                <div className="ps-pref-row">
                  <div>
                    <div className="ps-pref-label">Dark Mode</div>
                    <div className="ps-pref-sublabel">Theme preference</div>
                  </div>
                  <span className="ps-pref-value">Always Dark</span>
                </div>
                <div className="ps-pref-row">
                  <div>
                    <div className="ps-pref-label">Language</div>
                    <div className="ps-pref-sublabel">Display language</div>
                  </div>
                  <span className="ps-pref-value">English</span>
                </div>
                <div className="ps-pref-row">
                  <div>
                    <div className="ps-pref-label">Region</div>
                    <div className="ps-pref-sublabel">Your server region</div>
                  </div>
                  <span className="ps-pref-value">India</span>
                </div>
              </div>

              {/* ── Account (moved here) ── */}
              <div className="ps-subsection">
                <div className="ps-subsection-title">Account</div>
                <div className="ps-account-actions">
                  <button
                    type="button"
                    className="ps-account-btn outline"
                    onClick={handleExportData}
                    disabled={exportLoading}
                  >
                    {exportLoading ? 'Requesting...' : 'Request My Data'}
                  </button>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      className="ps-account-btn danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="ps-delete-confirm">
                      <p className="text-red-400 text-xs font-medium mb-2">
                        This action is irreversible. Enter your password to confirm.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter password"
                          className="ps-input flex-1 text-sm"
                        />
                        <button
                          type="button"
                          className="ps-account-btn danger text-xs"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? '...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="ps-account-btn outline text-xs"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ GAMING TAB ══════════════ */}
          {activeTab === 'gaming' && (
            <div className="ps-section-gap">
              <p className="ps-input-hint" style={{ marginBottom: 4 }}>
                Enter your in-game name and ID for each game you play.
              </p>
              {[
                { label: 'BGMI', key: 'BGMI' },
                { label: 'Valorant', key: 'Valorant' },
                { label: 'COD Mobile', key: 'COD' },
                { label: 'Free Fire', key: 'Freefire' },
                { label: 'Scarfall', key: 'Scarfall' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="ps-field-label">{label}</label>
                  <div className="ps-game-row">
                    <input
                      type="text"
                      value={formData.game_profiles?.[key]?.ign || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          game_profiles: {
                            ...prev.game_profiles,
                            [key]: { ...(prev.game_profiles?.[key] || {}), ign: e.target.value },
                          },
                        }))
                      }
                      placeholder="In-Game Name"
                      className="ps-input"
                    />
                    <input
                      type="text"
                      value={formData.game_profiles?.[key]?.game_id || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          game_profiles: {
                            ...prev.game_profiles,
                            [key]: {
                              ...(prev.game_profiles?.[key] || {}),
                              game_id: e.target.value,
                            },
                          },
                        }))
                      }
                      placeholder="Game ID / UID"
                      className="ps-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══════════════ ALERTS TAB ══════════════ */}
          {activeTab === 'alerts' && (
            <div className="ps-section-gap">
              <p className="ps-input-hint" style={{ marginBottom: 4 }}>
                Choose which notifications you want to receive.
              </p>
              {NOTIF_TOGGLES.map(({ key, label, desc }) => (
                <div key={key} className="ps-toggle-row">
                  <div className="ps-toggle-info">
                    <div className="ps-toggle-label">{label}</div>
                    <div className="ps-toggle-desc">{desc}</div>
                    <div className={`ps-toggle-status ${notifPrefs[key] ? 'enabled' : 'disabled'}`}>
                      {notifPrefs[key] ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <Toggle checked={notifPrefs[key]} onChange={() => toggleNotif(key)} />
                </div>
              ))}
            </div>
          )}

          {/* ══════════════ SECURITY TAB ══════════════ */}
          {activeTab === 'security' && (
            <div className="ps-section-gap">
              <div>
                <label className="ps-field-label">Current Password</label>
                <input
                  name="current"
                  type="password"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  placeholder="Current password..."
                  className="ps-input"
                />
              </div>
              <div>
                <label className="ps-field-label">New Password</label>
                <input
                  name="newPass"
                  type="password"
                  value={passwords.newPass}
                  onChange={handlePasswordChange}
                  placeholder="New password..."
                  className="ps-input"
                />
              </div>
              <div>
                <label className="ps-field-label">Confirm New Password</label>
                <input
                  name="confirm"
                  type="password"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password..."
                  className="ps-input"
                />
              </div>
              {passwords.current && passwords.newPass && passwords.confirm && !passOtpSent && (
                <button
                  type="button"
                  className="ps-otp-btn"
                  onClick={handleSendPassOTP}
                  disabled={passOtpLoading}
                >
                  {passOtpLoading ? 'Sending OTP...' : 'Send OTP to verify password change'}
                </button>
              )}
              {passOtpSent && (
                <div>
                  <label className="ps-field-label">OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    value={passOtp}
                    onChange={(e) => setPassOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP sent to your phone"
                    className="ps-input"
                  />
                  <div className="ps-otp-action-row" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="ps-otp-btn ps-otp-btn--narrow"
                      style={{ margin: 0 }}
                      onClick={async () => {
                        if (!passwords.current || !passwords.newPass || !passwords.confirm) {
                          setError('Please fill all password fields');
                          return;
                        }
                        if (passwords.newPass !== passwords.confirm) {
                          setError('New passwords do not match');
                          return;
                        }
                        if (!passOtp.trim()) {
                          setError('Please enter the OTP');
                          return;
                        }
                        setPassOtpLoading(true);
                        setError('');
                        try {
                          await authAPI.changePassword({
                            current_password: passwords.current,
                            new_password: passwords.newPass,
                            otp: passOtp,
                          });
                          setSuccess('Password changed successfully!');
                          setPasswords({ current: '', newPass: '', confirm: '' });
                          setPassOtpSent(false);
                          setPassOtp('');
                        } catch (err) {
                          setError(
                            err.response?.data?.error ||
                              'Invalid OTP or wrong password. Please try again.'
                          );
                        } finally {
                          setPassOtpLoading(false);
                        }
                      }}
                      disabled={passOtpLoading || passOtp.length !== 6}
                    >
                      {passOtpLoading ? 'Saving...' : 'Verify & Save Password'}
                    </button>
                    <span className="ps-otp-timer">
                      {passOtpCountdown > 0 ? (
                        `Expires in ${Math.floor(passOtpCountdown / 60)}:${String(passOtpCountdown % 60).padStart(2, '0')}`
                      ) : (
                        <button type="button" className="ps-link-btn" onClick={handleSendPassOTP}>
                          Resend OTP
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="ps-forgot-link"
                onClick={() => window.open('/forgot-password', '_blank')}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* ══════════════ TRANSACTIONS TAB ══════════════ */}
          {activeTab === 'transactions' && (
            <div className="ps-section-gap">
              {txLoading ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem 0',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  Loading transactions...
                </div>
              ) : recentTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Wallet
                    size={36}
                    style={{
                      margin: '0 auto 0.75rem',
                      color: 'hsl(var(--muted-foreground) / 0.4)',
                    }}
                  />
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                    No transactions yet
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'hsl(var(--muted-foreground) / 0.6)',
                      marginTop: '0.25rem',
                    }}
                  >
                    Join tournaments to see your transaction history
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentTransactions.map((tx) => {
                    const isEarned = tx.type === 'earned';
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem 0.625rem',
                          borderRadius: '0.5rem',
                          background: 'hsl(var(--secondary) / 0.3)',
                          border: '1px solid hsl(var(--border) / 0.4)',
                        }}
                      >
                        <div
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '0.375rem',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isEarned ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          }}
                        >
                          {isEarned ? (
                            <ArrowUpRight size={16} color="rgb(34,197,94)" />
                          ) : (
                            <ArrowDownRight size={16} color="rgb(239,68,68)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: 'hsl(var(--foreground))',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx.name}
                          </p>
                          {tx.game && (
                            <p
                              style={{
                                fontSize: '0.6875rem',
                                color: 'hsl(var(--muted-foreground))',
                                margin: 0,
                              }}
                            >
                              {tx.game}
                            </p>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            color: isEarned ? 'rgb(34,197,94)' : 'rgb(239,68,68)',
                          }}
                        >
                          {isEarned ? '+' : '-'}₹{tx.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* See All button */}
              {onViewAllTransactions && (
                <button
                  type="button"
                  onClick={onViewAllTransactions}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid hsl(var(--purple) / 0.3)',
                    background: 'hsl(var(--purple) / 0.08)',
                    color: 'hsl(var(--purple))',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '0.25rem',
                  }}
                >
                  See All Transactions <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {activeTab !== 'transactions' && (
          <div className="ps-footer">
            <button className="ps-save-btn" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPlayerProfileModal;
