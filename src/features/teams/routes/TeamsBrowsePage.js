import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Trophy,
  Plus,
  Loader2,
  X,
  Gamepad2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { teamAPI, authAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import useToast from '../../../hooks/useToast';
import Toast from '../../../components/Toast';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import './TeamsBrowsePage.css';

const MEDIA_URL = (process.env.REACT_APP_MEDIA_URL || 'http://localhost:8000').replace(
  /\/media\/?$/,
  ''
);

const GAME_OPTIONS = ['BGMI', 'Valorant', 'Free Fire', 'COD Mobile', 'Scarfall'];
const GAME_FILTERS = ['All', ...GAME_OPTIONS];

// Floating particles component (from Lovable)
const FloatingParticles = () => (
  <div className="enhanced-particles">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="particle" />
    ))}
  </div>
);

const getBadgeColor = (wins) => {
  if (wins >= 6) return 'tb-badge-elite';
  if (wins >= 3) return 'tb-badge-pro';
  if (wins >= 1) return 'tb-badge-rising';
  return 'tb-badge-new';
};

const getBadgeLabel = (wins) => {
  if (wins >= 6) return 'Elite';
  if (wins >= 3) return 'Pro';
  if (wins >= 1) return 'Rising';
  return 'New';
};

// ── Create Team Modal ─────────────────────────────────────────────────────────
const CreateTeamModal = ({ isOpen, onClose, onCreated, showToast, user }) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState(GAME_OPTIONS[0]);
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const [playerUsernames, setPlayerUsernames] = useState(['', '', '']);
  const [selectedUsernames, setSelectedUsernames] = useState([null, null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const searchCounter = useRef(0);
  const gameDropdownRef = useRef(null);
  const currentUsername = user?.user?.username || '';

  // Close game dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gameDropdownRef.current && !gameDropdownRef.current.contains(e.target)) {
        setGameDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setTeamName('');
    setDescription('');
    setGame(GAME_OPTIONS[0]);
    setPlayerUsernames(['', '', '']);
    setSelectedUsernames([null, null, null]);
    setFieldErrors({});
    setUsernameSuggestions({});
    setShowSuggestions({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUsernameChange = async (index, value) => {
    const newUsernames = [...playerUsernames];
    newUsernames[index] = value;
    setPlayerUsernames(newUsernames);

    const newSelected = [...selectedUsernames];
    newSelected[index] = null;
    setSelectedUsernames(newSelected);

    const newErrors = { ...fieldErrors };
    delete newErrors[index];
    setFieldErrors(newErrors);

    if (value.length >= 2) {
      searchCounter.current += 1;
      const myToken = searchCounter.current;
      try {
        const res = await authAPI.searchPlayerUsernames(value, true);
        if (myToken !== searchCounter.current) return;
        const alreadySelected = [currentUsername, ...newSelected.filter((u) => u !== null)];
        const filteredResults = (res.data.results || []).filter(
          (u) => !alreadySelected.includes(u.username)
        );
        setUsernameSuggestions((prev) => ({ ...prev, [index]: filteredResults }));
        setShowSuggestions((prev) => ({ ...prev, [index]: filteredResults.length > 0 }));
      } catch (err) {
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

    const newSelected = [...selectedUsernames];
    newSelected[index] = username;
    setSelectedUsernames(newSelected);

    setShowSuggestions({ ...showSuggestions, [index]: false });

    const newErrors = { ...fieldErrors };
    delete newErrors[index];
    setFieldErrors(newErrors);
  };

  const handleFieldBlur = (index) => {
    setTimeout(() => {
      setShowSuggestions({ ...showSuggestions, [index]: false });
      if (playerUsernames[index] && !selectedUsernames[index]) {
        const newUsernames = [...playerUsernames];
        newUsernames[index] = '';
        setPlayerUsernames(newUsernames);
        setFieldErrors({ ...fieldErrors, [index]: 'Please select a player from the dropdown' });
      }
    }, 300);
  };

  const addPlayerField = () => {
    if (playerUsernames.length < 14) {
      setPlayerUsernames([...playerUsernames, '']);
      setSelectedUsernames([...selectedUsernames, null]);
    }
  };

  const removePlayerField = (index) => {
    if (playerUsernames.length > 1) {
      setPlayerUsernames(playerUsernames.filter((_, i) => i !== index));
      setSelectedUsernames(selectedUsernames.filter((_, i) => i !== index));
      const newErrors = { ...fieldErrors };
      delete newErrors[index];
      setFieldErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showToast('Please enter a team name', 'error');
      return;
    }

    const invalidFields = [];
    playerUsernames.forEach((username, index) => {
      if (username.trim() !== '' && !selectedUsernames[index]) {
        invalidFields.push(index);
      }
    });

    if (invalidFields.length > 0) {
      showToast('Please select all players from the dropdown', 'error');
      const newErrors = {};
      invalidFields.forEach((index) => {
        newErrors[index] = 'Please select from dropdown';
      });
      setFieldErrors(newErrors);
      return;
    }

    const selectedPlayers = selectedUsernames.filter((u) => u !== null && u.trim() !== '');
    const allPlayers = [currentUsername, ...selectedPlayers];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      showToast('Duplicate players detected. Each player can only be added once.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await teamAPI.createTeam({
        name: teamName.trim(),
        description: description.trim() || undefined,
        game,
        player_usernames: allPlayers,
      });
      showToast(`Team "${teamName}" created successfully!`, 'success');
      resetForm();
      onCreated();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.player_usernames ||
        'Failed to create team';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tb-modal-overlay" onClick={handleClose}>
      <div className="tb-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tb-modal-header">
          <h3 className="tb-modal-title">
            <Users size={18} className="tb-modal-icon" />
            Create New Team
          </h3>
          <button className="tb-modal-close" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>
        <p className="tb-modal-subtitle">Pick a game, name your team, and invite your crew</p>

        <form onSubmit={handleSubmit} className="tb-modal-form">
          {/* Game selector */}
          <div className="tb-form-field">
            <label className="tb-form-label">Game *</label>
            <div style={{ position: 'relative' }} ref={gameDropdownRef}>
              <button
                type="button"
                className="tb-game-btn"
                onClick={() => setGameDropdownOpen((v) => !v)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Gamepad2 size={14} /> {game}
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: gameDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              {gameDropdownOpen && (
                <div className="tb-game-dropdown">
                  {GAME_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`tb-game-option${game === g ? ' active' : ''}`}
                      onClick={() => {
                        setGame(g);
                        setGameDropdownOpen(false);
                      }}
                    >
                      {game === g && <Check size={12} />}
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team name */}
          <div className="tb-form-field">
            <label className="tb-form-label">Team Name *</label>
            <input
              type="text"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="tb-form-input"
            />
          </div>

          {/* Description */}
          <div className="tb-form-field">
            <label className="tb-form-label">Description (Optional)</label>
            <textarea
              placeholder="Brief team description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="tb-form-input"
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Players */}
          <div className="tb-form-field">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <label className="tb-form-label" style={{ marginBottom: 0 }}>
                Add Players ({playerUsernames.filter((p) => p.trim()).length + 1}/15)
              </label>
              {playerUsernames.length < 14 && (
                <button type="button" className="tb-add-player-btn" onClick={addPlayerField}>
                  + Add Player
                </button>
              )}
            </div>

            {/* Captain (locked) */}
            <div className="tb-player-row">
              <input
                type="text"
                value={currentUsername}
                disabled
                className="tb-form-input tb-locked-input"
                placeholder="Captain (You)"
              />
              <span className="tb-captain-badge">Captain</span>
            </div>

            {/* Other players */}
            {playerUsernames.map((username, index) => (
              <div key={index} style={{ position: 'relative', marginTop: 8 }}>
                <div className="tb-player-row">
                  <input
                    type="text"
                    placeholder={`Player ${index + 2} username`}
                    value={username}
                    onChange={(e) => {
                      if (!selectedUsernames[index]) handleUsernameChange(index, e.target.value);
                    }}
                    onBlur={() => handleFieldBlur(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && selectedUsernames[index]) {
                        e.preventDefault();
                        const newU = [...playerUsernames];
                        newU[index] = '';
                        setPlayerUsernames(newU);
                        const newS = [...selectedUsernames];
                        newS[index] = null;
                        setSelectedUsernames(newS);
                        const newErr = { ...fieldErrors };
                        delete newErr[index];
                        setFieldErrors(newErr);
                      }
                    }}
                    className={`tb-form-input${fieldErrors[index] ? ' tb-input-error' : ''}${selectedUsernames[index] ? ' tb-input-selected' : ''}`}
                  />
                  {playerUsernames.length > 1 && (
                    <button
                      type="button"
                      className="tb-remove-player-btn"
                      onClick={() => removePlayerField(index)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {showSuggestions[index] && usernameSuggestions[index]?.length > 0 && (
                  <div className="tb-suggestions">
                    {usernameSuggestions[index].map((u) => (
                      <div
                        key={u.id}
                        className="tb-suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(index, u.username);
                        }}
                      >
                        {u.username}
                      </div>
                    ))}
                  </div>
                )}
                {fieldErrors[index] && <div className="tb-field-error">{fieldErrors[index]}</div>}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="tb-modal-actions">
            <button
              type="button"
              className="tb-btn-cancel"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="tb-btn-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="tb-spinner-sm" /> Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

const TeamsBrowsePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { toast, showToast, hideToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGameFilter, setActiveGameFilter] = useState('All');
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningTeamId, setJoiningTeamId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // fetchTeams accepts { game, search, page } — search + game filter both applied together
  const fetchTeams = useCallback(async ({ game, search, pg }) => {
    try {
      setIsLoading(true);
      const params = { page: pg || 1, page_size: PAGE_SIZE };
      if (search && search.trim()) params.search = search.trim();
      if (game && game !== 'All') params.game = game;
      const res = await teamAPI.getTeams(params);
      const data = res.data.results || res.data;
      setTeams(Array.isArray(data) ? data : []);
      setTotalCount(res.data.count || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error('Error fetching teams:', err);
      showToast('Failed to load teams', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: load with current defaults
  useEffect(() => {
    fetchTeams({ game: activeGameFilter, search: searchQuery, pg: page });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — when searchQuery changes, reset to page 1 and fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTeams({ game: activeGameFilter, search: searchQuery, pg: 1 });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Game chip change — always re-fetch with current search + new filter
  useEffect(() => {
    setPage(1);
    fetchTeams({ game: activeGameFilter, search: searchQuery, pg: 1 });
  }, [activeGameFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page change
  useEffect(() => {
    fetchTeams({ game: activeGameFilter, search: searchQuery, pg: page });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Teams are already filtered by API — no client-side filter needed
  const filteredTeams = teams;

  const handleJoinRequest = async (teamId) => {
    if (!user) {
      showToast('Please log in to send a join request', 'error');
      return;
    }
    setJoiningTeamId(teamId);
    try {
      await teamAPI.requestJoin(teamId);
      showToast('Join request sent!', 'success');
      fetchTeams({ game: activeGameFilter, search: searchQuery, pg: page });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to send join request';
      showToast(msg, 'error');
    } finally {
      setJoiningTeamId(null);
    }
  };

  const getMemberCount = (team) => {
    if (Array.isArray(team.members)) return team.members.length;
    return 0;
  };

  const getTeamWins = (team) => {
    return team.overall_stats?.tournament_wins || team.wins || 0;
  };

  const getTeamAvatar = (team) => {
    if (team.profile_picture) {
      return team.profile_picture.startsWith('http')
        ? team.profile_picture
        : `${MEDIA_URL}${team.profile_picture}`;
    }
    return null;
  };

  // Determine if the current user is already a member or captain of a team
  const getUserTeamStatus = (team) => {
    if (!user) return null;
    const currentUserId = user?.user?.id;
    // Check if captain (team.captain is user id)
    if (team.captain === currentUserId) return 'captain';
    // Check if member via members array
    // Captain entry: { id: userId, username, is_captain: true } (no user wrapper)
    // Member entry: { id: TeamMember.id, user: { id: userId }, username, ... }
    if (Array.isArray(team.members)) {
      const isMember = team.members.some((m) => {
        if (m.is_captain) return m.id === currentUserId; // captain entry uses user id directly
        return m.user?.id === currentUserId; // regular member entry
      });
      if (isMember) return 'member';
    }
    return null;
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="cyber-grid" />
      <FloatingParticles />
      <div className="scanlines" />

      <Navbar />

      <main className="tb-main">
        <div className="tb-container">
          {/* Header */}
          <div className="tb-header">
            <h1 className="tb-title">
              <span className="gradient-text">Teams</span>
            </h1>
            <p className="tb-subtitle">
              Discover and join competitive gaming teams. Build your squad and dominate the
              battlefield.
            </p>
          </div>

          {/* Search and Create */}
          <div className="tb-search-row">
            <div className="tb-search-wrap">
              <Search className="tb-search-icon" size={16} />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tb-search-input"
              />
            </div>
            <button
              className="tb-create-btn-white hover-lift"
              onClick={() => {
                if (!user) {
                  showToast('Please log in to create a team', 'error');
                  return;
                }
                setShowCreateModal(true);
              }}
            >
              <Plus size={16} />
              Create Team
            </button>
          </div>

          {/* Game Filter Chips */}
          <div className="tb-filter-chips">
            {GAME_FILTERS.map((g) => (
              <button
                key={g}
                className={`tb-chip${activeGameFilter === g ? ' tb-chip-active' : ''}`}
                onClick={() => setActiveGameFilter(g)}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Teams Grid */}
          {isLoading ? (
            <div className="tb-loading">
              <Loader2 size={32} className="tb-spinner" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="tb-empty">
              <Users size={64} className="tb-empty-icon" />
              <h3 className="tb-empty-title">No Teams Found</h3>
              <p className="tb-empty-desc">
                {searchQuery || activeGameFilter !== 'All'
                  ? 'No teams match your filters'
                  : 'Be the first to create a team!'}
              </p>
              <button
                className="tb-create-btn-white"
                onClick={() => {
                  if (!user) {
                    showToast('Please log in to create a team', 'error');
                    return;
                  }
                  setShowCreateModal(true);
                }}
              >
                <Plus size={16} />
                Create Team
              </button>
            </div>
          ) : (
            <div className="tb-grid">
              {filteredTeams.map((team) => {
                const memberCount = getMemberCount(team);
                const wins = getTeamWins(team);
                const avatarUrl = getTeamAvatar(team);
                const requestStatus = team.user_request_status;
                const membershipStatus = getUserTeamStatus(team);

                return (
                  <div key={team.id} className="cyber-card tb-card hover-lift">
                    {/* Card Header */}
                    <div className="tb-card-header">
                      <div className="avatar-ring-container">
                        <div className="avatar-ring" />
                        <div className="tb-avatar">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={team.name} className="tb-avatar-img" />
                          ) : (
                            <span className="tb-avatar-fallback">
                              {team.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="tb-card-title-wrap">
                        <h3 className="tb-card-name">{team.name}</h3>
                        <span className={`tb-badge ${getBadgeColor(wins)}`}>
                          {getBadgeLabel(wins)}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="tb-card-content">
                      <p className="tb-card-desc">
                        {team.description || 'No description provided'}
                      </p>

                      <div className="tb-card-meta">
                        <div className="tb-meta-item">
                          <Users size={14} />
                          {memberCount} members
                        </div>
                        <div className="tb-meta-item tb-meta-wins">
                          <Trophy size={14} />
                          <span>{wins} wins</span>
                        </div>
                      </div>

                      <div className="tb-card-actions">
                        <button
                          className="tb-btn-outline"
                          onClick={() => navigate(`/team/${team.id}`)}
                        >
                          View Team
                        </button>

                        {/* Membership / join request button */}
                        {membershipStatus === 'captain' ? (
                          <button className="tb-btn-captain" disabled>
                            Captain
                          </button>
                        ) : membershipStatus === 'member' ? (
                          <button className="tb-btn-member" disabled>
                            Member
                          </button>
                        ) : requestStatus === 'pending' ? (
                          <button className="tb-btn-pending" disabled>
                            Request Pending
                          </button>
                        ) : (
                          <button
                            className="tb-btn-join"
                            onClick={() => handleJoinRequest(team.id)}
                            disabled={joiningTeamId === team.id}
                          >
                            {joiningTeamId === team.id ? (
                              <Loader2 size={14} className="tb-spinner-sm" />
                            ) : (
                              'Join Request'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                className="tb-btn-outline px-4 py-1.5 text-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                className="tb-btn-outline px-4 py-1.5 text-xs"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchTeams({ game: activeGameFilter, search: searchQuery, pg: 1 });
        }}
        showToast={showToast}
        user={user}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default TeamsBrowsePage;
