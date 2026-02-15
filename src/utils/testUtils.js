import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const { authValue, ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <GoogleOAuthProvider clientId="mock-client-id">
        <BrowserRouter>
          <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock user data for tests
export const mockPlayerUser = {
  user: {
    id: 1,
    email: 'player@test.com',
    username: 'testplayer',
    user_type: 'player',
    full_name: 'Test Player',
  },
  player_profile: {
    id: 1,
    user: 1,
    games_played: ['BGMI', 'CODM'],
    preferred_game_mode: 'Battle Royale',
  },
};

export const mockHostUser = {
  user: {
    id: 2,
    email: 'host@test.com',
    username: 'testhost',
    user_type: 'host',
    full_name: 'Test Host',
  },
  host_profile: {
    id: 1,
    user: 2,
    total_tournaments: 5,
    average_rating: 4.5,
  },
};

export const mockTokens = {
  access: 'mock-access-token',
  refresh: 'mock-refresh-token',
};

export const mockTournament = {
  id: 1,
  title: 'Test Tournament',
  game_name: 'BGMI',
  game_mode: 'Squad',
  status: 'upcoming',
  prize_pool: 10000,
  entry_fee: 100,
  max_participants: 100,
  current_participants: 50,
  tournament_start: '2025-12-01T10:00:00Z',
  tournament_end: '2025-12-01T18:00:00Z',
  registration_start: '2025-11-01T00:00:00Z',
  registration_end: '2025-11-30T23:59:59Z',
  host_name: 'Test Host',
  host: 1,
  is_featured: true,
  banner_image: null,
};

export const mockScrim = {
  id: 1,
  title: 'Test Scrim',
  game_name: 'CODM',
  game_mode: 'TDM',
  status: 'upcoming',
  max_participants: 20,
  current_participants: 10,
  scrim_start: '2025-12-01T15:00:00Z',
  scrim_end: '2025-12-01T16:00:00Z',
  registration_start: '2025-11-20T00:00:00Z',
  registration_end: '2025-11-30T23:59:59Z',
  host_name: 'Test Host',
  host: 1,
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
