import React from 'react';
import { Link } from 'react-router-dom';

const ScrimCard = ({ scrim }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-accent-cyan text-white';
      case 'ongoing':
        return 'bg-success text-white';
      case 'completed':
        return 'bg-gray-600 text-gray-200';
      case 'cancelled':
        return 'bg-danger text-white';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  return (
    <Link to={`/scrims/${scrim.id}`} className="block group">
      <div className="bg-dark-bg-card rounded-xl shadow-card hover:shadow-glow-purple transition-all duration-300 overflow-hidden border border-dark-bg-hover hover:border-accent-cyan">
        {scrim.banner_image && (
          <img src={scrim.banner_image} alt={scrim.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-white group-hover:text-accent-cyan transition-colors">
              {scrim.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(scrim.status)}`}
            >
              {scrim.status}
            </span>
          </div>

          <p className="text-gray-400 mb-2 flex items-center gap-2">
            ⚔️ {scrim.game_name} - {scrim.game_mode}
          </p>
          <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
            👑 Host: <span className="text-accent-purple">{scrim.host_name}</span>
          </p>

          <div className="flex justify-between items-center mb-4 bg-dark-bg-primary rounded-lg p-3">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Entry Fee</p>
              <p className="text-xl font-bold text-accent-cyan">₹{scrim.entry_fee}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase mb-1">Participants</p>
              <p className="text-xl font-semibold text-white">
                {scrim.current_participants}/{scrim.max_participants}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Start Date</p>
            <p className="text-md font-semibold text-white">
              {new Date(scrim.scrim_start).toLocaleDateString()}
            </p>
          </div>

          {scrim.is_featured && (
            <span className="inline-flex items-center gap-1 bg-accent-gold text-dark-bg-primary text-xs px-3 py-1 rounded-full font-bold">
              ⭐ Featured
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ScrimCard;
