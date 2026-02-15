import React, { useState, useEffect } from 'react';

const RoundNamesModal = ({ isOpen, onClose, numRounds, roundNames, onSave }) => {
  const [names, setNames] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing names or defaults
      const initialNames = {};
      for (let i = 1; i <= numRounds; i++) {
        initialNames[i] = roundNames[i] || `Round ${i}`;
      }
      setNames(initialNames);
    }
  }, [isOpen, numRounds, roundNames]);

  const handleChange = (roundNum, value) => {
    setNames((prev) => ({
      ...prev,
      [roundNum]: value,
    }));
  };

  const handleSave = () => {
    onSave(names);
    onClose();
  };

  const handleReset = () => {
    const defaultNames = {};
    for (let i = 1; i <= numRounds; i++) {
      defaultNames[i] = `Round ${i}`;
    }
    setNames(defaultNames);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0a0e1a] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 cyber-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Customize Round Names</h2>
            <p className="text-gray-400 text-sm">
              Give your rounds custom names to make them more engaging
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Round Name Inputs */}
        <div className="space-y-4 mb-8">
          {Array.from({ length: numRounds }, (_, i) => i + 1).map((roundNum) => (
            <div key={roundNum} className="group">
              <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider ml-1">
                Round {roundNum}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={names[roundNum] || ''}
                  onChange={(e) => handleChange(roundNum, e.target.value)}
                  placeholder={`Round ${roundNum}`}
                  maxLength={30}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs">
                  {(names[roundNum] || '').length}/30
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Example Suggestions */}
        <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-primary-400 font-semibold text-sm mb-2">Suggestions:</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Popular names: "Qualifiers", "Quarter Finals", "Semi Finals", "Grand Finals", "Group
                Stage", "Knockout Stage"
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-semibold transition-all border border-white/10"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Save Round Names
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundNamesModal;
