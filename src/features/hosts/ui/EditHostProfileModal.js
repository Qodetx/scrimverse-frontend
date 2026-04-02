import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Building2,
  Camera,
  Save,
  Shield,
  Bell,
  DollarSign,
  BarChart3,
  Users,
  Trophy,
  ChevronDown,
  Check,
  Loader2,
  Instagram,
  Youtube,
  Linkedin,
} from 'lucide-react';
import { authAPI, paymentsAPI } from '../../../utils/api';
import { sanitizeInput, sanitizeBio, sanitizeURL } from '../../../utils/sanitize';
import { AuthContext } from '../../../context/AuthContext';
import './EditHostProfileModal.css';

// Instagram-style verified badge (12-point burst, centered checkmark)
const VerifiedBadge = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path
      d="M12 1l2.39 3.42L18 3.27l.73 3.73 3.73.73-1.15 3.61L24 14l-3.42 2.39.88 3.84-3.84.88L15.61 24 12 22.15 8.39 24l-2.03-2.89-3.84-.88.88-3.84L0 14l2.69-2.66L1.54 7.73l3.73-.73L6 3.27l3.61 1.15L12 1z"
      fill="#0095F6"
    />
    <path
      d="M8.5 12.5l2.5 2.5 5-5"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NOTIF_STORAGE_KEY = 'scrimverse_host_notif_prefs';
const DEFAULT_NOTIF_PREFS = {
  newRegistrations: true,
  matchAlerts: true,
  payoutNotifications: true,
  disputeAlerts: true,
  platformUpdates: true,
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

// ── Toggle Switch ──────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`ehp-toggle${checked ? ' ehp-toggle-on' : ''}`}
  >
    <span className="ehp-toggle-thumb" />
  </button>
);

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'payout', label: 'Payout' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'revenue', label: 'Revenue' },
];

