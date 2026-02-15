import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../AuthContext';
import { mockPlayerUser, mockHostUser, mockTokens } from '../../utils/testUtils';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Test component to access context
const TestComponent = () => {
  const { user, tokens, isAuthenticated, isHost, isPlayer, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No user'}</div>
      <div data-testid="tokens">{tokens ? JSON.stringify(tokens) : 'No tokens'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated() ? 'true' : 'false'}</div>
      <div data-testid="isHost">{isHost() ? 'true' : 'false'}</div>
      <div data-testid="isPlayer">{isPlayer() ? 'true' : 'false'}</div>
    </div>
  );
};

describe.skip('AuthContext', () => {
  let getItemSpy, setItemSpy, removeItemSpy;

  beforeEach(() => {
    // Create spies for localStorage methods
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original implementations
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
    removeItemSpy.mockRestore();
  });

  test('initializes with no user when localStorage is empty', async () => {
    getItemSpy.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('tokens')).toHaveTextContent('No tokens');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  test('fetches user data when tokens exist in localStorage', async () => {
    getItemSpy.mockReturnValue(JSON.stringify(mockTokens));
    axios.get.mockResolvedValue({ data: mockPlayerUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockPlayerUser));
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('isPlayer')).toHaveTextContent('true');
      expect(screen.getByTestId('isHost')).toHaveTextContent('false');
    });
  });

  test('identifies host user correctly', async () => {
    getItemSpy.mockReturnValue(JSON.stringify(mockTokens));
    axios.get.mockResolvedValue({ data: mockHostUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isHost')).toHaveTextContent('true');
      expect(screen.getByTestId('isPlayer')).toHaveTextContent('false');
    });
  });

  test('handles fetch user data error by logging out', async () => {
    getItemSpy.mockReturnValue(JSON.stringify(mockTokens));
    axios.get.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('tokens')).toHaveTextContent('No tokens');
      expect(removeItemSpy).toHaveBeenCalledWith('tokens');
    });
  });

  test('login function sets user and tokens', async () => {
    getItemSpy.mockReturnValue(null);

    const TestComponentWithLogin = () => {
      const { user, login } = useContext(AuthContext);

      return (
        <div>
          <div data-testid="user">{user ? JSON.stringify(user) : 'No user'}</div>
          <button onClick={() => login(mockPlayerUser, mockTokens)}>Login</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponentWithLogin />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });

    const loginButton = screen.getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockPlayerUser));
      expect(setItemSpy).toHaveBeenCalledWith('tokens', JSON.stringify(mockTokens));
    });
  });

  test('logout function clears user and tokens', async () => {
    getItemSpy.mockReturnValue(JSON.stringify(mockTokens));
    axios.get.mockResolvedValue({ data: mockPlayerUser });

    const TestComponentWithLogout = () => {
      const { user, logout, loading } = useContext(AuthContext);

      if (loading) return <div>Loading...</div>;

      return (
        <div>
          <div data-testid="user">{user ? JSON.stringify(user) : 'No user'}</div>
          <button onClick={logout}>Logout</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponentWithLogout />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockPlayerUser));
    });

    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(removeItemSpy).toHaveBeenCalledWith('tokens');
    });
  });
});
