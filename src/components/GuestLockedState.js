import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';

/**
 * Empty placeholder shown to guests on tabs that require authentication
 * (ID & Passwords, Slot List, Points Table, Analytics, Team).
 *
 * Replaces the normal view content for these tabs when the user is browsing
 * as a guest, so we never fire authenticated API calls and the user gets a
 * clear "what's here once I sign in" message + a one-click path to auth.
 *
 * Props:
 *  - title:         section title (e.g. "Slot List")
 *  - description:   one-line context (e.g. "View your assigned slot for each round of registered tournaments.")
 *  - returnTo:      pathname to return to after login (defaults to current location)
 */
const GuestLockedState = ({ title, description, returnTo }) => {
  const handleSignIn = (e) => {
    // Stash the current dashboard view so we can land back on the same tab
    // after the user signs in. Reuses the existing `post_verify_redirect`
    // key already honored by PlayerAuth and TournamentDetail's Join button.
    try {
      const target =
        returnTo ||
        (typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/player/dashboard');
      localStorage.setItem('post_verify_redirect', target);
    } catch {
      /* localStorage unavailable — fall through, user just lands on default */
    }
    // Don't preventDefault — let the <Link> navigate normally.
    if (!e) return;
  };

  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed"
      style={{
        borderColor: 'hsl(var(--border) / 0.4)',
        background: 'hsl(var(--card) / 0.4)',
        minHeight: 320,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: 56,
          height: 56,
          background: 'hsl(var(--accent) / 0.12)',
          color: 'hsl(var(--accent))',
        }}
      >
        <Lock className="h-6 w-6" />
      </div>

      <h3 className="text-lg font-bold mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
        {title || 'Sign in to view this'}
      </h3>

      <p className="text-sm max-w-md mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {description || 'Create a free account or sign in to access this section.'}
      </p>

      <Link
        to="/player-auth"
        onClick={handleSignIn}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: 'hsl(var(--accent))',
          color: '#fff',
          boxShadow: '0 4px 14px hsl(var(--accent) / 0.35)',
          textDecoration: 'none',
        }}
      >
        Sign In to Continue
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default GuestLockedState;
