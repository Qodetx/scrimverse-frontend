import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import useToast from '../../../hooks/useToast';
import usePhonePe from '../../../hooks/usePhonePe';
import Toast from '../../../components/Toast';
import PremiumDropdown from '../../../components/PremiumDropdown';
import {
  Swords,
  Calendar,
  Users,
  Trophy,
  Upload,
  FileText,
  ArrowLeft,
  Info,
  Check,
  Rocket,
  IndianRupee,
  Target,
  Award,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';

const scrimListingPlans = [
  {
    id: 'basic',
    name: 'Basic Listing',
    features: [
      'Standard scrim listing',
      'Basic registration management',
      'Match scheduling',
      'Up to 25 teams',
    ],
    popular: false,
    dotColor: 'bg-[hsl(var(--muted-foreground))]',
  },
  {
    id: 'featured',
    name: 'Featured Listing',
    features: [
      'Featured on scrims page',
      'Priority in search results',
      'Advanced analytics',
      'Up to 25 teams',
      'Custom branding',
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
      'Up to 25 teams',
      'Dedicated support',
    ],
    popular: false,
    dotColor: 'bg-amber-500',
  },
];

const CreateScrim = () => {
  useContext(AuthContext);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  // eslint-disable-next-line no-unused-vars
  const { initiatePayment, loading: paymentLoading, error: paymentError } = usePhonePe();

  const [formData, setFormData] = useState({
    title: '',
    game_name: '',
    game_mode: '',
    entry_fee: '0',
    prize_pool: '0',
    max_participants: '25',
    tournament_date: '',
    tournament_time: '',
    registration_start_date: '',
    registration_start_time: '',
    registration_end_date: '',
    registration_end_time: '',
    description: '',
    rules: '',
    plan_type: 'basic',
  });

  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [tournamentFile, setTournamentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [tempScrimId, setTempScrimId] = useState(null);

  const [scrimPlanPrices, setScrimPlanPrices] = useState({
    basic: 299,
    featured: 499,
    premium: 699,
  });

  // Prize Distribution state
  const getDefaultPrizeDistribution = (pool) => {
    const p = parseInt(pool) || 0;
    if (p <= 0)
      return [
        { place: 1, amount: '0' },
        { place: 2, amount: '0' },
        { place: 3, amount: '0' },
      ];
    return [
      { place: 1, amount: Math.round(p * 0.5).toString() },
      { place: 2, amount: Math.round(p * 0.3).toString() },
      { place: 3, amount: Math.round(p * 0.2).toString() },
    ];
  };
  const [prizeDistribution, setPrizeDistribution] = useState(() =>
    getDefaultPrizeDistribution('0')
  );

  // Placement Points state
  const [placementPoints, setPlacementPoints] = useState([
    { place: 1, points: 10 },
    { place: 2, points: 6 },
    { place: 3, points: 5 },
    { place: 4, points: 4 },
    { place: 5, points: 3 },
    { place: 6, points: 2 },
    { place: 7, points: 1 },
    { place: 8, points: 1 },
  ]);

  // Match Structure state
  const [matches, setMatches] = useState([
    { id: '1', name: 'Match 1' },
    { id: '2', name: 'Match 2' },
    { id: '3', name: 'Match 3' },
  ]);

  const getPlaceSuffix = (place) => {
    if (place === 1) return 'st';
    if (place === 2) return 'nd';
    if (place === 3) return 'rd';
    return 'th';
  };

  React.useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await tournamentAPI.getPlanPricing();
        if (response.data.success && response.data.pricing) {
          setScrimPlanPrices(response.data.pricing.scrim);
        }
      } catch (err) {
        console.error('Failed to fetch plan pricing:', err);
      }
    };
    fetchPricing();
  }, []);

  const gameOptions = ['BGMI', 'COD', 'Freefire', 'Scarfall'];
  const gameFormatOptions = ['Squad', 'Duo', 'Solo'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'max_participants') {
      const val = parseInt(value) || 0;
      setFormData({ ...formData, [name]: Math.min(val, 25).toString() });
      return;
    }

    if (name === 'prize_pool') {
      setFormData({ ...formData, [name]: value });
      setPrizeDistribution(getDefaultPrizeDistribution(value));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handlePrizeChange = (index, value) => {
    const updated = [...prizeDistribution];
    updated[index] = { ...updated[index], amount: value };
    setPrizeDistribution(updated);
  };

  const addPrizePlace = () => {
    const nextPlace = prizeDistribution.length + 1;
    setPrizeDistribution([...prizeDistribution, { place: nextPlace, amount: '0' }]);
  };

  const removePrizePlace = (index) => {
    if (prizeDistribution.length <= 1) return;
    const updated = prizeDistribution
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, place: i + 1 }));
    setPrizeDistribution(updated);
  };

  const handlePointsChange = (index, value) => {
    const updated = [...placementPoints];
    updated[index] = { ...updated[index], points: parseInt(value) || 0 };
    setPlacementPoints(updated);
  };

  const addPlacementPoint = () => {
    const nextPlace = placementPoints.length + 1;
    setPlacementPoints([...placementPoints, { place: nextPlace, points: 0 }]);
  };

  const removePlacementPoint = (index) => {
    if (placementPoints.length <= 1) return;
    const updated = placementPoints
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, place: i + 1 }));
    setPlacementPoints(updated);
  };

  const addMatch = () => {
    if (matches.length >= 4) {
      showToast('Maximum 4 matches allowed per scrim', 'error');
      return;
    }
    const newId = Date.now().toString();
    setMatches([...matches, { id: newId, name: `Match ${matches.length + 1}` }]);
  };

  const removeMatch = (id) => {
    if (matches.length <= 1) {
      showToast('Scrim must have at least one match', 'error');
      return;
    }
    setMatches(matches.filter((m) => m.id !== id));
  };

  const updateMatchName = (id, value) => {
    setMatches(matches.map((m) => (m.id === id ? { ...m, name: value } : m)));
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

  const createScrimAfterPayment = async () => {
    try {
      const formDataToSend = new FormData();

      formDataToSend.append('event_mode', 'SCRIM');
      formDataToSend.append('prize_pool', formData.prize_pool);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('game_name', formData.game_name);
      formDataToSend.append('game_mode', formData.game_mode);
      formDataToSend.append('entry_fee', formData.entry_fee);
      formDataToSend.append('max_participants', formData.max_participants);
      formDataToSend.append('max_matches', matches.length.toString());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('rules', formData.rules);
      formDataToSend.append('plan_type', formData.plan_type);

      // Wire prize distribution: { "1st": amount, "2nd": amount, ... } — keys must be ordinal to match ScrimDetail placeColors
      const prizeDistObj = {};
      prizeDistribution.forEach((item) => {
        prizeDistObj[`${item.place}${getPlaceSuffix(item.place)}`] = item.amount;
      });
      formDataToSend.append('prize_distribution', JSON.stringify(prizeDistObj));

      // Wire placement points: { "1": points, "2": points, ... }
      const placementObj = {};
      placementPoints.forEach((item) => {
        placementObj[item.place.toString()] = item.points;
      });
      formDataToSend.append('placement_points', JSON.stringify(placementObj));

      const tournamentDateTime = new Date(
        `${formData.tournament_date}T${formData.tournament_time}`
      );
      const regStartDateTime = new Date(
        `${formData.registration_start_date}T${formData.registration_start_time}`
      );
      const regEndDateTime = new Date(
        `${formData.registration_end_date}T${formData.registration_end_time}`
      );

      formDataToSend.append('tournament_start', tournamentDateTime.toISOString());
      formDataToSend.append(
        'tournament_end',
        new Date(tournamentDateTime.getTime() + 4 * 60 * 60 * 1000).toISOString()
      );
      formDataToSend.append('registration_start', regStartDateTime.toISOString());
      formDataToSend.append('registration_end', regEndDateTime.toISOString());

      formDataToSend.append(
        'rounds',
        JSON.stringify([
          {
            round: 1,
            max_teams: parseInt(formData.max_participants),
            qualifying_teams: 0,
          },
        ])
      );

      if (bannerImage) formDataToSend.append('banner_image', bannerImage);
      if (tournamentFile) formDataToSend.append('tournament_file', tournamentFile);

      const response = await tournamentAPI.createTournament(formDataToSend);
      return response.data;
    } catch (err) {
      console.error('Error creating scrim:', err);
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
      const regStartDateTime = new Date(
        `${formData.registration_start_date}T${formData.registration_start_time}`
      );
      const regEndDateTime = new Date(
        `${formData.registration_end_date}T${formData.registration_end_time}`
      );

      if (regEndDateTime <= regStartDateTime) {
        setError('Registration end must be after start time');
        setLoading(false);
        return;
      }
      if (tournamentDateTime <= regEndDateTime) {
        setError('Scrim must start after registration ends');
        setLoading(false);
        return;
      }

      showToast('Creating scrim...', 'info');
      const scrimDataItems = await createScrimAfterPayment();

      if (scrimDataItems.payment_required && scrimDataItems.redirect_url) {
        showToast('Opening payment gateway...', 'info');

        if (!window.PhonePeCheckout) {
          setError('Payment gateway not loaded. Please refresh the page.');
          setLoading(false);
          return;
        }

        window.PhonePeCheckout.transact({
          tokenUrl: scrimDataItems.redirect_url,
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
                  try {
                    const statusResponse = await tournamentAPI.checkPaymentStatus({
                      merchant_order_id: scrimDataItems.merchant_order_id,
                    });

                    if (
                      statusResponse.data.status === 'completed' &&
                      statusResponse.data.tournament_id
                    ) {
                      showToast('Scrim created successfully!', 'success');
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
                  } catch (err) {
                    console.error('Error checking status poll:', err);
                    setTimeout(checkStatus, 2000);
                  }
                };
                setTimeout(checkStatus, 1000);
              } catch (err) {
                console.error('Error checking payment status:', err);
                showToast('Payment completed! Please check your dashboard.', 'success');
                setTimeout(() => {
                  navigate('/host/dashboard');
                }, 1500);
              }
            }
          },
        });
      } else {
        showToast('Scrim created successfully!', 'success');
        setLoading(false);
        setTimeout(() => {
          navigate('/host/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Error in scrim creation:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create scrim');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 relative bg-[hsl(var(--background))]">
      <div className="cyber-grid" />
      <div className="scanlines" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
              Create Scrim
            </span>
          </h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            Set up practice matches for teams to compete and improve
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full border text-sm"
            style={{
              color: 'hsl(var(--accent))',
              borderColor: 'hsl(var(--accent))',
            }}
          >
            <Users className="w-3 h-3" />
            Maximum 25 Teams
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))] text-sm mb-6">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-10">
          {/* Scrim Listing Plans */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-[hsl(var(--foreground))]">
              Scrim Listing Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scrimListingPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setFormData({ ...formData, plan_type: plan.id })}
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
                        ₹{scrimPlanPrices[plan.id]}
                      </span>
                      <span className="text-[hsl(var(--muted-foreground))]">/scrim</span>
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
                    onClick={() => setFormData({ ...formData, plan_type: plan.id })}
                    className="w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                    style={
                      formData.plan_type === plan.id
                        ? { background: 'hsl(var(--accent))', color: 'white' }
                        : plan.id === 'featured'
                          ? { background: 'hsl(var(--accent))', color: 'white' }
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
                      `Choose ${plan.name.split(' ')[0]}`
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Scrim Details */}
          <div
            className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6"
            style={{ position: 'relative', zIndex: 10, overflow: 'visible' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                <Swords className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Scrim Details</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Scrim Name
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Practice Scrim #1"
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
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
                  placeholder="Describe your scrim, rules, and what teams should expect..."
                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    <Users className="w-4 h-4" />
                    Max Teams (Max 25)
                  </label>
                  <input
                    type="number"
                    name="max_participants"
                    required
                    max={25}
                    value={formData.max_participants}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="25"
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    Entry Fee (₹) — Optional
                  </label>
                  <input
                    type="number"
                    name="entry_fee"
                    value={formData.entry_fee}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                    <Trophy className="w-4 h-4" />
                    Prize Pool (₹)
                  </label>
                  <input
                    type="number"
                    name="prize_pool"
                    value={formData.prize_pool}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="5000"
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2.5 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scrim Schedule */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                <Calendar className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Scrim Schedule</h2>
            </div>

            <div className="space-y-6">
              {/* Registration Start */}
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
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
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
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
                      min={formData.registration_start_date}
                      value={formData.registration_end_date}
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

              {/* Scrim Kick-off */}
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3">
                  Scrim Kick-off
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
                      min={formData.registration_end_date}
                      value={formData.tournament_date}
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

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[hsl(var(--accent)/0.05)] border border-[hsl(var(--accent)/0.15)]">
                <Info className="w-3.5 h-3.5 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  The scrim session must be scheduled after registration closes.
                </p>
              </div>
            </div>
          </div>

          {/* Rules */}
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
              rows="6"
              value={formData.rules}
              onChange={handleChange}
              placeholder="Scrim rules, restrictions, and guidelines..."
              className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors resize-none font-mono leading-relaxed"
            />

            {/* Detailed Guidelines file */}
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-3">
                <FileText className="w-4 h-4" />
                Detailed Guidelines{' '}
                <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-scrim-upload"
              />
              <label
                htmlFor="pdf-scrim-upload"
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

          {/* Scrim Poster */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                <Upload className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Scrim Poster{' '}
                <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">
                  (Optional)
                </span>
              </h2>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
              style={{ borderColor: 'hsl(var(--border)/0.5)' }}
            >
              {bannerPreview ? (
                <div className="space-y-4">
                  <img
                    src={bannerPreview}
                    alt="Scrim poster preview"
                    className="max-h-48 mx-auto rounded-lg object-cover"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImage(null);
                        setBannerPreview(null);
                      }}
                      className="px-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors"
                    >
                      Remove
                    </button>
                    <label
                      htmlFor="banner-scrim-upload"
                      className="px-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors cursor-pointer"
                    >
                      Change Poster
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-[hsl(var(--foreground))]">
                      Upload Scrim Poster
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Recommended size: 1920x1080px · PNG, JPG up to 5MB
                    </p>
                  </div>
                  <label
                    htmlFor="banner-scrim-upload"
                    className="inline-block px-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              )}
              <input
                id="banner-scrim-upload"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Prize Distribution & Placement Points */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prize Distribution */}
            <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <IndianRupee className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  Prize Distribution
                </h2>
              </div>
              <div className="space-y-2 mb-3">
                {prizeDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 min-w-[56px]">
                      <Trophy
                        className={`w-4 h-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-[hsl(var(--muted-foreground))]'}`}
                      />
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {item.place}
                        {getPlaceSuffix(item.place)}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))]">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handlePrizeChange(index, e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm pl-7 pr-3 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                      />
                    </div>
                    {prizeDistribution.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePrizePlace(index)}
                        className="p-1.5 rounded text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPrizePlace}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors mb-3"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Place
              </button>
              {/* Total validation */}
              {(() => {
                const total = prizeDistribution.reduce(
                  (sum, i) => sum + (parseInt(i.amount) || 0),
                  0
                );
                const pool = parseInt(formData.prize_pool) || 0;
                const color =
                  total === pool
                    ? 'text-green-400'
                    : total > pool
                      ? 'text-[hsl(var(--destructive))]'
                      : 'text-yellow-400';
                const bg =
                  total === pool
                    ? 'bg-green-500/10 border-green-500/30'
                    : total > pool
                      ? 'bg-[hsl(var(--destructive)/0.1)] border-[hsl(var(--destructive)/0.3)]'
                      : 'bg-yellow-500/10 border-yellow-500/30';
                return (
                  <div className={`p-3 rounded-lg border ${bg}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--muted-foreground))]">
                        Total Distributed:
                      </span>
                      <span className={`font-bold ${color}`}>
                        ₹{total.toLocaleString()} / ₹{pool.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Placement Points */}
            <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                  <Target className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                  Placement Points
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {placementPoints.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 p-2 bg-[hsl(var(--secondary)/0.2)] rounded-lg border border-[hsl(var(--border)/0.3)]"
                  >
                    <span className="text-xs text-[hsl(var(--muted-foreground))] min-w-[36px]">
                      #{item.place}
                    </span>
                    <input
                      type="number"
                      value={item.points}
                      onChange={(e) => handlePointsChange(index, e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs text-center py-1 px-1 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                    />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">pts</span>
                    {placementPoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlacementPoint(index)}
                        className="text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] rounded p-0.5 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPlacementPoint}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors mb-3"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Placement
              </button>
              {/* Kill Points info */}
              <div className="p-3 rounded-lg bg-[hsl(var(--accent)/0.1)] border border-[hsl(var(--accent)/0.3)]">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[hsl(var(--accent))]" />
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Kill Points</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Every finish ={' '}
                      <span className="font-bold text-[hsl(var(--accent))]">1 point</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))] space-y-0.5">
                <p>• Total Points = Placement Points + Kill Points</p>
                <p>• Preset values shown, editable as needed</p>
              </div>
            </div>
          </div>

          {/* Match Structure */}
          <div className="cyber-card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                  <Trophy className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Match Structure</h2>
              </div>
              <button
                type="button"
                onClick={addMatch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Match
              </button>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Configure the matches for your scrim. Teams will play through each match sequentially.
            </p>
            <div className="space-y-3">
              {matches.map((match, index) => (
                <div
                  key={match.id}
                  className="flex items-center gap-4 p-4 bg-[hsl(var(--secondary)/0.3)] rounded-lg border border-[hsl(var(--border)/0.5)] hover:border-[hsl(var(--accent)/0.3)] transition-colors"
                >
                  <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                    <GripVertical className="w-5 h-5" />
                    <span className="text-xs font-semibold border border-[hsl(var(--accent))] text-[hsl(var(--accent))] rounded px-1.5 py-0.5">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">
                      Match Name
                    </label>
                    <input
                      type="text"
                      value={match.name}
                      onChange={(e) => updateMatchName(match.id, e.target.value)}
                      placeholder="Match name"
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm px-3 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent)/0.5)] transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMatch(match.id)}
                    className="p-2 rounded text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-2">
            <button
              type="submit"
              disabled={loading || paymentLoading}
              className="flex items-center justify-center gap-2 py-3 px-8 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent)), #7c3aed)',
                color: 'white',
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
                  <span>{paymentLoading ? 'Processing Payment...' : 'Launching...'}</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Publish Scrim — Pay ₹{scrimPlanPrices[formData.plan_type]}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default CreateScrim;
