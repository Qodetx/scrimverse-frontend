import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Trophy,
  Mail,
  Users,
  Clock,
  Check,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { communityAPI } from '../../../utils/api';
import './RegistrationConfirmationModal.css';

/**
 * Registration confirmation modal shown after a successful tournament registration.
 *
 * Props:
 *  - tournament:    { title, game_name, game_mode, event_mode }
 *  - teamName:      string
 *  - isNewTeam:     bool — true for "new-team"/"br-flow", false for existing team
 *  - inviteMode:    'username' | 'phone' | 'email' (only used for new team)
 *  - invitees:      array of identifiers entered for invited teammates (new team only)
 *  - leader:        { username, displayName? }
 *  - existingMembers: array of { username, displayName? } — used for existing team
 *  - teamSize:      total team size (e.g. 4 for Squad)
 *  - onClose:       fired when user clicks "Go to Dashboard" or close
 */
const RegistrationConfirmationModal = ({
  tournament,
  teamName,
  isNewTeam,
  inviteMode = 'phone',
  invitees = [],
  leader,
  existingMembers = [],
  teamSize = 1,
  joinedCount = 0,
  captainName = '',
  onClose,
  viewerRole = 'captain', // 'captain' | 'teammate'
}) => {
  const isTeammate = viewerRole === 'teammate';
  const navigate = useNavigate();

  // Community links from admin settings
  const [communitySettings, setCommunitySettings] = useState({
    whatsapp_link: '',
    instagram_link: '',
  });
  const [waJoined, setWaJoined] = useState(false);
  const [igJoined, setIgJoined] = useState(false);

  useEffect(() => {
    communityAPI
      .getSettings()
      .then((res) => setCommunitySettings(res.data))
      .catch(() => {});
  }, []);

  const handleCommunityJoin = (type, link) => {
    window.open(link, '_blank', 'noopener,noreferrer');
    communityAPI.recordJoin(type).catch(() => {});
    if (type === 'whatsapp') setWaJoined(true);
    else setIgJoined(true);
  };

  const showCommunity = communitySettings.whatsapp_link || communitySettings.instagram_link;

  const handleGoToDashboard = () => {
    if (onClose) onClose();
    navigate('/player/dashboard?view=slot-list');
  };

  const teammateCount = Math.max(0, teamSize - 1);
  const totalMembers = isTeammate
    ? Math.min(joinedCount || 2, teamSize)
    : isNewTeam
      ? 1 + invitees.filter((v) => v && v.trim()).length
      : 1 + existingMembers.length;

  // Mask helpers for displaying invitees politely
  const formatInvitee = (val) => {
    if (!val) return '';
    if (inviteMode === 'phone') return val;
    if (inviteMode === 'email') return val;
    return val; // username
  };

  return createPortal(
    <div className="rcm-overlay" onClick={onClose}>
      <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rcm-back" onClick={handleGoToDashboard}>
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>

        {/* Header */}
        <div className="rcm-header">
          <div className="rcm-check-circle">
            <CheckCircle2 size={28} className="rcm-check-icon" />
          </div>
          <div className="rcm-header-text">
            <h1 className="rcm-title">
              {isTeammate ? (
                <>
                  You&apos;re <span className="rcm-title-accent">In!</span>
                </>
              ) : (
                <>
                  Registration <span className="rcm-title-accent">Confirmed!</span>
                </>
              )}
            </h1>
            <p className="rcm-subtitle">
              {isTeammate ? (
                <>
                  You&apos;ve joined team <span className="rcm-tournament-name">{teamName}</span>
                  {tournament?.title ? (
                    <>
                      {' '}
                      for <span className="rcm-tournament-name">{tournament.title}</span> tournament
                    </>
                  ) : (
                    ''
                  )}
                </>
              ) : (
                <>
                  You&apos;ve registered for{' '}
                  <span className="rcm-tournament-name">
                    {tournament?.title || tournament?.name || 'Tournament'}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Community card — matches Lovable reference design */}
        {showCommunity && (
          <div className="rcm-community-card">
            <div className="rcm-community-header">
              <Sparkles size={14} className="rcm-community-icon" />
              <span className="rcm-community-label">COMMUNITY</span>
            </div>
            <p className="rcm-community-title">Not in the Loop with Scrimverse?</p>
            <p className="rcm-community-sub">
              Join for tournament alerts, updates, points table, announcements, and more.
            </p>
            <div className="rcm-community-btns">
              {communitySettings.whatsapp_link && (
                <button
                  className={`rcm-community-btn whatsapp${waJoined ? ' joined' : ''}`}
                  onClick={() => handleCommunityJoin('whatsapp', communitySettings.whatsapp_link)}
                >
                  {waJoined ? <Check size={15} /> : <ExternalLink size={15} />}
                  {waJoined ? 'Joined WhatsApp' : 'WhatsApp Community'}
                </button>
              )}
              {communitySettings.instagram_link && (
                <button
                  className={`rcm-community-btn instagram${igJoined ? ' joined' : ''}`}
                  onClick={() => handleCommunityJoin('instagram', communitySettings.instagram_link)}
                >
                  {igJoined ? <Check size={15} /> : <ExternalLink size={15} />}
                  {igJoined ? 'Joined Instagram' : 'Instagram Community'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Team card */}
        <div className="rcm-team-card">
          <div className="rcm-team-card-header">
            <div className="rcm-team-card-info">
              <div className="rcm-team-icon">
                <Trophy size={18} />
              </div>
              <div>
                <h2 className="rcm-team-name">{teamName}</h2>
                <p className="rcm-team-status-label">
                  {isTeammate
                    ? 'Team Joined Successfully'
                    : isNewTeam
                      ? 'Team Created Successfully'
                      : 'Team Registered Successfully'}
                </p>
              </div>
            </div>
            <div
              className={`rcm-status-badge ${!isTeammate && isNewTeam ? 'pending' : 'confirmed'}`}
            >
              {!isTeammate && isNewTeam ? <Clock size={12} /> : <Check size={12} />}
              <span>{!isTeammate && isNewTeam ? 'Pending' : 'Confirmed'}</span>
            </div>
          </div>

          <div className="rcm-team-card-body">
            {/* Invite warning banner — only for captain of new team */}
            {!isTeammate && isNewTeam && teammateCount > 0 && (
              <div className="rcm-invite-banner">
                <div className="rcm-invite-banner-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="rcm-invite-banner-title">
                    ⚠️ Invites Sent via{' '}
                    {inviteMode === 'email' ? 'Email' : inviteMode === 'phone' ? 'SMS' : 'Username'}
                  </p>
                  <p className="rcm-invite-banner-text">
                    Your teammates will receive an invitation. Once they sign up and join, your team
                    will be complete and match credentials will appear in your dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Team status row */}
            <div className="rcm-team-status-row">
              <div className="rcm-team-status-row-left">
                <Users size={14} />
                <span>Team Status</span>
              </div>
              <span className="rcm-team-status-count">
                {totalMembers}/{teamSize} Players
              </span>
            </div>

            {/* Team Leader */}
            <div className="rcm-section">
              <p className="rcm-section-label">Team Leader</p>
              <div className="rcm-leader-row">
                <div className="rcm-avatar rcm-avatar-leader">1</div>
                <div className="rcm-row-info">
                  <span className="rcm-row-name">
                    {isTeammate
                      ? captainName || 'Captain'
                      : leader?.displayName || leader?.username || 'You'}
                  </span>
                  <p className="rcm-row-sub">{isTeammate ? 'Team Captain' : 'You'}</p>
                </div>
                <div className="rcm-leader-badge">
                  <Check size={12} />
                  <span>Leader</span>
                </div>
              </div>
            </div>

            {/* Teammates / Members */}
            {teammateCount > 0 && (
              <div className="rcm-section">
                <p className="rcm-section-label">
                  {isTeammate
                    ? `Teammates (${totalMembers}/${teamSize})`
                    : isNewTeam
                      ? `Teammates (${invitees.filter((v) => v?.trim()).length}/${teammateCount})`
                      : `Members (${existingMembers.length})`}
                </p>
                <div className="rcm-members-list">
                  {isTeammate ? (
                    <>
                      {/* You — the current user who just accepted */}
                      <div className="rcm-member-row">
                        <div className="rcm-avatar rcm-avatar-confirmed">2</div>
                        <div className="rcm-row-info">
                          <span className="rcm-row-name">You</span>
                          <p className="rcm-row-sub">Joined</p>
                        </div>
                        <div className="rcm-status-badge confirmed small">
                          <Check size={10} />
                          <span>Joined</span>
                        </div>
                      </div>
                      {/* Remaining pending slots */}
                      {Array.from({ length: Math.max(0, teamSize - 2) }).map((_, idx) => (
                        <div key={idx} className="rcm-member-row empty">
                          <div className="rcm-avatar rcm-avatar-empty">{idx + 3}</div>
                          <span className="rcm-member-empty-text">Waiting for teammate...</span>
                        </div>
                      ))}
                    </>
                  ) : isNewTeam ? (
                    Array.from({ length: teammateCount }).map((_, idx) => {
                      const value = invitees[idx]?.trim();
                      if (!value) {
                        return (
                          <div key={idx} className="rcm-member-row empty">
                            <div className="rcm-avatar rcm-avatar-empty">{idx + 2}</div>
                            <span className="rcm-member-empty-text">Waiting for teammate...</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="rcm-member-row">
                          <div className="rcm-avatar rcm-avatar-pending">{idx + 2}</div>
                          <div className="rcm-row-info">
                            <span className="rcm-row-name">{formatInvitee(value)}</span>
                            <p className="rcm-row-sub">
                              Invited via {inviteMode === 'phone' ? 'SMS' : inviteMode}
                            </p>
                          </div>
                          <div className="rcm-status-badge pending small">
                            <Clock size={10} />
                            <span>Pending</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    existingMembers.map((m, idx) => (
                      <div key={idx} className="rcm-member-row">
                        <div className="rcm-avatar rcm-avatar-confirmed">{idx + 2}</div>
                        <div className="rcm-row-info">
                          <span className="rcm-row-name">{m.displayName || m.username}</span>
                          <p className="rcm-row-sub">Team Member</p>
                        </div>
                        <div className="rcm-status-badge confirmed small">
                          <Check size={10} />
                          <span>Joined</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="rcm-cta-wrap">
          <button className="rcm-cta-btn" onClick={handleGoToDashboard}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RegistrationConfirmationModal;
