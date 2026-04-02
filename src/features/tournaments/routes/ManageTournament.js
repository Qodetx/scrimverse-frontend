import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Eye,
  Calendar,
  Settings,
  Download,
  BarChart3,
  Video,
  Info,
  ExternalLink,
  Copy,
  DollarSign,
  Users,
  Layers,
  Swords,
  Trophy,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingDown,
  Play,
  Plus,
  X,
  RotateCcw,
} from 'lucide-react';
import { tournamentAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import RoundConfigModal from '../ui/RoundConfigModal';
import GroupConfirmModal from '../ui/GroupConfirmModal';
import Lobby5v5PreviewModal from '../ui/Lobby5v5PreviewModal';
import GroupManagementView from '../ui/GroupManagementView';
import MatchConfigModal from '../ui/MatchConfigModal';
import MatchPointsModal from '../ui/MatchPointsModal';
import EliminatedTeamsModal from '../ui/EliminatedTeamsModal';
import PointsTableModal from '../ui/PointsTableModal';
import BulkScheduleModal from '../ui/BulkScheduleModal';
import CountdownTimer from '../../../components/CountdownTimer';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import TeamPlayersModal from '../ui/TeamPlayersModal';
import RoundNamesModal from '../ui/RoundNamesModal';
import './ManageTournament.css';

// Compact inline countdown for the Start Tournament card
const StartCountdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = React.useState(null);

  React.useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (!timeLeft)
    return <p className="text-xs text-green-400 font-medium">Unlocked — ready to start!</p>;

  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-muted-foreground">Starts in</span>
      <div className="flex items-center gap-1 bg-accent/10 border border-accent/20 rounded-lg px-2.5 py-1">
        {timeLeft.d > 0 && (
          <>
            <span className="text-xs font-bold text-accent tabular-nums">{timeLeft.d}d</span>
            <span className="text-accent/40 text-xs mx-0.5">·</span>
          </>
        )}
        <span className="text-sm font-mono font-bold text-accent tabular-nums">
          {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
        </span>
      </div>
    </div>
  );
};

