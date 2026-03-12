import React from 'react';
import './TournamentPlanSelector.css';

const TournamentPlanSelector = ({ selectedPlan, onPlanSelect, maxParticipants }) => {
  const plans = [
    {
      id: 'basic',
      name: 'Basic Listing',
      price: 299,
      features: [
        { text: 'Tournament listing (To be listed in all tournaments)', included: true },
        { text: 'Up to 100 teams', included: true },
        { text: 'Advanced tournament management', included: true },
        { text: 'Detailed analytics(TBD Later)', included: true },
        { text: 'Custom tournament page', included: true },
        { text: 'Email notifications to participants(TBD)', included: true },
      ],
    },
    {
      id: 'featured',
      name: 'Featured Listing',
      price: 499,
      popular: true,
      features: [
        {
          text: 'Premium featured listing (Official Tournaments, should be listed under this)',
          included: true,
        },
        { text: 'Unlimited teams', included: true },
        { text: 'Advanced management tools', included: true },
        { text: 'Comprehensive analytics', included: true },
        { text: 'Custom branding options', included: true },
        { text: 'Homepage banner placement', included: true },
        { text: 'Email notifications to participants', included: true },
      ],
    },
    {
      id: 'premium',
      name: 'Premium + Promotion',
      price: 799,
      features: [
        { text: 'Everything in Featured Plan', included: true },
        { text: 'Dedicated promotion campaign', included: true },
        { text: 'Premium placement', included: true },
        { text: 'Custom promotional content', included: true },
        { text: 'Extended visibility period', included: true },
        { text: 'Guaranteed participant boost', included: true },
        { text: 'Email notifications to participants', included: true },
      ],
    },
  ];

  const handlePlanClick = (planId) => {
    // Check if basic plan is selected with more than 100 participants
    if (planId === 'basic' && maxParticipants > 100) {
      alert(
        'Basic plan allows maximum 100 teams. Please reduce max participants or select Featured/Premium plan.'
      );
      return;
    }
    onPlanSelect(planId);
  };

  return (
    <div className="tournament-plan-selector">
      <h3 className="plan-selector-title">Select Tournament Plan</h3>
      <div className="plans-container">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
            onClick={() => handlePlanClick(plan.id)}
          >
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            <div className="plan-header">
              <h4 className="plan-name">{plan.name}</h4>
              <div className="plan-price">
                <span className="currency">₹</span>
                <span className="amount">{plan.price}</span>
              </div>
            </div>
            <div className="plan-features">
              <p className="features-title">What's Included:</p>
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className={feature.included ? 'included' : 'excluded'}>
                    <span className="feature-icon">{feature.included ? '✓' : '✕'}</span>
                    <span className="feature-text">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {selectedPlan === plan.id && (
              <div className="selected-indicator">
                <span>✓ Selected</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedPlan === 'basic' && maxParticipants > 100 && (
        <div className="plan-warning">
          ⚠️ Basic plan allows maximum 100 teams. Your current max participants ({maxParticipants})
          exceeds this limit. Please reduce max participants or upgrade to Featured/Premium plan.
        </div>
      )}
    </div>
  );
};

export default TournamentPlanSelector;
