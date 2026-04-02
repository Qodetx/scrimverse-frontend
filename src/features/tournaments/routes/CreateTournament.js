import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import PremiumDropdown from '../../../components/PremiumDropdown';
import useToast from '../../../hooks/useToast';
import usePhonePe from '../../../hooks/usePhonePe';
import Toast from '../../../components/Toast';
import {
  Trophy,
  Calendar,
  Users,
  DollarSign,
  Upload,
  FileText,
  Video,
  ArrowLeft,
  Plus,
  Trash2,
  Info,
  Check,
  Zap,
  Target,
  MapPin,
  Image,
  Rocket,
} from 'lucide-react';

const listingPlans = [
  {
    id: 'basic',
    name: 'Basic Listing',
    features: [
      'Standard tournament listing',
      'Basic registration management',
      'Tournament brackets',
      'Up to 64 participants',
    ],
    popular: false,
    dotColor: 'bg-[hsl(var(--muted-foreground))]',
  },
  {
    id: 'featured',
    name: 'Featured Listing',
    features: [
      'Featured on homepage',
      'Priority in search results',
      'Advanced analytics',
      'Up to 128 participants',
      'Custom branding options',
    ],
    popular: true,
    dotColor: 'bg-[hsl(var(--accent))]',
  },
  {
    id: 'premium',
    name: 'Premium Promotion',
    features: [
      'Top banner placement',
      'Social media promotion',
      'Email marketing inclusion',
      'Unlimited participants',
      'Dedicated support',
    ],
    popular: false,
    dotColor: 'bg-amber-500',
  },
];

