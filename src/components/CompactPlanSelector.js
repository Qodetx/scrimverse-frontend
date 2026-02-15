import React from 'react';
import useToast from '../hooks/useToast';
import Toast from './Toast';
import './CompactPlanSelector.css';

const CompactPlanSelector = ({
  selectedPlan,
  onPlanSelect,
  maxParticipants,
  mode = 'tournament',
  prices = { basic: 299, featured: 499, premium: mode === 'scrim' ? 699 : 799 }, // Default fallback
}) => {
  const { toast, showToast, hideToast } = useToast();

  const tournamentPlans = [
    {
      id: 'basic',
      name: 'Basic Listing',
      price: prices.basic,
      color: 'blue',
      features: [
        'Standard tournament listing',
        'No Custom Banner placement',
        'Advanced analytics',
        'Up to 100 participants',
        'Dedicated Support',
      ],
      limit: 100,
    },
    {
      id: 'featured',
      name: 'Featured Listing',
      price: prices.featured,
      color: 'purple',
      popular: true,
      features: [
        'Featured on homepage',
        'No Custom Banner placement',
        'Advanced analytics',
        'Unlimited participants',
        'Dedicated Support',
      ],
      limit: Infinity,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: prices.premium,
      color: 'gold',
      features: [
        'Top-priority tournament listing',
        'Custom Banner placement',
        'Maximum in-house promotion',
        'Enhanced branding visibility',
        'Dedicated support',
      ],
      limit: Infinity,
    },
  ];

  const scrimPlans = [
    {
      id: 'basic',
      name: 'Basic Listing',
      price: prices.basic,
      color: 'blue',
      features: [
        'Standard scrim listing',
        'No Custom Banner placement',
        'Basic registration management',
        'Up to 25 teams',
        'Dedicated Support',
      ],
      limit: 25,
    },
    {
      id: 'featured',
      name: 'Featured Listing',
      price: prices.featured,
      color: 'purple',
      popular: true,
      features: [
        'Featured on scrims page',
        'Listed on homepage',
        'No Custom Banner placement',
        'Up to 25 teams',
        'Dedicated Support',
      ],
      limit: 25,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: prices.premium,
      color: 'gold',
      features: [
        'All Featured benefits',
        'Custom Banner upload',
        'Maximum in-house promotion',
        'Up to 25 teams',
        'Dedicated support',
      ],
      limit: 25,
    },
  ];

  const plans = mode === 'scrim' ? scrimPlans : tournamentPlans;
  const isScrim = mode === 'scrim';

  const handlePlanSelect = (plan) => {
    if (maxParticipants > plan.limit) {
      showToast(
        `${plan.name} allows maximum ${plan.limit} teams. Please reduce max participants or select a higher plan.`,
        'warning'
      );
      return;
    }
    onPlanSelect(plan.id);
  };

  return (
    <div className="compact-plan-selector">
      <div className="compact-plan-header">
        <h2 className="compact-plan-title">{isScrim ? 'Scrim' : 'Tournament'} Listing Plans</h2>
        <p className="compact-plan-subtitle">
          {isScrim
            ? 'Set up your practice matches and build your team skills'
            : 'Set up your epic gaming tournament and bring the community together'}
        </p>
      </div>

      <div className="compact-plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`compact-plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.color} ${
              plan.popular ? 'popular-card' : ''
            }`}
          >
            {plan.popular && <div className="popular-badge">POPULAR</div>}

            <div className="plan-content">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price-container">
                <span className="plan-currency">₹</span>
                <span className="plan-price">{plan.price.toLocaleString()}</span>
                <span className="plan-duration">/{isScrim ? 'scrim' : 'tournament'}</span>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="plan-feature-item">
                    <span className="feature-dot" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`plan-choose-btn ${plan.id}`}
                onClick={() => handlePlanSelect(plan)}
              >
                {selectedPlan === plan.id ? 'Selected' : `Choose ${plan.name.split(' ')[0]}`}
              </button>
            </div>

            {selectedPlan === plan.id && <div className="selected-glow" />}
          </div>
        ))}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default CompactPlanSelector;
