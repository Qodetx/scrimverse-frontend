import React, { useState } from 'react';
import { Trophy, Users, AlertTriangle, ArrowLeft, Check } from 'lucide-react';

const MAX_MATCHES = 4;

const ScrimConfigModal = ({ isOpen, onClose, onSubmit, totalTeams, teams = [], gameMode }) => {
  const [matchesPerGroup, setMatchesPerGroup] = useState(4);
  const [step, setStep] = useState(1); // 1 = config, 2 = confirm

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleConfirm = () => {
    onSubmit({
      teams_per_group: totalTeams,
      qualifying_per_group: 0,
      matches_per_group: matchesPerGroup,
    });
    setStep(1);
  };

  if (!isOpen) return null;

  // Step 2 — Confirm Teams
  if (step === 2) {
    return (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-lg rounded-xl border border-border/30 bg-card shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            ✕
          </button>

          {/* Header */}
          <div className="p-6 border-b border-border/20">
            <div className="flex items-center gap-3 mb-1">
              <Users className="h-5 w-5 text-accent" />
              <h2 className="text-base font-bold text-foreground">Confirm Teams & Start Scrim</h2>
            </div>
            <p className="text-sm text-muted-foreground pl-8">
              Review the {totalTeams} participating teams below. Once you start, you cannot go back.
            </p>
          </div>

          {/* Match summary card */}
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {matchesPerGroup} Matches Configured
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Match 1 through Match {matchesPerGroup}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold border border-accent/30">
                {totalTeams} Teams
              </span>
            </div>
          </div>

          {/* Team list — scrollable */}
          <div className="px-6 pt-4 flex-1 overflow-y-auto">
            <p className="text-sm font-medium text-foreground mb-3">Participating Teams:</p>
            <div className="grid grid-cols-3 gap-2">
              {teams.map((reg, index) => (
                <div
                  key={reg.id || index}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/30"
                >
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-accent/20 text-accent text-[10px] font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs text-foreground font-medium truncate">
                    {reg.team_name || `Team ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="px-6 pt-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">
                  Warning: This action cannot be undone
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Once you confirm and start the scrim, you won't be able to change the number of
                  matches or modify the team list. Make sure everything is correct before
                  proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border/40 bg-secondary/40 hover:bg-secondary/70 text-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Setup
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{ backgroundColor: '#ffffff', color: '#111111' }}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Confirm & Start Scrim
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1 — Configure
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border/30 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="h-5 w-5 text-accent" />
            <h2 className="text-base font-bold text-foreground">Configure Scrim</h2>
          </div>
          <p className="text-sm text-muted-foreground pl-8">
            Set up your scrim by choosing the number of matches.
          </p>
        </div>

        <form onSubmit={handleNext}>
          <div className="p-6 space-y-5">
            {/* Number of matches input */}
            <div className="space-y-2">
              <label
                htmlFor="matchesPerGroup"
                className="block text-sm font-medium text-foreground"
              >
                Number of Matches
              </label>
              <input
                id="matchesPerGroup"
                type="number"
                min="1"
                max={MAX_MATCHES}
                value={matchesPerGroup}
                onChange={(e) =>
                  setMatchesPerGroup(Math.min(MAX_MATCHES, Math.max(1, Number(e.target.value))))
                }
                className="w-full text-center text-lg font-bold px-4 py-3 bg-card/50 border border-accent/40 rounded-lg text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                Maximum {MAX_MATCHES} matches allowed per scrim
              </p>
            </div>

            {/* Teams participating card */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/20 border border-border/50">
              <Users className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {totalTeams} Teams Participating
                </p>
                <p className="text-xs text-muted-foreground">{gameMode} · All teams in one group</p>
              </div>
            </div>

            {/* Session overview */}
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">
                Session Overview
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: 'Total Teams', value: totalTeams },
                  { label: 'Groups', value: '1 (All together)' },
                  { label: 'Total Matches', value: matchesPerGroup },
                  { label: 'Format', value: gameMode || '—' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border/40 bg-secondary/40 hover:bg-secondary/70 text-foreground text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#ffffff', color: '#111111' }}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
            >
              Start Scrim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScrimConfigModal;