const CreateTournament = () => {
  useContext(AuthContext);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { loading: paymentLoading } = usePhonePe();

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
    num_rounds: 1,
    plan_type: 'basic',
    live_link: '',
  });

  const [bannerImage, setBannerImage] = useState(null);
  const [tournamentFile, setTournamentFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [prizeError, setPrizeError] = useState('');
  const scheduleRef = useRef(null);
  const prizeRef = useRef(null);

  const [planPrices, setPlanPrices] = useState({
    basic: 299,
    featured: 799,
    premium: 1499,
  });

  React.useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await tournamentAPI.getPlanPricing();
        if (response.data.success && response.data.pricing) {
          setPlanPrices(response.data.pricing.tournament);
        }
      } catch (err) {
        console.error('Failed to fetch plan pricing:', err);
      }
    };
    fetchPricing();
  }, []);

  const [roundNames, setRoundNames] = useState({});
  const [roundDates, setRoundDates] = useState({});

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

  const gameMaps = {
    BGMI: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik', 'Karakin', 'Nusa'],
    Freefire: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra'],
    COD: ['Isolated', 'Alcatraz', 'Blackout', 'Rebirth Island', "Fortune's Keep"],
    Valorant: [
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
    ],
    Scarfall: ['Valley', 'Seaview', 'Graveyard', 'Desert'],
  };

  const [matchCount, setMatchCount] = useState(4);
  const [matchMaps, setMatchMaps] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addRound = () => {
    const current = parseInt(formData.num_rounds) || 1;
    if (current >= 6) return;
    setFormData({ ...formData, num_rounds: current + 1 });
  };

  const removeRound = (roundNum) => {
    const current = parseInt(formData.num_rounds) || 1;
    if (current <= 1) {
      showToast('At least 1 round is required', 'error');
      return;
    }
    // Remove this round's name and dates, shift subsequent rounds down
    const newNames = {};
    const newDates = {};
    for (let i = 1; i <= current; i++) {
      if (i === roundNum) continue;
      const newIdx = i < roundNum ? i : i - 1;
      if (roundNames[String(i)]) newNames[String(newIdx)] = roundNames[String(i)];
      if (roundDates[String(i)]) newDates[String(newIdx)] = roundDates[String(i)];
    }
    setRoundNames(newNames);
    setRoundDates(newDates);
    setFormData({ ...formData, num_rounds: current - 1 });
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

      formDataToSend.append('title', formData.title);
      formDataToSend.append('game_name', formData.game_name);
      formDataToSend.append('game_mode', formData.game_mode);
      formDataToSend.append('prize_pool', formData.prize_pool);
      formDataToSend.append('entry_fee', formData.entry_fee);
      formDataToSend.append('max_participants', formData.max_participants);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('rules', formData.rules);
      formDataToSend.append('plan_type', formData.plan_type);
      if (formData.live_link) {
        formDataToSend.append('live_link', formData.live_link);
      }

      if (formData.tournament_date) {
        formDataToSend.append('tournament_date', formData.tournament_date);
      }
      if (formData.tournament_time) {
        formDataToSend.append('tournament_time', formData.tournament_time);
      }

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

      const formattedRounds = Array.from({ length: formData.num_rounds }, (_, i) => ({
        round: i + 1,
        ...(i === 0
          ? { max_teams: parseInt(formData.max_participants) || 0 }
          : { qualifying_teams: 1 }),
      }));

      formDataToSend.append('rounds', JSON.stringify(formattedRounds));

      formDataToSend.append('match_count', matchCount);
      if (Object.keys(matchMaps).length > 0) {
        formDataToSend.append('match_maps', JSON.stringify(matchMaps));
      }

      if (Object.keys(roundNames).length > 0) {
        formDataToSend.append('round_names', JSON.stringify(roundNames));
      }

      // Build complete round_dates ensuring every round has a mode (default: 'online')
      const numRounds = parseInt(formData.num_rounds) || 1;
      const completeRoundDates = {};
      for (let r = 1; r <= numRounds; r++) {
        const existing = roundDates[String(r)] || {};
        completeRoundDates[String(r)] = { mode: 'online', ...existing };
      }
      formDataToSend.append('round_dates', JSON.stringify(completeRoundDates));

      const prizeDistributionObj = {};
      prizeDistribution.forEach((item) => {
        prizeDistributionObj[item.place] = parseInt(item.amount) || 0;
      });
      formDataToSend.append('prize_distribution', JSON.stringify(prizeDistributionObj));

      const shouldIncludePlacementPoints = !['Valorant', 'COD'].includes(formData.game_name);
      if (shouldIncludePlacementPoints) {
        const placementPointsObj = {};
        placementPoints.forEach((item) => {
          placementPointsObj[item.position.toString()] = parseInt(item.points) || 0;
        });
        formDataToSend.append('placement_points', JSON.stringify(placementPointsObj));
      }

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
        setScheduleError('Registration end date/time must be after registration start date/time');
        setLoading(false);
        scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (tournamentDateTime <= registrationEndDateTime) {
        setScheduleError('Tournament start date/time must be after registration end date/time');
        setLoading(false);
        scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      setScheduleError('');

      const totalPrize = getTotalPrizeDistributed();
      const prizePool = parseFloat(formData.prize_pool) || 0;
      if (prizePool > 0 && totalPrize > prizePool) {
        setPrizeError(
          `Prize distribution total (₹${totalPrize.toLocaleString()}) exceeds the prize pool (₹${prizePool.toLocaleString()}). Please reduce the amounts.`
        );
        setLoading(false);
        prizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      setPrizeError('');

      showToast('Creating tournament...', 'info');
      const tournamentData = await createTournamentAfterPayment();

      if (tournamentData.payment_required && tournamentData.redirect_url) {
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
              showToast('Checking payment status...', 'info');
              try {
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
                    setTimeout(checkStatus, 2000);
                  }
                };
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

  const totalDistributed = getTotalPrizeDistributed();
  const prizePool = parseInt(formData.prize_pool || 0);
  const isOverDistributed = totalDistributed > prizePool && prizePool > 0;

  return (
    <div className="min-h-screen pt-20 pb-12 relative bg-[hsl(var(--background))]">
      <div className="cyber-grid" />
      <div className="scanlines" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/host/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent)), #a855f7, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Create Tournament
            </span>
          </h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            Set up your epic gaming tournament and bring the community together
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))] text-sm mb-6">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-10">
          {/* Tournament Listing Plans */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-[hsl(var(--foreground))]">
              Tournament Listing Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {listingPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  className="relative p-6 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer"
                  style={{
                    borderColor:
                      formData.plan_type === plan.id
                        ? 'hsl(var(--accent))'
                        : plan.popular
                          ? 'hsl(var(--accent) / 0.5)'
                          : 'hsl(var(--border) / 0.5)',
                    background:
                      formData.plan_type === plan.id
                        ? 'hsl(var(--accent) / 0.1)'
                        : plan.popular
                          ? 'hsl(var(--secondary) / 0.3)'
                          : 'hsl(var(--secondary) / 0.2)',
                    boxShadow:
                      formData.plan_type === plan.id ? '0 0 20px hsl(270 60% 55% / 0.3)' : 'none',
                  }}
                >
                  {plan.popular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: 'hsl(var(--accent))',
                        color: 'hsl(var(--accent-foreground))',
                      }}
                    >
                      POPULAR
                    </div>
                  )}
                  <div className="text-center mb-6 pt-2">
                    <h3 className="text-xl font-bold mb-2 text-[hsl(var(--foreground))]">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-[hsl(var(--foreground))]">
                        ₹{planPrices[plan.id]?.toLocaleString()}
                      </span>
                      <span className="text-[hsl(var(--muted-foreground))]">/tournament</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))]"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${plan.dotColor}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handlePlanSelect(plan.id)}
                    className="w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                    style={
                      formData.plan_type === plan.id
                        ? {
                            background: 'hsl(var(--accent))',
                            color: 'white',
                          }
                        : plan.id === 'featured'
                          ? {
                              background: 'hsl(var(--accent))',
                              color: 'white',
                            }
                          : plan.id === 'premium'
                            ? {
                                background: 'linear-gradient(to right, #f59e0b, #eab308)',
                                color: 'black',
                              }
                            : {
                                background: 'transparent',
                                border: '1px solid hsl(var(--border))',
                                color: 'hsl(var(--foreground))',
                              }
                    }
                  >
                    {formData.plan_type === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Selected
                      </span>
                    ) : (
                      `Choose ${plan.id.charAt(0).toUpperCase() + plan.id.slice(1)}`
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column: Details + Prize Pool */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tournament Details */}
            <div
              className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6"
              style={{ position: 'relative', zIndex: 10, overflow: 'visible' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                  <Trophy className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  Tournament Details
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Epic Gaming Championship"
                    className="w-full bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Game
                  </label>
                  <PremiumDropdown
                    name="game_name"
                    value={formData.game_name}
                    onChange={handleChange}
                    options={gameOptions}
                    placeholder="Select game"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your tournament, rules, and what makes it special..."
                    className="w-full bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                      <Users className="w-4 h-4" />
                      Max Teams
                    </label>
                    <input
                      type="number"
                      name="max_participants"
                      required
                      min="1"
                      value={formData.max_participants}
                      onChange={handleChange}
                      onWheel={(e) => e.target.blur()}
                      placeholder="64"
                      className="w-full bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                      Team Format
                    </label>
                    <PremiumDropdown
                      name="game_mode"
                      value={formData.game_mode}
                      onChange={handleChange}
                      options={gameFormatOptions}
                      placeholder="Select format"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    <DollarSign className="w-4 h-4" />
                    Entry Fee (₹)
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
                    placeholder="100"
                    className="w-full bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    <Video className="w-4 h-4" />
                    Live Stream URL{' '}
                    <span className="font-normal text-[hsl(var(--muted-foreground))]">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    name="live_link"
                    value={formData.live_link}
                    onChange={handleChange}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Prize Pool & Points */}
            <div
              ref={prizeRef}
              className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  Prize Pool &amp; Points
                </h2>
              </div>

              <div className="space-y-5">
                {/* Total Prize Pool */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Total Prize Pool (₹)
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
                    placeholder="10000"
                    className="w-full bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                  />
                </div>

                {/* Prize Distribution */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Prize Distribution (₹)
                    </label>
                    <button
                      type="button"
                      onClick={addPrizePlace}
                      disabled={prizeDistribution.length >= 8}
                      className="flex items-center gap-1 text-xs text-[hsl(var(--foreground))] hover:text-[hsl(var(--accent))] transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" /> Add Place
                    </button>
                  </div>

                  {prizeDistribution.map((item, index) => {
                    let badgeStyle = {};
                    if (index === 0)
                      badgeStyle = {
                        background: 'rgba(234,179,8,0.2)',
                        color: '#eab308',
                        borderColor: 'rgba(234,179,8,0.3)',
                      };
                    else if (index === 1)
                      badgeStyle = {
                        background: 'rgba(156,163,175,0.2)',
                        color: '#9ca3af',
                        borderColor: 'rgba(156,163,175,0.3)',
                      };
                    else if (index === 2)
                      badgeStyle = {
                        background: 'rgba(249,115,22,0.2)',
                        color: '#f97316',
                        borderColor: 'rgba(249,115,22,0.3)',
                      };
                    else
                      badgeStyle = {
                        background: 'hsl(var(--secondary)/0.5)',
                        color: 'hsl(var(--foreground))',
                        borderColor: 'hsl(var(--border))',
                      };

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className="shrink-0 w-10 text-center text-xs font-semibold px-1 py-1 rounded border"
                          style={badgeStyle}
                        >
                          {item.place}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={item.amount}
                          onChange={(e) => updatePrizePlace(index, 'amount', e.target.value)}
                          className="flex-1 bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors h-9"
                        />
                        {prizeDistribution.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrizePlace(index)}
                            className="flex items-center justify-center w-8 h-8 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] rounded-md transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <p
                    className="text-xs font-medium"
                    style={{
                      color:
                        totalDistributed === prizePool
                          ? '#4ade80'
                          : isOverDistributed
                            ? 'hsl(var(--destructive))'
                            : '#facc15',
                    }}
                  >
                    Total: ₹{totalDistributed.toLocaleString()} / ₹{prizePool.toLocaleString()}
                  </p>
                </div>

                {prizeError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)]">
                    <Info className="w-3.5 h-3.5 text-[hsl(var(--destructive))] flex-shrink-0" />
                    <p className="text-xs text-[hsl(var(--destructive))]">{prizeError}</p>
                  </div>
                )}

                {/* Placement Points — only for non-competitive games */}
                {!['Valorant', 'COD'].includes(formData.game_name) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[hsl(var(--accent))]" />
                      <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        Placement Points
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {placementPoints.map((item, index) => (
                        <div
                          key={index}
                          className="text-center p-2 rounded-lg border"
                          style={{
                            background: 'hsl(var(--secondary)/0.3)',
                            borderColor: 'hsl(var(--border)/0.3)',
                          }}
                        >
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                            #{item.position}
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.points}
                            onChange={(e) => updatePlacementPoints(index, e.target.value)}
                            className="w-full bg-transparent text-sm font-bold text-center text-[hsl(var(--foreground))] focus:outline-none mt-0.5"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      Points per placement (9th onwards = 0). Every kill = 1 point.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tournament Schedule */}
          <div
            ref={scheduleRef}
            className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                <Calendar className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Tournament Schedule
              </h2>
            </div>

            <div className="space-y-5">
              {/* Registration Start */}
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                  Registration Opens
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="registration_start_date"
                      required
                      value={formData.registration_start_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-black border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      name="registration_start_time"
                      required
                      value={formData.registration_start_time}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-black border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Registration End */}
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                  Registration Closes
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="registration_end_date"
                      required
                      value={formData.registration_end_date}
                      min={formData.registration_start_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-black border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      name="registration_end_time"
                      required
                      value={formData.registration_end_time}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-black border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Tournament Kick-off */}
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                  Tournament Kick-off
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="tournament_date"
                      required
                      value={formData.tournament_date}
                      min={formData.registration_end_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-black border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      name="tournament_time"
                      required
                      value={formData.tournament_time}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-black border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {scheduleError && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)]">
                  <Info className="w-3.5 h-3.5 text-[hsl(var(--destructive))] flex-shrink-0" />
                  <p className="text-xs text-[hsl(var(--destructive))]">{scheduleError}</p>
                </div>
              )}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[hsl(var(--accent)/0.05)] border border-[hsl(var(--accent)/0.15)]">
                <Info className="w-3.5 h-3.5 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Tournament start must be scheduled after registration closes.
                </p>
              </div>
            </div>
          </div>

          {/* Round Structure */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                  <Zap className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Round Structure</h2>
              </div>
              {parseInt(formData.num_rounds) < 6 && (
                <button
                  type="button"
                  onClick={addRound}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[hsl(var(--accent)/0.4)] text-xs font-semibold text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.1)] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Round
                </button>
              )}
            </div>

            <div className="space-y-3">
              {Array.from({ length: parseInt(formData.num_rounds) || 1 }, (_, i) => {
                const rn = i + 1;
                const rd = roundDates[String(rn)] || {};
                return (
                  <div
                    key={rn}
                    className="p-4 rounded-lg border border-[hsl(var(--border)/0.5)] hover:border-[hsl(var(--accent)/0.3)] transition-colors"
                    style={{ background: 'hsl(var(--secondary)/0.3)' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded border shrink-0"
                        style={{ color: 'hsl(var(--accent))', borderColor: 'hsl(var(--accent))' }}
                      >
                        R{rn}
                      </span>
                      <input
                        type="text"
                        value={roundNames[String(rn)] || ''}
                        onChange={(e) =>
                          setRoundNames({ ...roundNames, [String(rn)]: e.target.value })
                        }
                        placeholder={`Round ${rn} name`}
                        className="flex-1 bg-black border border-[hsl(var(--border))] rounded-md text-xs px-2 py-1.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeRound(rn)}
                        className="flex items-center justify-center w-7 h-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] rounded-md transition-colors shrink-0"
                        title="Remove round"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={rd.start_date || ''}
                          onChange={(e) => handleRoundDateChange(rn, 'start_date', e.target.value)}
                          className="w-full px-2 py-1.5 bg-black border border-[hsl(var(--border))] rounded-md text-[hsl(var(--foreground))] text-xs focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={rd.end_date || ''}
                          onChange={(e) => handleRoundDateChange(rn, 'end_date', e.target.value)}
                          className="w-full px-2 py-1.5 bg-black border border-[hsl(var(--border))] rounded-md text-[hsl(var(--foreground))] text-xs focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider mb-1">
                          Mode
                        </label>
                        <select
                          value={rd.mode || 'online'}
                          onChange={(e) => handleRoundDateChange(rn, 'mode', e.target.value)}
                          className="w-full px-2 py-1.5 bg-black border border-[hsl(var(--border))] rounded-md text-[hsl(var(--foreground))] text-xs focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="online" className="bg-gray-900">
                            🌐 Online
                          </option>
                          <option value="offline" className="bg-gray-900">
                            📍 Offline / LAN
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {parseInt(formData.num_rounds) >= 6 && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mt-4">
                Maximum 6 rounds reached.
              </p>
            )}
          </div>

          {/* Matches & Maps */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                <MapPin className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Matches &amp; Maps
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                  Number of Matches per Round
                </label>
                <select
                  value={matchCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setMatchCount(v);
                    const updated = {};
                    for (let i = 1; i <= v; i++) {
                      if (matchMaps[i]) updated[i] = matchMaps[i];
                    }
                    setMatchMaps(updated);
                  }}
                  className="w-24 bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors text-center appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {formData.game_name && gameMaps[formData.game_name] && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))]">
                    Map per Match
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array.from({ length: matchCount }, (_, i) => {
                      const mn = i + 1;
                      return (
                        <div key={mn}>
                          <label className="block text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider mb-1">
                            Match {mn}
                          </label>
                          <select
                            value={matchMaps[mn] || ''}
                            onChange={(e) => setMatchMaps({ ...matchMaps, [mn]: e.target.value })}
                            className="w-full px-2 py-1.5 bg-black border border-[hsl(var(--border))] rounded-md text-[hsl(var(--foreground))] text-xs focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-gray-900">
                              Select map
                            </option>
                            {gameMaps[formData.game_name].map((map) => (
                              <option key={map} value={map} className="bg-gray-900">
                                {map}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!formData.game_name && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Select a game above to configure maps per match.
                </p>
              )}
            </div>
          </div>

          {/* Tournament Poster */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                  <Image className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  Tournament Poster
                </h2>
              </div>
              {bannerPreview && (
                <div className="flex gap-2">
                  <label
                    htmlFor="banner-tournament-upload"
                    className="text-sm cursor-pointer px-4 py-1.5 rounded border font-medium"
                    style={{
                      color: '#ffffff',
                      background: 'hsl(0 0% 12%)',
                      borderColor: 'hsl(0 0% 25%)',
                    }}
                  >
                    Change
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerImage(null);
                      setBannerPreview(null);
                    }}
                    className="text-sm px-4 py-1.5 rounded border font-medium"
                    style={{
                      color: '#ef4444',
                      background: 'hsl(0 80% 8%)',
                      borderColor: 'hsl(0 60% 20%)',
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {bannerPreview ? (
              <div className="w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/6' }}>
                <img
                  src={bannerPreview}
                  alt="Tournament poster preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
                style={{ borderColor: 'hsl(var(--border)/0.5)' }}
              >
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-[hsl(var(--foreground))]">
                      Upload Tournament Poster
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Recommended size: 1920x1080px · PNG, JPG up to 5MB
                    </p>
                  </div>
                  <label
                    htmlFor="banner-tournament-upload"
                    className="inline-block px-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              </div>
            )}
            <input
              id="banner-tournament-upload"
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>

          {/* Rules & Guidelines */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                <FileText className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Rules &amp; Guidelines
              </h2>
            </div>
            <textarea
              name="rules"
              required
              rows="8"
              value={formData.rules}
              onChange={handleChange}
              placeholder="Enter your tournament rules, regulations, and any additional information..."
              className="w-full bg-black border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none font-mono leading-relaxed"
            />

            {/* Rules Document upload */}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                <MapPin className="w-4 h-4" />
                Detailed Guidelines File{' '}
                <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="file-tournament-upload"
              />
              <label
                htmlFor="file-tournament-upload"
                className="group flex flex-col items-center justify-center w-full h-28 bg-[hsl(var(--card)/0.5)] border-2 border-dashed border-[hsl(var(--border))] rounded-lg cursor-pointer hover:border-[hsl(var(--accent)/0.4)] transition-colors"
              >
                {tournamentFile ? (
                  <div className="flex flex-col items-center p-3">
                    <FileText className="w-8 h-8 text-[hsl(var(--accent))] mb-1" />
                    <span className="text-sm font-medium text-[hsl(var(--foreground))] text-center line-clamp-1 max-w-[200px]">
                      {tournamentFile.name}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {(tournamentFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--accent))] mx-auto mb-2 transition-colors" />
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      Click to upload · PDF, DOC, DOCX
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading || paymentLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'white',
                  color: 'black',
                }}
              >
                {loading || paymentLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{paymentLoading ? 'Processing Payment...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Publish Tournament — Pay ₹{planPrices[formData.plan_type]}
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-4">
              Once published, your tournament will be visible to all players.
            </p>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default CreateTournament;
