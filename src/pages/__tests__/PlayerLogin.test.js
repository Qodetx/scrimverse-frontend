import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockPlayerUser, mockTokens } from '../../utils/testUtils';
import PlayerLogin from '../PlayerLogin';
import { authAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

// Mock the API
jest.mock('../../utils/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe.skip('PlayerLogin Component', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPlayerLogin = () => {
    return render(
      <AuthContext.Provider
        value={{
          login: mockLogin,
          user: null,
          tokens: null,
          isAuthenticated: () => false,
          isHost: () => false,
          isPlayer: () => false,
          logout: jest.fn(),
        }}
      >
        <PlayerLogin />
      </AuthContext.Provider>
    );
  };

  test('renders player login form', () => {
    renderPlayerLogin();

    expect(screen.getByText('Player Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('displays register link', () => {
    renderPlayerLogin();

    const registerLink = screen.getByText('Register here');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/player/register');
  });

  test('handles input changes', () => {
    renderPlayerLogin();

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('handles successful login', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        user: mockPlayerUser,
        tokens: mockTokens,
      },
    });

    renderPlayerLogin();

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'player@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'player@test.com',
        password: 'password123',
        user_type: 'player',
      });
      expect(mockLogin).toHaveBeenCalledWith(mockPlayerUser, mockTokens);
      expect(mockNavigate).toHaveBeenCalledWith('/player/dashboard');
    });
  });

  test('displays error message on login failure', async () => {
    authAPI.login.mockRejectedValue({
      response: {
        data: {
          error: 'Invalid credentials',
        },
      },
    });

    renderPlayerLogin();

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('displays generic error message when error response is missing', async () => {
    authAPI.login.mockRejectedValue(new Error('Network error'));

    renderPlayerLogin();

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });

  test('disables submit button while loading', async () => {
    authAPI.login.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderPlayerLogin();

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});