const formatRevAmount = (n) => {
  const num = Number(n) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

// ── Revenue Tab ────────────────────────────────────────────────────────────────
const RevenueTab = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    paymentsAPI
      .getHostTransactions()
      .then((res) => setTournaments(res.data?.tournaments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = tournaments[selectedIdx] || null;

  if (loading) {
    return (
      <div className="ehp-rev-loading">
        <Loader2 size={22} className="ehp-rev-spinner" />
      </div>
    );
  }

  if (tournaments.length === 0) {
    return <div className="ehp-rev-empty">No tournament revenue data yet.</div>;
  }

  return (
    <div className="ehp-section-gap">
      {/* Tournament selector */}
      <div className="ehp-field">
        <label className="ehp-label">Select Tournament</label>
        <div className="ehp-rev-dropdown-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="ehp-input ehp-rev-select-btn"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <Trophy size={13} style={{ flexShrink: 0, color: 'hsl(var(--purple))' }} />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selected?.title || 'Select Tournament'}
            </span>
            <ChevronDown
              size={13}
              style={{
                flexShrink: 0,
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.15s',
              }}
            />
          </button>
          {dropdownOpen && (
            <div className="ehp-rev-dropdown-menu">
              {tournaments.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  className={`ehp-rev-dropdown-item${i === selectedIdx ? ' selected' : ''}`}
                  onClick={() => {
                    setSelectedIdx(i);
                    setDropdownOpen(false);
                  }}
                >
                  {i === selectedIdx && <Check size={11} style={{ flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {t.title}
                    {t.game_name ? ` · ${t.game_name}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <>
          {/* Stats row */}
          <div className="ehp-revenue-grid">
            <div className="ehp-revenue-tile">
              <p className="ehp-revenue-label">Revenue</p>
              <p className="ehp-revenue-value" style={{ color: 'hsl(var(--purple))' }}>
                {formatRevAmount(selected.total_revenue)}
              </p>
            </div>
            <div className="ehp-revenue-tile">
              <p className="ehp-revenue-label">Platform Fee</p>
              <p className="ehp-revenue-value" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {formatRevAmount(selected.scrimverse_fee)}
              </p>
            </div>
            <div className="ehp-revenue-tile">
              <p className="ehp-revenue-label">Teams</p>
              <p className="ehp-revenue-value">{selected.team_count}</p>
            </div>
          </div>

          {/* Payment rows */}
          {selected.payments.length === 0 ? (
            <p className="ehp-hint" style={{ textAlign: 'center', padding: '1rem 0' }}>
              No entry fee payments yet for this tournament.
            </p>
          ) : (
            <div className="ehp-rev-list">
              {selected.payments.map((p, i) => (
                <div key={i} className="ehp-rev-row">
                  <div className="ehp-rev-row-icon">
                    <Users size={15} style={{ color: 'hsl(var(--purple))' }} />
                  </div>
                  <div className="ehp-rev-row-details">
                    <span className="ehp-rev-row-name">{p.team_name}</span>
                    <span className="ehp-hint">
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>
                  <span className="ehp-rev-row-amount">{formatRevAmount(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EditHostProfileModal = ({ isOpen, onClose, host, onSuccess }) => {
  const navigate = useNavigate();
  const { logout, fetchUserData } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');

  // ── Profile fields ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    username: host?.user?.username || '',
    phone_number: host?.user?.phone_number || '',
    bio: host?.bio || '',
    website: host?.website || '',
    instagram: host?.social_links?.instagram || '',
    youtube: host?.social_links?.youtube || '',
    linkedin: host?.social_links?.linkedin || '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(
    host?.user?.profile_picture || null
  );

  // ── Payout fields ───────────────────────────────────────────────────────────
  const [payoutMethod, setPayoutMethod] = useState(host?.payout_details?.method || 'bank');
  const [payoutData, setPayoutData] = useState({
    bankName: host?.payout_details?.bank_name || '',
    accountNumber: host?.payout_details?.account_number || '',
    ifscCode: host?.payout_details?.ifsc_code || '',
    upiId: host?.payout_details?.upi_id || '',
  });

  // ── Notification prefs ──────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState(loadNotifPrefs);

  // ── Password change (OTP flow) ───────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [passOtpSent, setPassOtpSent] = useState(false);
  const [passOtp, setPassOtp] = useState('');
  const [passOtpCountdown, setPassOtpCountdown] = useState(0);
  const [passOtpLoading, setPassOtpLoading] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && host) {
      setFormData({
        username: host.user?.username || '',
        phone_number: host.user?.phone_number || '',
        bio: host.bio || '',
        website: host.website || '',
        instagram: host.social_links?.instagram || '',
        youtube: host.social_links?.youtube || '',
        linkedin: host.social_links?.linkedin || '',
      });
      setProfilePicturePreview(host.user?.profile_picture || null);
      setProfilePicture(null);
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPassOtpSent(false);
      setPassOtp('');
      setError('');
      setSuccess('');
      setActiveTab('profile');
      // Load payout details from backend
      const pd = host.payout_details || {};
      setPayoutMethod(pd.method || 'bank');
      setPayoutData({
        bankName: pd.bank_name || '',
        accountNumber: pd.account_number || '',
        ifscCode: pd.ifsc_code || '',
        upiId: pd.upi_id || '',
      });
      // Load notification preferences from backend if available, fall back to localStorage
      const backendPrefs = host.notification_preferences;
      if (backendPrefs && Object.keys(backendPrefs).length > 0) {
        setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...backendPrefs });
      } else {
        setNotifPrefs(loadNotifPrefs());
      }
    }
  }, [host, isOpen]);

  // Countdown ticker
  useEffect(() => {
    if (passOtpCountdown > 0) {
      const t = setTimeout(() => setPassOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [passOtpCountdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
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
      await authAPI.sendOTP('password_change', formData.phone_number || '');
      setPassOtpSent(true);
      setPassOtpCountdown(600);
      setPassOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setPassOtpLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const sanitizedUsername = sanitizeInput(formData.username);
    const sanitizedBio = sanitizeBio(formData.bio);
    const rawPhone = formData.phone_number.trim();

    if (!sanitizedUsername.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    try {
      const userFormData = new FormData();
      userFormData.append('username', sanitizedUsername);
      if (rawPhone) userFormData.append('phone_number', rawPhone);
      if (profilePicture) userFormData.append('profile_picture', profilePicture);

      const userResponse = await authAPI.updateUser(userFormData);
      const social_links = {};
      if (formData.instagram.trim()) social_links.instagram = formData.instagram.trim();
      if (formData.youtube.trim()) social_links.youtube = formData.youtube.trim();
      if (formData.linkedin.trim()) social_links.linkedin = formData.linkedin.trim();

      const profileResponse = await authAPI.updateHostProfile({
        bio: sanitizedBio,
        website: sanitizeURL(formData.website.trim()),
        social_links,
      });

      onSuccess({ ...profileResponse.data, user: userResponse.data });
      setSuccess('Profile updated successfully!');
      setTimeout(onClose, 1000);
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

  const handleSaveAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      await authAPI.updateHostProfile({ notification_preferences: notifPrefs });
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifPrefs));
      setSuccess('Notification preferences saved!');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const avatarLetter = (host?.user?.username || 'H').charAt(0).toUpperCase();

  if (!isOpen) return null;

  return (
    <div className="ehp-overlay">
      <div className="ehp-dialog">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="ehp-header">
          <div className="flex items-center gap-2">
            <Building2 size={18} style={{ color: 'hsl(var(--purple))' }} />
            <span className="ehp-header-title">Host Settings</span>
          </div>
          <button className="ehp-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="ehp-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ehp-tab${activeTab === tab.id ? ' ehp-tab-active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccess('');
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="ehp-body">
          {/* Feedback messages */}
          {error && <div className="ehp-alert ehp-alert-error">{error}</div>}
          {success && <div className="ehp-alert ehp-alert-success">{success}</div>}

          {/* ── PROFILE TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmitProfile} className="ehp-section-gap">
              {/* Avatar row */}
              <div className="flex items-center gap-4">
                <label
                  htmlFor="host-profile-picture-upload"
                  className="ehp-avatar-wrap ehp-avatar-clickable"
                >
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" className="ehp-avatar-img" />
                  ) : (
                    <span className="ehp-avatar-letter">{avatarLetter}</span>
                  )}
                  <span
                    className={`ehp-avatar-overlay${!profilePicturePreview ? ' ehp-avatar-overlay-always' : ''}`}
                  >
                    <Camera size={16} style={{ color: '#fff' }} />
                  </span>
                  <input
                    id="host-profile-picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {host?.user?.username || 'Host'}
                    </p>
                    {host?.verification_status === 'approved' && <VerifiedBadge size={16} />}
                  </div>
                  <p className="ehp-hint" style={{ marginTop: '0.25rem' }}>
                    Click to upload logo · Max 5MB · JPG, PNG, GIF
                  </p>
                </div>
              </div>

              {/* Organization Name = username */}
              <div className="ehp-field">
                <label className="ehp-label">Organization Name *</label>
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
                  className="ehp-input"
                />
                <p className="ehp-hint">
                  {host?.user?.username_change_count === 0
                    ? 'You have 1 chance to change your name. Subsequent changes allowed every 6 months.'
                    : 'Name can only be changed once every 6 months.'}
                </p>
              </div>

              {/* Email — read only */}
              <div className="ehp-field">
                <label className="ehp-label">Email</label>
                <input
                  type="email"
                  value={host?.user?.email || ''}
                  disabled
                  className="ehp-input"
                />
                <p className="ehp-hint">Email cannot be changed. Contact support to update.</p>
              </div>

              {/* Contact Number + Website */}
              <div className="ehp-two-col">
                <div className="ehp-field">
                  <label className="ehp-label">Contact Number</label>
                  <input
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    maxLength="15"
                    placeholder="+91XXXXXXXXXX or 10-digit"
                    className="ehp-input"
                  />
                </div>
                <div className="ehp-field">
                  <label className="ehp-label">Website</label>
                  <input
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yoursite.com"
                    className="ehp-input"
                  />
                </div>
              </div>

              {/* Description / Bio */}
              <div className="ehp-field">
                <label className="ehp-label">Description</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  placeholder="Tell us about your organization..."
                  className="ehp-input ehp-textarea"
                />
                <p className="ehp-hint">
                  {formData.bio.length}/500 · Only description is visible to all users
                </p>
              </div>

              {/* Social Links */}
              <div className="ehp-field">
                <label className="ehp-label">
                  Social Links <span className="ehp-optional">(optional)</span>
                </label>
                <div className="ehp-social-list">
                  <div className="ehp-social-row">
                    <Instagram size={15} className="ehp-social-icon" />
                    <input
                      name="instagram"
                      type="url"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="https://instagram.com/yourhandle"
                      className="ehp-input"
                    />
                  </div>
                  <div className="ehp-social-row">
                    <Youtube size={15} className="ehp-social-icon" />
                    <input
                      name="youtube"
                      type="url"
                      value={formData.youtube}
                      onChange={handleChange}
                      placeholder="https://youtube.com/@yourchannel"
                      className="ehp-input"
                    />
                  </div>
                  <div className="ehp-social-row">
                    <Linkedin size={15} className="ehp-social-icon" />
                    <input
                      name="linkedin"
                      type="url"
                      value={formData.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="ehp-input"
                    />
                  </div>
                </div>
              </div>

              {/* Security — Change Password (OTP flow) */}
              <div className="ehp-security-block">
                <p className="ehp-security-title">
                  <Shield size={13} /> Security
                </p>
                <div className="ehp-section-gap" style={{ marginTop: '0.5rem' }}>
                  <div className="ehp-field">
                    <label className="ehp-label">Change Password</label>
                    <input
                      name="current"
                      type="password"
                      value={passwords.current}
                      onChange={handlePasswordChange}
                      placeholder="Current password"
                      className="ehp-input"
                    />
                  </div>
                  <div className="ehp-field">
                    <input
                      name="newPass"
                      type="password"
                      value={passwords.newPass}
                      onChange={handlePasswordChange}
                      placeholder="New password"
                      className="ehp-input"
                    />
                  </div>
                  <div className="ehp-field">
                    <input
                      name="confirm"
                      type="password"
                      value={passwords.confirm}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="ehp-input"
                    />
                  </div>
                  {passwords.current && passwords.newPass && passwords.confirm && !passOtpSent && (
                    <button
                      type="button"
                      className="ehp-security-btn"
                      onClick={handleSendPassOTP}
                      disabled={passOtpLoading}
                      style={{ marginTop: '0.125rem' }}
                    >
                      {passOtpLoading ? 'Sending OTP...' : 'Send OTP to verify password change'}
                    </button>
                  )}
                  {passOtpSent && (
                    <div className="ehp-field">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        value={passOtp}
                        onChange={(e) => setPassOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter OTP sent to your phone"
                        className="ehp-input"
                      />
                      <div className="ehp-otp-action-row">
                        <button
                          type="button"
                          className="ehp-security-btn ehp-security-btn--primary"
                          onClick={async () => {
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
                              setSuccess('Password changed! Logging you out...');
                              setTimeout(() => {
                                logout();
                                navigate('/host/login');
                              }, 1200);
                            } catch (err) {
                              setError(
                                err.response?.data?.error || 'Invalid OTP or wrong password.'
                              );
                            } finally {
                              setPassOtpLoading(false);
                            }
                          }}
                          disabled={passOtpLoading || passOtp.length !== 6}
                        >
                          {passOtpLoading ? 'Saving...' : 'Verify & Save Password'}
                        </button>
                        <span className="ehp-otp-timer">
                          {passOtpCountdown > 0 ? (
                            `Expires in ${Math.floor(passOtpCountdown / 60)}:${String(passOtpCountdown % 60).padStart(2, '0')}`
                          ) : (
                            <button
                              type="button"
                              className="ehp-link-btn"
                              onClick={handleSendPassOTP}
                            >
                              Resend OTP
                            </button>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="ehp-link-btn"
                    onClick={() => window.open('/forgot-password', '_blank')}
                    style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="ehp-actions">
                <button
                  type="button"
                  className="ehp-btn-cancel"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="ehp-btn-save" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="ehp-spinner" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save size={14} />
                      Save Profile
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── PAYOUT TAB ───────────────────────────────────────────────────── */}
          {activeTab === 'payout' && (
            <div className="ehp-section-gap">
              <div className="ehp-field">
                <label className="ehp-label">Payout Method</label>
                <div className="ehp-radio-group">
                  {['bank', 'upi'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`ehp-radio-btn${payoutMethod === m ? ' ehp-radio-active' : ''}`}
                      onClick={() => setPayoutMethod(m)}
                    >
                      {m === 'bank' ? 'Bank Transfer' : 'UPI'}
                    </button>
                  ))}
                </div>
              </div>

              {payoutMethod === 'bank' && (
                <div className="ehp-payout-card">
                  <div className="ehp-field">
                    <label className="ehp-label">Bank Name</label>
                    <input
                      type="text"
                      value={payoutData.bankName}
                      onChange={(e) => setPayoutData((p) => ({ ...p, bankName: e.target.value }))}
                      placeholder="e.g. HDFC Bank"
                      className="ehp-input"
                    />
                  </div>
                  <div className="ehp-two-col">
                    <div className="ehp-field">
                      <label className="ehp-label">Account Number</label>
                      <input
                        type="text"
                        value={payoutData.accountNumber}
                        onChange={(e) =>
                          setPayoutData((p) => ({ ...p, accountNumber: e.target.value }))
                        }
                        placeholder="Account number"
                        className="ehp-input"
                      />
                    </div>
                    <div className="ehp-field">
                      <label className="ehp-label">IFSC Code</label>
                      <input
                        type="text"
                        value={payoutData.ifscCode}
                        onChange={(e) => setPayoutData((p) => ({ ...p, ifscCode: e.target.value }))}
                        placeholder="e.g. HDFC0001234"
                        className="ehp-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {payoutMethod === 'upi' && (
                <div className="ehp-payout-card">
                  <div className="ehp-field">
                    <label className="ehp-label">UPI ID</label>
                    <input
                      type="text"
                      value={payoutData.upiId}
                      onChange={(e) => setPayoutData((p) => ({ ...p, upiId: e.target.value }))}
                      placeholder="yourname@upi"
                      className="ehp-input"
                    />
                  </div>
                </div>
              )}

              <div className="ehp-info-note">
                <DollarSign size={13} />
                Payout details are private — only visible to you and the admin.
              </div>

              <div className="ehp-actions">
                <button type="button" className="ehp-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="ehp-btn-save"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    try {
                      const details = {
                        method: payoutMethod,
                        bank_name: payoutData.bankName.trim(),
                        account_number: payoutData.accountNumber.trim(),
                        ifsc_code: payoutData.ifscCode.trim(),
                        upi_id: payoutData.upiId.trim(),
                      };
                      await authAPI.updateHostProfile({ payout_details: details });
                      await fetchUserData();
                      setSuccess('Payout details saved!');
                      setTimeout(() => setSuccess(''), 2000);
                    } catch {
                      setError('Failed to save payout details. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Save size={14} />
                    Save Payout
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── ALERTS TAB ───────────────────────────────────────────────────── */}
          {activeTab === 'alerts' && (
            <div className="ehp-section-gap">
              <div className="flex items-center gap-2">
                <Bell size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Notification Preferences
                </span>
              </div>

              {[
                {
                  key: 'newRegistrations',
                  label: 'New Registrations',
                  desc: 'When teams register for your events',
                },
                {
                  key: 'matchAlerts',
                  label: 'Match Alerts',
                  desc: 'Ongoing match and round alerts',
                },
                {
                  key: 'payoutNotifications',
                  label: 'Payout Notifications',
                  desc: 'Payment and revenue updates',
                },
                {
                  key: 'disputeAlerts',
                  label: 'Dispute Alerts',
                  desc: 'Dispute and issue notifications',
                },
                {
                  key: 'platformUpdates',
                  label: 'Platform Updates',
                  desc: 'New ScrimVerse features',
                },
                { key: 'marketingEmails', label: 'Marketing', desc: 'Promotional content' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="ehp-notif-row">
                  <div>
                    <p className="ehp-notif-label">{label}</p>
                    <p className="ehp-hint">{desc}</p>
                  </div>
                  <Toggle
                    checked={notifPrefs[key]}
                    onChange={(val) => setNotifPrefs((prev) => ({ ...prev, [key]: val }))}
                  />
                </div>
              ))}

              <div className="ehp-actions">
                <button type="button" className="ehp-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="ehp-btn-save" onClick={handleSaveAlerts}>
                  <span className="flex items-center gap-2">
                    <Save size={14} />
                    Save Preferences
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ── REVENUE TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'revenue' && <RevenueTab />}
        </div>
      </div>
    </div>
  );
};

export default EditHostProfileModal;