const ManageTournament = ({ inlineId, onBack, onStarted } = {}) => {
  const params = useParams();
  const id = inlineId || params.id;
  const navigate = useNavigate();
  const { isHost, loading: authLoading } = useContext(AuthContext);

  // Convert UTC ISO string → local datetime-local input value (YYYY-MM-DDTHH:mm)
  const toLocalDatetimeInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

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
    entry_fee: 0,
    prize_pool: 0,
    max_participants: 0,
    tournament_start: '',
    live_link: '',
  });
  const [bannerPreview, setBannerPreview] = useState(null);
  const [roundNames, setRoundNames] = useState({});
  const [showRoundNamesModal, setShowRoundNamesModal] = useState(false);
  const [roundDates, setRoundDates] = useState({});
  const [editPrizeDistribution, setEditPrizeDistribution] = useState([]);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [teamsTab, setTeamsTab] = useState('active'); // 'active' or 'rejected'
  const [finalStandings, setFinalStandings] = useState(null);

  // Groups and Matches State
  const [showRoundConfigModal, setShowRoundConfigModal] = useState(false);
  const [showGroupConfirmModal, setShowGroupConfirmModal] = useState(false);
  const [pendingRoundConfig, setPendingRoundConfig] = useState(null); // { configData, pendingGroups }
  const [roundGroups, setRoundGroups] = useState([]);
  const [pastRoundsGroups, setPastRoundsGroups] = useState({}); // { [roundNumber]: groups[] }
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMatchConfigModal, setShowMatchConfigModal] = useState(false);
  const [showMatchPointsModal, setShowMatchPointsModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [showEliminatedModal, setShowEliminatedModal] = useState(false);
  const [eliminatedData, setEliminatedData] = useState(null);
  const [showPointsTable, setShowPointsTable] = useState(false);
  const [showBulkSchedule, setShowBulkSchedule] = useState(false);
  const [bulkScheduleRound, setBulkScheduleRound] = useState(null);
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

  // Live Stream + Overview
  const [showLiveUrlDialog, setShowLiveUrlDialog] = useState(false);
  const [tempLiveUrl, setTempLiveUrl] = useState('');
  const [showOverviewDialog, setShowOverviewDialog] = useState(false);

  // 5v5 lobby preview (inline, not a modal)
  const [lobbyPreview, setLobbyPreview] = useState(null); // { lobbies, bestOf, qualifyingPerGroup, roundNumber }

  // Bracket Generator
  const [showBracketGenerator, setShowBracketGenerator] = useState(false);
  const [bracketExpanded, setBracketExpanded] = useState(true);
  const [selectedBracketTemplate, setSelectedBracketTemplate] = useState('bgis');
  const [bracketCustomRounds, setBracketCustomRounds] = useState([
    {
      name: 'Quarter Finals',
      groups: 4,
      teamsPerGroup: 25,
      matchesPerGroup: 4,
      advancePerGroup: 12,
    },
    { name: 'Semi Finals', groups: 2, teamsPerGroup: 24, matchesPerGroup: 4, advancePerGroup: 8 },
    { name: 'Finals', groups: 1, teamsPerGroup: 16, matchesPerGroup: 6, advancePerGroup: 1 },
  ]);
  const [bracketGenerated, setBracketGenerated] = useState(false);

  const bracketTemplates = [
    {
      id: 'pmgc',
      name: 'PMGC Style',
      icon: '\u{1F3C6}',
      description:
        '48 teams \u2192 Group Stage (3 groups of 16) \u2192 Survival Stage \u2192 Last Chance \u2192 Grand Finals.',
      stages: ['Group Stage', 'Survival Stage', 'Last Chance', 'Grand Finals'],
      defaultRounds: [
        {
          name: 'Group Stage',
          groups: 3,
          teamsPerGroup: 16,
          matchesPerGroup: 6,
          advancePerGroup: 5,
        },
        {
          name: 'Survival Stage',
          groups: 1,
          teamsPerGroup: 16,
          matchesPerGroup: 6,
          advancePerGroup: 8,
        },
        {
          name: 'Last Chance',
          groups: 1,
          teamsPerGroup: 8,
          matchesPerGroup: 4,
          advancePerGroup: 4,
        },
        {
          name: 'Grand Finals',
          groups: 1,
          teamsPerGroup: 16,
          matchesPerGroup: 6,
          advancePerGroup: 1,
        },
      ],
    },
    {
      id: 'bgis',
      name: 'BGIS Style',
      icon: '\u{1F6E1}\uFE0F',
      description:
        '100 teams \u2192 Quarter Finals (4\u00D725) \u2192 Semi Finals (2\u00D724) \u2192 Finals (16 teams).',
      stages: ['Quarter Finals', 'Semi Finals', 'Finals'],
      defaultRounds: [
        {
          name: 'Quarter Finals',
          groups: 4,
          teamsPerGroup: 25,
          matchesPerGroup: 4,
          advancePerGroup: 12,
        },
        {
          name: 'Semi Finals',
          groups: 2,
          teamsPerGroup: 24,
          matchesPerGroup: 4,
          advancePerGroup: 8,
        },
        { name: 'Finals', groups: 1, teamsPerGroup: 16, matchesPerGroup: 6, advancePerGroup: 1 },
      ],
    },
    {
      id: 'league',
      name: 'League Format',
      icon: '\u{1F4CA}',
      description: 'Round-robin within groups. Top teams advance to playoffs then Grand Finals.',
      stages: ['League Stage', 'Playoffs', 'Grand Finals'],
      defaultRounds: [
        {
          name: 'League Stage',
          groups: 4,
          teamsPerGroup: 16,
          matchesPerGroup: 6,
          advancePerGroup: 4,
        },
        { name: 'Playoffs', groups: 1, teamsPerGroup: 16, matchesPerGroup: 6, advancePerGroup: 8 },
        {
          name: 'Grand Finals',
          groups: 1,
          teamsPerGroup: 8,
          matchesPerGroup: 6,
          advancePerGroup: 1,
        },
      ],
    },
    {
      id: 'classic',
      name: 'Classic Elimination',
      icon: '\u{1F3AF}',
      description: 'Groups play matches, bottom half eliminated each round until finals.',
      stages: ['Round 1', 'Round 2', 'Finals'],
      defaultRounds: [
        { name: 'Round 1', groups: 4, teamsPerGroup: 25, matchesPerGroup: 4, advancePerGroup: 12 },
        { name: 'Round 2', groups: 2, teamsPerGroup: 24, matchesPerGroup: 4, advancePerGroup: 8 },
        { name: 'Finals', groups: 1, teamsPerGroup: 16, matchesPerGroup: 6, advancePerGroup: 1 },
      ],
    },
    {
      id: 'custom',
      name: 'Custom Bracket',
      icon: '\u2699\uFE0F',
      description:
        'Build your own bracket structure with custom rounds, groups, and advancement rules.',
      stages: ['Round 1', 'Finals'],
      defaultRounds: [
        { name: 'Round 1', groups: 4, teamsPerGroup: 25, matchesPerGroup: 4, advancePerGroup: 12 },
        { name: 'Finals', groups: 1, teamsPerGroup: 16, matchesPerGroup: 6, advancePerGroup: 1 },
      ],
    },
  ];

  const getRoundStatus = useCallback(
    (roundNum) => {
      const val = tournament?.round_status?.[String(roundNum)];
      if (!val) return 'upcoming';
      // Backend sometimes stores {"status": "ongoing"} and sometimes just "ongoing"
      if (typeof val === 'object' && val !== null) return val.status || 'upcoming';
      return val;
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
        const data = response.data;

        // Flatten standings from all groups into a single results array
        let allResults = [];
        if (data.groups) {
          data.groups.forEach((group) => {
            if (group.standings && Array.isArray(group.standings)) {
              allResults = [...allResults, ...group.standings];
            } else if (group.standings && typeof group.standings === 'object') {
              // Handle single group standings object if needed
              const standingsArray = Object.values(group.standings).filter(
                (s) => typeof s === 'object'
              );
              allResults = [...allResults, ...standingsArray];
            }
          });
        }

        // Merge with existing results if any
        if (data.results && Array.isArray(data.results)) {
          allResults = [...allResults, ...data.results];
        }

        // Remove duplicates and sort by total points
        const seenTeams = new Set();
        const uniqueResults = allResults.filter((team) => {
          const id = team.team_id || team.id;
          if (!id || seenTeams.has(id)) return false;
          seenTeams.add(id);
          return true;
        });

        uniqueResults.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

        // Resolve names from registrations if missing
        const resultsWithNames = uniqueResults.map((result) => {
          if (!result.team_name && (result.team_id || result.id)) {
            const reg = response.data.registrations?.find(
              (r) => r.team === (result.team_id || result.id)
            );
            if (reg) return { ...result, team_name: reg.team_name };
          }
          return result;
        });

        setFinalStandings({ ...data, results: resultsWithNames });
      } catch (error) {
        console.error('Error fetching final standings:', error);
      }
    },
    [id]
  );

  const fetchTournamentData = useCallback(
    async (preserveRound = false) => {
      try {
        const response = await tournamentAPI.getManageTournament(id);
        setTournament(response.data.tournament);
        setRegistrations(response.data.registrations || []);
        const t = response.data.tournament;
        const currentRoundNum =
          t.status === 'completed'
            ? t.rounds?.length || 0
            : t.status === 'upcoming' || t.current_round === 0
              ? 1
              : t.current_round || 0;
        if (!preserveRound) {
          setCurrentRound(currentRoundNum);
        }

        // Initialize edit data
        setEditData({
          title: response.data.tournament.title || '',
          description: response.data.tournament.description || '',
          rules: response.data.tournament.rules || '',
          banner_image: null,
          rounds: response.data.tournament.rounds?.length || 1,
          entry_fee: response.data.tournament.entry_fee || 0,
          prize_pool: response.data.tournament.prize_pool || 0,
          max_participants: response.data.tournament.max_participants || 0,
          tournament_start: toLocalDatetimeInput(response.data.tournament.tournament_start),
          live_link: response.data.tournament.live_link || '',
        });

        // Parse round_names if it's a string, otherwise use as is
        const initialRoundNames =
          typeof response.data.tournament.round_names === 'string'
            ? JSON.parse(response.data.tournament.round_names)
            : response.data.tournament.round_names || {};
        setRoundNames(initialRoundNames);

        // Parse round_dates
        const initialRoundDates =
          typeof response.data.tournament.round_dates === 'string'
            ? JSON.parse(response.data.tournament.round_dates)
            : response.data.tournament.round_dates || {};
        setRoundDates(initialRoundDates);

        // Parse prize_distribution
        const pd = response.data.tournament.prize_distribution;
        if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) {
          const pdArray = Object.entries(pd).map(([place, amount]) => ({
            place,
            amount: parseInt(amount) || 0,
          }));
          setEditPrizeDistribution(pdArray);
        } else {
          const pool = parseFloat(response.data.tournament.prize_pool) || 0;
          setEditPrizeDistribution([
            { place: '1st', amount: Math.round(pool * 0.5) },
            { place: '2nd', amount: Math.round(pool * 0.3) },
            { place: '3rd', amount: Math.round(pool * 0.2) },
          ]);
        }

        // Load selected teams for current round
        if (currentRoundNum > 0) {
          // Fetch groups only if round is actively ongoing (not pre_configured)
          // pre_configured rounds should show the "Ready to Start" screen first
          const roundStatusVal = response.data.tournament.round_status?.[String(currentRoundNum)];
          const roundStatusStr =
            typeof roundStatusVal === 'object' ? roundStatusVal?.status : roundStatusVal;
          if (
            response.data.tournament.status === 'ongoing' &&
            roundStatusStr !== 'pre_configured'
          ) {
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
    },
    [id, fetchRoundGroups, fetchFinalStandings, showToast]
  );

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
        entry_fee: tournament.entry_fee || 0,
        prize_pool: tournament.prize_pool || 0,
        max_participants: tournament.max_participants || 0,
        tournament_start: toLocalDatetimeInput(tournament.tournament_start),
        live_link: tournament.live_link || '',
      });
      setBannerPreview(tournament.banner_image || null);
      setRoundNames(tournament.round_names || {});
      setRoundDates(tournament.round_dates || {});
      // Reset prize distribution
      const pd = tournament.prize_distribution;
      if (pd && typeof pd === 'object' && Object.keys(pd).length > 0) {
        setEditPrizeDistribution(
          Object.entries(pd).map(([place, amount]) => ({
            place,
            amount: parseInt(amount) || 0,
          }))
        );
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveRoundNames = (names) => {
    setRoundNames(names);
  };

  const handleRoundDateChange = (roundNum, field, value) => {
    setRoundDates((prev) => ({
      ...prev,
      [String(roundNum)]: {
        ...prev[String(roundNum)],
        [field]: value,
      },
    }));
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
    const totalDistributed = editPrizeDistribution.reduce(
      (s, p) => s + (parseFloat(p.amount) || 0),
      0
    );
    const prizePool = parseFloat(editData.prize_pool) || 0;
    if (prizePool > 0 && totalDistributed > prizePool) {
      showToast(
        `Prize distribution (₹${totalDistributed.toLocaleString()}) exceeds prize pool (₹${prizePool.toLocaleString()})`,
        'error'
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', editData.title);
      formData.append('description', editData.description);
      formData.append('rules', editData.rules);
      formData.append('live_link', editData.live_link || '');

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

      // Add round dates & mode if they exist
      if (Object.keys(roundDates).length > 0) {
        formData.append('round_dates', JSON.stringify(roundDates));
      }

      // Add prize distribution
      if (editPrizeDistribution.length > 0) {
        const prizeObj = {};
        editPrizeDistribution.forEach((item) => {
          prizeObj[item.place] = item.amount;
        });
        formData.append('prize_distribution', JSON.stringify(prizeObj));
      }

      // Add banner image if a new file was selected
      if (editData.banner_image instanceof File) {
        formData.append('banner_image', editData.banner_image);
      }

      // Add entry fee, prize pool, max participants if different from current
      if (editData.entry_fee !== tournament.entry_fee) {
        formData.append('entry_fee', editData.entry_fee || 0);
      }
      if (editData.prize_pool !== tournament.prize_pool) {
        formData.append('prize_pool', editData.prize_pool || 0);
      }
      if (editData.max_participants !== tournament.max_participants) {
        formData.append('max_participants', editData.max_participants || 0);
      }

      // Always send tournament_start so host can change it to unlock early
      if (editData.tournament_start) {
        formData.append('tournament_start', new Date(editData.tournament_start).toISOString());
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
    // If round was pre-configured, officially start it (sends slot_list notifications) then load groups
    const roundStatus = getRoundStatus(roundNumber);
    if (roundStatus === 'pre_configured') {
      try {
        setLoading(true);
        await tournamentAPI.startRound(tournament.id, roundNumber);
        await fetchTournamentData();
        const res = await tournamentAPI.getRoundGroups(tournament.id, roundNumber);
        const groups = res.data?.groups || [];
        setCurrentRound(roundNumber);
        setRoundGroups(groups);
        setSelectedGroup(groups[0] || null);
        showToast(`Round ${roundNumber} started! Players have been notified.`);
      } catch (err) {
        showToast(err.response?.data?.error || 'Failed to start round', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // New system - show configuration modal
    let totalTeams = 0;
    if (roundNumber === 1) {
      totalTeams = registrations.filter(
        (r) => r.status === 'confirmed' || r.status === 'approved'
      ).length;
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
    // team.id from groups API is already the registration ID
    setSelectedTeam({
      id: team.id, // registration ID from groups API
      team_name: team.team_name,
    });
    setShowTeamDetails(true);
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

  // Helper: build team list for a given round number
  const getTeamListForRound = (roundNumber) => {
    if (roundNumber === 1) {
      return registrations
        .filter((r) => r.status === 'confirmed' || r.status === 'approved')
        .map((r) => r.team_name || `Team ${r.id}`);
    }
    // For subsequent rounds, use selected_teams from prev round
    const prevKey = String(roundNumber - 1);
    const selected = tournament?.selected_teams?.[prevKey] || [];
    return selected.map((t) => t.team_name || t.name || String(t));
  };

  // Step 1: called by RoundConfigModal — compute groups preview, show GroupConfirmModal
  const handleSubmitRoundConfig = (configData) => {
    // 5v5 mode: show inline lobby preview before calling API
    if (configData?._5v5Preview) {
      setLobbyPreview({
        lobbies: configData.lobbies,
        bestOf: configData.bestOf,
        qualifyingPerGroup: configData.qualifyingPerGroup,
        roundNumber: configData.roundNumber,
      });
      return;
    }

    // 5v5 rounds are already configured by the modal's API call — skip confirmation
    if (configData?._alreadyConfigured) {
      handleConfirmedRoundConfig(configData);
      return;
    }

    // Compute group preview for BR mode
    const teamsPerGroup = configData.teams_per_group;
    const teamList = getTeamListForRound(currentRound);
    const numGroups = Math.ceil(teamList.length / teamsPerGroup);
    const computedGroups = [];
    for (let i = 0; i < numGroups; i++) {
      const start = i * teamsPerGroup;
      const end = Math.min(start + teamsPerGroup, teamList.length);
      computedGroups.push(teamList.slice(start, end));
    }

    setPendingRoundConfig({ configData, pendingGroups: computedGroups });
    setShowRoundConfigModal(false);
    setShowGroupConfirmModal(true);
  };

  // Step 2: called when user clicks "Confirm & Start" in GroupConfirmModal
  const handleConfirmedRoundConfig = async (configData) => {
    setShowGroupConfirmModal(false);
    try {
      setLoading(true);
      if (!configData?._alreadyConfigured) {
        await tournamentAPI.configureRound(id, currentRound, configData);
      }
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
      // Auto-open Bulk Schedule so host can set maps/times for this round's matches
      setBulkScheduleRound(currentRound);
      setShowBulkSchedule(true);
    } catch (error) {
      console.error('Error configuring round:', error);
      showToast(error.response?.data?.error || 'Failed to configure round', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 for 5v5: called when user confirms in inline lobby preview ("Start Round N")
  // Configures lobbies in DB (or skips if already done), then opens Bulk Schedule
  const handleLobbyPreviewConfirm = async () => {
    if (!lobbyPreview) return;
    const roundNumber = lobbyPreview.roundNumber;
    try {
      setLoading(true);

      // Check if groups already exist for this round (created by getRoundResults)
      let groups = [];
      try {
        const existing = await tournamentAPI.getRoundGroups(id, roundNumber);
        groups = existing.data.groups || [];
      } catch (e) {
        /* none yet */
      }

      if (groups.length === 0) {
        // Groups don't exist — create them now
        await tournamentAPI.configureRound(id, roundNumber, {
          teams_per_group: 2,
          qualifying_per_group: lobbyPreview.qualifyingPerGroup,
          matches_per_group: lobbyPreview.bestOf,
        });
        // Poll until they appear
        const maxAttempts = 8;
        let attempts = 0;
        while (attempts < maxAttempts) {
          try {
            const resp = await tournamentAPI.getRoundGroups(id, roundNumber);
            groups = resp.data.groups || [];
            if (groups.length > 0) break;
          } catch (e) {
            /* retry */
          }
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 750));
          attempts += 1;
        }
      }

      // Only officially start the round if tournament is already ongoing
      // If tournament is still upcoming, this is pre-configure only — startRound is called later
      // when the host clicks "Start Round N" after tournament goes live
      if (tournament?.status === 'ongoing') {
        try {
          await tournamentAPI.startRound(id, roundNumber);
        } catch (e) {
          // May already be ongoing — ignore
        }
      }

      // Open bulk schedule first (before clearing lobbyPreview) to avoid page flicker
      setBulkScheduleRound(roundNumber);
      setShowBulkSchedule(true);
      setLobbyPreview(null);
      setLoading(false);
      setRoundGroups(groups);
      // Refresh tournament but preserve currentRound
      const tResp = await tournamentAPI.getManageTournament(id);
      setTournament(tResp.data.tournament);
      setRegistrations(tResp.data.registrations || []);
      setCurrentRound(roundNumber);
      showToast('Lobbies ready! Set your schedule below.');
    } catch (error) {
      console.error('Error configuring round:', error);
      showToast(error.response?.data?.error || 'Failed to configure round', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRound = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Round Configuration',
      message:
        'Are you sure you want to reset this round? This will delete groups and matches so you can reconfigure the round.',
      confirmText: 'Reset Round',
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoading(true);
          await tournamentAPI.resetRound(id, currentRound);
          showToast('Round reset. You may reconfigure now.');
          setRoundGroups([]);
          await fetchTournamentData();
        } catch (error) {
          console.error('Error resetting round:', error);
          showToast(error.response?.data?.error || 'Failed to reset round', 'error');
        } finally {
          setLoading(false);
          setConfirmModal((c) => ({ ...c, isOpen: false }));
        }
      },
    });
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
  };

  const handleStartMatch = (match) => {
    setCurrentMatch(match);
    setShowMatchConfigModal(true);
  };

  const handleSaveOnlyMatchConfig = async (credData) => {
    if (!currentMatch) return;
    try {
      setLoading(true);
      const currentGroupId = selectedGroup.id;
      await tournamentAPI.updateMatchCredentials(id, currentMatch.id, credData);
      setShowMatchConfigModal(false);
      setCurrentMatch(null);
      showToast('Credentials saved!');
      const updatedGroups = await tournamentAPI.getRoundGroups(id, currentRound);
      setRoundGroups(updatedGroups.data.groups || []);
      const updatedGroup = updatedGroups.data.groups.find((g) => g.id === currentGroupId);
      if (updatedGroup) setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error saving credentials:', error);
      showToast(error.response?.data?.error || 'Failed to save credentials', 'error');
    } finally {
      setLoading(false);
    }
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

  const handleAdvanceRound = async (overrideRound) => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getRoundResults(id, overrideRound ?? currentRound);
      const data = response.data;

      if (data.is_final_round) {
        // Final round completed - show winner
        const winnerName = data.winner?.team_name || 'Unknown';
        showToast(
          `Tournament Complete!\n\nWinner: ${winnerName}\n\nTotal Points: ${data.winner?.total_points || 0}`
        );
        await fetchTournamentData();
      } else if (tournament?.is_5v5) {
        // 5v5: skip eliminated modal, go straight to lobby preview for next round
        const nextRound = data.next_round;

        // Refresh tournament state
        const tResp = await tournamentAPI.getManageTournament(id);
        setTournament(tResp.data.tournament);
        setRegistrations(tResp.data.registrations || []);
        setCurrentRound(nextRound);
        setSelectedGroup(null);
        setRoundGroups([]);

        // Build qualified teams list from data.groups[].qualified_teams (already in response)
        const qualifiedTeams = (data.groups || [])
          .flatMap((g) => g.qualified_teams || [])
          .map((t) => ({ id: t.team_id, team_name: t.team_name }));

        const pairs = [];
        for (let i = 0; i < qualifiedTeams.length - 1; i += 2) {
          pairs.push({
            id: `lobby-${i / 2 + 1}`,
            teams: [qualifiedTeams[i], qualifiedTeams[i + 1]],
          });
        }
        if (qualifiedTeams.length % 2 !== 0) {
          pairs.push({ id: `lobby-bye`, teams: [qualifiedTeams[qualifiedTeams.length - 1]] });
        }

        setLobbyPreview({
          lobbies: pairs,
          bestOf: 1,
          qualifyingPerGroup: 1,
          roundNumber: nextRound,
          fromAdvance: true,
        });
      } else {
        // BR mode - show eliminated teams modal
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
    // Save current round's groups before moving on so Round Results can show them
    if (roundGroups.length > 0) {
      setPastRoundsGroups((prev) => ({ ...prev, [currentRound]: roundGroups }));
    }
    setCurrentRound(nextRound);
    setSelectedGroup(null);
    setRoundGroups([]);
    // Don't auto-open RoundConfigModal — host can now use Bulk Schedule
    // to pre-set maps/times, then click "Start Round N" when ready.
  };

  // Fetch groups for all past rounds on load so Round Results shows correct data.
  // This handles page refreshes where pastRoundsGroups state starts empty.
  useEffect(() => {
    if (!id || currentRound <= 1) return;
    for (let r = 1; r < currentRound; r++) {
      tournamentAPI
        .getRoundGroups(id, r)
        .then((res) => {
          const groups = res.data?.groups || [];
          if (groups.length > 0) {
            setPastRoundsGroups((prev) => ({ ...prev, [r]: groups }));
          }
        })
        .catch(() => {}); // silently ignore — completed rounds always have groups
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentRound]);

  // Load groups when round changes.
  // Also handles upcoming tournaments (currentRound=0) — always check if round 1 was pre-configured
  // so the host sees the green badge + Reset button when they come back to the page.
  useEffect(() => {
    if (!tournament?.use_groups_system) return;

    if (tournament?.status === 'upcoming' && currentRound === 0) {
      // Silently probe round 1 for pre-configured groups
      tournamentAPI
        .getRoundGroups(tournament.id, 1)
        .then((res) => {
          const groups = res.data?.groups || [];
          setRoundGroups(groups);
          if (groups.length > 0) setSelectedGroup(groups[0]);
        })
        .catch(() => {
          setRoundGroups([]);
          setSelectedGroup(null);
        });
      return;
    }

    if (currentRound > 0) {
      const roundStatus = getRoundStatus(currentRound);
      if (roundStatus === 'completed') {
        // Auto-load completed rounds (for round navigation / history)
        fetchRoundGroups(currentRound);
      }
      // For 'ongoing' rounds: groups are only loaded after host explicitly clicks "Start Round"
      // via handleStartRound — not auto-loaded on page mount, so host always sees the
      // "Ready to Start" screen first when navigating to an ongoing tournament.
    }
  }, [
    currentRound,
    tournament?.use_groups_system,
    tournament?.status,
    tournament?.id,
    getRoundStatus,
    fetchRoundGroups,
  ]);

  const handleExportCSV = async () => {
    try {
      showToast('Exporting tournament registrations...');
      const response = await tournamentAPI.exportTournamentRegistrationsCSV(id);

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tournament.title}_registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Tournament registrations exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast(error.response?.data?.error || 'Failed to export registrations', 'error');
    }
  };

  const handleSaveLiveUrl = async () => {
    try {
      await tournamentAPI.updateTournamentFields(id, { live_link: tempLiveUrl || '' });
      setTournament((prev) => ({ ...prev, live_link: tempLiveUrl || null }));
      setShowLiveUrlDialog(false);
      showToast(tempLiveUrl ? 'Live stream published!' : 'Live stream removed');
    } catch (error) {
      showToast('Failed to update live stream', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(var(--accent))]"></div>
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

  const currentRoundName =
    roundNames?.[String(currentRound)] || (currentRound > 0 ? `Round ${currentRound}` : null);

  // 5v5 Lobby Preview — renders inline, replacing the full page (sidebar still visible via HostDashboard)
  if (lobbyPreview) {
    return (
      <div className="min-h-screen bg-transparent manage-tournament-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Lobby5v5PreviewModal
            isOpen={true}
            onClose={() => {
              setLobbyPreview(null);
              if (!lobbyPreview?.fromAdvance) {
                setShowRoundConfigModal(true);
              }
            }}
            onConfirm={handleLobbyPreviewConfirm}
            lobbies={lobbyPreview.lobbies}
            bestOf={lobbyPreview.bestOf}
            totalTeams={lobbyPreview.lobbies.reduce((acc, l) => acc + l.teams.length, 0)}
            loading={loading}
            roundNumber={lobbyPreview.roundNumber}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent manage-tournament-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button — own row */}
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
              {tournament?.is_5v5 && tournament.status === 'ongoing' ? (
                <p className="mt-subtitle flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
                    {tournament.game} • 5v5
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {currentRoundName || `Round ${currentRound}`} • {roundGroups.length} Lobbies
                  </span>
                </p>
              ) : (
                <p className="mt-subtitle">Tournament Management</p>
              )}
            </div>

            {/* Round badge — only for non-5v5 ongoing */}
            {tournament.status === 'ongoing' && currentRoundName && !tournament?.is_5v5 && (
              <span className="mt-round-badge">
                <Zap className="h-3 w-3" />
                {currentRoundName}
              </span>
            )}

            {/* Generate Next Round — 5v5 only, top-right header, when all lobbies complete */}
            {tournament?.is_5v5 &&
              tournament.status === 'ongoing' &&
              roundGroups.length > 0 &&
              roundGroups.every((g) => g.status === 'completed') &&
              (() => {
                const isFinalRound =
                  tournament.rounds?.findIndex((r) => r.round === currentRound) ===
                  (tournament.rounds?.length ?? 0) - 1;
                const roundAtRender = currentRound;
                return (
                  <button
                    onClick={() => handleAdvanceRound(roundAtRender)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isFinalRound ? 'End Tournament' : 'Generate Next Round'}
                  </button>
                );
              })()}
          </div>

          {/* Action buttons */}
          <div className="mt-actions-bar">
            <button
              onClick={() => navigate(`/tournaments/${id}`, { state: { fromManage: true } })}
              className="mt-action-btn"
            >
              <Eye className="h-3.5 w-3.5" />
              View Details
            </button>
            <button
              onClick={() => setShowPointsTable(true)}
              className="mt-action-btn mt-action-btn-purple"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Points Table
            </button>
            {tournament?.is_5v5 && (
              <button
                onClick={() => {
                  // Open match config for the first pending match across all groups
                  const firstPending = roundGroups.find((g) =>
                    g.matches?.some((m) => m.status !== 'completed')
                  );
                  if (firstPending) {
                    setSelectedGroup(firstPending);
                    const match = firstPending.matches?.find((m) => m.status !== 'completed');
                    if (match) handleStartMatch(match);
                  }
                }}
                className="mt-action-btn"
              >
                <Settings className="h-3.5 w-3.5" />
                Match IDP
              </button>
            )}
            <button
              onClick={() => {
                setBulkScheduleRound(null);
                setShowBulkSchedule(true);
              }}
              className="mt-action-btn mt-action-btn-green"
            >
              <Calendar className="h-3.5 w-3.5" />
              Bulk Schedule
            </button>
            <button
              onClick={() => {
                setTempLiveUrl(tournament.live_link || '');
                setShowLiveUrlDialog(true);
              }}
              className={`mt-action-btn mt-action-btn-red`}
            >
              <Video className="h-3.5 w-3.5" />
              {tournament.live_link ? 'Live Active' : 'Live Stream'}
            </button>
            <button onClick={() => setShowOverviewDialog(true)} className="mt-action-btn">
              <Info className="h-3.5 w-3.5" />
              Overview
            </button>
            <button
              onClick={handleEditToggle}
              disabled={tournament.status !== 'upcoming' && !isEditing}
              className={`mt-action-btn ${isEditing ? 'active' : ''}`}
            >
              <Settings className="h-3.5 w-3.5" />
              {isEditing ? 'Cancel Edit' : tournament.status === 'upcoming' ? 'Edit' : 'View'}
            </button>
            <button onClick={handleExportCSV} className="mt-action-btn">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Live Stream Banner */}
        {tournament.live_link && (
          <div
            className="mt-cyber-card p-3 sm:p-4 mb-4"
            style={{ borderColor: 'hsl(0 84% 60% / 0.3)', background: 'hsl(0 84% 60% / 0.05)' }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <Video className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Live Stream Active
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[200px] sm:max-w-md">
                    {tournament.live_link}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tournament.live_link);
                    showToast('Live URL copied!');
                  }}
                  className="mt-action-btn flex-1 sm:flex-none text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
                <button
                  onClick={() => window.open(tournament.live_link, '_blank')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 justify-center"
                >
                  <ExternalLink className="h-3 w-3" />
                  Watch
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full mx-auto space-y-8">
          {/* Edit/View Tournament Section */}
          {isEditing && (
            <div className="info-grid-card rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                    {tournament.status === 'upcoming' ? 'Edit Tournament' : 'Tournament Details'}
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {tournament.status === 'upcoming'
                      ? 'Update the core details of your tournament'
                      : 'View tournament information (editing locked after start)'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
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
                      className="w-full px-3 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      {tournament.status === 'upcoming'
                        ? 'Set between 1-6 rounds'
                        : 'Locked after tournament starts'}
                    </p>

                    {/* Read-only Round Structure — match count per round */}
                    {tournament.rounds && tournament.rounds.length > 0 && (
                      <div className="mt-4 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.2)] rounded-lg p-4">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium mb-2">
                          Round Structure
                        </p>
                        <div className="space-y-2">
                          {tournament.rounds.map((round) => {
                            const roundNum = round.round;
                            const roundName =
                              roundNames[String(roundNum)] ||
                              tournament.round_names?.[String(roundNum)] ||
                              `Round ${roundNum}`;
                            const matchCount = round.max_matches || tournament.max_matches || '—';
                            const maxTeams = round.max_teams || round.qualifying_teams || '—';
                            return (
                              <div
                                key={roundNum}
                                className="flex items-center justify-between py-2 px-3 bg-[hsl(var(--secondary)/0.3)] rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 flex items-center justify-center bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] rounded-md text-xs font-semibold">
                                    {roundNum}
                                  </span>
                                  <span className="text-white text-sm font-bold">{roundName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-400 text-xs font-medium">
                                    {typeof maxTeams === 'number' ? `${maxTeams} teams` : ''}
                                  </span>
                                  <span className="text-[hsl(var(--accent))] text-xs font-medium">
                                    {typeof matchCount === 'number'
                                      ? `${matchCount} match${matchCount > 1 ? 'es' : ''}`
                                      : 'Matches set on start'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-gray-600 text-[8px] mt-2 ml-1 font-medium">
                          Match counts are set when each round is configured via "Start Round"
                        </p>
                      </div>
                    )}

                    {/* Round Dates & Mode Editor */}
                    {tournament.status === 'upcoming' &&
                      (editData.rounds || tournament.rounds?.length || 0) > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                            Round Schedule & Mode
                          </p>
                          {Array.from(
                            { length: editData.rounds || tournament.rounds?.length || 0 },
                            (_, i) => {
                              const rn = i + 1;
                              const rd = roundDates[String(rn)] || {};
                              const roundLabel =
                                roundNames[String(rn)] ||
                                tournament.round_names?.[String(rn)] ||
                                `Round ${rn}`;
                              return (
                                <div
                                  key={rn}
                                  className="bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.2)] rounded-lg p-4"
                                >
                                  <p className="text-white text-sm font-bold mb-3">{roundLabel}</p>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
                                        Start Date
                                      </label>
                                      <input
                                        type="date"
                                        value={rd.start_date || ''}
                                        onChange={(e) =>
                                          handleRoundDateChange(rn, 'start_date', e.target.value)
                                        }
                                        className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
                                        End Date
                                      </label>
                                      <input
                                        type="date"
                                        value={rd.end_date || ''}
                                        onChange={(e) =>
                                          handleRoundDateChange(rn, 'end_date', e.target.value)
                                        }
                                        className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
                                      Mode
                                    </label>
                                    <select
                                      value={rd.mode || 'online'}
                                      onChange={(e) =>
                                        handleRoundDateChange(rn, 'mode', e.target.value)
                                      }
                                      className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors appearance-none cursor-pointer"
                                    >
                                      <option
                                        value="online"
                                        className="bg-[hsl(var(--background))]"
                                      >
                                        Online
                                      </option>
                                      <option
                                        value="offline"
                                        className="bg-[hsl(var(--background))]"
                                      >
                                        Offline
                                      </option>
                                    </select>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                  </div>

                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                      Event Description
                    </label>
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      rows={6}
                      className="w-full px-3 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Detailed description..."
                      required
                    />
                  </div>

                  {/* Banner Image Upload - Premium only */}
                  {tournament.plan_type === 'premium' && (
                    <div>
                      <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                        Banner Image
                      </label>
                      {bannerPreview && (
                        <img
                          src={bannerPreview}
                          alt="Banner preview"
                          className="w-full h-28 object-cover rounded-lg mb-2 border border-[hsl(var(--border)/0.3)]"
                        />
                      )}
                      <label
                        htmlFor="banner-edit-upload"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-[hsl(var(--card))] border border-dashed border-[hsl(var(--border)/0.4)] hover:border-[hsl(var(--accent)/0.5)] hover:bg-[hsl(var(--secondary)/0.3)] rounded-lg cursor-pointer transition-colors group"
                      >
                        <svg
                          className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--accent))] transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors font-semibold">
                          {editData.banner_image instanceof File
                            ? editData.banner_image.name
                            : 'Change Banner Image'}
                        </span>
                        <input
                          id="banner-edit-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Settings Card - editable core fields */}
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[hsl(var(--accent))]"
                      >
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      Settings
                    </label>
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.2)] rounded-lg p-4 space-y-3">
                      {/* Tournament Start Date — controls "Locked until" timer */}
                      <div>
                        <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
                          Tournament Start Date &amp; Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editData.tournament_start}
                          onChange={(e) =>
                            setEditData({ ...editData, tournament_start: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                        />
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                          Set to now or past to unlock "Start Tournament"
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
                            Max Teams
                          </label>
                          <input
                            type="number"
                            min="2"
                            value={editData.max_participants}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                max_participants: parseInt(e.target.value) || 0,
                              })
                            }
                            disabled={tournament.status !== 'upcoming'}
                            className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
                            Entry (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editData.entry_fee}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                entry_fee: parseFloat(e.target.value) || 0,
                              })
                            }
                            onWheel={(e) => e.target.blur()}
                            disabled={tournament.status !== 'upcoming'}
                            className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
                          Prize Pool (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editData.prize_pool}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              prize_pool: parseFloat(e.target.value) || 0,
                            })
                          }
                          onWheel={(e) => e.target.blur()}
                          disabled={tournament.status !== 'upcoming'}
                          className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                      Live Stream URL
                    </label>
                    <input
                      type="url"
                      name="live_link"
                      value={editData.live_link}
                      onChange={handleEditChange}
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                      Rules & Guidelines
                    </label>
                    <textarea
                      name="rules"
                      value={editData.rules}
                      onChange={handleEditChange}
                      disabled={tournament.status !== 'upcoming'}
                      rows={8}
                      className="w-full px-3 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] font-mono text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Rules & guidelines..."
                      required
                    />
                  </div>

                  {tournament.status === 'upcoming' && (
                    <div>
                      <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                        Prize Distribution
                      </label>
                      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.2)] rounded-lg p-4 space-y-2">
                        {editPrizeDistribution.map((prize, index) => {
                          let trophyColor = 'text-gray-400';
                          if (prize.place === '1st') trophyColor = 'text-yellow-500';
                          else if (prize.place === '2nd') trophyColor = 'text-gray-400';
                          else if (prize.place === '3rd') trophyColor = 'text-orange-500';
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 min-w-[56px]">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className={`h-3.5 w-3.5 ${trophyColor}`}
                                >
                                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                                  <path d="M4 22h16"></path>
                                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                                </svg>
                                <span className="text-xs font-medium text-gray-300">
                                  {prize.place}
                                </span>
                              </div>
                              <div className="flex-1 relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={prize.amount}
                                  onChange={(e) => {
                                    const updated = [...editPrizeDistribution];
                                    updated[index].amount = parseInt(e.target.value) || 0;
                                    setEditPrizeDistribution(updated);
                                  }}
                                  onWheel={(e) => e.target.blur()}
                                  className="w-full rounded-xl border border-white/20 px-3 py-1.5 pl-6 text-xs bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50"
                                />
                              </div>
                              {editPrizeDistribution.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditPrizeDistribution(
                                      editPrizeDistribution.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                                >
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
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            const places = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
                            const nextPlace =
                              places[editPrizeDistribution.length] ||
                              `${editPrizeDistribution.length + 1}th`;
                            setEditPrizeDistribution([
                              ...editPrizeDistribution,
                              { place: nextPlace, amount: 0 },
                            ]);
                          }}
                          disabled={editPrizeDistribution.length >= 8}
                          className="w-full py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.3)] hover:border-[hsl(var(--border)/0.5)] rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + Add Place
                        </button>
                        <div className="pt-2 border-t border-[hsl(var(--border)/0.2)] flex justify-between items-center">
                          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
                            Total Distributed
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              editPrizeDistribution.reduce((s, p) => s + p.amount, 0) ===
                              parseFloat(editData.prize_pool || 0)
                                ? 'text-green-400'
                                : 'text-yellow-400'
                            }`}
                          >
                            ₹
                            {editPrizeDistribution
                              .reduce((s, p) => s + p.amount, 0)
                              .toLocaleString()}{' '}
                            / ₹{parseFloat(editData.prize_pool || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {tournament.status === 'upcoming' && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/20">
                    <button
                      onClick={handleSaveChanges}
                      className="flex-1 bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="flex-1 bg-secondary/50 text-muted-foreground px-5 py-2.5 rounded-lg font-medium text-sm border border-border/30 hover:bg-secondary transition-colors"
                    >
                      Discard
                    </button>
                  </div>

                  <p className="mt-4 text-muted-foreground text-xs bg-accent/5 border border-accent/10 rounded-lg px-4 py-3">
                    <strong className="text-foreground">Note:</strong> Some parameters are locked
                    once the tournament starts.
                  </p>
                </>
              )}

              {tournament.status !== 'upcoming' && (
                <p className="mt-4 text-muted-foreground text-xs bg-secondary/30 border border-border/20 rounded-lg px-4 py-3">
                  <strong className="text-foreground">Locked:</strong> Editing is disabled after the
                  tournament starts.
                </p>
              )}
            </div>
          )}

          {/* Tournament Actions & Status Section - Only show when NOT ongoing */}
          {tournament.status !== 'ongoing' && (
            <div className="mt-cyber-card p-5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Start Tournament Button - Only show when status is upcoming */}
                {tournament.status === 'upcoming' && (
                  <>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-foreground mb-0.5">Start Tournament</h2>
                      {new Date() < new Date(tournament.tournament_start) ? (
                        <StartCountdown targetDate={tournament.tournament_start} />
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          Begin the competition once registration closes.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {/* Pre-configure Round 1 — lets host set up groups + bulk schedule before start */}
                      {roundGroups.length === 0 && (
                        <button
                          onClick={async () => {
                            // Check if groups already exist before opening config modal
                            try {
                              const res = await tournamentAPI.getRoundGroups(tournament.id, 1);
                              const existing = res.data?.groups || [];
                              if (existing.length > 0) {
                                // Already pre-configured — load them and show reset option
                                setRoundGroups(existing);
                                setSelectedGroup(existing[0]);
                                showToast(
                                  'Round 1 is already pre-configured. Use Reset to reconfigure.',
                                  'info'
                                );
                                return;
                              }
                            } catch {
                              // No groups yet — fall through to open modal
                            }
                            setCurrentRound(1);
                            setShowRoundConfigModal(true);
                          }}
                          className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30"
                          title="Pre-configure Round 1 groups so you can set maps and schedules before the tournament starts"
                        >
                          <Settings className="h-4 w-4" />
                          Pre-configure Groups
                        </button>
                      )}
                      {roundGroups.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                            <Zap className="h-3.5 w-3.5" />
                            Round 1 groups ready — Bulk Schedule available
                          </div>
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Reset Pre-configured Groups',
                                message:
                                  'This will delete all Round 1 groups and matches so you can reconfigure from scratch. No players have been notified yet.',
                                confirmText: 'Reset Groups',
                                type: 'danger',
                                onConfirm: async () => {
                                  try {
                                    setLoading(true);
                                    await tournamentAPI.resetRound(tournament.id, 1);
                                    showToast('Round 1 reset. You can pre-configure again.');
                                    setRoundGroups([]);
                                    setSelectedGroup(null);
                                    await fetchTournamentData();
                                  } catch (error) {
                                    showToast(
                                      error.response?.data?.error || 'Failed to reset round',
                                      'error'
                                    );
                                  } finally {
                                    setLoading(false);
                                  }
                                },
                              });
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-medium transition-colors text-red-400 border border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5"
                            title="Reset pre-configured groups and start over"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                          </button>
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            await tournamentAPI.startTournament(tournament.id);
                            showToast('Tournament started successfully!');
                            if (onStarted) {
                              onStarted();
                            } else {
                              navigate('/host/dashboard?tab=tournaments');
                            }
                          } catch (error) {
                            console.error('Error starting tournament:', error);
                            const errorMsg =
                              error.response?.data?.error ||
                              error.response?.data?.message ||
                              'Failed to start tournament';
                            showToast(errorMsg, 'error');
                          }
                        }}
                        disabled={new Date() < new Date(tournament.tournament_start)}
                        title={
                          new Date() < new Date(tournament.tournament_start)
                            ? `Locked until ${new Date(tournament.tournament_start).toLocaleString()}`
                            : 'Start Tournament'
                        }
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
                          new Date() < new Date(tournament.tournament_start)
                            ? 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        Start Tournament
                      </button>
                    </div>
                  </>
                )}

                {/* If completed, show basic summary */}
                {tournament.status === 'completed' && (
                  <div className="flex items-center gap-3 bg-green-500/10 px-4 py-2.5 rounded-lg border border-green-500/20">
                    <span className="text-xl">🏆</span>
                    <div>
                      <p className="text-green-400 font-semibold text-sm">Tournament Completed</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tournament Completion Summary - Show ONLY when completed */}
              {tournament.status === 'completed' && (
                <div className="space-y-4 mt-4">
                  {/* Victory Header */}
                  <div className="info-grid-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Tournament Complete</h3>
                          <p className="text-yellow-500 text-xs font-medium">
                            {getEventLabel()} Concluded
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Final Results</p>
                        <p className="text-foreground text-sm font-bold">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1st Place - Champion */}
                      {(() => {
                        const champion = finalStandings?.winner || finalStandings.results?.[0];
                        return (
                          champion && (
                            <div
                              onClick={() => handleWinnerClick(champion)}
                              className="cursor-pointer"
                            >
                              <div className="info-grid-card p-3 border-yellow-500/30 hover:border-yellow-500/50 transition-colors h-full">
                                <div className="flex items-center gap-3 h-full">
                                  <div className="w-11 h-11 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xl shrink-0">
                                    🥇
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-yellow-500 text-[10px] font-semibold uppercase flex items-center gap-1">
                                      🥇 CHAMPION
                                    </span>
                                    <h4 className="text-foreground font-bold text-base truncate">
                                      {champion.team_name}
                                    </h4>
                                    <p className="text-yellow-500 font-semibold text-sm">
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

                      {/* 2nd Place */}
                      {finalStandings.results?.[1] && (
                        <div
                          onClick={() => handleWinnerClick(finalStandings.results[1])}
                          className="cursor-pointer h-full"
                        >
                          <div className="info-grid-card p-3 hover:border-muted-foreground/30 transition-colors h-full">
                            <div className="flex items-center gap-3 h-full">
                              <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
                                🥈
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-400 text-[10px] font-semibold uppercase">
                                  RUNNER UP
                                </span>
                                <h4 className="text-foreground font-bold text-base truncate">
                                  {finalStandings.results[1].team_name ||
                                    finalStandings.results[1].name ||
                                    'Team 2'}
                                </h4>
                                <p className="text-muted-foreground font-semibold text-sm">
                                  {finalStandings.results[1].total_points ||
                                    finalStandings.results[1].match_wins ||
                                    0}{' '}
                                  <span className="text-xs opacity-60">
                                    {finalStandings.results[1].match_wins !== undefined
                                      ? 'WINS'
                                      : 'PTS'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {finalStandings.results?.[2] && (
                        <div
                          onClick={() => handleWinnerClick(finalStandings.results[2])}
                          className="cursor-pointer h-full"
                        >
                          <div className="info-grid-card p-3 hover:border-orange-500/30 transition-colors h-full">
                            <div className="flex items-center gap-3 h-full">
                              <div className="w-11 h-11 rounded-lg bg-orange-500/15 flex items-center justify-center text-xl shrink-0">
                                🥉
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-orange-500/70 text-[10px] font-semibold uppercase">
                                  3RD PLACE
                                </span>
                                <h4 className="text-foreground font-bold text-base truncate">
                                  {finalStandings.results[2].team_name ||
                                    finalStandings.results[2].name ||
                                    'Team 3'}
                                </h4>
                                <p className="text-muted-foreground font-semibold text-sm">
                                  {finalStandings.results[2].total_points ||
                                    finalStandings.results[2].match_wins ||
                                    0}{' '}
                                  <span className="text-xs opacity-60">
                                    {finalStandings.results[2].match_wins !== undefined
                                      ? 'WINS'
                                      : 'PTS'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tournament Stats */}
                  <div className="info-grid-card p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-accent" />
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
                        <div key={i} className="mt-stat-tile">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                            {stat.label}
                          </p>
                          <p
                            className={`font-bold text-sm truncate ${stat.highlight ? 'text-yellow-500' : 'text-foreground'}`}
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
            <div>
              {/* Round Progress */}
              <div className="mt-cyber-card p-3 sm:p-4 mb-4">
                {tournament?.is_5v5 ? (
                  /* ── 5v5: Lovable pill-style round navigation ── */
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {tournament.rounds.map((round, index) => {
                      const roundNum = round.round;
                      const isActive = roundNum === currentRound;
                      const isCompleted = getRoundStatus(roundNum) === 'completed';
                      const isFinal = index === tournament.rounds.length - 1;
                      const isLastItem = index === tournament.rounds.length - 1;
                      const rName =
                        roundNames?.[String(roundNum)] ||
                        (isFinal ? 'Finals' : `Round ${roundNum}`);
                      const teamCount =
                        roundNum === currentRound
                          ? roundGroups.reduce((a, g) => a + (g.teams?.length || 0), 0)
                          : null;
                      return (
                        <div key={roundNum} className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => setCurrentRound(roundNum)}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all text-[11px] sm:text-sm font-medium ${
                              isActive
                                ? 'bg-accent/20 text-accent border border-accent/50 font-semibold'
                                : isCompleted
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-secondary/20 text-muted-foreground/60 border border-dashed border-border/30'
                            }`}
                          >
                            {rName}
                            <span className="ml-1 opacity-70">
                              ({teamCount != null ? teamCount : '—'})
                            </span>
                          </button>
                          {!isLastItem && (
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/50 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ── BR mode: circular stepper ── */
                  <div className="round-stepper flex items-center justify-center overflow-x-auto no-scrollbar px-2">
                    {tournament.rounds.map((round, index) => {
                      const roundNum = round.round;
                      const isActive = roundNum === currentRound;
                      const isCompleted = getRoundStatus(roundNum) === 'completed';
                      const isFinal = index === tournament.rounds.length - 1;
                      const isLastItem = index === tournament.rounds.length - 1;
                      return (
                        <div key={roundNum} className="flex items-center">
                          <div
                            onClick={() => setCurrentRound(roundNum)}
                            className="flex flex-col items-center cursor-pointer group/step"
                          >
                            <div
                              className={`stepper-circle relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                isActive
                                  ? 'bg-accent border-accent text-white'
                                  : isCompleted
                                    ? 'bg-green-500/15 border-green-500 text-green-500'
                                    : 'bg-secondary/30 border-border/50 text-muted-foreground group-hover/step:border-muted-foreground/50'
                              }`}
                            >
                              {isCompleted ? (
                                <svg
                                  className="w-4 h-4"
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
                                roundNum
                              )}
                            </div>
                            <span
                              className={`mt-1.5 text-[10px] font-semibold whitespace-nowrap max-w-[72px] text-center truncate ${
                                isActive
                                  ? 'text-accent'
                                  : isCompleted
                                    ? 'text-green-500/70'
                                    : 'text-muted-foreground/50'
                              }`}
                            >
                              {roundNames?.[String(roundNum)] ||
                                (isFinal ? 'Finals' : `Round ${roundNum}`)}
                            </span>
                          </div>
                          {!isLastItem && (
                            <div className="stepper-line w-10 sm:w-16 lg:w-24 h-0.5 mx-1 mt-[-16px] relative">
                              <div className="absolute inset-0 bg-border/30 rounded-full"></div>
                              <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                  isCompleted
                                    ? 'bg-green-500 w-full'
                                    : isActive
                                      ? 'bg-accent w-1/2'
                                      : 'w-0'
                                }`}
                              ></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Content Area — separate card */}
              <div className="mt-cyber-card p-5 lg:p-6 mb-6">
                <div className="relative">
                  {groupsLoading && roundGroups.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-muted-foreground text-xs font-medium">
                        Loading match data...
                      </p>
                    </div>
                  ) : (
                    <>
                      {groupsLoading && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full border border-border/30">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Refreshing
                          </span>
                        </div>
                      )}

                      {roundGroups.length === 0 ? (
                        <div className="space-y-6">
                          {/* Ready to Start Card */}
                          <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-5 border border-accent/20">
                              <Trophy className="h-8 w-8 text-accent" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                              Ready to Start{' '}
                              {roundNames?.[String(currentRound)] || `Round ${currentRound}`}?
                            </h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                              {tournament?.is_5v5 && currentRound > 1
                                ? 'Qualifying teams from the previous round are ready. Configure lobbies to begin.'
                                : 'Configure group settings and begin the tournament round'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              {tournament?.is_5v5 && currentRound > 1 ? (
                                /* 5v5 round 2+: advance from prev round (marks it complete) then show lobby preview */
                                <button
                                  onClick={() => handleAdvanceRound(currentRound - 1)}
                                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm sm:text-base transition-colors"
                                >
                                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                                  Configure Lobbies for{' '}
                                  {roundNames?.[String(currentRound)] || `Round ${currentRound}`}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartRound(currentRound || 1)}
                                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm sm:text-base transition-colors"
                                >
                                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                                  Start{' '}
                                  {roundNames?.[String(currentRound)] || `Round ${currentRound}`}
                                </button>
                              )}
                              {!tournament?.is_5v5 && (
                                <button
                                  onClick={() => setShowBracketGenerator(!showBracketGenerator)}
                                  className={`inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base transition-colors ${
                                    showBracketGenerator
                                      ? 'bg-red-700 hover:bg-red-800 text-white'
                                      : 'bg-red-600 hover:bg-red-700 text-white'
                                  }`}
                                >
                                  <Swords className="h-4 w-4 sm:h-5 sm:w-5" />
                                  {showBracketGenerator
                                    ? 'Hide Bracket Generator'
                                    : 'Show Bracket Generator'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Bracket Generator */}
                          {showBracketGenerator && !tournament?.is_5v5 && (
                            <div
                              className="mt-cyber-card p-0 overflow-hidden"
                              style={{ borderColor: 'hsl(var(--accent) / 0.3)' }}
                            >
                              {/* Header */}
                              <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border)/0.3)]">
                                <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold">
                                  <Trophy className="h-5 w-5 text-amber-400" />
                                  BGMI Bracket Generator
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-accent border border-accent/30 rounded-full px-2.5 py-0.5">
                                    {registrations?.length || tournament?.registered_count || 0}{' '}
                                    Teams
                                  </span>
                                  <button
                                    onClick={() => setBracketExpanded(!bracketExpanded)}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/50 transition-colors"
                                  >
                                    {bracketExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {bracketExpanded && (
                                <div className="p-4 space-y-5">
                                  {/* Total Teams Input */}
                                  <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-foreground">
                                      Total Teams
                                    </label>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      {registrations?.length || tournament?.registered_count || 0}{' '}
                                      teams registered
                                    </div>
                                  </div>

                                  {/* Select Bracket Template */}
                                  <div className="space-y-3">
                                    <label className="text-sm font-bold text-foreground">
                                      Select Bracket Template
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {bracketTemplates.map((tmpl) => (
                                        <button
                                          key={tmpl.id}
                                          onClick={() => {
                                            setSelectedBracketTemplate(tmpl.id);
                                            if (tmpl.id !== 'custom') {
                                              setBracketCustomRounds(
                                                tmpl.defaultRounds.map((r) => ({ ...r }))
                                              );
                                            }
                                          }}
                                          className={`text-left p-4 rounded-xl border-2 transition-all ${
                                            selectedBracketTemplate === tmpl.id
                                              ? 'border-accent bg-accent/10 shadow-[0_0_20px_hsl(var(--accent)/0.15)]'
                                              : 'border-[hsl(var(--border)/0.3)] bg-[hsl(var(--card))] hover:border-accent/30'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{tmpl.icon}</span>
                                            <span className="font-bold text-sm">{tmpl.name}</span>
                                          </div>
                                          <p className="text-[11px] text-muted-foreground mb-3">
                                            {tmpl.description}
                                          </p>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {tmpl.stages.map((stage, si) => (
                                              <div key={si} className="flex items-center gap-1">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                                                  {stage}
                                                </span>
                                                {si < tmpl.stages.length - 1 && (
                                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Custom Rounds Config */}
                                  {selectedBracketTemplate === 'custom' && (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-foreground">
                                          Custom Rounds
                                        </label>
                                        <button
                                          onClick={() =>
                                            setBracketCustomRounds((prev) => [
                                              ...prev,
                                              {
                                                name: `Round ${prev.length + 1}`,
                                                groups: 1,
                                                teamsPerGroup: 16,
                                                matchesPerGroup: 4,
                                                advancePerGroup: 8,
                                              },
                                            ])
                                          }
                                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded border border-border/50 hover:bg-secondary/50 transition-colors"
                                        >
                                          <Plus className="h-3 w-3" /> Add Round
                                        </button>
                                      </div>
                                      {bracketCustomRounds.map((round, ri) => (
                                        <div
                                          key={ri}
                                          className="p-4 rounded-xl bg-secondary/10 border border-border/30 space-y-3"
                                        >
                                          <div className="flex items-center justify-between">
                                            <input
                                              value={round.name}
                                              onChange={(e) => {
                                                const updated = [...bracketCustomRounds];
                                                updated[ri] = {
                                                  ...updated[ri],
                                                  name: e.target.value,
                                                };
                                                setBracketCustomRounds(updated);
                                              }}
                                              className="h-8 w-40 text-sm font-bold bg-secondary/30 border border-border/30 rounded px-2 text-foreground"
                                            />
                                            {bracketCustomRounds.length > 1 && (
                                              <button
                                                onClick={() =>
                                                  setBracketCustomRounds((prev) =>
                                                    prev.filter((_, i) => i !== ri)
                                                  )
                                                }
                                                className="text-red-400 hover:text-red-300"
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                              { key: 'groups', label: 'Groups' },
                                              { key: 'teamsPerGroup', label: 'Teams/Group' },
                                              { key: 'matchesPerGroup', label: 'Matches/Group' },
                                              { key: 'advancePerGroup', label: 'Advance/Group' },
                                            ].map(({ key, label }) => (
                                              <div key={key} className="space-y-1">
                                                <label className="text-[10px] text-muted-foreground">
                                                  {label}
                                                </label>
                                                <input
                                                  type="number"
                                                  value={round[key]}
                                                  onChange={(e) => {
                                                    const updated = [...bracketCustomRounds];
                                                    updated[ri] = {
                                                      ...updated[ri],
                                                      [key]: parseInt(e.target.value) || 1,
                                                    };
                                                    setBracketCustomRounds(updated);
                                                  }}
                                                  className="w-full h-9 bg-secondary/30 border border-border/30 rounded px-2 text-sm text-foreground"
                                                  min={1}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Bracket Overview Preview */}
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-foreground">
                                      Bracket Preview
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <div className="flex items-center gap-2 pb-2 min-w-max px-1">
                                        {/* Starting Teams */}
                                        <div className="flex flex-col items-center p-3 rounded-lg bg-accent/10 border border-accent/30 min-w-[100px]">
                                          <Users className="h-5 w-5 text-accent mb-1" />
                                          <span className="text-lg font-bold text-accent">
                                            {registrations?.length ||
                                              tournament?.registered_count ||
                                              0}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground uppercase">
                                            Teams Start
                                          </span>
                                        </div>

                                        {bracketCustomRounds.map((round, ri) => {
                                          const teamsIn = round.groups * round.teamsPerGroup;
                                          const teamsOut = round.advancePerGroup * round.groups;
                                          const eliminated = teamsIn - teamsOut;
                                          return (
                                            <div key={ri} className="flex items-center">
                                              <div className="flex flex-col items-center mx-2">
                                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                                {eliminated > 0 && (
                                                  <span className="text-[9px] text-red-400 flex items-center gap-0.5 mt-0.5">
                                                    <TrendingDown className="h-3 w-3" />-
                                                    {eliminated}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex flex-col items-center p-3 rounded-lg border bg-secondary/20 border-border/40 min-w-[110px]">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground mb-2">
                                                  {round.name}
                                                </span>
                                                <span className="text-lg font-bold text-foreground">
                                                  {teamsOut}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">
                                                  Teams
                                                </span>
                                                <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                                                  <span>{round.groups} Groups</span>
                                                  <span>&bull;</span>
                                                  <span>{round.matchesPerGroup} Matches</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}

                                        {/* Winner */}
                                        <div className="flex items-center">
                                          <ArrowRight className="h-5 w-5 text-yellow-500 mx-2" />
                                          <div className="flex flex-col items-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 min-w-[100px]">
                                            <Trophy className="h-5 w-5 text-yellow-500 mb-1" />
                                            <span className="text-lg font-bold text-yellow-500">
                                              1
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase">
                                              Winner
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Round Details Summary */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {bracketCustomRounds.map((round, ri) => {
                                      const teamsIn = round.groups * round.teamsPerGroup;
                                      const teamsOut = round.advancePerGroup * round.groups;
                                      const eliminated = teamsIn - teamsOut;
                                      return (
                                        <div
                                          key={ri}
                                          className={`p-2 rounded-lg border text-center ${
                                            ri === 0
                                              ? 'bg-accent/10 border-accent/30'
                                              : 'bg-secondary/10 border-border/30'
                                          }`}
                                        >
                                          <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
                                            {round.name}
                                          </div>
                                          <div className="flex items-center justify-center gap-2 text-xs">
                                            <span className="text-foreground font-medium">
                                              {teamsIn}
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-accent font-bold">
                                              {teamsOut}
                                            </span>
                                          </div>
                                          <div className="text-[9px] text-red-400 mt-0.5">
                                            -{eliminated} eliminated
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Info note */}
                                  <p className="text-xs text-muted-foreground text-center">
                                    This is a visual reference for your tournament structure. Use
                                    "Start Round" above to configure the actual round.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bracket Preview Section (shown when bracket has been generated from template) */}
                          {bracketGenerated && !showBracketGenerator && (
                            <div className="mt-cyber-card p-4">
                              <h4 className="text-sm font-bold flex items-center gap-2 text-green-400 mb-3">
                                <svg
                                  className="h-4 w-4"
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
                                Bracket Generated — Quick Overview
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                {bracketCustomRounds.map((round, ri) => (
                                  <div key={ri} className="flex items-center gap-1.5">
                                    <div
                                      className={`px-3 py-2 rounded-lg border text-center ${ri === 0 ? 'bg-accent/10 border-accent/30' : 'bg-secondary/10 border-border/30'}`}
                                    >
                                      <div className="text-xs font-bold">{round.name}</div>
                                      <div className="text-[9px] text-muted-foreground">
                                        {round.groups * round.teamsPerGroup} teams
                                      </div>
                                      <div className="text-[9px] text-muted-foreground">
                                        {round.groups}G × {round.matchesPerGroup}M
                                      </div>
                                      <div className="text-[9px] text-green-400">
                                        {round.advancePerGroup * round.groups} advance
                                      </div>
                                    </div>
                                    {ri < bracketCustomRounds.length - 1 && (
                                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                ))}
                                <div className="flex items-center gap-1.5">
                                  <ArrowRight className="h-4 w-4 text-yellow-500" />
                                  <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                                    <Trophy className="h-4 w-4 text-yellow-500 mx-auto" />
                                    <div className="text-[9px] text-muted-foreground">Winner</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Group / Lobby Selector */}
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-foreground">
                                  {tournament?.is_5v5 ? 'Lobbies' : 'Groups'}
                                </h3>
                                <p className="text-muted-foreground text-xs mt-0.5">
                                  {roundGroups.length} {tournament?.is_5v5 ? 'lobby' : 'group'}
                                  {roundGroups.length !== 1 ? 's' : ''} active
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {roundGroups.length > 0 && (
                                  <button
                                    onClick={handleResetRound}
                                    className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                                  >
                                    Reconfigure
                                  </button>
                                )}
                              </div>
                            </div>

                            {tournament?.is_5v5 ? (
                              /* ── 5v5 Lovable-style lobby cards ── */
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
                                {roundGroups.map((group, gi) => {
                                  const lobbyMapNames = [
                                    'Bind',
                                    'Haven',
                                    'Split',
                                    'Ascent',
                                    'Icebox',
                                    'Breeze',
                                    'Fracture',
                                    'Pearl',
                                    'Lotus',
                                    'Sunset',
                                    'Abyss',
                                  ];
                                  const mapName =
                                    group.matches?.[0]?.map_name ||
                                    lobbyMapNames[gi % lobbyMapNames.length];
                                  const hasLiveMatch = group.matches?.some(
                                    (m) => m.status === 'ongoing'
                                  );
                                  const completedMatches =
                                    group.matches?.filter((m) => m.status === 'completed').length ||
                                    0;
                                  const totalMatches = group.matches?.length || 0;
                                  const allComplete =
                                    totalMatches > 0 && completedMatches === totalMatches;
                                  const teamA = group.teams?.[0];
                                  const teamB = group.teams?.[1];
                                  const getTag = (t) =>
                                    (t?.team_name || t?.name || '???')
                                      .substring(0, 3)
                                      .toUpperCase();
                                  const getName = (t) =>
                                    t?.team_name || t?.name || `Team ${t?.id || '?'}`;
                                  const credMatch =
                                    group.matches?.find((m) => m.match_id) || group.matches?.[0];
                                  const roomId = credMatch?.match_id || group.room_id;
                                  const password = credMatch?.match_password || group.password;
                                  // Winner + scores from submitted scores
                                  const doneMatch = group.matches?.find(
                                    (m) => m.status === 'completed' && m.scores_submitted
                                  );
                                  const scores = doneMatch?.scores || [];
                                  const hasScores =
                                    scores.length > 0 && scores.some((s) => s.total_points > 0);
                                  const winnerScore = hasScores
                                    ? scores.reduce(
                                        (a, b) => (b.total_points > a.total_points ? b : a),
                                        scores[0]
                                      )
                                    : null;
                                  const getScoreFor = (team) =>
                                    scores.find(
                                      (s) => s.team_name === (team?.team_name || team?.name)
                                    );

                                  return (
                                    <div
                                      key={group.id}
                                      className={`bg-card rounded-xl border transition-all ${
                                        allComplete
                                          ? 'border-green-500/30'
                                          : hasLiveMatch
                                            ? 'border-destructive/50'
                                            : 'border-border/50'
                                      }`}
                                    >
                                      {/* Card Header */}
                                      <div className="flex items-center justify-between p-3 sm:p-4 pb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded bg-accent/10">
                                            <Swords className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                                          </div>
                                          <span className="font-semibold text-sm sm:text-base">
                                            {group.group_name}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <svg
                                              className="h-2.5 w-2.5"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                              />
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                              />
                                            </svg>
                                            {mapName}
                                          </span>
                                        </div>
                                        <span
                                          className={`inline-flex items-center text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-medium ${
                                            allComplete
                                              ? 'bg-green-500/20 text-green-500 border-green-500/30'
                                              : hasLiveMatch
                                                ? 'bg-destructive/20 text-destructive border-destructive/30 animate-pulse'
                                                : 'bg-secondary/50 text-muted-foreground border-border/40'
                                          }`}
                                        >
                                          {allComplete
                                            ? 'Complete'
                                            : hasLiveMatch
                                              ? 'LIVE'
                                              : 'Pending'}
                                        </span>
                                      </div>

                                      {/* Teams */}
                                      <div className="px-3 sm:px-4 space-y-2 pb-3 sm:pb-4">
                                        {/* Team A */}
                                        {(() => {
                                          const scoreA = getScoreFor(teamA);
                                          const isWinnerA =
                                            winnerScore &&
                                            winnerScore.team_name ===
                                              (teamA?.team_name || teamA?.name);
                                          return (
                                            <div
                                              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg border transition-all ${isWinnerA ? 'bg-green-500/10 border-green-500/50' : 'bg-secondary/20 border-border/30'}`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent shrink-0">
                                                  {getTag(teamA)}
                                                </span>
                                                <span className="font-medium text-xs sm:text-sm">
                                                  {getName(teamA)}
                                                </span>
                                                {isWinnerA && (
                                                  <Trophy className="h-3 w-3 text-yellow-500" />
                                                )}
                                              </div>
                                              {scoreA && (
                                                <span className="font-bold text-sm sm:text-base text-foreground">
                                                  {scoreA.total_points}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })()}

                                        {/* VS divider */}
                                        <div className="flex items-center justify-center">
                                          <span className="text-xs text-muted-foreground px-2">
                                            VS
                                          </span>
                                        </div>

                                        {/* Team B */}
                                        {teamB ? (
                                          (() => {
                                            const scoreB = getScoreFor(teamB);
                                            const isWinnerB =
                                              winnerScore &&
                                              winnerScore.team_name ===
                                                (teamB?.team_name || teamB?.name);
                                            return (
                                              <div
                                                className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg border transition-all ${isWinnerB ? 'bg-green-500/10 border-green-500/50' : 'bg-secondary/20 border-border/30'}`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent shrink-0">
                                                    {getTag(teamB)}
                                                  </span>
                                                  <span className="font-medium text-xs sm:text-sm">
                                                    {getName(teamB)}
                                                  </span>
                                                  {isWinnerB && (
                                                    <Trophy className="h-3 w-3 text-yellow-500" />
                                                  )}
                                                </div>
                                                {scoreB && (
                                                  <span className="font-bold text-sm sm:text-base text-foreground">
                                                    {scoreB.total_points}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })()
                                        ) : (
                                          <div className="flex items-center p-2 sm:p-2.5 rounded-lg bg-secondary/10 border border-border/20 opacity-50">
                                            <span className="text-xs text-accent italic">
                                              BYE — Advances free
                                            </span>
                                          </div>
                                        )}

                                        {/* Credentials (if available) */}
                                        {roomId && (
                                          <div className="p-2 sm:p-3 bg-accent/10 rounded-lg border border-accent/20">
                                            <span className="text-[10px] sm:text-xs font-medium text-accent flex items-center gap-1 mb-2">
                                              <svg
                                                className="h-3 w-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth="2"
                                                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                                />
                                              </svg>
                                              Credentials
                                            </span>
                                            <div
                                              className={`grid gap-2 ${password && tournament?.requires_password ? 'grid-cols-2' : 'grid-cols-1'}`}
                                            >
                                              <div className="flex items-center justify-between bg-background/50 px-2 py-1.5 rounded">
                                                <div>
                                                  <div className="text-[10px] text-muted-foreground">
                                                    Room ID
                                                  </div>
                                                  <div className="font-mono font-semibold text-xs sm:text-sm">
                                                    {roomId}
                                                  </div>
                                                </div>
                                                <button
                                                  type="button"
                                                  className="ml-2 p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                                                  onClick={() =>
                                                    navigator.clipboard?.writeText(roomId)
                                                  }
                                                  title="Copy Room ID"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </div>
                                              {password && (
                                                <div className="flex items-center justify-between bg-background/50 px-2 py-1.5 rounded">
                                                  <div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                      Password
                                                    </div>
                                                    <div className="font-mono font-semibold text-xs sm:text-sm">
                                                      {password}
                                                    </div>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    className="ml-2 p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                                                    onClick={() =>
                                                      navigator.clipboard?.writeText(password)
                                                    }
                                                    title="Copy Password"
                                                  >
                                                    <Copy className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-1">
                                          {allComplete ? (
                                            hasScores && winnerScore ? (
                                              /* Winner declared — show winner banner */
                                              <div className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-green-500/15 rounded-lg text-xs sm:text-sm text-green-500 font-semibold border border-green-500/20">
                                                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                                Winner: {winnerScore.team_name}
                                              </div>
                                            ) : (
                                              /* No scores yet — show Match Complete + Enter Points */
                                              <>
                                                <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 bg-green-500/15 rounded-lg text-xs sm:text-sm text-green-500 font-semibold border border-green-500/20">
                                                  <svg
                                                    className="h-3.5 w-3.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth="2"
                                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                  </svg>
                                                  Match Complete
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    setSelectedGroup(group);
                                                    const completedMatch = group.matches?.find(
                                                      (m) => m.status === 'completed'
                                                    );
                                                    if (completedMatch)
                                                      handleEnterPoints(completedMatch);
                                                  }}
                                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg font-semibold transition-colors bg-secondary/60 hover:bg-secondary text-foreground border border-border/40"
                                                >
                                                  <Trophy className="h-3.5 w-3.5" />
                                                  Enter Points
                                                </button>
                                              </>
                                            )
                                          ) : hasLiveMatch ? (
                                            <button
                                              onClick={() => {
                                                setSelectedGroup(group);
                                                const liveMatch = group.matches?.find(
                                                  (m) => m.status === 'ongoing'
                                                );
                                                if (liveMatch) handleEndMatch(liveMatch);
                                              }}
                                              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg font-semibold transition-colors text-white bg-red-500 hover:bg-red-600"
                                            >
                                              <svg
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <rect x="6" y="6" width="12" height="12" rx="1" />
                                              </svg>
                                              End Match
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setSelectedGroup(group);
                                                const firstMatch = group.matches?.[0];
                                                if (firstMatch) handleStartMatch(firstMatch);
                                              }}
                                              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg font-semibold transition-colors text-white bg-accent hover:bg-accent/90"
                                            >
                                              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                              Start Match
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* ── BR mode: small group selector grid ── */
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                                {roundGroups.map((group, gi) => {
                                  const completedMatches =
                                    group.matches?.filter((m) => m.status === 'completed').length ||
                                    0;
                                  const totalMatches = group.matches?.length || 0;
                                  const progressPercent =
                                    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
                                  const isSelected = selectedGroup?.id === group.id;
                                  const hasLiveMatch = group.matches?.some(
                                    (m) => m.status === 'ongoing'
                                  );
                                  const allComplete =
                                    totalMatches > 0 && completedMatches === totalMatches;
                                  const hasInProgress = completedMatches > 0 && !allComplete;

                                  return (
                                    <div key={group.id} className="relative group/card">
                                      <div
                                        onClick={() => setSelectedGroup(group)}
                                        className={`relative p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                                          isSelected
                                            ? 'border-accent bg-accent/10 ring-2 ring-accent/30'
                                            : allComplete
                                              ? 'border-green-500/50 bg-green-500/10'
                                              : hasLiveMatch
                                                ? 'border-red-500/50 bg-red-500/10 animate-pulse'
                                                : hasInProgress
                                                  ? 'border-yellow-500/50 bg-yellow-500/10'
                                                  : 'border-border/50 bg-secondary/30 hover:border-accent/50'
                                        }`}
                                      >
                                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                                          {allComplete && (
                                            <svg
                                              className="h-4 w-4 sm:h-5 sm:w-5 text-green-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                          )}
                                          {hasLiveMatch && (
                                            <div className="flex items-center gap-1">
                                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse" />
                                              <span className="text-[8px] sm:text-[10px] text-red-400 font-bold">
                                                LIVE
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 ${
                                            allComplete
                                              ? 'text-green-400 border-green-500'
                                              : hasLiveMatch
                                                ? 'text-red-400 border-red-500'
                                                : 'text-accent border-accent'
                                          }`}
                                        >
                                          {group.group_name}
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                                          {group.teams?.length || 0} teams
                                        </div>
                                        <div className="h-1.5 sm:h-2 bg-secondary/50 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full transition-all duration-500 ${allComplete ? 'bg-green-500' : 'bg-accent'}`}
                                            style={{ width: `${progressPercent}%` }}
                                          />
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                          {completedMatches}/{totalMatches} matches
                                        </div>
                                      </div>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover/card:block pointer-events-none">
                                        <div className="bg-popover border border-border/50 rounded-lg p-3 shadow-xl min-w-[160px] text-xs space-y-1.5">
                                          <p className="font-semibold text-foreground">
                                            {group.group_name} Summary
                                          </p>
                                          <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Teams:</span>
                                            <span className="font-medium">
                                              {group.teams?.length || 0}
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span
                                              className={`font-medium ${allComplete ? 'text-green-400' : hasLiveMatch ? 'text-red-400' : hasInProgress ? 'text-yellow-400' : 'text-muted-foreground'}`}
                                            >
                                              {allComplete
                                                ? 'Complete'
                                                : hasLiveMatch
                                                  ? 'Live'
                                                  : hasInProgress
                                                    ? 'In Progress'
                                                    : 'Idle'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Progress:</span>
                                            <span className="font-medium">
                                              {completedMatches}/{totalMatches} matches
                                            </span>
                                          </div>
                                        </div>
                                        <div className="w-2 h-2 bg-popover border-b border-r border-border/50 rotate-45 mx-auto -mt-1" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Selected Group Management View — BR only (5v5 uses lobby cards above) */}
                          {selectedGroup && !tournament?.is_5v5 && (
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

                          {/* Config Summary Cards — BR only, not 5v5 */}
                          {!tournament?.is_5v5 &&
                            (() => {
                              const allGroupsCompleted =
                                roundGroups.length > 0 &&
                                roundGroups.every((g) => g.status === 'completed');
                              const isFinalRound =
                                tournament.rounds.findIndex((r) => r.round === currentRound) ===
                                tournament.rounds.length - 1;
                              const teamsPerGroupVal =
                                roundGroups.length > 0
                                  ? Math.max(...roundGroups.map((g) => g.teams?.length || 0))
                                  : currentRoundConfig?.max_teams || '—';
                              const teamsQualifyVal =
                                roundGroups[0]?.qualifying_teams ?? qualifyingTeams;
                              const liveMatchesCount = roundGroups.reduce(
                                (acc, g) =>
                                  acc +
                                  (g.matches?.filter((m) => m.status === 'ongoing').length || 0),
                                0
                              );
                              const completedGroupsCount = roundGroups.filter(
                                (g) => g.status === 'completed'
                              ).length;

                              return (
                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {/* Round Config */}
                                  <div className="bg-card/60 border border-accent/20 rounded-lg p-3 sm:p-4 hover:border-accent/40 transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                      <span className="font-semibold text-sm sm:text-base">
                                        Round Config
                                      </span>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Teams per Group
                                        </span>
                                        <span className="font-bold text-accent">
                                          {teamsPerGroupVal}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Teams Qualify</span>
                                        <span className="font-bold text-green-400">
                                          {teamsQualifyVal}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Groups</span>
                                        <span className="font-bold">{roundGroups.length}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress */}
                                  <div className="bg-card/60 border border-accent/20 rounded-lg p-3 sm:p-4 hover:border-accent/40 transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                                      <span className="font-semibold text-sm sm:text-base">
                                        Progress
                                      </span>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Groups Complete
                                        </span>
                                        <span className="font-bold text-green-400">
                                          {completedGroupsCount}/{roundGroups.length}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Live Matches</span>
                                        <span className="font-bold text-red-400">
                                          {liveMatchesCount}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Next Action */}
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 flex flex-col justify-center items-center min-h-[80px]">
                                    {allGroupsCompleted ? (
                                      <button
                                        onClick={() => handleAdvanceRound()}
                                        className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg text-sm font-bold bg-white hover:bg-gray-100 text-black transition-colors shadow-sm"
                                      >
                                        {isFinalRound
                                          ? 'End Tournament'
                                          : `Advance to ${roundNames?.[String(currentRound + 1)] || `Round ${currentRound + 1}`}`}
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                    ) : (
                                      <div className="text-center text-muted-foreground text-xs sm:text-sm">
                                        Complete all groups to finalize round
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                          {/* Round Results — BR only */}
                          {!tournament?.is_5v5 && (
                            <div className="mt-6 space-y-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Round Results
                              </h4>
                              {tournament?.rounds?.map((r, idx) => {
                                const rNum = r.round;
                                if (rNum > currentRound) return null;
                                const rName = roundNames?.[String(rNum)] || `Round ${rNum}`;
                                const rGroups =
                                  idx === currentRound - 1
                                    ? roundGroups
                                    : pastRoundsGroups[rNum] || [];
                                return (
                                  <div key={rNum} className="space-y-1.5">
                                    <p className="text-xs font-medium text-purple-400">{rName}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {rGroups.map((g, gi) => {
                                        const gComplete = g.status === 'completed';
                                        const hasData = g.matches?.some(
                                          (m) => m.status === 'completed'
                                        );
                                        return (
                                          <button
                                            key={gi}
                                            disabled={!hasData && !gComplete}
                                            onClick={() => {
                                              setSelectedGroup(g);
                                            }}
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                                              gComplete
                                                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                                : hasData
                                                  ? 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10'
                                                  : 'border-border/30 text-muted-foreground/40 cursor-not-allowed'
                                            }`}
                                          >
                                            <svg
                                              className="w-3 h-3"
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
                                            {rName} Group {String.fromCharCode(65 + gi)}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
      <RoundConfigModal
        isOpen={showRoundConfigModal}
        onClose={() => setShowRoundConfigModal(false)}
        onSubmit={handleSubmitRoundConfig}
        onReset={handleResetRound}
        isRoundConfigured={roundGroups.length > 0}
        roundNumber={currentRound === 0 ? 1 : currentRound}
        totalTeams={
          currentRound <= 1
            ? registrations.filter((r) => r.status === 'confirmed' || r.status === 'approved')
                .length
            : tournament.selected_teams?.[String(currentRound - 1)]?.length || 0
        }
        isFinalRound={(currentRound === 0 ? 1 : currentRound) === tournament.rounds?.length}
        tournament={tournament}
        teamList={
          currentRound <= 1
            ? registrations
                .filter((r) => r.status === 'confirmed' || r.status === 'approved')
                .map((r) => ({ team_name: r.team_name, id: r.team }))
            : tournament.selected_teams?.[String(currentRound - 1)] || []
        }
      />

      {/* Group Confirmation Modal — shown between RoundConfigModal and API call */}
      <GroupConfirmModal
        isOpen={showGroupConfirmModal}
        onClose={() => {
          setShowGroupConfirmModal(false);
          // Go back to config modal so user can adjust
          setShowRoundConfigModal(true);
        }}
        onConfirm={() => handleConfirmedRoundConfig(pendingRoundConfig?.configData)}
        roundName={tournament?.round_names?.[String(currentRound)] || `Round ${currentRound}`}
        groups={pendingRoundConfig?.pendingGroups || []}
        teamsPerGroup={pendingRoundConfig?.configData?.teams_per_group}
        qualifying={pendingRoundConfig?.configData?.qualifying_per_group}
        matches={pendingRoundConfig?.configData?.matches_per_group}
        loading={loading}
      />

      {/* Match Config Modal */}
      <MatchConfigModal
        isOpen={showMatchConfigModal}
        onClose={() => setShowMatchConfigModal(false)}
        onSubmit={handleSubmitMatchConfig}
        onSaveOnly={handleSaveOnlyMatchConfig}
        mode={currentMatch?.status === 'ongoing' ? 'edit' : 'start'}
        matchNumber={currentMatch?.match_number}
        groupName={selectedGroup?.group_name}
        initialMatchId={currentMatch?.match_id || ''}
        initialMatchPassword={currentMatch?.match_password || ''}
        is5v5Game={tournament?.is_5v5 || false}
        requiresPassword={tournament?.requires_password ?? true}
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
        defaultRound={bulkScheduleRound ?? currentRound}
        onSuccess={() => {
          showToast('Matches scheduled successfully!', 'success');
          fetchRoundGroups(bulkScheduleRound ?? currentRound);
        }}
      />

      {/* Teams Modal */}
      {showTeamsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="mt-cyber-card w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-[hsl(var(--border)/0.3)]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                    Registered Teams
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {tournament.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTeamsModal(false);
                    setTeamsTab('active');
                  }}
                  className="w-8 h-8 rounded-lg border border-[hsl(var(--border)/0.5)] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTeamsTab('active')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    teamsTab === 'active'
                      ? 'bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] border border-[hsl(var(--accent)/0.3)]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] border border-transparent'
                  }`}
                >
                  Active (
                  {
                    registrations.filter(
                      (r) =>
                        r.status === 'confirmed' ||
                        r.status === 'approved' ||
                        r.status === 'pending'
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setTeamsTab('rejected')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    teamsTab === 'rejected'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] border border-transparent'
                  }`}
                >
                  Rejected ({registrations.filter((r) => r.status === 'rejected').length})
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              {teamsTab === 'active' ? (
                // Active Teams Tab
                registrations.filter(
                  (reg) =>
                    reg.status === 'confirmed' ||
                    reg.status === 'approved' ||
                    reg.status === 'pending'
                ).length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      No active teams registered yet
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Approve All Button */}
                    {registrations.filter((reg) => reg.status === 'pending').length > 0 && (
                      <div className="mb-4 flex justify-end">
                        <button
                          onClick={async () => {
                            const pendingTeams = registrations.filter(
                              (r) => r.status === 'pending'
                            );
                            setConfirmModal({
                              isOpen: true,
                              title: 'Approve All Pending',
                              message: `Approve all ${pendingTeams.length} pending teams?`,
                              confirmText: 'Approve All',
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
                                  showToast(`Approved ${pendingTeams.length} teams!`);
                                  fetchTournamentData();
                                } catch (error) {
                                  showToast('Operation failed partially.', 'error');
                                }
                              },
                            });
                          }}
                          className="px-4 py-2 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.9)] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          Approve All (
                          {registrations.filter((reg) => reg.status === 'pending').length})
                        </button>
                      </div>
                    )}
                    <div className="grid gap-2">
                      {registrations
                        .filter(
                          (reg) =>
                            reg.status === 'confirmed' ||
                            reg.status === 'approved' ||
                            reg.status === 'pending'
                        )
                        .map((reg) => (
                          <div key={reg.id} className="info-grid-card p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent)/0.15)] border border-[hsl(var(--accent)/0.3)] flex items-center justify-center text-[hsl(var(--accent))] font-bold text-sm flex-shrink-0">
                                  {(reg.team_name || reg.player?.user?.username || '?')
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                                    {reg.team_name || reg.player?.user?.username || 'Unknown'}
                                  </h3>
                                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                    Lead: {reg.player?.user?.username || 'Unknown'}
                                  </p>
                                </div>
                              </div>

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
                                          showToast('Team approved');
                                          fetchTournamentData();
                                        } catch (error) {
                                          showToast('Approval failed');
                                        }
                                      }}
                                      className="w-7 h-7 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center justify-center transition-colors text-xs"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={async () => {
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Reject Team',
                                          message: `Reject ${reg.team_name || reg.player?.user?.username}?`,
                                          confirmText: 'Reject',
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
                                              showToast('Operation failed', 'error');
                                            }
                                          },
                                        });
                                      }}
                                      className="w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-md flex items-center justify-center transition-colors text-xs"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 text-[0.6875rem] font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    Approved
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )
              ) : registrations.filter((reg) => reg.status === 'rejected').length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No rejected teams</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {registrations
                    .filter((reg) => reg.status === 'rejected')
                    .map((reg) => (
                      <div key={reg.id} className="info-grid-card p-3 opacity-75">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[hsl(var(--secondary)/0.5)] flex items-center justify-center text-[hsl(var(--muted-foreground))] font-bold text-sm flex-shrink-0">
                              {(reg.team_name || reg.player?.user?.username || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] truncate">
                                {reg.team_name || reg.player?.user?.username || 'Unknown'}
                              </h3>
                              <p className="text-xs text-red-400/60">Rejected</p>
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
                                showToast('Team restored');
                                fetchTournamentData();
                              } catch (error) {
                                showToast('Restore failed');
                              }
                            }}
                            className="mt-action-btn"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[hsl(var(--border)/0.3)] flex justify-end">
              <button
                onClick={() => setShowTeamsModal(false)}
                className="px-4 py-2 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.8)] text-[hsl(var(--foreground))] rounded-lg text-sm font-medium transition-colors"
              >
                Close
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

      {/* Live Stream URL Dialog */}
      {showLiveUrlDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="mt-cyber-card w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-[hsl(var(--border)/0.3)]">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <Video className="h-5 w-5 text-red-500" />
                Publish Live Stream
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1.5">
                  Live Stream URL
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/live/..."
                  value={tempLiveUrl}
                  onChange={(e) => setTempLiveUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border)/0.3)] rounded-lg text-[hsl(var(--foreground))] text-sm focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5">
                  Players will see this link in the tournament details page.
                </p>
              </div>

              {tempLiveUrl && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Preview:</p>
                  <a
                    href={tempLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-red-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{tempLiveUrl}</span>
                  </a>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[hsl(var(--border)/0.3)] flex flex-col sm:flex-row gap-2 justify-end">
              {tournament.live_link && (
                <button
                  onClick={() => {
                    setTempLiveUrl('');
                    handleSaveLiveUrl();
                  }}
                  className="mt-action-btn text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  Remove Stream
                </button>
              )}
              <button onClick={() => setShowLiveUrlDialog(false)} className="mt-action-btn">
                Cancel
              </button>
              <button
                onClick={handleSaveLiveUrl}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 justify-center"
              >
                <Video className="h-3.5 w-3.5" />
                {tournament.live_link ? 'Update' : 'Publish'} Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Overview Dialog */}
      {showOverviewDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="mt-cyber-card w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-[hsl(var(--border)/0.3)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <Info className="h-5 w-5 text-[hsl(var(--accent))]" />
                Tournament Overview
              </h2>
              <button
                onClick={() => setShowOverviewDialog(false)}
                className="w-8 h-8 rounded-lg border border-[hsl(var(--border)/0.5)] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
              {/* Title + Status */}
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-[hsl(var(--foreground))] truncate">
                  {tournament.title}
                </h3>
                <span
                  className={
                    tournament.status === 'ongoing'
                      ? 'mt-status-live'
                      : tournament.status === 'upcoming'
                        ? 'mt-status-upcoming'
                        : 'mt-status-completed'
                  }
                >
                  {tournament.status}
                </span>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="mt-stat-tile items-center text-center">
                  <span className="text-xl font-bold text-[hsl(var(--accent))]">
                    {tournament.current_participants}
                  </span>
                  <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                    Registered
                  </span>
                </div>
                <div className="mt-stat-tile items-center text-center">
                  <span className="text-xl font-bold text-[hsl(var(--foreground))]">
                    {tournament.max_participants}
                  </span>
                  <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                    Max Teams
                  </span>
                </div>
                <div className="mt-stat-tile items-center text-center">
                  <span className="text-xl font-bold text-green-400">
                    ₹{Number(tournament.prize_pool || 0).toLocaleString()}
                  </span>
                  <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                    Prize Pool
                  </span>
                </div>
                <div className="mt-stat-tile items-center text-center">
                  <span className="text-xl font-bold text-amber-400">
                    {Math.max(0, tournament.max_participants - tournament.current_participants)}
                  </span>
                  <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                    Slots Left
                  </span>
                </div>
              </div>

              {/* Tournament Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Game', value: tournament.game_name },
                  { label: 'Format', value: tournament.game_mode },
                  { label: 'Entry Fee', value: `₹${tournament.entry_fee}` },
                  {
                    label: 'Prize Pool',
                    value: `₹${Number(tournament.prize_pool || 0).toLocaleString()}`,
                  },
                  {
                    label: 'Registration Start',
                    value: tournament.registration_start
                      ? new Date(tournament.registration_start).toLocaleDateString()
                      : '—',
                  },
                  {
                    label: 'Match Start',
                    value: tournament.tournament_start
                      ? new Date(tournament.tournament_start).toLocaleString()
                      : '—',
                  },
                  {
                    label: 'Current Round',
                    value:
                      currentRound > 0
                        ? roundNames?.[String(currentRound)] || `Round ${currentRound}`
                        : 'Not started',
                  },
                  { label: 'Total Rounds', value: tournament.rounds?.length || 0 },
                  { label: 'Event Mode', value: tournament.event_mode },
                  {
                    label: 'Plan',
                    value:
                      tournament.plan_type?.charAt(0).toUpperCase() +
                      tournament.plan_type?.slice(1),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-2.5 bg-[hsl(var(--secondary)/0.15)] rounded-lg border border-[hsl(var(--border)/0.1)]"
                  >
                    <span className="text-[hsl(var(--muted-foreground))]">{item.label}</span>
                    <span className="font-semibold text-[hsl(var(--foreground))]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Revenue Summary */}
              {(() => {
                const totalRevenue =
                  Number(tournament.entry_fee || 0) * tournament.current_participants;
                const prizePool = Number(tournament.prize_pool || 0);
                const net = totalRevenue - prizePool;
                return (
                  <div className="info-grid-card p-4">
                    <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      Revenue Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          ₹{totalRevenue.toLocaleString()}
                        </div>
                        <div className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                          Total Revenue
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-400">
                          ₹{prizePool.toLocaleString()}
                        </div>
                        <div className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                          Prize Payout
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-lg font-bold ${net >= 0 ? 'text-[hsl(var(--accent))]' : 'text-red-400'}`}
                        >
                          ₹{net.toLocaleString()}
                        </div>
                        <div className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                          Net Profit
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Platform Metrics */}
              <div>
                <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[hsl(var(--accent))]" />
                  Platform Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="mt-stat-tile items-center text-center">
                    <span className="text-lg font-bold text-blue-400">
                      {tournament.max_participants > 0
                        ? Math.round(
                            (tournament.current_participants / tournament.max_participants) * 100
                          )
                        : 0}
                      %
                    </span>
                    <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                      Fill Rate
                    </span>
                  </div>
                  <div className="mt-stat-tile items-center text-center">
                    <span className="text-lg font-bold text-[hsl(var(--accent))]">
                      {tournament.current_participants}
                    </span>
                    <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                      Teams
                    </span>
                  </div>
                  <div className="mt-stat-tile items-center text-center">
                    <span className="text-lg font-bold text-green-400">
                      ₹
                      {tournament.current_participants > 0
                        ? Math.round(Number(tournament.entry_fee || 0))
                        : 0}
                    </span>
                    <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                      Rev/Team
                    </span>
                  </div>
                  <div className="mt-stat-tile items-center text-center">
                    <span className="text-lg font-bold text-amber-400">
                      {roundGroups.length || 0}
                    </span>
                    <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                      Groups
                    </span>
                  </div>
                </div>
              </div>

              {/* Round Progress */}
              {tournament.rounds && tournament.rounds.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[hsl(var(--accent))]" />
                    Round Progress
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {tournament.rounds.map((round) => {
                      const rNum = round.round;
                      const rStatus = getRoundStatus(rNum);
                      const rName =
                        roundNames?.[String(rNum)] ||
                        tournament.round_names?.[String(rNum)] ||
                        `Round ${rNum}`;
                      return (
                        <div
                          key={rNum}
                          className={`text-center p-2.5 rounded-lg border ${
                            rStatus === 'ongoing'
                              ? 'bg-[hsl(var(--accent)/0.1)] border-[hsl(var(--accent)/0.3)]'
                              : rStatus === 'completed'
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-[hsl(var(--secondary)/0.2)] border-[hsl(var(--border)/0.2)]'
                          }`}
                        >
                          <div className="text-xs font-medium text-[hsl(var(--foreground))]">
                            {rName}
                          </div>
                          <div
                            className={`text-[0.6875rem] mt-0.5 ${
                              rStatus === 'ongoing'
                                ? 'text-[hsl(var(--accent))]'
                                : rStatus === 'completed'
                                  ? 'text-green-400'
                                  : 'text-[hsl(var(--muted-foreground))]'
                            }`}
                          >
                            {rStatus === 'ongoing'
                              ? 'Active'
                              : rStatus === 'completed'
                                ? 'Done'
                                : 'Pending'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Next Match In */}
              {tournament.tournament_start && (
                <div className="p-3 rounded-lg bg-[hsl(var(--secondary)/0.2)] border border-[hsl(var(--border)/0.2)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Next Match In
                    </span>
                    <CountdownTimer
                      targetDate={tournament.tournament_start}
                      className="text-sm font-mono font-bold text-[hsl(var(--foreground))]"
                    />
                  </div>
                </div>
              )}

              {/* Credentials Scheduled */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--secondary)/0.2)] border border-[hsl(var(--border)/0.2)]">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Credentials Scheduled
                </span>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {(() => {
                    let scheduled = 0;
                    let total = 0;
                    roundGroups.forEach((g) => {
                      (g.matches || []).forEach((m) => {
                        total++;
                        if (m.room_id) scheduled++;
                      });
                    });
                    return `${scheduled} / ${total || '—'}`;
                  })()}
                </span>
              </div>

              {/* Registered Teams */}
              {registrations.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[hsl(var(--accent))]" />
                    Registered Teams (
                    {
                      registrations.filter(
                        (r) => r.status === 'confirmed' || r.status === 'approved'
                      ).length
                    }
                    )
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {registrations
                      .filter((r) => r.status === 'confirmed' || r.status === 'approved')
                      .slice(0, 50)
                      .map((reg) => (
                        <div
                          key={reg.id}
                          className="px-2 py-1.5 bg-[hsl(var(--secondary)/0.3)] rounded-lg text-[0.6875rem] text-center truncate border border-[hsl(var(--border)/0.2)]"
                          title={reg.team_name || reg.player?.user?.username}
                        >
                          {reg.team_name || reg.player?.user?.username || 'Team'}
                        </div>
                      ))}
                    {registrations.filter(
                      (r) => r.status === 'confirmed' || r.status === 'approved'
                    ).length > 50 && (
                      <div className="px-2 py-1.5 bg-[hsl(var(--accent)/0.15)] rounded-lg text-[0.6875rem] text-center text-[hsl(var(--accent))] font-medium border border-[hsl(var(--accent)/0.3)]">
                        +
                        {registrations.filter(
                          (r) => r.status === 'confirmed' || r.status === 'approved'
                        ).length - 50}{' '}
                        more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[hsl(var(--border)/0.3)] flex justify-end">
              <button
                onClick={() => setShowOverviewDialog(false)}
                className="px-4 py-2 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.8)] text-[hsl(var(--foreground))] rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTournament;
