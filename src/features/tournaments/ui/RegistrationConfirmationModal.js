import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Trophy, Mail, Users, Clock, Check, ArrowLeft } from 'lucide-react';
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
  onClose,
}) => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    if (onClose) onClose();
    navigate('/player/dashboard?view=slot-list');
  };

  const teammateCount = Math.max(0, teamSize - 1);
  const totalMembers = isNewTeam
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
              Registration <span className="rcm-title-accent">Confirmed!</span>
            </h1>
            <p className="rcm-subtitle">
              You&apos;ve registered for{' '}
              <span className="rcm-tournament-name">
                {tournament?.title || tournament?.name || 'Tournament'}
              </span>
            </p>
          </div>
        </div>

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
                  {isNewTeam ? 'Team Created Successfully' : 'Team Registered Successfully'}
                </p>
              </div>
            </div>
            <div className={`rcm-status-badge ${isNewTeam ? 'pending' : 'confirmed'}`}>
              {isNewTeam ? <Clock size={12} /> : <Check size={12} />}
              <span>{isNewTeam ? 'Pending' : 'Confirmed'}</span>
            </div>
          </div>

          <div className="rcm-team-card-body">
            {/* Invite warning banner — only for new team */}
            {isNewTeam && teammateCount > 0 && (
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
                    {leader?.displayName || leader?.username || 'You'}
                  </span>
                  <p className="rcm-row-sub">You</p>
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
                  {isNewTeam
                    ? `Teammates (${invitees.filter((v) => v?.trim()).length}/${teammateCount})`
                    : `Members (${existingMembers.length})`}
                </p>
                <div className="rcm-members-list">
                  {isNewTeam
                    ? Array.from({ length: teammateCount }).map((_, idx) => {
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
                    : existingMembers.map((m, idx) => (
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
                      ))}
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
