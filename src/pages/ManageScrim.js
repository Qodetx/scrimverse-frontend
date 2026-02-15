import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import ScrimConfigModal from '../components/ScrimConfigModal';
import GroupSelectionView from '../components/GroupSelectionView';
import GroupManagementView from '../components/GroupManagementView';
import MatchConfigModal from '../components/MatchConfigModal';
import MatchPointsModal from '../components/MatchPointsModal';
import EliminatedTeamsModal from '../components/EliminatedTeamsModal';
import ScrimPointsTableModal from '../components/ScrimPointsTableModal';
import CountdownTimer from '../components/CountdownTimer';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import TeamPlayersModal from '../components/TeamPlayersModal';
import RoundNamesModal from '../components/RoundNamesModal';

const ManageScrim = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHost, loading: authLoading } = useContext(AuthContext);

  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    rules: '',
    banner_image: null,
  });
  const [bannerPreview, setBannerPreview] = useState(null);
  const [roundNames, setRoundNames] = useState({});
  const [showRoundNamesModal, setShowRoundNamesModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [teamsTab, setTeamsTab] = useState('active'); // 'active' or 'rejected'
  const [finalStandings, setFinalStandings] = useState(null);

  // Groups and Matches State
  const [showRoundConfigModal, setShowRoundConfigModal] = useState(false);
  const [roundGroups, setRoundGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMatchConfigModal, setShowMatchConfigModal] = useState(false);
  const [showMatchPointsModal, setShowMatchPointsModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [showEliminatedModal, setShowEliminatedModal] = useState(false);
  const [eliminatedData, setEliminatedData] = useState(null);
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastSelectedMatch, setLastSelectedMatch] = useState(1);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Hardcoded for Scrim
  const getEventLabel = () => 'Scrim';
  const getEventLabelLower = () => 'scrim';

  const getRoundStatus = (roundNum) => {
    return tournament?.round_status?.[String(roundNum)] || 'upcoming';
  };

  const isRoundCompleted = (roundNum) => {
    return getRoundStatus(roundNum) === 'completed';
  };

  const isRoundOngoing = (roundNum) => {
    return getRoundStatus(roundNum) === 'ongoing';
  };

  const canStartRound = (roundNum) => {
    if (!tournament || tournament.status === 'completed') return false;
    const status = getRoundStatus(roundNum);
    if (status === 'completed' || status === 'ongoing') return false;
    if (roundNum === 1) {
      return tournament.current_round === 0;
    }
    return isRoundCompleted(roundNum - 1) && tournament.current_round === 0;
  };

  const allRoundsCompleted = () => {
    return tournament?.rounds?.every((round) => isRoundCompleted(round.round)) || false;
  };

  const fetchRoundGroups = useCallback(
    async (roundNumber) => {
      try {
        setGroupsLoading(true);
        const response = await tournamentAPI.getRoundGroups(id, roundNumber);
        setRoundGroups(response.data.groups || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
        if (error.response?.status !== 404) {
          showToast('Failed to load groups');
        }
        setRoundGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    },
    [id, showToast]
  );

  const fetchFinalStandings = useCallback(
    async (roundNum) => {
      try {
        const response = await tournamentAPI.getRoundResults(id, roundNum);
        setFinalStandings(response.data);
      } catch (error) {
        console.error('Error fetching final standings:', error);
      }
    },
    [id]
  );

  const fetchTournamentData = useCallback(async () => {
    try {
      const response = await tournamentAPI.getManageTournament(id);
      setTournament(response.data.tournament);
      setRegistrations(response.data.registrations || []);
      const currentRoundNum =
        response.data.tournament.status === 'completed'
          ? response.data.tournament.rounds?.length || 0
          : response.data.tournament.current_round || 0;
      setCurrentRound(currentRoundNum);

      // Initialize edit data
      setEditData({
        title: response.data.tournament.title || '',
        description: response.data.tournament.description || '',
        rules: response.data.tournament.rules || '',
        banner_image: null,
      });
      setBannerPreview(response.data.tournament.banner_image || null);

      // Parse round_names if it's a string, otherwise use as is
      const initialRoundNames =
        typeof response.data.tournament.round_names === 'string'
          ? JSON.parse(response.data.tournament.round_names)
          : response.data.tournament.round_names || {};
      setRoundNames(initialRoundNames);
      if (currentRoundNum > 0) {
        // Fetch groups for current round if tournament is ongoing
        if (response.data.tournament.status === 'ongoing') {
          await fetchRoundGroups(currentRoundNum);
        }
        if (response.data.tournament.status === 'completed') {
          fetchFinalStandings(response.data.tournament.rounds.length);
        }
      }
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      showToast(`Failed to load scrim data`, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, fetchRoundGroups, fetchFinalStandings, showToast]);

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return;

    if (!isHost()) {
      navigate('/');
      return;
    }
    fetchTournamentData();
  }, [id, authLoading, isHost, navigate, fetchTournamentData]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditData({
        title: tournament.title || '',
        description: tournament.description || '',
        rules: tournament.rules || '',
        banner_image: null,
      });
      setBannerPreview(tournament.banner_image || null);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveRoundNames = (names) => {
    setRoundNames(names);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Banner image size should not exceed 5MB', 'warning');
        return;
      }
      setEditData({ ...editData, banner_image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const formData = new FormData();
      formData.append('title', editData.title);
      formData.append('description', editData.description);
      formData.append('rules', editData.rules);

      // Add round names if they exist
      if (Object.keys(roundNames).length > 0) {
        formData.append('round_names', JSON.stringify(roundNames));
      }

      await tournamentAPI.updateTournamentFields(id, formData);
      showToast(`${getEventLabel()} updated successfully!`);
      setIsEditing(false);
      fetchTournamentData();
    } catch (error) {
      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          `Failed to update ${getEventLabelLower()}`
      );
      console.error('Update error:', error);
    }
  };

  // ===== Groups and Matches Handlers =====

  const handleSubmitRoundConfig = async (configData) => {
    try {
      setLoading(true);
      await tournamentAPI.configureRound(id, currentRound, configData);
      setShowRoundConfigModal(false);
      showToast('Round configured successfully!');
      await fetchRoundGroups(currentRound);
      await fetchTournamentData();
    } catch (error) {
      console.error('Error configuring round:', error);
      showToast(error.response?.data?.error || 'Failed to configure round', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (team) => {
    // Find the registration for this team
    const teamReg = registrations.find((r) => r.team === team.id || r.team_name === team.team_name);
    if (teamReg) {
      // Set the team with the registration ID for the API call
      setSelectedTeam({ ...team, id: teamReg.id, team_name: teamReg.team_name });
      setShowTeamDetails(true);
    }
  };

  const handleWinnerClick = (winner) => {
    // Find the registration by team_id or team_name
    const teamReg = registrations.find(
      (r) => r.team === winner.team_id || r.team_name === winner.team_name
    );
    if (teamReg) {
      setSelectedTeam({ id: teamReg.id, team_name: winner.team_name });
      setShowTeamDetails(true);
    }
  };

  const handleStartMatch = (match) => {
    setCurrentMatch(match);
    setShowMatchConfigModal(true);
  };

  const handleSubmitMatchConfig = async (matchConfigData) => {
    try {
      setLoading(true);
      const currentGroupId = selectedGroup.id;
      await tournamentAPI.startMatch(id, currentGroupId, matchConfigData);
      setShowMatchConfigModal(false);
      setCurrentMatch(null);
      showToast('Match started successfully!');
      // Refresh groups and restore selected group
      const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
      setRoundGroups(updatedGroups.data.groups || []);
      const updatedGroup = updatedGroups.data.groups.find((g) => g.id === currentGroupId);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    } catch (error) {
      console.error('Error starting match:', error);
      showToast('Failed to start match', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEndMatch = (match) => {
    setConfirmModal({
      isOpen: true,
      title: 'End Match',
      message: `Are you sure you want to end Match ${match.match_number}?`,
      confirmText: 'End Match',
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true);
          const currentGroupId = selectedGroup.id;
          await tournamentAPI.endMatch(id, match.id);
          showToast('Match ended successfully!');
          // Refresh groups and restore selected group
          const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
          setRoundGroups(updatedGroups.data.groups || []);
          const updatedGroup = updatedGroups.data.groups.find((g) => g.id === currentGroupId);
          if (updatedGroup) {
            setSelectedGroup(updatedGroup);
          }
        } catch (error) {
          console.error('Error ending match:', error);
          showToast('Failed to end match', 'error');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleEnterPoints = (match) => {
    setCurrentMatch(match);
    setShowMatchPointsModal(true);
  };

  const handleSubmitPoints = async (pointsData) => {
    try {
      setLoading(true);
      const currentGroupId = selectedGroup.id;
      await tournamentAPI.submitMatchScores(id, currentMatch.id, pointsData);
      setShowMatchPointsModal(false);
      setCurrentMatch(null);
      showToast('Points submitted successfully!');
      // Refresh groups and restore selected group
      const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
      setRoundGroups(updatedGroups.data.groups || []);
      const updatedGroup = updatedGroups.data.groups.find((g) => g.id === currentGroupId);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    } catch (error) {
      console.error('Error submitting points:', error);
      const errorMsg = error.response?.data?.error || 'Failed to submit points';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceRound = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getRoundResults(id, currentRound);
      const data = response.data;

      if (data.is_final_round) {
        // Final round completed - show winner
        const winnerName = data.winner?.team_name || 'Unknown';
        showToast(
          `Tournament Complete!\n\nWinner: ${winnerName}\n\nTotal Points: ${data.winner?.total_points || 0}`
        );
        await fetchTournamentData();
      } else {
        // Regular round - show eliminated teams modal
        await fetchTournamentData();
        setEliminatedData(data);
        setShowEliminatedModal(true);
      }
    } catch (error) {
      console.error('Error advancing round:', error);
      const errorMsg = error.response?.data?.error || 'Failed to advance round';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToNextRound = () => {
    setShowEliminatedModal(false);
    const nextRound = eliminatedData.next_round;
    setCurrentRound(nextRound);
    setSelectedGroup(null);
    setRoundGroups([]);
    setShowRoundConfigModal(true);
  };

  // Load groups when round changes
  useEffect(() => {
    if (tournament?.use_groups_system && currentRound > 0) {
      fetchRoundGroups(currentRound);
    }
  }, [currentRound, tournament?.use_groups_system]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-gray-400">{getEventLabel()} not found</p>
      </div>
    );
  }

  const currentRoundConfig = tournament.rounds.find((r) => r.round === tournament.current_round);
  // For display: use qualifying_teams if set, otherwise max_teams
  const qualifyingTeams = Number(currentRoundConfig?.qualifying_teams) || 0;
  const maxTeams = Number(currentRoundConfig?.max_teams) || 0;
  const _qualifyingLimit = qualifyingTeams > 0 ? qualifyingTeams : maxTeams; // eslint-disable-line no-unused-vars

  // Check if current round is final round (last round, no qualifying_teams or qualifying_teams = 0)
  const _isCurrentRoundFinal = // eslint-disable-line no-unused-vars
    currentRoundConfig &&
    tournament.rounds.length > 0 &&
    tournament.current_round === tournament.rounds[tournament.rounds.length - 1].round &&
    (!currentRoundConfig.qualifying_teams || Number(currentRoundConfig.qualifying_teams) === 0);

  return (
    <div className="min-h-screen bg-[#030303] py-14 relative overflow-hidden">
      {/* Ambient Background Effects - EXACT COPY FROM TOURNAMENT */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-purple/5 blur-[150px] -mr-96 -mt-96 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-blue/5 blur-[120px] -ml-72 -mb-72 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Ultra-Premium Command Header - EXACT COPY FROM TOURNAMENT */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-20 gap-10">
          <div className="flex items-center gap-8 group">
            <button
              onClick={() => navigate('/host/dashboard')}
              className="relative w-14 h-14 flex items-center justify-center bg-[#0f0f11] border border-white/5 hover:border-accent-purple/50 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg
                className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-md bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-[10px] font-black uppercase tracking-[0.2em]">
                  Manage Scrim
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse"></div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent shimmer-text">
                {tournament.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            {(tournament.status === 'ongoing' || tournament.status === 'completed') && (
              <button
                onClick={() => setShowPointsTable(true)}
                className="flex-1 xl:flex-none px-8 py-4 bg-white text-black font-black transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(255,255,255,0.15)] active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Points Table</span>
              </button>
            )}

            <button
              onClick={handleEditToggle}
              className={`flex-1 xl:flex-none px-8 py-4 font-black transition-all flex items-center justify-center gap-3 ${
                isEditing
                  ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                  : tournament.status === 'upcoming'
                    ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    : 'bg-white/5 border border-white/10 text-gray-400 cursor-default'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {tournament.status === 'upcoming' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                ) : (
                  <>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </>
                )}
              </svg>
              <span>
                {isEditing
                  ? tournament.status === 'upcoming'
                    ? 'Cancel Edit'
                    : 'Close'
                  : tournament.status === 'upcoming'
                    ? 'Edit'
                    : 'View'}
              </span>
            </button>
          </div>
        </div>

        <div className="w-full mx-auto space-y-12 mb-20">
          {/* Edit/View Scrim Section - EXACT COPY FROM TOURNAMENT */}
          {isEditing && (
            <div className="info-grid-card cyber-card p-6 border border-white/10 mb-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                    {tournament.status === 'upcoming' ? 'Modify Parameters' : 'Scrim Details'}
                  </h2>
                  <p className="text-gray-500 text-xs font-black">
                    {tournament.status === 'upcoming'
                      ? 'Update the core details of your scrim'
                      : 'View scrim information (editing locked after start)'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 ml-1">
                      Scrim Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={editData.title}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white font-bold focus:outline-none focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 ml-1">
                      Event Description
                    </label>
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      rows={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white font-medium focus:outline-none focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Detailed description..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 ml-1">
                      Rules & Guidelines
                    </label>
                    <textarea
                      name="rules"
                      value={editData.rules}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      rows={12}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Rules & guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {tournament.status === 'upcoming' && (
                <>
                  <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-white/5">
                    <button
                      onClick={handleSaveChanges}
                      className="flex-1 bg-accent-purple text-white px-6 py-3 font-black uppercase tracking-widest hover:bg-accent-purple/90 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] shadow-2xl active:scale-95"
                    >
                      Confirm Evolution
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="flex-1 bg-white/5 text-gray-300 px-6 py-3 font-black uppercase tracking-widest hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                    >
                      Discard Changes
                    </button>
                  </div>

                  <div className="mt-6 bg-accent-purple/10 p-4 border border-accent-purple/20">
                    <div className="flex gap-3">
                      <div className="text-accent-purple text-lg">ℹ️</div>
                      <p className="text-gray-400 text-xs font-medium leading-relaxed">
                        <strong className="text-white font-black uppercase tracking-widest mr-2">
                          Core Lockdown:
                        </strong>
                        Game settings and participant limits cannot be changed after creation. Only
                        title, description, and rules can be modified.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tactical Scrim Details Section - EXACT COPY FROM TOURNAMENT */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-purple/20 via-transparent to-accent-blue/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative bg-[#0a0a0c] border border-white/5 cyber-card p-6 lg:p-8 overflow-hidden">
              {/* Interactive Grid Background */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '48px 48px',
                }}
              ></div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-purple/10 flex items-center justify-center text-accent-purple border border-accent-purple/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                      Scrim Specs
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></span>
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500">
                        Live Operation
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                  <div className="flex-1 bg-[#121214] border border-white/5 px-6 py-3 flex items-center justify-between gap-6 min-w-[280px] shadow-xl">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-0.5">
                        Time to Zero
                      </span>
                      <div className="font-mono text-xl font-black text-white tracking-wider leading-none">
                        <CountdownTimer targetDate={tournament.tournament_start} simple />
                      </div>
                    </div>
                    <div className="w-9 h-9 bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
                {[
                  {
                    label: 'Prize Pool',
                    value: `₹${tournament.prize_pool?.toLocaleString()}`,
                    icon: (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                    color: 'text-accent-gold',
                    bg: 'bg-accent-gold/5',
                    border: 'border-accent-gold/20',
                  },
                  {
                    label: 'Teams',
                    value: `${tournament.current_participants}/${tournament.max_participants}`,
                    icon: (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    ),
                    color: 'text-accent-blue',
                    bg: 'bg-accent-blue/5',
                    border: 'border-accent-blue/20',
                  },
                  {
                    label: 'Entry Fee',
                    value: `₹${tournament.entry_fee}`,
                    icon: (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    ),
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/5',
                    border: 'border-emerald-500/20',
                  },
                  {
                    label: 'Game',
                    value: tournament.game_name,
                    icon: (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                        />
                      </svg>
                    ),
                    color: 'text-accent-purple',
                    bg: 'bg-accent-purple/5',
                    border: 'border-accent-purple/20',
                  },
                  {
                    label: 'Format',
                    value: tournament.game_mode,
                    icon: (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    ),
                    color: 'text-sky-500',
                    bg: 'bg-sky-500/5',
                    border: 'border-sky-500/20',
                  },
                  {
                    label: 'Match Start',
                    value: new Date(tournament.tournament_start).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                    icon: (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    ),
                    color: 'text-pink-500',
                    bg: 'bg-pink-500/5',
                    border: 'border-pink-500/20',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`relative flex flex-col p-4 border ${item.border} ${item.bg} hover:border-white/20 transition-all duration-500 overflow-hidden group/item`}
                  >
                    <div className="absolute top-2 right-2 opacity-10 group-hover/item:scale-110 group-hover/item:rotate-6 transition-transform duration-700">
                      {item.icon}
                    </div>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 relative z-10">
                      {item.label}
                    </span>
                    <p
                      className={`text-lg font-black ${item.color} leading-none tracking-tight relative z-10`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scrim Progress Section */}
          <div className="bg-dark-bg-card/30 rounded-[2.5rem] p-4 lg:p-6 border border-white/5 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 shimmer-bg opacity-20"></div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 relative z-10">
              <div>
                <h2 className="text-xl font-black text-white mb-1 tracking-tight leading-none">
                  {getEventLabel()} Progress
                </h2>
                <p className="text-gray-400 text-xs font-black">
                  Manage rounds and track {getEventLabelLower()} advancement
                </p>
              </div>

              {/* Start Scrim Button - Only show when status is upcoming */}
              {tournament.status === 'upcoming' && (
                <div className="flex flex-col items-end gap-2">
                  {new Date() < new Date(tournament.tournament_start) && (
                    <p className="text-gray-400 text-xs font-black">
                      Unlocks at {new Date(tournament.tournament_start).toLocaleString()}
                    </p>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await tournamentAPI.startTournament(tournament.id);
                        showToast('Scrim started successfully!');
                        fetchTournamentData();
                      } catch (error) {
                        console.error('Error starting scrim:', error);
                        const errorMsg = error.response?.data?.error || 'Failed to start scrim';
                        showToast(errorMsg, 'error');
                      }
                    }}
                    disabled={new Date() < new Date(tournament.tournament_start)}
                    className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                      new Date() < new Date(tournament.tournament_start)
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-success to-green-600 hover:from-success/90 hover:to-green-600/90 text-white'
                    }`}
                  >
                    {new Date() < new Date(tournament.tournament_start) ? (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Locked
                      </>
                    ) : (
                      `Start ${getEventLabel()}`
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Tournament Completion Summary - Show ONLY when completed */}
            {tournament.status === 'completed' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Premium Victory Header */}
                <div
                  className="cyber-card relative overflow-hidden bg-gradient-to-r from-accent-gold/10 via-accent-gold/5 to-transparent border border-accent-gold/20 p-6"
                  style={{ borderRadius: 0 }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-accent-gold"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">Victory Ceremony</h3>
                        <p className="text-accent-gold text-sm font-bold">
                          {getEventLabel()} Concluded
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                        Final Results
                      </p>
                      <p className="text-white text-lg font-black">
                        {finalStandings?.results?.length || 0} Teams
                      </p>
                    </div>
                  </div>
                </div>

                {/* Champion Podium - Horizontal Premium Cards */}
                {finalStandings?.results && finalStandings.results.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1st Place - Champion */}
                    {finalStandings.results[0] && (
                      <div
                        onClick={() => handleWinnerClick(finalStandings.results[0])}
                        className="md:col-span-3 lg:col-span-1 relative group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-gold/20 via-accent-gold/10 to-transparent border-2 border-accent-gold/40 p-6 hover:border-accent-gold/60 transition-all">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                          <div className="relative flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-gold to-yellow-600 flex items-center justify-center text-white font-black text-2xl shrink-0 group-hover:scale-110 transition-transform">
                              {finalStandings.results[0].team_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <svg
                                  className="w-4 h-4 text-accent-gold"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-accent-gold text-xs font-black uppercase">
                                  Champion
                                </span>
                              </div>
                              <h4 className="text-white font-black text-xl truncate mb-1">
                                {finalStandings.results[0].team_name}
                              </h4>
                              <p className="text-accent-gold font-black text-lg">
                                {finalStandings.results[0].total_points}{' '}
                                <span className="text-xs opacity-60">PTS</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2nd Place */}
                    {finalStandings.results[1] && (
                      <div
                        onClick={() => handleWinnerClick(finalStandings.results[1])}
                        className="relative group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-400/10 via-gray-400/5 to-transparent border border-gray-400/20 p-5 hover:border-gray-400/40 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-black text-lg shrink-0">
                              2
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-base truncate mb-0.5">
                                {finalStandings.results[1].team_name}
                              </p>
                              <p className="text-gray-400 font-bold text-sm">
                                {finalStandings.results[1].total_points} PTS
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {finalStandings.results[2] && (
                      <div
                        onClick={() => handleWinnerClick(finalStandings.results[2])}
                        className="relative group cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 p-5 hover:border-orange-500/40 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center text-white font-black text-lg shrink-0">
                              3
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-base truncate mb-0.5">
                                {finalStandings.results[2].team_name}
                              </p>
                              <p className="text-gray-400 font-bold text-sm">
                                {finalStandings.results[2].total_points} PTS
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Scrim Stats - Full Width */}
                <div
                  className="cyber-card bg-dark-bg-card/50 border border-white/5 p-5"
                  style={{ borderRadius: 0 }}
                >
                  <h4 className="text-white font-black text-base mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-accent-purple"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    {getEventLabel()} Stats
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Rounds', value: tournament.rounds.length },
                      { label: 'Teams', value: tournament.current_participants },
                      {
                        label: 'Prize Pool',
                        value: `₹${tournament.prize_pool?.toLocaleString()}`,
                        highlight: true,
                      },
                      {
                        label: 'Winner',
                        value: finalStandings?.results?.[0]?.team_name || 'TBD',
                        highlight: true,
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors"
                      >
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">
                          {stat.label}
                        </p>
                        <p
                          className={`font-black text-sm truncate ${stat.highlight ? 'text-accent-gold' : 'text-white'}`}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rounds Display - Only show when NOT upcoming and NOT completed (Gated Section) */}
          {tournament.status === 'ongoing' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Modern Groups System */}
              <div
                className="cyber-card bg-[#0a0a0c] border border-white/5 overflow-hidden mb-6 p-6 lg:p-8"
                style={{ borderRadius: 0 }}
              >
                {/* Round Tabs */}
                <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                  {tournament.rounds.map((round, index) => {
                    const roundNum = round.round;
                    const isActive = roundNum === currentRound;
                    const isCompleted = getRoundStatus(roundNum) === 'completed';
                    const isOngoing = getRoundStatus(roundNum) === 'ongoing';
                    const isFinal = index === tournament.rounds.length - 1;

                    return (
                      <div
                        key={roundNum}
                        onClick={() => setCurrentRound(roundNum)}
                        className={`flex-1 min-w-[140px] text-center py-4 px-6 rounded-2xl transition-all duration-300 cursor-pointer border ${
                          isActive
                            ? 'bg-white/10 border-white/20 text-white'
                            : isCompleted
                              ? 'bg-success/5 border-success/10 text-success'
                              : isOngoing
                                ? 'bg-accent-blue/5 border-accent-blue/10 text-accent-blue'
                                : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black mb-1">{roundNum}</span>
                          <span className="text-[9px] uppercase font-black tracking-[0.2em] opacity-60">
                            {roundNames?.[String(roundNum)] ||
                              (isFinal ? 'Championship' : `Round ${roundNum}`)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Content Area */}
                <div className="relative">
                  {groupsLoading && roundGroups.length === 0 ? (
                    <div className="text-center py-24">
                      <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400 font-black uppercase tracking-widest text-xs">
                        Synchronizing Match Data...
                      </p>
                    </div>
                  ) : (
                    <>
                      {groupsLoading && (
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                          <div className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-pulse"></div>
                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                            Live Refreshing
                          </span>
                        </div>
                      )}

                      {roundGroups.length === 0 ? (
                        <div className="text-center py-24">
                          <div className="relative mb-8 w-16 h-16 mx-auto">
                            <div className="absolute inset-0 bg-accent-purple/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative z-10 text-5xl flex items-center justify-center">
                              ⚙️
                            </div>
                          </div>
                          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                            Ready for{' '}
                            {roundNames?.[String(currentRound)] || `Round ${currentRound}`}
                          </h2>
                          <p className="text-gray-400 mb-8 max-w-md mx-auto font-medium text-sm leading-relaxed">
                            Initialize groups and match configurations to begin the next stage of
                            the competition.
                          </p>
                          <button
                            onClick={() => setShowRoundConfigModal(true)}
                            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-white text-black rounded-2xl font-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] shadow-2xl active:scale-95 text-sm uppercase tracking-widest"
                          >
                            <span className="text-lg">▶</span>
                            <span>INITIALIZE MATCHES</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Group Selector */}
                          <div className="mb-8">
                            <div className="flex justify-between items-end mb-6">
                              <div>
                                <h3 className="text-2xl font-black text-white mb-1 flex items-center gap-3 tracking-tight leading-none">
                                  <span className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                      />
                                    </svg>
                                  </span>
                                  Groups Management
                                </h3>
                                <p className="text-gray-500 font-black text-[9px] uppercase tracking-[0.2em] ml-[52px]">
                                  Active Battle Fronts: {roundGroups.length}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {roundGroups.map((group) => {
                                const completedMatches =
                                  group.matches?.filter((m) => m.status === 'completed').length ||
                                  0;
                                const totalMatches = group.matches?.length || 0;
                                const progressPercent =
                                  totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
                                const isSelected = selectedGroup?.id === group.id;

                                return (
                                  <div
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group)}
                                    className={`group-card-premium rounded-2xl p-4 cursor-pointer relative overflow-hidden group/card transition-all duration-500 ${
                                      isSelected
                                        ? 'border-white/20 ring-1 ring-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] scale-[1.02]'
                                        : 'hover:border-white/10 hover:translate-y-[-4px]'
                                    }`}
                                  >
                                    {/* Abstract Design Elements */}
                                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover/card:bg-white/10 transition-all duration-700"></div>

                                    <div className="relative z-10">
                                      <div className="flex justify-between items-center mb-4">
                                        <div
                                          className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${
                                            isSelected
                                              ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                              : 'bg-white/5 text-gray-500'
                                          }`}
                                        >
                                          {group.group_name}
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-success/5 rounded-full border border-success/10">
                                          <div className="w-1 h-1 bg-success rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                                          <span className="text-[7px] text-success font-black uppercase tracking-widest">
                                            Live
                                          </span>
                                        </div>
                                      </div>

                                      <div className="mb-4">
                                        <div className="flex items-baseline gap-1.5">
                                          <span className="text-2xl font-black text-white tracking-tighter">
                                            {group.teams?.length || 0}
                                          </span>
                                          <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">
                                            Participants
                                          </span>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                          <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">
                                            Battle Progress
                                          </span>
                                          <span className="text-[10px] font-black text-white">
                                            {completedMatches}/{totalMatches}
                                          </span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5">
                                          <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                              isSelected
                                                ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                                                : 'bg-gray-700'
                                            }`}
                                            style={{ width: `${progressPercent}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Selected Group Management - Renders inline below */}
                          {selectedGroup && (
                            <GroupManagementView
                              group={selectedGroup}
                              onStartMatch={handleStartMatch}
                              onEndMatch={handleEndMatch}
                              onEnterPoints={handleEnterPoints}
                              initialMatchIndex={lastSelectedMatch - 1}
                              onMatchIndexChange={(index) => setLastSelectedMatch(index + 1)}
                              onTeamClick={handleTeamClick}
                              roundNumber={currentRound}
                              qualifyingTeams={0}
                            />
                          )}

                          {/* Premium Insight Cards - EXACT COPY FROM TOURNAMENT */}
                          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* System Configuration Overview */}
                            <div className="info-grid-card p-4 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></span>
                                Sector Configuration
                              </h4>
                              <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div>
                                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-1">
                                    Total Squads
                                  </p>
                                  <p className="text-2xl font-black text-white tracking-tighter">
                                    {roundGroups[0]?.teams?.length || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-1">
                                    Total Matches
                                  </p>
                                  <p className="text-2xl font-black text-white tracking-tighter">
                                    {roundGroups.length}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Live Engagement Monitoring */}
                            <div className="info-grid-card p-4 rounded-[3rem] border border-white/5 relative group overflow-hidden">
                              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_#22c55e]"></span>
                                Battlefront Intel
                              </h4>
                              <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div>
                                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-1">
                                    Sectors Clear
                                  </p>
                                  <p className="text-2xl font-black text-white tracking-tighter">
                                    {roundGroups.filter((g) => g.status === 'completed').length}
                                    <span className="text-sm text-gray-500 font-medium ml-1">
                                      / {roundGroups.length}
                                    </span>
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-1">
                                    Hot Zones
                                  </p>
                                  <p className="text-2xl font-black text-danger tracking-tighter">
                                    {roundGroups.reduce(
                                      (acc, g) =>
                                        acc +
                                        (g.matches?.filter((m) => m.status === 'ongoing').length ||
                                          0),
                                      0
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Progression Commander */}
                            {(() => {
                              const allGroupsCompleted =
                                roundGroups.length > 0 &&
                                roundGroups.every((g) => g.status === 'completed');

                              return (
                                <div
                                  className={`p-6 rounded-[3rem] border transition-all duration-1000 flex flex-col justify-between relative overflow-hidden ${
                                    allGroupsCompleted
                                      ? 'bg-white border-white shadow-[0_30px_70px_rgba(255,255,255,0.2)]'
                                      : 'bg-white/[0.02] border-white/5'
                                  }`}
                                >
                                  <div className="text-center relative z-10">
                                    <p
                                      className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${allGroupsCompleted ? 'text-black/40' : 'text-gray-600'}`}
                                    >
                                      Round Command Hub
                                    </p>
                                    <h5
                                      className={`text-lg font-black mb-6 ${allGroupsCompleted ? 'text-black' : 'text-gray-400'}`}
                                    >
                                      {allGroupsCompleted
                                        ? 'All Objectives Met'
                                        : 'Operation In Progress'}
                                    </h5>
                                  </div>

                                  <button
                                    onClick={handleAdvanceRound}
                                    disabled={!allGroupsCompleted}
                                    className={`w-full py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 relative z-10 ${
                                      allGroupsCompleted
                                        ? 'bg-black text-white hover:scale-[1.03] active:scale-[0.98] shadow-2xl'
                                        : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                    }`}
                                  >
                                    🏁 COMPLETE SCRIM
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrim Config Modal */}

        <ScrimConfigModal
          isOpen={showRoundConfigModal}
          onClose={() => setShowRoundConfigModal(false)}
          onSubmit={handleSubmitRoundConfig}
          totalTeams={registrations.filter((r) => r.status === 'confirmed').length}
          gameMode={tournament.game_mode}
        />

        {/* Match Config Modal */}
        <MatchConfigModal
          isOpen={showMatchConfigModal}
          onClose={() => setShowMatchConfigModal(false)}
          onSubmit={handleSubmitMatchConfig}
          matchNumber={currentMatch?.match_number}
          groupName={selectedGroup?.group_name}
          initialMatchId={currentMatch?.match_id}
          initialMatchPassword={currentMatch?.match_password}
        />

        {/* Match Points Modal */}
        <MatchPointsModal
          isOpen={showMatchPointsModal}
          onClose={() => setShowMatchPointsModal(false)}
          onSubmit={handleSubmitPoints}
          match={currentMatch}
          teams={selectedGroup?.teams || []}
        />

        {/* Eliminated Teams Modal */}
        <EliminatedTeamsModal
          isOpen={showEliminatedModal}
          onClose={() => setShowEliminatedModal(false)}
          onProceed={handleProceedToNextRound}
          roundData={eliminatedData}
        />

        {/* Points Table Modal */}
        <ScrimPointsTableModal
          isOpen={showPointsTable}
          onClose={() => setShowPointsTable(false)}
          tournament={tournament}
          currentRound={currentRound}
          initialMatch={lastSelectedMatch}
          onMatchChange={setLastSelectedMatch}
        />

        {/* Teams Modal */}
        {showTeamsModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-[#0a0a0c] w-full max-w-2xl rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b border-white/5 relative">
                <div className="absolute top-0 right-6 w-24 h-24 bg-accent-blue/10 blur-3xl -mr-12 -mt-12"></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                      Registered Teams
                    </h2>
                    <p className="text-gray-500 text-xs font-black">
                      Managing contenders for {tournament.title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTeamsModal(false);
                      setTeamsTab('active');
                    }}
                    className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 relative z-10">
                  <button
                    onClick={() => setTeamsTab('active')}
                    className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      teamsTab === 'active'
                        ? 'bg-white text-black shadow-2xl'
                        : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    ACTIVE (
                    {
                      registrations.filter(
                        (r) => r.status === 'confirmed' || r.status === 'pending'
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setTeamsTab('rejected')}
                    className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      teamsTab === 'rejected'
                        ? 'bg-danger text-white shadow-[0_10px_20px_rgba(239,68,68,0.3)]'
                        : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    ARCHIVED ({registrations.filter((r) => r.status === 'rejected').length})
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-transparent to-black/30">
                {teamsTab === 'active' ? (
                  // Active Teams Tab
                  registrations.filter(
                    (reg) => reg.status === 'confirmed' || reg.status === 'pending'
                  ).length === 0 ? (
                    <div className="text-center py-20">
                      <div className="text-5xl mb-6 grayscale opacity-20">👥</div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                        No active teams registered yet
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Confirm All Button */}
                      {registrations.filter((reg) => reg.status === 'pending').length > 0 && (
                        <div className="mb-6 flex justify-center">
                          <button
                            onClick={async () => {
                              const pendingTeams = registrations.filter(
                                (r) => r.status === 'pending'
                              );
                              setConfirmModal({
                                isOpen: true,
                                title: 'Mass Confirmation',
                                message: `Validate all ${pendingTeams.length} pending applications?`,
                                confirmText: 'APPROVE ALL',
                                type: 'primary',
                                onConfirm: async () => {
                                  try {
                                    await Promise.all(
                                      pendingTeams.map((reg) =>
                                        tournamentAPI.updateTeamStatus(
                                          tournament.id,
                                          reg.id,
                                          'confirmed'
                                        )
                                      )
                                    );
                                    showToast(
                                      `Successfully validated ${pendingTeams.length} teams!`
                                    );
                                    fetchTournamentData();
                                  } catch (error) {
                                    showToast('Operation failed partially. Check logs.', 'error');
                                  }
                                },
                              });
                            }}
                            className="group px-8 py-3 bg-accent-blue text-white rounded-2xl font-black uppercase tracking-widest hover:bg-accent-blue/90 transition-all shadow-2xl flex items-center gap-2 active:scale-95 text-[10px]"
                          >
                            <span>
                              MASS APPROVE (
                              {registrations.filter((reg) => reg.status === 'pending').length})
                            </span>
                            <span className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform text-sm">
                              ✓
                            </span>
                          </button>
                        </div>
                      )}
                      <div className="grid gap-3">
                        {registrations
                          .filter((reg) => reg.status === 'confirmed' || reg.status === 'pending')
                          .map((reg) => (
                            <div
                              key={reg.id}
                              className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/team"
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left side - Team info */}
                                <div
                                  className="flex items-center gap-3 flex-1 cursor-pointer"
                                  onClick={() => {
                                    setSelectedTeam({ id: reg.id, team_name: reg.team_name });
                                    setShowTeamDetails(true);
                                  }}
                                >
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                                    {(reg.team_name || reg.player?.user?.username || '?')
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-lg leading-tight truncate hover:text-accent-blue transition-colors">
                                      {reg.team_name ||
                                        reg.player?.user?.username ||
                                        'Unknown Team'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                      <span className="truncate">
                                        👤 {reg.player?.user?.username || 'Unknown Player'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right side - Status and actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {reg.status === 'pending' ? (
                                    <>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await tournamentAPI.updateTeamStatus(
                                              tournament.id,
                                              reg.id,
                                              'confirmed'
                                            );
                                            showToast('Team confirmed!');
                                            fetchTournamentData();
                                          } catch (error) {
                                            showToast('Failed to confirm team');
                                            console.error(error);
                                          }
                                        }}
                                        className="px-4 py-2 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-all shadow-sm"
                                      >
                                        ✓ Confirm
                                      </button>
                                      <button
                                        onClick={async () => {
                                          setConfirmModal({
                                            isOpen: true,
                                            title: 'Reject Team',
                                            message: `Are you sure you want to reject ${reg.team_name || reg.player?.user?.username}?`,
                                            confirmText: 'Reject Team',
                                            type: 'danger',
                                            onConfirm: async () => {
                                              try {
                                                await tournamentAPI.updateTeamStatus(
                                                  tournament.id,
                                                  reg.id,
                                                  'rejected'
                                                );
                                                showToast('Team rejected');
                                                fetchTournamentData();
                                              } catch (error) {
                                                showToast('Failed to reject team', 'error');
                                                console.error(error);
                                              }
                                            },
                                          });
                                        }}
                                        className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-semibold hover:bg-danger/90 transition-all shadow-sm"
                                      >
                                        ✕ Reject
                                      </button>
                                    </>
                                  ) : (
                                    <div className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-success/20 text-success border border-success/20">
                                      ✓ Confirmed
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )
                ) : // Rejected Teams Tab
                registrations.filter((reg) => reg.status === 'rejected').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No rejected teams.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {registrations
                      .filter((reg) => reg.status === 'rejected')
                      .map((reg) => (
                        <div
                          key={reg.id}
                          className="bg-dark-bg-primary p-4 rounded-xl border border-danger/30 hover:border-danger/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left side - Team info */}
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                                {(reg.team_name || reg.player?.user?.username || '?')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-lg leading-tight truncate">
                                  {reg.team_name || reg.player?.user?.username || 'Unknown Team'}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                  <span className="truncate">
                                    👤 {reg.player?.user?.username || 'Unknown Player'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right side - Re-confirm button */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={async () => {
                                  try {
                                    await tournamentAPI.updateTeamStatus(
                                      tournament.id,
                                      reg.id,
                                      'confirmed'
                                    );
                                    showToast('Team re-confirmed!');
                                    fetchTournamentData();
                                  } catch (error) {
                                    const errorMsg =
                                      error.response?.data?.error || 'Failed to re-confirm team';
                                    showToast(errorMsg);
                                    console.error(error);
                                  }
                                }}
                                className="px-4 py-2 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-all shadow-sm"
                              >
                                ↻ Re-confirm
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-dark-bg-hover bg-dark-bg-primary/50 rounded-b-2xl flex justify-end">
                <button
                  onClick={() => setShowTeamsModal(false)}
                  className="px-6 py-2 bg-dark-bg-hover text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        />

        <TeamPlayersModal
          isOpen={showTeamDetails}
          onClose={() => {
            setShowTeamDetails(false);
            setSelectedTeam(null);
          }}
          team={selectedTeam}
          tournamentId={id}
        />

        <RoundNamesModal
          isOpen={showRoundNamesModal}
          onClose={() => setShowRoundNamesModal(false)}
          numRounds={parseInt(tournament.rounds?.length) || 1}
          roundNames={roundNames}
          onSave={handleSaveRoundNames}
        />
      </div>
    </div>
  );
};

export default ManageScrim;
