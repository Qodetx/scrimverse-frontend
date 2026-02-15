import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../utils/testUtils';
import Navbar from '../Navbar';
import { AuthContext } from '../../context/AuthContext';
import { mockPlayerUser, mockHostUser, mockTokens } from '../../utils/testUtils';

// Helper to render Navbar with custom auth context
const renderNavbarWithAuth = (authValue) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <Navbar />
    </AuthContext.Provider>
  );
};

describe.skip('Navbar Component', () => {
  test('renders logo and brand name', () => {
    renderNavbarWithAuth({
      user: null,
      tokens: null,
      isAuthenticated: () => false,
      isHost: () => false,
      isPlayer: () => false,
      logout: jest.fn(),
    });

    expect(screen.getByText(/Scrimverse/i)).toBeInTheDocument();
  });

  test('displays guest navigation links when not authenticated', () => {
    renderNavbarWithAuth({
      user: null,
      tokens: null,
      isAuthenticated: () => false,
      isHost: () => false,
      isPlayer: () => false,
      logout: jest.fn(),
    });

    expect(screen.getByText(/Scrimverse/i)).toBeInTheDocument();
    // Tournaments and Scrims appear in both button text and dropdown
    const tournamentLinks = screen.getAllByText(/Tournaments/i);
    expect(tournamentLinks.length).toBeGreaterThan(0);
    const scrimLinks = screen.getAllByText(/Scrims/i);
    expect(scrimLinks.length).toBeGreaterThan(0);
  });

  test('displays player navigation links when authenticated as player', () => {
    renderNavbarWithAuth({
      user: mockPlayerUser,
      tokens: mockTokens,
      isAuthenticated: () => true,
      isHost: () => false,
      isPlayer: () => true,
      logout: jest.fn(),
    });

    // Dashboard link should be present
    const dashboardLinks = screen.getAllByText(/Dashboard/i);
    expect(dashboardLinks.length).toBeGreaterThan(0);
    // Tournaments and Scrims appear in both dropdown and main nav
    const tournamentLinks = screen.getAllByText(/Tournaments/i);
    expect(tournamentLinks.length).toBeGreaterThan(0);
    const scrimLinks = screen.getAllByText(/Scrims/i);
    expect(scrimLinks.length).toBeGreaterThan(0);
  });

  test('displays host navigation links when authenticated as host', () => {
    renderNavbarWithAuth({
      user: mockHostUser,
      tokens: mockTokens,
      isAuthenticated: () => true,
      isHost: () => true,
      isPlayer: () => false,
      logout: jest.fn(),
    });

    // Dashboard link should be present
    const dashboardLinks = screen.getAllByText(/Dashboard/i);
    expect(dashboardLinks.length).toBeGreaterThan(0);
    // Host should see Create Tournament and Create Scrim links
    const createTournamentLinks = screen.getAllByText(/Create Tournament/i);
    expect(createTournamentLinks.length).toBeGreaterThan(0);
  });

  test('displays logout button when authenticated', () => {
    renderNavbarWithAuth({
      user: mockPlayerUser,
      tokens: mockTokens,
      isAuthenticated: () => true,
      isHost: () => false,
      isPlayer: () => true,
      logout: jest.fn(),
    });

    // Logout button should be present
    const logoutButtons = screen.getAllByText(/Logout/i);
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  test('calls logout function when logout button is clicked', () => {
    const mockLogout = jest.fn();
    renderNavbarWithAuth({
      user: mockPlayerUser,
      tokens: mockTokens,
      isAuthenticated: () => true,
      isHost: () => false,
      isPlayer: () => true,
      logout: mockLogout,
    });

    // Get first logout button (desktop or mobile)
    const logoutButtons = screen.getAllByText(/Logout/i);
    fireEvent.click(logoutButtons[0]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('displays login/register buttons when not authenticated', () => {
    renderNavbarWithAuth({
      user: null,
      tokens: null,
      isAuthenticated: () => false,
      isHost: () => false,
      isPlayer: () => false,
      logout: jest.fn(),
    });
    // Login buttons appear in both desktop and mobile nav
    const playerLoginButtons = screen.getAllByText(/Player Login/i);
    expect(playerLoginButtons.length).toBeGreaterThan(0);
    const hostLoginButtons = screen.getAllByText(/Host Login/i);
    expect(hostLoginButtons.length).toBeGreaterThan(0);
  });
});
