import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import PointsTableModal from './PointsTableModal';
import ScrimPointsTableModal from './ScrimPointsTableModal';
import RegistrationModal from './RegistrationModal';
import './TournamentCard.css';

import posterBgmi from '../../../assets/poster-bgmi.png';
import posterFreefire from '../../../assets/poster-freefire.jpg';
import posterScarfall from '../../../assets/poster-scarfall.png';
import posterValorant from '../../../assets/poster-valorant.jpg';
import posterCodm from '../../../assets/poster-codm.jpg';

const GAME_POSTERS = {
  BGMI: posterBgmi,
  Freefire: posterFreefire,
  'Free Fire': posterFreefire,
  Scarfall: posterScarfall,
  Valorant: posterValorant,
  COD: posterCodm,
  'COD Mobile': posterCodm,
};

const TournamentCard = ({ tournament, activeTab }) => {
  const { isHost, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegisteredInternal, setIsRegisteredInternal] = useState(tournament.is_registered);

  const isGuest = !isAuthenticated();
  // const hostProfileId = user?.profile?.id || user?.host_profile?.id;

  const getBaseLink = () => {
    const mode = (tournament.event_mode || '').toUpperCase();
    return mode === 'SCRIM' ? `/scrims/${tournament.id}` : `/tournaments/${tournament.id}`;
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(getBaseLink());
  };

  const handleGuestClick = (e) => {
    if (isGuest) {
      e.preventDefault();
      navigate('/player/login');
    }
  };

  const getRegistrationStatus = () => {
    const start = tournament.registration_start || tournament.registrationStart;
    const end = tournament.registration_end || tournament.registrationEnd;
    if (!start || !end) return 'ended';
    const now = new Date();
    const regStart = new Date(start);
    const regEnd = new Date(end);
    if (isNaN(regStart.getTime()) || isNaN(regEnd.getTime())) return 'ended';
    const isFull =
      Number(tournament.current_participants || 0) >= Number(tournament.max_participants || 0);
    if (isFull) return 'full';
    if (now < regStart) return 'not_started';
    if (now > regEnd) return 'ended';
    return 'open';
  };

  const effectiveTab =
    activeTab ||
    (tournament.status === 'ongoing'
      ? 'active'
      : tournament.status === 'completed'
        ? 'past'
        : 'upcoming');

  const isRegistered =
    isRegisteredInternal ||
    tournament.is_registered ||
    (user &&
      user.profile &&
      tournament.participants?.some((p) => {
        const isPlayer = p.player_id === user.profile.id;
        const isTeamMember =
          user.profile.current_team && p.team_id === user.profile.current_team.id;
        return isPlayer || isTeamMember;
      }));

  // Poster image — use tournament image or fall back to game poster
  const getPosterImage = () => {
    const mediaBase = (
      process.env.REACT_APP_MEDIA_URL ||
      process.env.REACT_APP_API_URL?.replace('/api', '') ||
      'http://localhost:8000'
    ).replace(/\/media\/?$/, '');

    if (tournament.poster_image) {
      if (tournament.poster_image.startsWith('http')) return tournament.poster_image;
      return `${mediaBase}${tournament.poster_image}`;
    }
    if (tournament.banner_image) {
      if (tournament.banner_image.startsWith('http')) return tournament.banner_image;
      return `${mediaBase}${tournament.banner_image}`;
    }
    const game = tournament.game_name || tournament.game || '';
    return GAME_POSTERS[game] || GAME_POSTERS[game.split(' ')[0]] || posterBgmi;
  };

  // Progress bar stats
  const registered = tournament.registration_count || tournament.current_participants || 0;
  const total = tournament.max_teams || tournament.max_participants || 0;
  const progressPct = total > 0 ? Math.min((registered / total) * 100, 100) : 0;
  const spotsLeft = Math.max(total - registered, 0);

  // Prize and entry fee
  const prizeNum = parseFloat(tournament.prize_pool || tournament.prize || 0);
  const prizeDisplay = prizeNum > 0 ? `₹${tournament.prize_pool || tournament.prize}` : '₹0';
  const entryNum = parseFloat(tournament.entry_fee || 0);
  const entryFeeDisplay = entryNum === 0 ? 'Free entry' : `₹${tournament.entry_fee}/team`;

  const renderFooterButtons = () => {
    if (effectiveTab === 'past') {
      return (
        <>
          <Link to={getBaseLink()} className="tc-details-link">
            Details <ArrowRight size={12} />
          </Link>
          <button
            className="tc-action-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isGuest) {
                navigate('/player/login');
              } else {
                setShowPointsTable(true);
              }
            }}
          >
            Results
          </button>
        </>
      );
    }

    if (effectiveTab === 'active') {
      return (
        <>
          <Link to={getBaseLink()} className="tc-details-link">
            Details <ArrowRight size={12} />
          </Link>
          {tournament.live_link ? (
            <a
              href={tournament.live_link}
              target="_blank"
              rel="noopener noreferrer"
              className="tc-action-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Watch Live
            </a>
          ) : (
            <button
              className="tc-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate(getBaseLink());
              }}
            >
              Watch
            </button>
          )}
        </>
      );
    }

    // upcoming (default)
    const userIsHost = isHost && isHost();
    const regStatus = getRegistrationStatus();

    return (
      <>
        <Link to={getBaseLink()} className="tc-details-link">
          Details <ArrowRight size={12} />
        </Link>
        {!userIsHost && (
          <>
            {isRegistered ? (
              <span className="tc-status-chip tc-registered">✓ Registered</span>
            ) : regStatus === 'open' ? (
              <button
                className="tc-action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isGuest) {
                    navigate('/player/login');
                  } else {
                    navigate(getBaseLink());
                  }
                }}
              >
                Register
              </button>
            ) : regStatus === 'not_started' ? (
              <span className="tc-status-chip tc-soon">Opening Soon</span>
            ) : regStatus === 'full' ? (
              <span className="tc-status-chip tc-ended">Slots Full</span>
            ) : (
              <span className="tc-status-chip tc-ended">Closed</span>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="tc-card group cursor-pointer" onClick={handleCardClick}>
      {/* Poster image */}
      <div className="tc-poster-wrap">
        <img
          src={getPosterImage()}
          alt={tournament.title || tournament.name}
          className="tc-poster-img"
          draggable={false}
        />
        {/* Status badge overlay */}
        <div className="tc-badge-row">
          {tournament.status === 'ongoing' && <span className="tc-badge tc-badge-live">LIVE</span>}
          {tournament.status === 'upcoming' && (
            <span className="tc-badge tc-badge-upcoming">UPCOMING</span>
          )}
          {tournament.status === 'completed' && (
            <span className="tc-badge tc-badge-done">DONE</span>
          )}
          {tournament.plan_type === 'premium' && (
            <span className="tc-badge tc-badge-premium">PREMIUM</span>
          )}
          {tournament.plan_type === 'featured' && (
            <span className="tc-badge tc-badge-featured">FEATURED</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="tc-body">
        {/* Tournament name */}
        <h4 className="tc-title">{tournament.title || tournament.name}</h4>

        {/* Host link */}
        {(tournament.host_name || tournament.host) && (
          <div className="tc-host-row">
            by{' '}
            <Link
              to={`/host/profile/${tournament.host?.id || tournament.host_id}`}
              className="tc-host-link"
              onClick={(e) => {
                e.stopPropagation();
                handleGuestClick(e);
              }}
            >
              {tournament.host_name ||
                (typeof tournament.host === 'string'
                  ? tournament.host
                  : tournament.host?.username) ||
                'Scrimverse'}
            </Link>
          </div>
        )}

        {/* Prize + Entry fee row */}
        <div className="tc-prize-row">
          <span className="tc-prize">
            <Trophy size={14} />
            {prizeDisplay}
          </span>
          {entryFeeDisplay && <span className="tc-entry-fee">{entryFeeDisplay}</span>}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="tc-progress-wrap">
            <div className="tc-progress-track">
              <div className="tc-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="tc-progress-labels">
              <span>{registered} registered</span>
              <span className="tc-spots-left">{spotsLeft} spots left</span>
            </div>
          </div>
        )}

        {/* Footer: Details link + action button */}
        <div className="tc-footer">{renderFooterButtons()}</div>
      </div>

      {/* Points Table Modal */}
      {showPointsTable &&
        ((tournament.event_mode || '').toUpperCase() === 'SCRIM' ? (
          <ScrimPointsTableModal
            isOpen={showPointsTable}
            onClose={() => setShowPointsTable(false)}
            tournament={tournament}
            currentRound={tournament.current_round || 1}
          />
        ) : (
          <PointsTableModal
            isOpen={showPointsTable}
            onClose={() => setShowPointsTable(false)}
            tournament={tournament}
            currentRound={tournament.current_round || 1}
          />
        ))}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <RegistrationModal
          event={tournament}
          type={(tournament.event_mode || '').toLowerCase() === 'scrim' ? 'scrim' : 'tournament'}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => {
            setIsRegisteredInternal(true);
            setShowRegistrationModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TournamentCard;
