import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import CompactPlanSelector from '../components/CompactPlanSelector';
import PremiumDatePicker from '../components/PremiumDatePicker';
import ClockTimePicker from '../components/ClockTimePicker';
import PremiumDropdown from '../components/PremiumDropdown';
import RoundNamesModal from '../components/RoundNamesModal';
import useToast from '../hooks/useToast';
import usePhonePe from '../hooks/usePhonePe';
import Toast from '../components/Toast';

const CreateTournament = () => {
  useContext(AuthContext);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { initiatePayment, loading: paymentLoading, error: paymentError } = usePhonePe();

  const [formData, setFormData] = useState({
    title: '',
    game_name: '',
    game_mode: '',
    prize_pool: '',
    entry_fee: '',
    max_participants: '',
    tournament_date: '',
    tournament_time: '',
    registration_start_date: '',
    registration_start_time: '',
    registration_end_date: '',
    registration_end_time: '',
    description: '',
    rules: '',
    num_rounds: '',
    plan_type: 'basic',
  });

  const [bannerImage, setBannerImage] = useState(null);
  const [tournamentFile, setTournamentFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempTournamentId, setTempTournamentId] = useState(null);

  // Plan prices - fetched from backend
  const [planPrices, setPlanPrices] = useState({
    basic: 299,
    featured: 499,
    premium: 799,
  });

  // Fetch plan pricing on mount
  React.useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await tournamentAPI.getPlanPricing();
        if (response.data.success && response.data.pricing) {
          setPlanPrices(response.data.pricing.tournament);
        }
      } catch (err) {
        console.error('Failed to fetch plan pricing:', err);
        // Keep default prices if fetch fails
      }
    };
    fetchPricing();
  }, []);
  const [roundNames, setRoundNames] = useState({});
  const [showRoundNamesModal, setShowRoundNamesModal] = useState(false);

  // Prize Distribution & Placement Points
  const [prizeDistribution, setPrizeDistribution] = useState([
    { place: '1st', amount: 5000 },
    { place: '2nd', amount: 3000 },
    { place: '3rd', amount: 2000 },
  ]);
  const [placementPoints, setPlacementPoints] = useState([
    { position: 1, points: 10 },
    { position: 2, points: 6 },
    { position: 3, points: 4 },
    { position: 4, points: 3 },
    { position: 5, points: 2 },
    { position: 6, points: 1 },
    { position: 7, points: 0 },
    { position: 8, points: 0 },
  ]);

  const gameOptions = ['BGMI', 'Valorant', 'COD', 'Freefire', 'Scarfall'];
  const gameFormatOptions = ['Squad', 'Duo', 'Solo', '5v5'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumRoundsChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setFormData({ ...formData, num_rounds: '' });
      return;
    }
    const num = parseInt(value) || 1;
    const numRounds = Math.min(Math.max(num, 1), 6); // Max 6 rounds
    setFormData({ ...formData, num_rounds: numRounds });
  };

  const handleSaveRoundNames = (names) => {
    setRoundNames(names);
  };

  // Prize Distribution Handlers
  const addPrizePlace = () => {
    const nextPlace = prizeDistribution.length + 1;
    const placeNames = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    setPrizeDistribution([
      ...prizeDistribution,
      { place: placeNames[nextPlace - 1] || `${nextPlace}th`, amount: 0 },
    ]);
  };

  const removePrizePlace = (index) => {
    if (prizeDistribution.length > 1) {
      setPrizeDistribution(prizeDistribution.filter((_, i) => i !== index));
    }
  };

  const updatePrizePlace = (index, field, value) => {
    const updated = [...prizeDistribution];
    if (field === 'amount') {
      updated[index].amount = value === '' ? 0 : parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setPrizeDistribution(updated);
  };

  // Placement Points Handlers
  const updatePlacementPoints = (index, points) => {
    const updated = [...placementPoints];
    updated[index].points = points === '' ? 0 : parseInt(points) || 0;
    setPlacementPoints(updated);
  };

  const getTotalPrizeDistributed = () => {
    return prizeDistribution.reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Banner image must be less than 5MB');
        return;
      }
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTournamentFile(file);
    }
  };

  const handlePlanSelect = (planType) => {
    setFormData({ ...formData, plan_type: planType });
  };

  const createTournamentAfterPayment = async () => {
    try {
      const formDataToSend = new FormData();

      // Basic fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('game_name', formData.game_name);
      formDataToSend.append('game_mode', formData.game_mode);
      formDataToSend.append('prize_pool', formData.prize_pool);
      formDataToSend.append('entry_fee', formData.entry_fee);
      formDataToSend.append('max_participants', formData.max_participants);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('rules', formData.rules);
      formDataToSend.append('plan_type', formData.plan_type);

      // Date and time
      if (formData.tournament_date) {
        formDataToSend.append('tournament_date', formData.tournament_date);
      }
      if (formData.tournament_time) {
        formDataToSend.append('tournament_time', formData.tournament_time);
      }

      // Create datetime fields from date and time
      const tournamentDateTime = new Date(
        `${formData.tournament_date}T${formData.tournament_time}`
      );
      const registrationStartDateTime = new Date(
        `${formData.registration_start_date}T${formData.registration_start_time}`
      );
      const registrationEndDateTime = new Date(
        `${formData.registration_end_date}T${formData.registration_end_time}`
      );

      formDataToSend.append('tournament_start', tournamentDateTime.toISOString());
      formDataToSend.append(
        'tournament_end',
        new Date(tournamentDateTime.getTime() + 6 * 60 * 60 * 1000).toISOString()
      );
      formDataToSend.append('registration_start', registrationStartDateTime.toISOString());
      formDataToSend.append('registration_end', registrationEndDateTime.toISOString());

      // Rounds data
      const formattedRounds = Array.from({ length: formData.num_rounds }, (_, i) => ({
        round: i + 1,
        ...(i === 0
          ? { max_teams: parseInt(formData.max_participants) || 0 }
          : { qualifying_teams: 1 }),
      }));

      formDataToSend.append('rounds', JSON.stringify(formattedRounds));

      // Round names
      if (Object.keys(roundNames).length > 0) {
        formDataToSend.append('round_names', JSON.stringify(roundNames));
      }

      // Prize Distribution - Convert array to object format: {"1st": 5000, "2nd": 3000, ...}
      const prizeDistributionObj = {};
      prizeDistribution.forEach((item) => {
        prizeDistributionObj[item.place] = parseInt(item.amount) || 0;
      });
      formDataToSend.append('prize_distribution', JSON.stringify(prizeDistributionObj));

      // Placement Points - Convert array to object format: {"1": 10, "2": 6, ...}
      const placementPointsObj = {};
      placementPoints.forEach((item) => {
        placementPointsObj[item.position.toString()] = parseInt(item.points) || 0;
      });
      formDataToSend.append('placement_points', JSON.stringify(placementPointsObj));

      // Files
      if (bannerImage) {
        formDataToSend.append('banner_image', bannerImage);
      }
      if (tournamentFile) {
        formDataToSend.append('tournament_file', tournamentFile);
      }

      const response = await tournamentAPI.createTournament(formDataToSend);
      return response.data;
    } catch (err) {
      console.error('Error creating tournament:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate dates
      const tournamentDateTime = new Date(
        `${formData.tournament_date}T${formData.tournament_time}`
      );
      const registrationStartDateTime = new Date(
        `${formData.registration_start_date}T${formData.registration_start_time}`
      );
      const registrationEndDateTime = new Date(
        `${formData.registration_end_date}T${formData.registration_end_time}`
      );

      if (registrationEndDateTime <= registrationStartDateTime) {
        setError('Registration end date/time must be after registration start date/time');
        setLoading(false);
        return;
      }

      if (tournamentDateTime <= registrationEndDateTime) {
        setError('Tournament start date/time must be after registration end date/time');
        setLoading(false);
        return;
      }

      // Create tournament (backend will return payment redirect URL)
      showToast('Initiating payment...', 'info');
      const tournamentData = await createTournamentAfterPayment();

      // Check if payment is required
      if (tournamentData.payment_required && tournamentData.redirect_url) {
        // Open PhonePe payment in IFrame
        showToast('Opening payment gateway...', 'info');

        if (!window.PhonePeCheckout) {
          setError('Payment gateway not loaded. Please refresh the page.');
          setLoading(false);
          return;
        }

        window.PhonePeCheckout.transact({
          tokenUrl: tournamentData.redirect_url,
          type: 'IFRAME',
          callback: async (response) => {
            if (response === 'USER_CANCEL') {
              setError('Payment cancelled. Please try again.');
              showToast('Payment cancelled', 'error');
              setLoading(false);
            } else if (response === 'CONCLUDED') {
              // Payment concluded - check status via API
              showToast('Checking payment status...', 'info');

              try {
                // Poll for payment status (webhook might not work on localhost)
                const checkStatus = async () => {
                  const statusResponse = await tournamentAPI.checkPaymentStatus({
                    merchant_order_id: tournamentData.merchant_order_id,
                  });

                  if (
                    statusResponse.data.status === 'completed' &&
                    statusResponse.data.tournament_id
                  ) {
                    showToast('Tournament created successfully!', 'success');
                    setLoading(false);
                    setTimeout(() => {
                      navigate('/host/dashboard');
                    }, 1500);
                  } else if (statusResponse.data.status === 'failed') {
                    setError('Payment failed. Please try again.');
                    showToast('Payment failed', 'error');
                    setLoading(false);
                  } else {
                    // Still pending, wait and check again
                    setTimeout(checkStatus, 2000);
                  }
                };

                // Start checking after a short delay
                setTimeout(checkStatus, 1000);
              } catch (err) {
                console.error('Error checking payment status:', err);
                showToast('Payment completed! Please check your dashboard.', 'success');
                setTimeout(() => {
                  navigate('/host/dashboard');
                }, 2000);
              }
            }
          },
        });
      } else {
        // No payment required (shouldn't happen for tournaments, but handle it)
        showToast('Tournament created successfully!', 'success');
        setTimeout(() => {
          navigate('/host/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Error in tournament creation:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create tournament');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative py-12 px-4 sm:px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-1/4 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-0 -right-1/4 w-[500px] h-[500px] bg-accent-purple/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div className="cyber-grid opacity-30"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-blue/20 text-accent-blue border border-accent-blue/30 backdrop-blur-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <span className="text-accent-blue font-bold tracking-widest uppercase text-xs">
                Host Center
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Create <span className="gradient-text">Tournament</span>
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Organize professional scale competitions.</p>
          </div>
          <button
            onClick={() => navigate('/host/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 backdrop-blur-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          {/* Tournament Plan Selection */}
          <div className="mb-12">
            <CompactPlanSelector
              selectedPlan={formData.plan_type}
              onPlanSelect={handlePlanSelect}
              maxParticipants={parseInt(formData.max_participants) || 0}
              prices={planPrices}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8 flex flex-col">
              {/* Section 1: Basic Information */}
              <div
                className="glass-card cyber-card rounded-3xl p-8 hover-glow transition-all duration-300 overflow-visible"
                style={{ zIndex: 10, position: 'relative' }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue border border-accent-blue/30 shadow-lg shadow-accent-blue/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                    <p className="text-gray-400 text-sm">
                      Define the core details of your tournament.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider ml-1">
                      Tournament Title <span className="text-accent-blue">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Summer Pro Championship 2026"
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/10 transition-all duration-300 text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumDropdown
                      label="Select Game *"
                      name="game_name"
                      value={formData.game_name}
                      onChange={handleChange}
                      options={gameOptions}
                      placeholder="Choose Game"
                    />

                    <PremiumDropdown
                      label="Format *"
                      name="game_mode"
                      value={formData.game_mode}
                      onChange={handleChange}
                      options={gameFormatOptions}
                      placeholder="Select Format"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider ml-1">
                      Description <span className="text-accent-blue">*</span>
                    </label>
                    <textarea
                      name="description"
                      required
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Share details about the tournament, skill level, and progression map..."
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/10 transition-all duration-300 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Timings */}
              <div className="glass-card cyber-card rounded-3xl p-8 flex-1 hover-glow transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-accent-purple/20 flex items-center justify-center text-accent-purple border border-accent-purple/30 shadow-lg shadow-accent-purple/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Event Schedule</h2>
                    <p className="text-gray-400 text-sm">
                      Set registration and competition timings.
                    </p>
                  </div>
                </div>

                <div className="space-y-10 mt-6">
                  {/* Row 1: Start */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <PremiumDatePicker
                      label="Registration Start Date"
                      name="registration_start_date"
                      value={formData.registration_start_date}
                      onChange={handleChange}
                    />
                    <ClockTimePicker
                      label="Start Time"
                      name="registration_start_time"
                      value={formData.registration_start_time}
                      onChange={handleChange}
                      baseDate={formData.registration_start_date}
                    />
                  </div>

                  {/* Row 2: End */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <PremiumDatePicker
                      label="Registration End Date"
                      name="registration_end_date"
                      value={formData.registration_end_date}
                      onChange={handleChange}
                      minDate={formData.registration_start_date}
                    />
                    <ClockTimePicker
                      label="End Time"
                      name="registration_end_time"
                      value={formData.registration_end_time}
                      onChange={handleChange}
                      baseDate={formData.registration_end_date}
                      minTime={formData.registration_start_time}
                      minDateForTime={formData.registration_start_date}
                    />
                  </div>

                  {/* Row 3: Event */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <PremiumDatePicker
                      label="Tournament Date"
                      name="tournament_date"
                      value={formData.tournament_date}
                      onChange={handleChange}
                      minDate={formData.registration_end_date}
                    />
                    <ClockTimePicker
                      label="Kick-off Time"
                      name="tournament_time"
                      value={formData.tournament_time}
                      onChange={handleChange}
                      baseDate={formData.tournament_date}
                      minTime={formData.registration_end_time}
                      minDateForTime={formData.registration_end_date}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Section 2: Tournament Settings */}
              <div className="glass-card cyber-card rounded-3xl p-8 hover-glow transition-all duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 flex items-center justify-center text-accent-cyan border border-accent-cyan/30 shadow-lg shadow-accent-cyan/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Settings</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-widest ml-1">
                      Max Teams
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="max_participants"
                        required
                        min="1"
                        value={formData.max_participants}
                        onChange={handleChange}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent-cyan/50 transition-all font-mono"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-widest ml-1">
                      Number of Rounds
                    </label>
                    <input
                      type="number"
                      name="num_rounds"
                      required
                      min="1"
                      max="6"
                      placeholder=""
                      value={formData.num_rounds}
                      onChange={handleNumRoundsChange}
                      className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent-gold/50 transition-all font-mono"
                    />
                    {formData.num_rounds && (
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-widest ml-1">
                        Entry (₹)
                      </label>
                      <input
                        type="number"
                        name="entry_fee"
                        required
                        min="0"
                        step="0.01"
                        value={formData.entry_fee}
                        onChange={handleChange}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent-cyan/50 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-widest ml-1">
                        Prize (₹)
                      </label>
                      <input
                        type="number"
                        name="prize_pool"
                        required
                        min="0"
                        step="0.01"
                        value={formData.prize_pool}
                        onChange={handleChange}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent-cyan/50 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Upload - Premium Only */}
              {formData.plan_type === 'premium' && (
                <div className="glass-card cyber-card rounded-3xl p-8 hover-glow transition-all duration-300">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <svg
                      className="w-5 h-5 text-accent-blue"
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
                    Custom Tournament Banner
                    <span className="ml-auto px-2 py-1 rounded-full bg-accent-gold/10 text-accent-gold text-[10px] font-black uppercase tracking-wider border border-accent-gold/20">
                      Premium Only
                    </span>
                  </h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                    id="banner-tournament-upload"
                  />
                  <label
                    htmlFor="banner-tournament-upload"
                    className="group relative flex flex-col items-center justify-center w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-accent-blue/50 hover:bg-white/10 transition-all overflow-hidden"
                  >
                    {bannerPreview ? (
                      <>
                        <img
                          src={bannerPreview}
                          alt="Preview"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold border border-white/20">
                            Change Image
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 transition-transform duration-300 group-hover:-translate-y-1">
                        <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4 border border-accent-blue/20">
                          <svg
                            className="w-8 h-8 text-accent-blue"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <p className="text-white font-bold mb-1">Upload Custom Banner</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              )}

              {/* Tournament Document */}
              <div className="glass-card cyber-card rounded-3xl p-8 hover-glow transition-all">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <svg
                    className="w-5 h-5 text-accent-cyan"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  Rules Document (Optional)
                </h3>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-tournament-upload"
                />
                <label
                  htmlFor="file-tournament-upload"
                  className="group flex flex-col items-center justify-center w-full h-[184px] bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-accent-cyan/50 hover:bg-white/10 transition-all font-medium"
                >
                  {tournamentFile ? (
                    <div className="flex flex-col items-center p-4">
                      <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <svg
                          className="w-8 h-8 text-accent-cyan"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-white font-semibold text-center line-clamp-1 max-w-[200px]">
                        {tournamentFile.name}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                        {(tournamentFile.size / 1024).toFixed(2)} KB • PDF/DOC
                      </span>
                    </div>
                  ) : (
                    <div className="text-center group-hover:scale-105 transition-transform">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/10 shadow-lg shadow-black/20">
                        <svg
                          className="w-6 h-6 text-gray-400 group-hover:text-accent-cyan transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-400 text-sm font-bold block mb-1">
                        Click to upload doc
                      </span>
                      <span className="text-[10px] text-gray-600 uppercase tracking-widest font-black">
                        PDF, DOC, DOCX
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Sections 5 & 6: Prize Distribution & Placement Points - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Prize Distribution */}
            <div className="rounded-lg border bg-white/5 text-white shadow-sm cyber-card">
              <div className="flex flex-col space-y-1.5 p-6 pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
                <h3 className="font-semibold tracking-tight flex items-center gap-2 text-base sm:text-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500"
                  >
                    <path d="M6 3h12"></path>
                    <path d="M6 8h12"></path>
                    <path d="m6 13 8.5 8"></path>
                    <path d="M6 13h3"></path>
                    <path d="M9 13c6.667 0 6.667-10 0-10"></path>
                  </svg>
                  Prize Distribution
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-3 px-3 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-2">
                  {prizeDistribution.map((item, index) => {
                    // Determine trophy color
                    let trophyColor = 'text-gray-400';
                    if (item.place === '1st') trophyColor = 'text-yellow-500';
                    else if (item.place === '2nd') trophyColor = 'text-gray-400';
                    else if (item.place === '3rd') trophyColor = 'text-orange-500';

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 min-w-[60px] sm:min-w-[80px]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${trophyColor}`}
                          >
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                            <path d="M4 22h16"></path>
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                          </svg>
                          <span className="text-xs sm:text-sm font-medium">{item.place}</span>
                        </div>
                        <div className="flex-1 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.amount}
                            onChange={(e) => updatePrizePlace(index, 'amount', e.target.value)}
                            placeholder="0"
                            className="w-full rounded-md border border-white/20 px-3 py-2 pl-6 h-8 sm:h-9 text-xs sm:text-sm bg-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50"
                          />
                        </div>
                        {prizeDistribution.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrizePlace(index)}
                            className="inline-flex items-center justify-center h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              <line x1="10" x2="10" y1="11" y2="17"></line>
                              <line x1="14" x2="14" y1="11" y2="17"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addPrizePlace}
                  disabled={prizeDistribution.length >= 8}
                  className="inline-flex items-center justify-center w-full border border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-md px-3 gap-1.5 text-xs sm:text-sm h-8 sm:h-9 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                  Add Place
                </button>

                <div className="p-2 sm:p-3 rounded-lg border bg-green-500/10 border-green-500/30">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Total Distributed:</span>
                    <span className="font-bold text-green-400">
                      ₹{getTotalPrizeDistributed().toLocaleString()} / ₹
                      {parseInt(formData.prize_pool || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Placement Points */}
            <div className="rounded-lg border bg-white/5 text-white shadow-sm cyber-card">
              <div className="flex flex-col space-y-1.5 p-6 pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
                <h3 className="font-semibold tracking-tight flex items-center gap-2 text-base sm:text-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  Placement Points
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-3 px-3 sm:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-2 gap-2">
                  {placementPoints.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white/10 rounded-lg border border-white/20"
                    >
                      <span className="text-[10px] sm:text-xs text-gray-400 min-w-[32px] sm:min-w-[40px]">
                        #{item.position}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={item.points}
                        onChange={(e) => updatePlacementPoints(index, e.target.value)}
                        placeholder="0"
                        className="w-full rounded-md border border-white/20 py-2 h-7 sm:h-8 text-xs sm:text-sm text-center bg-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 px-1 sm:px-2"
                      />
                      <span className="text-[10px] sm:text-xs text-gray-400">pts</span>
                      <button
                        type="button"
                        onClick={() => {
                          // For placement points, we can keep deletion simple or disable for fixed 8
                          // For now, keeping it functional but this can be removed if you want fixed 8
                        }}
                        className="inline-flex items-center justify-center h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        style={{ display: 'none' }} // Hide delete for placement points (fixed 8)
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" x2="10" y1="11" y2="17"></line>
                          <line x1="14" x2="14" y1="11" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-2 sm:p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-cyan-400"
                    >
                      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
                      <circle cx="12" cy="8" r="6"></circle>
                    </svg>
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Kill Points</p>
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        Every finish = <span className="font-bold text-cyan-400">1 point</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] sm:text-xs text-gray-400 space-y-0.5">
                  <p>• Total Points = Placement Points + Kill Points</p>
                  <p>• Preset values shown, editable as needed</p>
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card cyber-card rounded-3xl p-8 hover-glow transition-all">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-accent-purple/20 flex items-center justify-center text-accent-purple border border-accent-purple/30 shadow-lg shadow-accent-purple/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Rules & Guidelines</h2>
                <p className="text-gray-400 text-sm">Ensuring fair play for all.</p>
              </div>
            </div>
            <textarea
              name="rules"
              required
              rows="8"
              value={formData.rules}
              onChange={handleChange}
              placeholder="Enter your tournament rules, regulations, and any additional information..."
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-purple/50 focus:ring-4 focus:ring-accent-purple/10 transition-all duration-300 resize-none font-mono text-sm shadow-inner"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-10 sticky bottom-8 z-50">
            <button
              type="submit"
              disabled={loading || paymentLoading}
              className="flex-1 group relative overflow-hidden action-button px-10 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_40px_rgba(0,123,255,0.4)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {loading || paymentLoading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="relative z-10">
                    {paymentLoading ? 'Processing Payment...' : 'Creating...'}
                  </span>
                </>
              ) : (
                <>
                  <span className="relative z-10 uppercase tracking-widest">
                    Create & Pay ₹{planPrices[formData.plan_type]}
                  </span>
                  <svg
                    className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/host/dashboard')}
              className="px-10 py-5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-bold transition-all border border-white/10 backdrop-blur-xl hover:border-white/20 whitespace-nowrap"
            >
              Cancel Setup
            </button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <RoundNamesModal
        isOpen={showRoundNamesModal}
        onClose={() => setShowRoundNamesModal(false)}
        numRounds={parseInt(formData.num_rounds) || 0}
        roundNames={roundNames}
        onSave={handleSaveRoundNames}
      />
    </div>
  );
};

export default CreateTournament;
