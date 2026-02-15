import React from 'react';
import ReactDOM from 'react-dom';
import './TournamentPlanModal.css';

const TournamentPlanModal = ({ isOpen, onClose, plan, onSelect }) => {
  if (!isOpen || !plan) return null;

  const plans = {
    basic: {
      id: 'basic',
      name: 'Basic',
      price: 299,
      tagline: 'Ideal for small groups & practice',
      color: 'blue',
      features: [
        { text: 'Listed in Scrim Page', included: true },
        { text: 'Up to 25 teams capacity', included: true },
        { text: 'Custom Scrim Management Page', included: true },
      ],
    },
    featured: {
      id: 'featured',
      name: 'Pro Featured',
      price: 499,
      popular: true,
      tagline: 'Boost visibility and fill faster',
      color: 'purple',
      features: [
        { text: 'Premium Featured Tag', included: true },
        { text: 'Unlimited Team Capacity', included: true },
        { text: 'Priority Homepage Listing', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Social Media Mention', included: true },
      ],
    },
    premium: {
      id: 'premium',
      name: 'Elite Growth',
      price: 799,
      tagline: 'Maximum reach for massive events',
      color: 'gold',
      features: [
        { text: 'Top Row Billboard Slot', included: true },
        { text: 'Dedicated Promo Campaign', included: true },
        { text: 'Email Blast to Players', included: true },
        { text: 'Custom Graphic Design', included: true },
        { text: '7-Day Extended Reach', included: true },
      ],
    },
  };

  const planData = plans[plan];

  const modalElement = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
        {/* Decorative corner glow */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 bg-accent-${planData.color}/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2`}
        ></div>

        <button className="modal-close-premium" onClick={onClose} aria-label="Close modal">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex flex-col items-center mb-6 text-center">
            {planData.popular && (
              <span className="px-4 py-1.5 rounded-full bg-accent-purple/20 text-accent-purple text-[10px] font-black uppercase tracking-widest border border-accent-purple/30 mb-4 animate-pulse">
                Community Favorite
              </span>
            )}

            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 uppercase italic leading-none">
              {planData.name}
            </h3>
            <p className="text-gray-400 text-xs font-medium tracking-wide">{planData.tagline}</p>
          </div>

          <div className="flex-1 space-y-4 px-1">
            <div className="flex flex-col items-center py-6 bg-white/[0.03] border border-white/10 rounded-[2rem] relative overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-gray-500 mb-4">₹</span>
                <span className="text-5xl font-black text-white tracking-tight shimmer-text">
                  {planData.price}
                </span>
              </div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mt-1">
                One-Time License Fee
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
                What You Get
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {planData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 py-4 px-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all duration-300 group/item hover:bg-white/[0.04]"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg bg-accent-${planData.color}/10 flex items-center justify-center text-accent-${planData.color} group-hover/item:scale-110 transition-transform`}
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
                          strokeWidth="4"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-[13px] font-bold text-gray-300 group-hover/item:text-white transition-colors tracking-tight">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              className="w-full group relative overflow-hidden bg-white text-black py-4 rounded-xl font-black text-lg uppercase tracking-[0.15em] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-500 active:scale-95"
              onClick={() => {
                onSelect(planData.id);
                onClose();
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue bg-[length:200%_100%] opacity-0 group-hover:opacity-10 transition-opacity animate-shimmer"></div>
              <span className="relative z-10">Confirm Selection</span>
            </button>
            <p className="text-center text-[9px] text-gray-600 mt-6 uppercase font-black tracking-[0.2em] opacity-50">
              Verified & Secure Transaction via Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalElement, document.body);
};

export default TournamentPlanModal;
