import React, { useState, useEffect, useRef } from 'react';
import './GroupManagementView.css';

const GroupManagementView = ({
  group,
  onStartMatch,
  onEndMatch,
  onEnterPoints,
  initialMatchIndex = 0,
  onMatchIndexChange,
  onTeamClick,
  roundNumber,
  qualifyingTeams,
  tournamentId,
  is5v5Game = false,
}) => {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(initialMatchIndex);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);
  const pwTimerRef = useRef(null);

  useEffect(() => {
    setCurrentMatchIndex(initialMatchIndex);
  }, [initialMatchIndex]);

  // When credentials change (new match selected), reset password visibility
  useEffect(() => {
    setPasswordVisible(false);
    if (pwTimerRef.current) clearTimeout(pwTimerRef.current);
  }, [currentMatchIndex]);

  const handleShowPassword = () => {
    setPasswordVisible(true);
    if (pwTimerRef.current) clearTimeout(pwTimerRef.current);
    pwTimerRef.current = setTimeout(() => setPasswordVisible(false), 5000);
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPw(true);
      setTimeout(() => setCopiedPw(false), 2000);
    }
  };

  const canStartMatch = (match) => {
    if (match.match_number === 1) return true;
    const previousMatch = group.matches?.find((m) => m.match_number === match.match_number - 1);
    if (!previousMatch) return false;
    return previousMatch.status === 'completed';
  };

  const totalMatches = group.matches?.length || 0;
  const currentMatch = group.matches?.[currentMatchIndex];

  const statusInfo = {
    waiting: {
      label: 'WAITING',
      color: 'text-muted-foreground',
      bg: 'bg-secondary/30 border-border',
    },
    ongoing: { label: 'LIVE', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500' },
    completed: { label: 'ENDED', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500' },
  };
  const matchStatus = statusInfo[currentMatch?.status] || statusInfo.waiting;

  return (
    <div className="gmv-card">
      {/* Header */}
      <div className="gmv-header">
        <div className="flex items-center gap-2">
          <span className="gmv-group-badge">{group.group_name}</span>
          <span className="text-sm sm:text-base font-semibold text-foreground">
            Round {roundNumber} Management
          </span>
        </div>
        {/* Match dots */}
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {group.matches?.map((match, index) => (
            <div
              key={match.id}
              onClick={() => {
                setCurrentMatchIndex(index);
                if (onMatchIndexChange) onMatchIndexChange(index);
              }}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold cursor-pointer transition-all ${
                match.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : index === currentMatchIndex
                    ? 'bg-accent text-accent-foreground ring-2 ring-accent/50'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {match.status === 'completed' ? (
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Match Info & Controls — only for BR (5v5 uses lobby cards) */}
      {currentMatch && !is5v5Game && (
        <div className="gmv-match-block">
          {/* Status + info row */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status badge — wider for LIVE, compact for others */}
            {currentMatch.status === 'ongoing' ? (
              <div className="gmv-live-badge">
                <div className="gmv-live-dot" />
                <span>LIVE</span>
              </div>
            ) : currentMatch.status === 'completed' ? (
              <div className={`p-2.5 sm:p-3 rounded-lg border-2 ${matchStatus.bg}`}>
                <div className={`flex items-center gap-1.5 ${matchStatus.color}`}>
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-bold text-xs sm:text-sm">ENDED</span>
                </div>
              </div>
            ) : (
              <div className={`p-2.5 sm:p-3 rounded-lg border-2 ${matchStatus.bg}`}>
                <div className={`flex items-center gap-1.5 ${matchStatus.color}`}>
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <span className="font-bold text-xs sm:text-sm">WAITING</span>
                </div>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-sm sm:text-base text-foreground">
                Match {currentMatchIndex + 1} of {totalMatches}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentMatch.status === 'waiting' && 'Configure and start match'}
                {currentMatch.status === 'ongoing' && 'Match in progress'}
                {currentMatch.status === 'completed' &&
                  (currentMatch.scores_submitted ? 'Points uploaded' : 'Upload points table')}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            {currentMatch.status === 'waiting' && (
              <button
                onClick={() => onStartMatch(currentMatch)}
                disabled={!canStartMatch(currentMatch)}
                className="gmv-btn gmv-btn-green"
              >
                <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Match
              </button>
            )}
            {currentMatch.status === 'ongoing' && (
              <>
                <button onClick={() => onStartMatch(currentMatch)} className="gmv-btn gmv-btn-dark">
                  <svg
                    className="h-3 w-3 sm:h-4 sm:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Edit ID/Password
                </button>
                <button onClick={() => onEndMatch(currentMatch)} className="gmv-btn gmv-btn-red">
                  <svg
                    className="h-3 w-3 sm:h-4 sm:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                  End Match
                </button>
              </>
            )}
            {currentMatch.status === 'completed' && !currentMatch.scores_submitted && (
              <button
                onClick={() => onEnterPoints(currentMatch)}
                className="gmv-btn gmv-btn-accent"
              >
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Enter Points Table
              </button>
            )}
            {currentMatch.scores_submitted && (
              <>
                <div className="gmv-scores-locked">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Points Finalized
                </div>
                {currentMatchIndex < totalMatches - 1 && (
                  <button
                    className="gmv-btn gmv-btn-next-match"
                    onClick={() => {
                      const next = currentMatchIndex + 1;
                      setCurrentMatchIndex(next);
                      if (onMatchIndexChange) onMatchIndexChange(next);
                    }}
                  >
                    Next Match
                    <svg
                      className="h-3 w-3 sm:h-4 sm:w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Credentials — only for BR (5v5 credentials shown inside lobby cards) */}
      {currentMatch && !is5v5Game && (currentMatch.match_id || currentMatch.match_password) && (
        <div className="gmv-credentials">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {/* Match ID */}
            <div className="gmv-cred-item">
              <div className="gmv-cred-header">
                <span className="gmv-cred-label">MATCH ID</span>
                <button
                  className="gmv-cred-action"
                  onClick={() => handleCopy(currentMatch.match_id, 'id')}
                  title="Copy Match ID"
                >
                  {copiedId ? (
                    <svg
                      className="w-3.5 h-3.5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <span className="gmv-cred-value">{currentMatch.match_id || '—'}</span>
            </div>

            {/* Room Password */}
            <div className="gmv-cred-item">
              <div className="gmv-cred-header">
                <span className="gmv-cred-label">ROOM PASSWORD</span>
                <div className="flex items-center gap-1.5">
                  <button
                    className="gmv-cred-action"
                    onClick={() =>
                      passwordVisible ? setPasswordVisible(false) : handleShowPassword()
                    }
                    title={passwordVisible ? 'Hide password' : 'Show password (5s)'}
                  >
                    {passwordVisible ? (
                      /* Eye-off */
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      /* Eye */
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    className="gmv-cred-action"
                    onClick={() => handleCopy(currentMatch.match_password, 'pw')}
                    title="Copy Password"
                  >
                    {copiedPw ? (
                      <svg
                        className="w-3.5 h-3.5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <span className="gmv-cred-value">
                {currentMatch.match_password
                  ? passwordVisible
                    ? currentMatch.match_password
                    : '••••••••'
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Teams */}
      {!is5v5Game && (
        <div className="gmv-teams-block">
          <div className="gmv-teams-header">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-semibold text-sm sm:text-base">
                Teams in {group.group_name}
              </span>
            </div>
            {qualifyingTeams > 0 && (
              <span className="gmv-qualifying-badge">{qualifyingTeams} qualifying</span>
            )}
          </div>
          <div className="gmv-teams-grid">
            {group.teams?.map((team) => (
              <div
                key={team.id}
                onClick={() => onTeamClick && onTeamClick(team)}
                className="gmv-team-chip"
              >
                {team.team_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagementView;
