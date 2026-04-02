import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Eye,
  BarChart3,
  Settings,
  Download,
  Users,
  Info,
  Trophy,
  Play,
  Square,
  Copy,
  EyeOff,
  CheckCircle2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import ScrimConfigModal from '../ui/ScrimConfigModal';
import ScrimResultsModal from '../ui/ScrimResultsModal';
import MatchConfigModal from '../../tournaments/ui/MatchConfigModal';
import MatchPointsModal from '../../tournaments/ui/MatchPointsModal';
import EliminatedTeamsModal from '../../tournaments/ui/EliminatedTeamsModal';
import ScrimPointsTableModal from '../../tournaments/ui/ScrimPointsTableModal';
import CountdownTimer from '../../../components/CountdownTimer';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import TeamPlayersModal from '../../tournaments/ui/TeamPlayersModal';
import RoundNamesModal from '../../tournaments/ui/RoundNamesModal';
import '../../../features/tournaments/routes/ManageTournament.css';

const ManageScrim = ({ inlineId, onBack } = {}) => {
  const params = useParams();
  const id = inlineId || params.id;
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
  const [matchPointsReadOnly, setMatchPointsReadOnly] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [showEliminatedModal, setShowEliminatedModal] = useState(false);
  const [eliminatedData, setEliminatedData] = useState(null);
  const [showScrimResults, setShowScrimResults] = useState(false);
  const [scrimResultsData, setScrimResultsData] = useState([]);
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [showOverviewDialog, setShowOverviewDialog] = useState(false);
  const [showPasswordVisible, setShowPasswordVisible] = useState({});
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

  const handleBeginMatch = async (match) => {
    try {
      setLoading(true);
      const currentGroupId = (selectedGroup || roundGroups[0])?.id;
      await tournamentAPI.startMatch(id, currentGroupId, {
        match_id: match.match_id,
        match_password: match.match_password,
      });
      showToast('Match started successfully!');
      const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
      const newGroups = updatedGroups.data.groups || [];
      setRoundGroups(newGroups);
      const updatedGroup = newGroups.find((g) => g.id === currentGroupId);
      if (updatedGroup) setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error starting match:', error);
      showToast('Failed to start match', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMatchConfig = async (matchConfigData) => {
    try {
      setLoading(true);
      const currentGroupId = (selectedGroup || roundGroups[0])?.id;
      await tournamentAPI.startMatch(id, currentGroupId, matchConfigData);
      setShowMatchConfigModal(false);
      setCurrentMatch(null);
      showToast('Match started successfully!');
      // Refresh groups
      const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
      const newGroups = updatedGroups.data.groups || [];
      setRoundGroups(newGroups);
      const updatedGroup = newGroups.find((g) => g.id === currentGroupId);
      if (updatedGroup) setSelectedGroup(updatedGroup);
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
          const currentGroupId = (selectedGroup || roundGroups[0])?.id;
          await tournamentAPI.endMatch(id, match.id);
          showToast('Match ended successfully!');
          const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
          const newGroups = updatedGroups.data.groups || [];
          setRoundGroups(newGroups);
          const updatedGroup = newGroups.find((g) => g.id === currentGroupId);
          if (updatedGroup) setSelectedGroup(updatedGroup);
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
    setMatchPointsReadOnly(false);
    setShowMatchPointsModal(true);
  };

  const handleViewPoints = (match) => {
    setCurrentMatch(match);
    setMatchPointsReadOnly(true);
    setShowMatchPointsModal(true);
  };

  const handleSubmitPoints = async (pointsData) => {
    try {
      setLoading(true);
      const currentGroupId = (selectedGroup || roundGroups[0])?.id;
      await tournamentAPI.submitMatchScores(id, currentMatch.id, pointsData);
      setShowMatchPointsModal(false);
      setCurrentMatch(null);
      showToast('Points submitted successfully!');
      const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
      const newGroups = updatedGroups.data.groups || [];
      setRoundGroups(newGroups);
      const updatedGroup = newGroups.find((g) => g.id === currentGroupId);
      if (updatedGroup) setSelectedGroup(updatedGroup);
      // Auto-advance to next incomplete match
      const nextMatchIdx = newGroups[0]?.matches?.findIndex(
        (m) => m.status !== 'completed' && m.status !== 'ongoing'
      );
      if (nextMatchIdx !== undefined && nextMatchIdx >= 0) setLastSelectedMatch(nextMatchIdx + 1);
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
        // Final round completed - show results modal
        await fetchTournamentData();
        setScrimResultsData(data.results || []);
        setShowScrimResults(true);
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

  const handleExportCSV = async () => {
    try {
      showToast('Exporting scrim registrations...');
      const response = await tournamentAPI.exportTournamentRegistrationsCSV(id);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tournament.title}-registrations.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Export successful!', 'success');
    } catch (error) {
      showToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-transparent manage-tournament-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <button
          onClick={() => (onBack ? onBack() : navigate('/host/dashboard'))}
          className="mt-back-btn mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mt-header">
          <div className="mt-header-top">
            <div className="mt-title-group">
              <h1 className="mt-title">{tournament.title}</h1>
              <p className="mt-subtitle">Scrim Management</p>
            </div>
            {tournament.status === 'ongoing' && (
              <span className="mt-round-badge">
                <Zap className="h-3 w-3" />
                Live
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-actions-bar">
            <button onClick={() => navigate(`/scrims/${id}`)} className="mt-action-btn">
              <Eye className="h-3.5 w-3.5" /> View Details
            </button>
            <button onClick={() => setShowOverviewDialog(true)} className="mt-action-btn">
              <Info className="h-3.5 w-3.5" /> Overview
            </button>
            {(tournament.status === 'ongoing' || tournament.status === 'completed') && (
              <button
                onClick={() => setShowPointsTable(true)}
                className="mt-action-btn mt-action-btn-purple"
              >
                <BarChart3 className="h-3.5 w-3.5" /> Points Table
              </button>
            )}
            <button
              onClick={handleEditToggle}
              disabled={tournament.status !== 'upcoming' && !isEditing}
              className={`mt-action-btn ${isEditing ? 'active' : ''}`}
            >
              <Settings className="h-3.5 w-3.5" />
              {isEditing ? 'Cancel Edit' : tournament.status === 'upcoming' ? 'Edit' : 'View'}
            </button>
            <button onClick={handleExportCSV} className="mt-action-btn">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="w-full mx-auto space-y-4">
          {/* Edit/View Scrim Section */}
          {isEditing && (
            <div className="mt-cyber-card p-4 sm:p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                    {tournament.status === 'upcoming' ? 'Edit Scrim' : 'Scrim Details'}
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {tournament.status === 'upcoming'
                      ? 'Update the core details of your scrim'
                      : 'View scrim information (editing locked after start)'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                      Scrim Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={editData.title}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      className="w-full px-3 py-2.5 bg-[hsl(var(--card)/0.5)] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      rows={6}
                      className="w-full px-3 py-2.5 bg-[hsl(var(--card)/0.5)] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Detailed description..."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                      Rules & Guidelines
                    </label>
                    <textarea
                      name="rules"
                      value={editData.rules}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      rows={12}
                      className="w-full px-3 py-2.5 bg-[hsl(var(--card)/0.5)] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] font-mono text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Rules & guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {tournament.status === 'upcoming' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[hsl(var(--border)/0.2)]">
                  <button
                    onClick={handleSaveChanges}
                    className="flex-1 px-5 py-2.5 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.9)] text-[hsl(var(--accent-foreground))] rounded-lg text-sm font-semibold transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex-1 px-5 py-2.5 bg-[hsl(var(--secondary)/0.5)] hover:bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--foreground))] rounded-lg text-sm font-medium border border-[hsl(var(--border)/0.3)] transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main content card */}
          <div className="mt-cyber-card p-4 sm:p-6 mb-4">
            {/* upcoming: start scrim */}
            {tournament.status === 'upcoming' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--accent)/0.15)] flex items-center justify-center mx-auto mb-5 border border-[hsl(var(--accent)/0.2)]">
                  <Settings className="h-8 w-8 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
                  {getEventLabel()} Ready
                </h2>
                {new Date() < new Date(tournament.tournament_start) && (
                  <p className="text-[hsl(var(--muted-foreground))] text-sm mb-1">
                    Unlocks at {new Date(tournament.tournament_start).toLocaleString()}
                  </p>
                )}
                <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6">
                  {tournament.current_participants}/{tournament.max_participants} teams registered
                </p>
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(142_76%_36%)] hover:bg-[hsl(142_76%_30%)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  {new Date() < new Date(tournament.tournament_start)
                    ? 'Locked'
                    : `Start ${getEventLabel()}`}
                </button>
              </div>
            )}

            {/* completed: victory / standings */}
            {tournament.status === 'completed' && (
              <div className="space-y-4">
                {/* Victory Header */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[hsl(var(--accent)/0.08)] border border-[hsl(var(--accent)/0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--accent)/0.15)] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-[hsl(var(--accent))]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                        {getEventLabel()} Concluded
                      </h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {finalStandings?.results?.length || 0} teams in final standings
                      </p>
                    </div>
                  </div>
                  {finalStandings?.results?.length > 0 && (
                    <button
                      onClick={() => {
                        setScrimResultsData(finalStandings.results);
                        setShowScrimResults(true);
                      }}
                      style={{ backgroundColor: '#ffffff', color: '#111111' }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm"
                    >
                      <Trophy className="h-4 w-4" />
                      View Full Results
                    </button>
                  )}
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

            {/* ongoing: Lovable-style match management */}
            {tournament.status === 'ongoing' &&
              (() => {
                // Scrims use 1 group — get matches from first group
                const scrimGroup = roundGroups[0] || null;
                const scrimMatches = scrimGroup?.matches || [];
                const completedCount = scrimMatches.filter((m) => m.status === 'completed').length;
                const totalCount = scrimMatches.length;
                const progressPct =
                  totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const activeMatch = scrimMatches[lastSelectedMatch - 1] || scrimMatches[0] || null;
                const allMatchesDone =
                  totalCount > 0 && scrimMatches.every((m) => m.status === 'completed');

                return (
                  <div className="space-y-4">
                    {/* Loading */}
                    {groupsLoading && roundGroups.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-[hsl(var(--accent))] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-[hsl(var(--muted-foreground))] text-sm">
                          Loading match data...
                        </p>
                      </div>
                    )}

                    {/* Not configured yet */}
                    {!groupsLoading && roundGroups.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-[hsl(var(--accent)/0.15)] flex items-center justify-center mx-auto mb-5 border border-[hsl(var(--accent)/0.2)]">
                          <Settings className="h-8 w-8 text-[hsl(var(--accent))]" />
                        </div>
                        <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
                          Ready to Configure
                        </h2>
                        <p className="text-[hsl(var(--muted-foreground))] mb-6 text-sm">
                          Set up match groups to begin the scrim
                        </p>
                        <button
                          onClick={() => setShowRoundConfigModal(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.9)] text-[hsl(var(--accent-foreground))] rounded-lg font-bold text-sm transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Configure Matches
                        </button>
                      </div>
                    )}

                    {roundGroups.length > 0 && (
                      <>
                        {groupsLoading && (
                          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] justify-end">
                            <div className="w-1.5 h-1.5 bg-[hsl(var(--accent))] rounded-full animate-pulse"></div>
                            Refreshing...
                          </div>
                        )}

                        {/* Progress bar */}
                        <div className="p-4 rounded-xl bg-[hsl(var(--secondary)/0.2)] border border-[hsl(var(--border)/0.2)]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">
                              Scrim Progress
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setShowRoundConfigModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[hsl(var(--border)/0.4)] bg-[hsl(var(--secondary)/0.4)] hover:bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-xs font-medium transition-colors"
                              >
                                <Settings className="h-3 w-3" />
                                Reconfigure
                              </button>
                              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                {completedCount}/{totalCount} Matches
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-[hsl(var(--secondary)/0.5)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--primary))] rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Match tabs grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {scrimMatches.map((match, idx) => {
                            const isActive = lastSelectedMatch === idx + 1;
                            const isDone = match.status === 'completed';
                            const isLive = match.status === 'ongoing';
                            const isEnded = match.status === 'ended';
                            return (
                              <div
                                key={match.id}
                                onClick={() => {
                                  setLastSelectedMatch(idx + 1);
                                  setSelectedGroup(scrimGroup);
                                }}
                                className={`cursor-pointer rounded-xl p-4 text-center border transition-all ${
                                  isActive
                                    ? 'border-[hsl(var(--accent)/0.6)] bg-[hsl(var(--accent)/0.1)]'
                                    : isDone
                                      ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
                                      : isLive
                                        ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                                        : 'border-[hsl(var(--border)/0.3)] bg-[hsl(var(--secondary)/0.15)] hover:border-[hsl(var(--accent)/0.4)]'
                                }`}
                              >
                                <div className="text-base font-bold text-[hsl(var(--foreground))] mb-1">
                                  Match {idx + 1}
                                </div>
                                <div
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block border ${
                                    isDone
                                      ? 'text-green-400 border-green-500/40 bg-green-500/10'
                                      : isLive
                                        ? 'text-red-400 border-red-500/40 bg-red-500/10 animate-pulse'
                                        : isEnded
                                          ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10'
                                          : 'text-[hsl(var(--muted-foreground))] border-[hsl(var(--border)/0.3)]'
                                  }`}
                                >
                                  {isDone
                                    ? 'Completed'
                                    : isLive
                                      ? 'LIVE'
                                      : isEnded
                                        ? 'Awaiting Points'
                                        : 'Pending'}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Active match card */}
                        {activeMatch && (
                          <div className="mt-cyber-card p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-[hsl(var(--accent))]" />
                                <span className="font-bold text-[hsl(var(--foreground))] text-base">
                                  Match {activeMatch.match_number}
                                </span>
                              </div>
                              {activeMatch.status === 'ongoing' && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                                  LIVE
                                </span>
                              )}
                            </div>

                            {/* Credentials display */}
                            {(activeMatch.match_id || activeMatch.match_password) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[hsl(var(--secondary)/0.2)] rounded-lg mb-4">
                                <div>
                                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide mb-1.5">
                                    Match ID
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-[hsl(var(--card)/0.6)] border border-[hsl(var(--border)/0.3)] rounded text-sm font-mono text-[hsl(var(--foreground))]">
                                      {activeMatch.match_id || 'Not set'}
                                    </code>
                                    {activeMatch.match_id && (
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(activeMatch.match_id);
                                          showToast('Match ID copied!', 'success');
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[hsl(var(--border)/0.3)] bg-[hsl(var(--secondary)/0.4)] hover:bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide mb-1.5">
                                    Password
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-[hsl(var(--card)/0.6)] border border-[hsl(var(--border)/0.3)] rounded text-sm font-mono text-[hsl(var(--foreground))]">
                                      {showPasswordVisible[activeMatch.id]
                                        ? activeMatch.match_password || 'Not set'
                                        : activeMatch.match_password
                                          ? '••••••'
                                          : 'Not set'}
                                    </code>
                                    {activeMatch.match_password && (
                                      <>
                                        <button
                                          onClick={() =>
                                            setShowPasswordVisible((prev) => ({
                                              ...prev,
                                              [activeMatch.id]: !prev[activeMatch.id],
                                            }))
                                          }
                                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[hsl(var(--border)/0.3)] bg-[hsl(var(--secondary)/0.4)] hover:bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                        >
                                          {showPasswordVisible[activeMatch.id] ? (
                                            <EyeOff className="h-3.5 w-3.5" />
                                          ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              activeMatch.match_password
                                            );
                                            showToast('Password copied!', 'success');
                                          }}
                                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[hsl(var(--border)/0.3)] bg-[hsl(var(--secondary)/0.4)] hover:bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action buttons by status */}
                            <div className="flex flex-wrap gap-3">
                              {activeMatch.status === 'waiting' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedGroup(scrimGroup);
                                      handleStartMatch(activeMatch);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[hsl(var(--border)/0.4)] bg-[hsl(var(--secondary)/0.4)] hover:bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--foreground))] text-sm font-medium transition-colors"
                                  >
                                    <Settings className="h-4 w-4" />
                                    Set Match ID &amp; Password
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedGroup(scrimGroup);
                                      handleBeginMatch(activeMatch);
                                    }}
                                    disabled={!activeMatch.match_id || !activeMatch.match_password}
                                    style={{ backgroundColor: '#ffffff', color: '#111111' }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                                  >
                                    <Play className="h-4 w-4" />
                                    Start Match
                                  </button>
                                </>
                              )}
                              {activeMatch.status === 'ongoing' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedGroup(scrimGroup);
                                      handleStartMatch(activeMatch);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[hsl(var(--border)/0.4)] bg-[hsl(var(--secondary)/0.4)] hover:bg-[hsl(var(--secondary)/0.7)] text-[hsl(var(--foreground))] text-sm font-medium transition-colors"
                                  >
                                    <Settings className="h-4 w-4" />
                                    Update Credentials
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedGroup(scrimGroup);
                                      handleEndMatch(activeMatch);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                                  >
                                    <Square className="h-4 w-4" />
                                    End Match
                                  </button>
                                </>
                              )}
                              {activeMatch.status === 'ended' && (
                                <button
                                  onClick={() => {
                                    setSelectedGroup(scrimGroup);
                                    handleEnterPoints(activeMatch);
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold transition-colors"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                  Enter Points Table
                                </button>
                              )}
                              {activeMatch.status === 'completed' && (
                                <button
                                  onClick={() => {
                                    setSelectedGroup(scrimGroup);
                                    handleViewPoints(activeMatch);
                                  }}
                                  style={{ backgroundColor: '#ffffff', color: '#111111' }}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                  View Points
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Scrim Completed card */}
                        {allMatchesDone && (
                          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
                              Scrim Completed!
                            </h3>
                            <p className="text-[hsl(var(--muted-foreground))] text-sm mb-5">
                              All {totalCount} matches have been completed successfully.
                            </p>
                            <button
                              onClick={handleAdvanceRound}
                              style={{ backgroundColor: '#ffffff', color: '#111111' }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors hover:opacity-90"
                            >
                              <BarChart3 className="h-4 w-4" />
                              View Scrim Results
                            </button>
                          </div>
                        )}

                        {/* Participating Teams */}
                        {scrimGroup && (
                          <div className="mt-cyber-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <Users className="h-5 w-5 text-[hsl(var(--accent))]" />
                              <span className="font-bold text-[hsl(var(--foreground))] text-base">
                                Participating Teams ({scrimGroup.teams?.length || 0})
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                              {(scrimGroup.teams || []).map((team, i) => (
                                <div
                                  key={team.id || i}
                                  onClick={() => handleTeamClick(team)}
                                  className="px-3 py-2 bg-[hsl(var(--secondary)/0.3)] hover:bg-[hsl(var(--secondary)/0.5)] rounded-lg text-sm text-center truncate border border-[hsl(var(--border)/0.3)] cursor-pointer transition-colors text-[hsl(var(--foreground))]"
                                >
                                  {team.team_name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
          </div>
        </div>

        {/* Scrim Config Modal */}

        <ScrimConfigModal
          isOpen={showRoundConfigModal}
          onClose={() => setShowRoundConfigModal(false)}
          onSubmit={handleSubmitRoundConfig}
          totalTeams={registrations.filter((r) => r.status === 'confirmed').length}
          teams={registrations.filter((r) => r.status === 'confirmed')}
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
          onClose={() => {
            setShowMatchPointsModal(false);
            setMatchPointsReadOnly(false);
          }}
          onSubmit={handleSubmitPoints}
          match={currentMatch}
          teams={selectedGroup?.teams || []}
          readOnly={matchPointsReadOnly}
        />

        {/* Eliminated Teams Modal */}
        <EliminatedTeamsModal
          isOpen={showEliminatedModal}
          onClose={() => setShowEliminatedModal(false)}
          onProceed={handleProceedToNextRound}
          roundData={eliminatedData}
        />

        {/* Scrim Final Results Modal */}
        <ScrimResultsModal
          isOpen={showScrimResults}
          onClose={() => setShowScrimResults(false)}
          results={scrimResultsData}
          scrimName={tournament?.title || 'Scrim'}
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

        {/* Overview Dialog */}
        {showOverviewDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="mt-cyber-card w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b border-[hsl(var(--border)/0.2)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent)/0.15)] flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[hsl(var(--foreground))] text-base">
                      Scrim Overview
                    </h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {tournament.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOverviewDialog(false)}
                  className="w-8 h-8 rounded-lg bg-[hsl(var(--secondary)/0.5)] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.8)] transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 space-y-5">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      tournament.status === 'ongoing'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                        : tournament.status === 'completed'
                          ? 'bg-[hsl(var(--muted)/0.3)] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border)/0.3)]'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${tournament.status === 'ongoing' ? 'bg-green-400 animate-pulse' : tournament.status === 'completed' ? 'bg-gray-400' : 'bg-blue-400'}`}
                    ></span>
                    {tournament.status === 'ongoing'
                      ? 'LIVE'
                      : tournament.status === 'completed'
                        ? 'COMPLETED'
                        : 'UPCOMING'}
                  </span>
                </div>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Prize Pool',
                      value:
                        tournament.prize_pool > 0
                          ? `₹${tournament.prize_pool?.toLocaleString()}`
                          : 'No Prize',
                      icon: <DollarSign className="h-3.5 w-3.5" />,
                    },
                    {
                      label: 'Teams',
                      value: `${tournament.current_participants}/${tournament.max_participants}`,
                      icon: <Users className="h-3.5 w-3.5" />,
                    },
                    {
                      label: 'Entry Fee',
                      value: tournament.entry_fee > 0 ? `₹${tournament.entry_fee}` : 'Free',
                      icon: <DollarSign className="h-3.5 w-3.5" />,
                    },
                    {
                      label: 'Game',
                      value: tournament.game || '—',
                      icon: <Layers className="h-3.5 w-3.5" />,
                    },
                    {
                      label: 'Format',
                      value: tournament.game_mode || '—',
                      icon: <Zap className="h-3.5 w-3.5" />,
                    },
                    {
                      label: 'Start',
                      value: tournament.tournament_start
                        ? new Date(tournament.tournament_start).toLocaleDateString()
                        : '—',
                      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                    },
                  ].map((stat, i) => (
                    <div key={i} className="mt-stat-tile">
                      <div className="flex items-center gap-1.5 mb-1 text-[hsl(var(--muted-foreground))]">
                        {stat.icon}
                        <span className="text-[10px] font-medium uppercase tracking-wide">
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Countdown */}
                {tournament.status !== 'completed' && (
                  <div className="p-3 rounded-lg bg-[hsl(var(--secondary)/0.3)] border border-[hsl(var(--border)/0.2)]">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide mb-1">
                      {tournament.status === 'ongoing' ? 'Scrim in Progress' : 'Starts In'}
                    </p>
                    {tournament.status === 'upcoming' ? (
                      <CountdownTimer targetDate={tournament.tournament_start} />
                    ) : (
                      <p className="text-sm font-semibold text-green-400">
                        Scrim is currently live
                      </p>
                    )}
                  </div>
                )}

                {/* Registered Teams */}
                <div>
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
                    Registered Teams ({registrations.filter((r) => r.status === 'confirmed').length}
                    )
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {registrations
                      .filter((r) => r.status === 'confirmed')
                      .map((reg, i) => (
                        <div
                          key={reg.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[hsl(var(--secondary)/0.3)] border border-[hsl(var(--border)/0.2)]"
                        >
                          <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent)/0.15)] flex items-center justify-center text-[9px] font-bold text-[hsl(var(--accent))] shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-xs text-[hsl(var(--foreground))] truncate">
                            {reg.team_name || reg.player?.user?.username}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
