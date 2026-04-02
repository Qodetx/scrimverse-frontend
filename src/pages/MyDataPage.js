import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import {
  User,
  Gamepad2,
  Trophy,
  Users,
  CreditCard,
  Download,
  AlertTriangle,
  ShieldX,
} from 'lucide-react';
import './MyDataPage.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * MyDataPage -- renders a user's exported data fetched by token.
 * Route: /my-data/:token
 * No authentication required; the token IS the auth.
 */
const MyDataPage = () => {
  const { token } = useParams();
  const [exportData, setExportData] = useState(null);
  const [meta, setMeta] = useState(null); // { created_at, expires_at, username }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authAPI.getDataExport(token);
        setExportData(res.data.data);
        setMeta({
          created_at: res.data.created_at,
          expires_at: res.data.expires_at,
          username: res.data.username,
        });
      } catch (err) {
        if (err.response?.status === 410) {
          setError('expired');
        } else if (err.response?.status === 404) {
          setError('invalid');
        } else {
          setError('unknown');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mydata-page">
        <div className="mydata-state">
          <div className="mydata-spinner" />
          <p className="mydata-state-title">Loading your data...</p>
        </div>
      </div>
    );
  }

  // ── Error states ───────────────────────────────────────────────────────
  if (error) {
    const errorConfig = {
      expired: {
        icon: <AlertTriangle className="mydata-state-icon" />,
        title: 'Link Expired',
        msg: 'This data export link has expired. Please request a new export from your dashboard settings.',
      },
      invalid: {
        icon: <ShieldX className="mydata-state-icon" />,
        title: 'Invalid Link',
        msg: 'This data export link is invalid or has already been used.',
      },
      unknown: {
        icon: <AlertTriangle className="mydata-state-icon" />,
        title: 'Something went wrong',
        msg: 'We could not load your data export. Please try again later.',
      },
    };
    const cfg = errorConfig[error] || errorConfig.unknown;

    return (
      <div className="mydata-page">
        <div className="mydata-state">
          {cfg.icon}
          <p className="mydata-state-title">{cfg.title}</p>
          <p className="mydata-state-msg">{cfg.msg}</p>
        </div>
      </div>
    );
  }

  // ── Data present ──────────────────────────────────────────────────────
  const account = exportData?.account || {};
  const playerProfile = exportData?.player_profile || {};
  const hostProfile = exportData?.host_profile || {};
  const gameProfiles = playerProfile.game_profiles || {};
  const tournaments = exportData?.tournament_registrations || [];
  const teams = exportData?.teams || [];
  const payments = exportData?.payment_history || [];

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const getBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (['completed', 'success'].includes(s)) return 'mydata-badge--completed';
    if (['pending', 'registered'].includes(s)) return 'mydata-badge--pending';
    if (['failed', 'cancelled', 'eliminated'].includes(s)) return 'mydata-badge--failed';
    if (['active', 'confirmed', 'selected'].includes(s)) return 'mydata-badge--active';
    return '';
  };

  const pdfUrl = `${API_URL}/accounts/data-export/${token}/pdf/`;

  return (
    <div className="mydata-page">
      <div className="mydata-container">
        {/* Header */}
        <div className="mydata-header">
          <div className="mydata-header-top">
            <div className="mydata-logo">
              SCRIM<span>VERSE</span>
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mydata-dl-btn"
              title="Download PDF"
            >
              <Download size={15} />
              <span>PDF</span>
            </a>
          </div>
          <h1 className="mydata-title">Player Data Report</h1>
          <p className="mydata-subtitle">
            Generated on {formatDate(meta?.created_at)} for{' '}
            <strong>{meta?.username || account.username}</strong>
            {meta?.expires_at && <> &middot; Expires {formatDate(meta.expires_at)}</>}
          </p>
        </div>

        {/* Account Info */}
        <div className="mydata-section">
          <div className="mydata-section-title">
            <User size={18} /> Account Information
          </div>
          <div className="mydata-info-grid">
            <div className="mydata-info-item">
              <div className="mydata-info-label">Username</div>
              <div className="mydata-info-value">{account.username || 'N/A'}</div>
            </div>
            <div className="mydata-info-item">
              <div className="mydata-info-label">Email</div>
              <div className="mydata-info-value">{account.email || 'N/A'}</div>
            </div>
            <div className="mydata-info-item">
              <div className="mydata-info-label">Phone</div>
              <div className="mydata-info-value">{account.phone_number || 'Not set'}</div>
            </div>
            <div className="mydata-info-item">
              <div className="mydata-info-label">User Type</div>
              <div className="mydata-info-value" style={{ textTransform: 'capitalize' }}>
                {account.user_type || 'N/A'}
              </div>
            </div>
            <div className="mydata-info-item">
              <div className="mydata-info-label">Email Verified</div>
              <div className="mydata-info-value">{account.is_email_verified ? 'Yes' : 'No'}</div>
            </div>
            <div className="mydata-info-item">
              <div className="mydata-info-label">Member Since</div>
              <div className="mydata-info-value">{formatDate(account.date_joined)}</div>
            </div>
          </div>
        </div>

        {/* Gaming Profiles (player only) */}
        {Object.keys(gameProfiles).length > 0 && (
          <div className="mydata-section">
            <div className="mydata-section-title">
              <Gamepad2 size={18} /> Gaming Profiles
            </div>
            <div className="mydata-table-wrapper">
              <table className="mydata-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>In-Game Name</th>
                    <th>Game ID</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gameProfiles).map(([game, info]) => (
                    <tr key={game}>
                      <td style={{ fontWeight: 600 }}>{game}</td>
                      <td>{info?.ign || '--'}</td>
                      <td>{info?.game_id || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Host Profile (host only) */}
        {account.user_type === 'host' && hostProfile && (
          <div className="mydata-section">
            <div className="mydata-section-title">
              <User size={18} /> Host Profile
            </div>
            <div className="mydata-info-grid">
              <div className="mydata-info-item">
                <div className="mydata-info-label">Bio</div>
                <div className="mydata-info-value">{hostProfile.bio || 'N/A'}</div>
              </div>
              <div className="mydata-info-item">
                <div className="mydata-info-label">Website</div>
                <div className="mydata-info-value">{hostProfile.website || 'N/A'}</div>
              </div>
              <div className="mydata-info-item">
                <div className="mydata-info-label">Tournaments Hosted</div>
                <div className="mydata-info-value">{hostProfile.total_tournaments_hosted}</div>
              </div>
              <div className="mydata-info-item">
                <div className="mydata-info-label">Rating</div>
                <div className="mydata-info-value">{hostProfile.rating}/5</div>
              </div>
            </div>
          </div>
        )}

        {/* Tournament History */}
        <div className="mydata-section">
          <div className="mydata-section-title">
            <Trophy size={18} /> Tournament History
          </div>
          {tournaments.length > 0 ? (
            <div className="mydata-table-wrapper">
              <table className="mydata-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((reg, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{reg.tournament_name}</td>
                      <td>{reg.event_mode || '--'}</td>
                      <td>
                        <span className={`mydata-badge ${getBadgeClass(reg.status)}`}>
                          {reg.status || 'N/A'}
                        </span>
                      </td>
                      <td>{formatDate(reg.registered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mydata-empty">No tournament registrations found.</div>
          )}
        </div>

        {/* Team History */}
        <div className="mydata-section">
          <div className="mydata-section-title">
            <Users size={18} /> Team History
          </div>
          {teams.length > 0 ? (
            <div className="mydata-table-wrapper">
              <table className="mydata-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Role</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{team.team_name}</td>
                      <td>{team.is_captain ? 'Captain' : 'Member'}</td>
                      <td>{team.is_temporary ? 'Temporary' : 'Permanent'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mydata-empty">No team memberships found.</div>
          )}
        </div>

        {/* Payment History */}
        <div className="mydata-section">
          <div className="mydata-section-title">
            <CreditCard size={18} /> Payment History
          </div>
          {payments.length > 0 ? (
            <div className="mydata-table-wrapper">
              <table className="mydata-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {p.merchant_order_id}
                      </td>
                      <td>{p.payment_type || '--'}</td>
                      <td style={{ fontWeight: 600 }}>{p.amount ? `INR ${p.amount}` : '--'}</td>
                      <td>
                        <span className={`mydata-badge ${getBadgeClass(p.status)}`}>
                          {p.status || 'N/A'}
                        </span>
                      </td>
                      <td>{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mydata-empty">No payment records found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="mydata-footer">
          <p className="mydata-disclaimer">
            This report was generated by ScrimVerse and reflects data at the time of your request.
            For questions, contact{' '}
            <a href="mailto:support@scrimverse.com" className="mydata-footer-link">
              support@scrimverse.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyDataPage;
