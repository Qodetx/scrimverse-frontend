import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import RoundConfigModal from '../components/RoundConfigModal';
import GroupManagementView from '../components/GroupManagementView';
import MatchConfigModal from '../components/MatchConfigModal';
import MatchPointsModal from '../components/MatchPointsModal';
import EliminatedTeamsModal from '../components/EliminatedTeamsModal';
import PointsTableModal from '../components/PointsTableModal';
import BulkScheduleModal from '../components/BulkScheduleModal';
import CountdownTimer from '../components/CountdownTimer';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import TeamPlayersModal from '../components/TeamPlayersModal';
import RoundNamesModal from '../components/RoundNamesModal';
import './ManageTournament.css';

const ManageTournament = () => {
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
    rounds: 0,
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
  const [showBulkSchedule, setShowBulkSchedule] = useState(false);
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

  const getRoundStatus = useCallback(
    (roundNum) => {
      return tournament?.round_status?.[String(roundNum)] || 'upcoming';
    },
    [tournament?.round_status]
  );

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

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Hardcoded for Tournament
  const getEventLabel = () => 'Tournament';
  const getEventLabelLower = () => 'tournament';

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
        rounds: response.data.tournament.rounds?.length || 1,
      });

      // Parse round_names if it's a string, otherwise use as is
      const initialRoundNames =
        typeof response.data.tournament.round_names === 'string'
          ? JSON.parse(response.data.tournament.round_names)
          : response.data.tournament.round_names || {};
      setRoundNames(initialRoundNames);

      // Load selected teams for current round
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
      showToast(`Failed to load tournament data`, 'error');
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
        rounds: tournament.rounds?.length || 1,
      });
      setBannerPreview(tournament.banner_image || null);
      setRoundNames(tournament.round_names || {});
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

      // Add rounds data (number of rounds)
      if (editData.rounds && editData.rounds !== tournament.rounds?.length) {
        // Generate rounds structure based on number of rounds
        const roundsData = Array.from({ length: editData.rounds }, (_, i) => ({
          round: i + 1,
          ...(i === 0
            ? { max_teams: parseInt(tournament.max_participants) || 0 }
            : { qualifying_teams: 1 }),
        }));
        formData.append('rounds', JSON.stringify(roundsData));
      }

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

  const handleStartRound = async (roundNumber) => {
    // New system - show configuration modal
    let totalTeams = 0;
    if (roundNumber === 1) {
      totalTeams = registrations.filter((r) => r.status === 'confirmed').length;
    } else {
      const prevRoundKey = String(roundNumber - 1);
      totalTeams = tournament.selected_teams?.[prevRoundKey]?.length || 0;
    }

    if (totalTeams === 0) {
      showToast('No teams available for this round');
      return;
    }

    setCurrentRound(roundNumber);
    setShowRoundConfigModal(true);
  };
  const handleEndTournament = async () => {
    const allRoundsDone = allRoundsCompleted();
    const confirmMessage = allRoundsDone
      ? 'End tournament? This will mark it as completed and cannot be undone.'
      : 'End tournament early? Not all rounds are completed. This will mark it as completed and cannot be undone.';

    setConfirmModal({
      isOpen: true,
      title: `End ${getEventLabel()}`,
      message: confirmMessage,
      confirmText: `End ${getEventLabel()}`,
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true);
          const response = await tournamentAPI.endTournament(id);
          showToast(response.data.message || `${getEventLabel()} ended successfully!`);
          fetchTournamentData();
        } catch (error) {
          console.error('Error ending tournament:', error);
          showToast(
            error.response?.data?.error || `Failed to end ${getEventLabelLower()}`,
            'error'
          );
        } finally {
          setLoading(false);
        }
      },
    });
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

  // ===== Groups and Matches Handlers =====

  const handleSubmitRoundConfig = async (configData) => {
    try {
      setLoading(true);
      // Request backend to configure/create groups for the round
      await tournamentAPI.configureRound(id, currentRound, configData);
      setShowRoundConfigModal(false);
      showToast('Round configured successfully!');

      // Fetch groups — backend may take a short moment to persist/create them.
      // Poll a few times so the UI updates immediately without requiring a manual refresh.
      const maxAttempts = 8;
      let attempts = 0;
      let groups = [];
      while (attempts < maxAttempts) {
        // Attempt to fetch groups for the current round
        try {
          const resp = await tournamentAPI.getRoundGroups(id, currentRound);
          groups = resp.data.groups || [];
          if (groups.length > 0) break;
        } catch (e) {
          // swallow transient errors and retry
          console.warn('Transient fetchRoundGroups error, retrying...', e?.message || e);
        }

        // wait 750ms before retrying
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, 750));
        attempts += 1;
      }

      // Update UI state with whatever we got (possibly empty if nothing created)
      setRoundGroups(groups);
      // Also refresh the full tournament object to update counts/status
      await fetchTournamentData();
    } catch (error) {
      console.error('Error configuring round:', error);
      showToast(error.response?.data?.error || 'Failed to configure round', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
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
      const roundStatus = getRoundStatus(currentRound);
      // Only fetch groups if the round has been started (ongoing or completed)
      if (roundStatus === 'ongoing' || roundStatus === 'completed') {
        fetchRoundGroups(currentRound);
      } else {
        // Clear groups for uninitialized rounds
        setRoundGroups([]);
        setSelectedGroup(null);
      }
    }
  }, [currentRound, tournament?.use_groups_system, getRoundStatus, fetchRoundGroups]);

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
    <div className="min-h-screen bg-transparent py-14 manage-tournament-container relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-purple/5 blur-[150px] -mr-96 -mt-96 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-blue/5 blur-[120px] -ml-72 -mb-72 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Ultra-Premium Command Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-20 gap-10">
          <div className="flex items-center gap-8 group">
            <button
              onClick={() => navigate('/host/dashboard')}
              className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-[#0f0f11] border border-white/5 hover:border-accent-purple/50 transition-all duration-500 overflow-hidden"
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
                  Manage Tournament
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse"></div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent shimmer-text">
                {tournament.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center w-full xl:w-auto">
            <div className="header-tab-bar flex items-center bg-[#0a0a0c] border border-white/5 rounded-2xl p-1.5 gap-1 w-full xl:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => setShowPointsTable(true)}
                className="header-tab flex-1 xl:flex-none px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Points Table</span>
              </button>

              <button
                onClick={() => setShowBulkSchedule(true)}
                className="header-tab flex-1 xl:flex-none px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Bulk Schedule</span>
              </button>

              <button
                onClick={handleEditToggle}
                className={`header-tab flex-1 xl:flex-none px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2.5 active:scale-95 whitespace-nowrap ${
                  isEditing
                    ? 'text-red-500 bg-red-500/10'
                    : tournament.status === 'upcoming'
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-500 cursor-default'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>

        <div className="w-full mx-auto space-y-12 mb-20">
          {/* Edit/View Tournament Section */}
          {isEditing && (
            <div className="info-grid-card rounded-[2.5rem] p-6 border border-white/10 mb-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                    {tournament.status === 'upcoming' ? 'Modify Parameters' : 'Tournament Details'}
                  </h2>
                  <p className="text-gray-500 text-xs font-black">
                    {tournament.status === 'upcoming'
                      ? 'Update the core details of your tournament'
                      : 'View tournament information (editing locked after start)'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 ml-1">
                      Number of Rounds
                    </label>
                    <input
                      type="number"
                      name="rounds"
                      value={editData.rounds || tournament.rounds?.length || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setEditData({ ...editData, rounds: Math.max(1, Math.min(6, value)) });
                      }}
                      disabled={tournament.status !== 'upcoming'}
                      min="1"
                      max="6"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:outline-none focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    {tournament.status === 'upcoming' && editData.rounds > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowRoundNamesModal(true)}
                        className="mt-2 text-sm text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Round Names
                      </button>
                    )}
                    <p className="text-gray-600 text-[8px] mt-1.5 ml-1 font-black">
                      {tournament.status === 'upcoming'
                        ? 'Set between 1-6 rounds'
                        : 'Locked after tournament starts'}
                    </p>
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-medium focus:outline-none focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-mono text-sm focus:outline-none focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="flex-1 bg-accent-purple text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-accent-purple/90 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] shadow-2xl active:scale-95"
                    >
                      Confirm Evolution
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="flex-1 bg-white/5 text-gray-300 px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                    >
                      Discard Changes
                    </button>
                  </div>

                  <div className="mt-6 bg-accent-purple/10 rounded-2xl p-4 border border-accent-purple/20">
                    <div className="flex gap-3">
                      <div className="text-accent-purple text-lg">ℹ️</div>
                      <p className="text-gray-400 text-xs font-medium leading-relaxed">
                        <strong className="text-white font-black uppercase tracking-widest mr-2">
                          Core Lockdown:
                        </strong>{' '}
                        Some parameters like tournament structure, game mode, and participant
                        capacity are locked once the event is live to preserve competitive
                        integrity.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {tournament.status !== 'upcoming' && (
                <div className="mt-6 bg-accent-blue/10 rounded-2xl p-4 border border-accent-blue/20">
                  <div className="flex gap-3">
                    <div className="text-accent-blue text-lg">🔒</div>
                    <p className="text-gray-400 text-xs font-medium leading-relaxed">
                      <strong className="text-white font-black uppercase tracking-widest mr-2">
                        Tournament Locked:
                      </strong>{' '}
                      Editing is disabled once the tournament has started to maintain competitive
                      integrity and fairness for all participants.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tactical Tournament Details Section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-purple/20 via-transparent to-accent-blue/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-6 lg:p-8 overflow-hidden">
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
                  <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center text-accent-purple border border-accent-purple/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
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
                      Tournament Specs
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
                  <div className="flex-1 bg-[#121214] border border-white/5 rounded-2xl px-6 py-3 flex items-center justify-between gap-6 min-w-[280px] shadow-xl">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mb-0.5">
                        Time to Zero
                      </span>
                      <div className="font-mono text-xl font-black text-white tracking-wider leading-none">
                        <CountdownTimer targetDate={tournament.tournament_start} simple />
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0121 12z"
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
                    className={`relative flex flex-col p-4 rounded-2xl border ${item.border} ${item.bg} hover:border-white/20 transition-all duration-500 overflow-hidden group/item`}
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

          {/* Tournament Actions & Status Section - Only show when NOT ongoing */}
          {tournament.status !== 'ongoing' && (
            <div className="bg-dark-bg-card/30 rounded-2xl p-6 border border-white/5 mb-8 relative overflow-hidden group">
              <div className="absolute inset-0 shimmer-bg opacity-30"></div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                {/* Start Tournament Button - Only show when status is upcoming */}
                {tournament.status === 'upcoming' && (
                  <>
                    <div>
                      <h2 className="text-2xl font-black text-white mb-1 tracking-tight leading-none">
                        Launch Tournament
                      </h2>
                      <p className="text-gray-400 text-xs font-black">
                        {new Date() < new Date(tournament.tournament_start)
                          ? `Locked until ${new Date(tournament.tournament_start).toLocaleString()}`
                          : 'Initialize the competition and begin registration processing.'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Starting tournament...', tournament.id);
                          console.log('Tournament start time:', tournament.tournament_start);
                          console.log('Current client time:', new Date().toISOString());
                          await tournamentAPI.startTournament(tournament.id);
                          showToast('Tournament started successfully!');
                          fetchTournamentData();
                        } catch (error) {
                          console.error('Error starting tournament:', error);
                          console.error('Error response:', error.response?.data);
                          const errorMsg =
                            error.response?.data?.error ||
                            error.response?.data?.message ||
                            'Failed to start tournament';
                          showToast(errorMsg, 'error');
                          // Show alert with full error for debugging
                          alert(`Error: ${errorMsg}\n\nCheck console for details.`);
                        }
                      }}
                      disabled={new Date() < new Date(tournament.tournament_start)}
                      title={
                        new Date() < new Date(tournament.tournament_start)
                          ? `Locked until ${new Date(tournament.tournament_start).toLocaleString()}`
                          : 'Launch Tournament'
                      }
                      className={`px-8 py-3 rounded-2xl font-black transition-all shadow-2xl flex items-center gap-3 group/btn text-sm ${
                        new Date() < new Date(tournament.tournament_start)
                          ? 'bg-white/10 text-gray-500 cursor-not-allowed opacity-50 grayscale'
                          : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      <span className="relative z-10">START TOURNAMENT</span>
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d={
                            new Date() < new Date(tournament.tournament_start)
                              ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                              : 'M13 7l5 5m0 0l-5 5m5-5H6'
                          }
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* If completed, show basic summary here too */}
                {tournament.status === 'completed' && (
                  <div className="flex items-center gap-4 bg-success/10 px-6 py-3 rounded-2xl border border-success/20">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-[10px] text-success font-black uppercase tracking-widest leading-none mb-1">
                        Status
                      </p>
                      <p className="text-white font-black uppercase text-sm">
                        Tournament Concluded
                      </p>
                    </div>
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
                          {finalStandings?.results?.length ||
                            finalStandings?.groups?.reduce(
                              (total, group) => total + (group.standings?.team_a ? 2 : 0),
                              0
                            ) ||
                            tournament.current_participants ||
                            0}{' '}
                          Teams
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Champion Podium - Horizontal Premium Cards */}
                  {((finalStandings?.results && finalStandings.results.length > 0) ||
                    finalStandings?.winner) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 1st Place - Champion */}
                      {(() => {
                        const champion = finalStandings?.winner || finalStandings.results?.[0];
                        return (
                          champion && (
                            <div
                              onClick={() => handleWinnerClick(champion)}
                              className="md:col-span-3 lg:col-span-1 relative group cursor-pointer"
                            >
                              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-gold/20 via-accent-gold/10 to-transparent border-2 border-accent-gold/40 p-6 hover:border-accent-gold/60 transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                                <div className="relative flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-gold to-yellow-600 flex items-center justify-center text-white font-black text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                    {champion.team_name?.charAt(0).toUpperCase()}
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
                                      {champion.team_name}
                                    </h4>
                                    <p className="text-accent-gold font-black text-lg">
                                      {champion.total_points || champion.match_wins || 0}{' '}
                                      <span className="text-xs opacity-60">
                                        {champion.match_wins !== undefined ? 'WINS' : 'PTS'}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        );
                      })()}

                      {/* 2nd Place - Only show for multi-team format */}
                      {finalStandings.results?.[1] && (
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

                      {/* 3rd Place - Only show for multi-team format */}
                      {finalStandings.results?.[2] && (
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

                  {/* Tournament Stats - Full Width */}
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
                      Tournament Stats
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
                          value:
                            finalStandings?.winner?.team_name ||
                            finalStandings?.results?.[0]?.team_name ||
                            'TBD',
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
          )}

          {tournament.status === 'ongoing' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {/* Premium Rounds Management */}
              <div
                className="cyber-card bg-[#0a0a0c] border border-white/5 p-6 lg:p-8 overflow-hidden mb-8"
                style={{ borderRadius: 0 }}
              >
                {/* Round Stepper */}
                <div className="round-stepper flex items-center justify-center mb-10 overflow-x-auto no-scrollbar px-4">
                  {tournament.rounds.map((round, index) => {
                    const roundNum = round.round;
                    const isActive = roundNum === currentRound;
                    const isCompleted = getRoundStatus(roundNum) === 'completed';
                    const isOngoing = getRoundStatus(roundNum) === 'ongoing';
                    const isFinal = index === tournament.rounds.length - 1;
                    const isLastItem = index === tournament.rounds.length - 1;

                    return (
                      <div key={roundNum} className="flex items-center">
                        {/* Step Circle + Label */}
                        <div
                          onClick={() => setCurrentRound(roundNum)}
                          className="flex flex-col items-center cursor-pointer group/step"
                        >
                          <div
                            className={`stepper-circle relative w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all duration-500 border-2 ${
                              isActive
                                ? 'bg-accent-purple border-accent-purple text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] scale-110'
                                : isCompleted
                                  ? 'bg-success/20 border-success text-success shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                  : isOngoing
                                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                    : 'bg-white/5 border-white/10 text-gray-500 group-hover/step:border-white/30 group-hover/step:text-gray-300'
                            }`}
                          >
                            {isCompleted ? (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              roundNum
                            )}
                            {isActive && (
                              <span className="absolute -inset-1 rounded-full border-2 border-accent-purple/30 animate-ping pointer-events-none"></span>
                            )}
                          </div>
                          <span
                            className={`mt-2 text-[9px] uppercase font-black tracking-[0.15em] whitespace-nowrap transition-colors duration-300 max-w-[80px] text-center truncate ${
                              isActive
                                ? 'text-accent-purple'
                                : isCompleted
                                  ? 'text-success/70'
                                  : 'text-gray-600'
                            }`}
                          >
                            {roundNames?.[String(roundNum)] ||
                              (isFinal ? 'Finals' : `Round ${roundNum}`)}
                          </span>
                        </div>

                        {/* Connecting Line */}
                        {!isLastItem && (
                          <div className="stepper-line w-12 sm:w-20 lg:w-28 h-0.5 mx-1 mt-[-20px] relative">
                            <div className="absolute inset-0 bg-white/5 rounded-full"></div>
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                                isCompleted
                                  ? 'bg-success w-full shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                                  : isActive
                                    ? 'bg-gradient-to-r from-accent-purple to-accent-purple/30 w-1/2'
                                    : 'w-0'
                              }`}
                            ></div>
                          </div>
                        )}
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

                          {/* Selected Group Management View */}
                          {selectedGroup && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                              <GroupManagementView
                                group={selectedGroup}
                                onStartMatch={handleStartMatch}
                                onEndMatch={handleEndMatch}
                                onEnterPoints={handleEnterPoints}
                                onTeamClick={handleTeamClick}
                                initialMatchIndex={lastSelectedMatch - 1}
                                onMatchIndexChange={(index) => setLastSelectedMatch(index + 1)}
                                roundNumber={currentRound}
                                qualifyingTeams={selectedGroup.qualifying_teams}
                                tournamentId={id}
                                is5v5Game={tournament?.is_5v5 || false}
                              />
                            </div>
                          )}

                          {/* Bottom Insight & Action Hub */}
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
                                    Force Qualified
                                  </p>
                                  <p className="text-2xl font-black text-white tracking-tighter">
                                    {roundGroups[0]?.qualifying_teams || 0}
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
                              const isFinalRound =
                                tournament.rounds.findIndex((r) => r.round === currentRound) ===
                                tournament.rounds.length - 1;

                              return (
                                <div
                                  className={`p-4 rounded-[3rem] border transition-all duration-1000 flex flex-col justify-between relative overflow-hidden ${
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
                                      className={`text-base font-black mb-4 ${allGroupsCompleted ? 'text-black' : 'text-gray-400'}`}
                                    >
                                      {allGroupsCompleted
                                        ? 'All Objectives Met'
                                        : 'Operation In Progress'}
                                    </h5>
                                  </div>

                                  <button
                                    onClick={handleAdvanceRound}
                                    disabled={!allGroupsCompleted}
                                    className={`w-full py-3 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 relative z-10 ${
                                      allGroupsCompleted
                                        ? 'bg-black text-white hover:scale-[1.03] active:scale-[0.98] shadow-2xl'
                                        : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                                    }`}
                                  >
                                    {isFinalRound
                                      ? '🏁 TERMINATE WAR'
                                      : `→ NEXT SECTOR: ${roundNames?.[String(currentRound + 1)] || `ROUND ${currentRound + 1}`}`}
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
      </div>

      {/* Round Config Modal */}
      {/* Round Config Modal */}

      <RoundConfigModal
        isOpen={showRoundConfigModal}
        onClose={() => setShowRoundConfigModal(false)}
        onSubmit={handleSubmitRoundConfig}
        roundNumber={currentRound}
        totalTeams={
          currentRound === 1
            ? registrations.filter((r) => r.status === 'confirmed').length
            : tournament.selected_teams?.[String(currentRound - 1)]?.length || 0
        }
        isFinalRound={currentRound === tournament.rounds?.length}
        tournament={tournament}
      />

      {/* Match Config Modal */}
      <MatchConfigModal
        isOpen={showMatchConfigModal}
        onClose={() => setShowMatchConfigModal(false)}
        onSubmit={handleSubmitMatchConfig}
        matchNumber={currentMatch?.match_number}
        groupName={selectedGroup?.group_name}
        is5v5Game={tournament?.is_5v5 || false}
        teamA={selectedGroup?.teams?.[0]}
        teamB={selectedGroup?.teams?.[1]}
      />

      {/* Match Points Modal */}
      <MatchPointsModal
        isOpen={showMatchPointsModal}
        onClose={() => setShowMatchPointsModal(false)}
        onSubmit={handleSubmitPoints}
        match={currentMatch}
        teams={selectedGroup?.teams || []}
        is5v5Game={tournament?.is_5v5 || false}
      />

      {/* Eliminated Teams Modal */}
      <EliminatedTeamsModal
        isOpen={showEliminatedModal}
        onClose={() => setShowEliminatedModal(false)}
        onProceed={handleProceedToNextRound}
        roundData={eliminatedData}
        tournament={tournament}
      />

      {/* Points Table Modal */}
      <PointsTableModal
        isOpen={showPointsTable}
        onClose={() => setShowPointsTable(false)}
        tournament={tournament}
        currentRound={currentRound}
        initialMatch={lastSelectedMatch}
        onMatchChange={setLastSelectedMatch}
      />

      {/* Bulk Schedule Modal */}
      <BulkScheduleModal
        isOpen={showBulkSchedule}
        onClose={() => setShowBulkSchedule(false)}
        tournament={tournament}
        onSuccess={() => {
          showToast('Matches scheduled successfully!', 'success');
          fetchRoundGroups(currentRound);
        }}
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
                    registrations.filter((r) => r.status === 'confirmed' || r.status === 'pending')
                      .length
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
                                  showToast(`Successfully validated ${pendingTeams.length} teams!`);
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
                            <div className="flex items-center justify-between gap-4">
                              {/* Left side - Team info */}
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="avatar-ring-container">
                                  <div className="avatar-ring"></div>
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-400 flex items-center justify-center text-black font-black text-lg shadow-lg relative z-10">
                                    {(reg.team_name || reg.player?.user?.username || '?')
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-white font-black text-base tracking-tight truncate leading-none mb-1">
                                    {reg.team_name ||
                                      reg.player?.user?.username ||
                                      'Unknown Identity'}
                                  </h3>
                                  <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-accent-blue rounded-full"></span>
                                    Lead: {reg.player?.user?.username || 'Redacted'}
                                  </p>
                                </div>
                              </div>

                              {/* Right side - Status and actions */}
                              <div className="flex items-center gap-2">
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
                                          showToast('contender validated');
                                          fetchTournamentData();
                                        } catch (error) {
                                          showToast('validation failed');
                                        }
                                      }}
                                      className="w-8 h-8 bg-success text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all font-bold shadow-lg shadow-success/20 text-sm"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={async () => {
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Reject contender',
                                          message: `Archive ${reg.team_name || reg.player?.user?.username}'s application?`,
                                          confirmText: 'ARCHIVE',
                                          type: 'danger',
                                          onConfirm: async () => {
                                            try {
                                              await tournamentAPI.updateTeamStatus(
                                                tournament.id,
                                                reg.id,
                                                'rejected'
                                              );
                                              showToast('contender archived');
                                              fetchTournamentData();
                                            } catch (error) {
                                              showToast('operation failed', 'error');
                                            }
                                          },
                                        });
                                      }}
                                      className="w-8 h-8 bg-danger text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all font-bold shadow-lg shadow-danger/20 text-sm"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <div className="px-4 py-1.5 rounded-2xl bg-success/10 border border-success/20 text-success font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_10px_#22c55e]"></span>
                                    Validated
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )
              ) : registrations.filter((reg) => reg.status === 'rejected').length === 0 ? (
                <div className="text-center py-20 opacity-30 grayscale">
                  <p className="font-black text-xs uppercase tracking-widest">
                    No archived applications
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {registrations
                    .filter((reg) => reg.status === 'rejected')
                    .map((reg) => (
                      <div
                        key={reg.id}
                        className="bg-white/5 p-6 rounded-3xl border border-danger/10 hover:border-danger/30 transition-all opacity-80"
                      >
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4 flex-1 min-w-0 grayscale">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-black text-lg">
                              {(reg.team_name || reg.player?.user?.username || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-gray-400 font-bold text-lg tracking-tight truncate leading-none mb-1">
                                {reg.team_name || reg.player?.user?.username || 'Unknown Content'}
                              </h3>
                              <p className="text-danger/40 text-[10px] font-black uppercase tracking-widest italic">
                                Archived Contender
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                await tournamentAPI.updateTeamStatus(
                                  tournament.id,
                                  reg.id,
                                  'confirmed'
                                );
                                showToast('record restored');
                                fetchTournamentData();
                              } catch (error) {
                                showToast('restore failed');
                              }
                            }}
                            className="px-6 py-2 bg-white/5 text-xs text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/10 border border-white/10 transition-all"
                          >
                            RESTORE
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-black/50 backdrop-blur-md flex justify-end items-center gap-6">
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mr-auto">
                Scrimverse Security Protocol v4.2
              </p>
              <button
                onClick={() => setShowTeamsModal(false)}
                className="px-10 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/90 active:scale-95 transition-all shadow-2xl"
              >
                Return to Command
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <TeamPlayersModal
        isOpen={showTeamDetails}
        onClose={() => {
          setShowTeamDetails(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
        tournamentId={id}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      <RoundNamesModal
        isOpen={showRoundNamesModal}
        onClose={() => setShowRoundNamesModal(false)}
        numRounds={parseInt(editData.rounds) || 0}
        roundNames={roundNames}
        onSave={handleSaveRoundNames}
      />
    </div>
  );
};

export default ManageTournament;
