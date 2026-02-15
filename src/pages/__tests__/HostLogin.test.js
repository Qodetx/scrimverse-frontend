import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockHostUser, mockTokens } from '../../utils/testUtils';
import HostLogin from '../HostLogin';
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

describe.skip('HostLogin Component', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHostLogin = () => {
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
        <HostLogin />
      </AuthContext.Provider>
    );
  };

  test('renders host login form', () => {
    renderHostLogin();

    expect(screen.getByText('Host Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('displays register link', () => {
    renderHostLogin();

    const registerLink = screen.getByText('Register here');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/host/register');
  });

  test('handles input changes', () => {
    renderHostLogin();

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'host@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('host@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('handles successful login', async () => {
    authAPI.login.mockResolvedValue({
      data: {
        user: mockHostUser,
        tokens: mockTokens,
      },
    });

    renderHostLogin();

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'host@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'host@test.com',
        password: 'password123',
        user_type: 'host',
      });
      expect(mockLogin).toHaveBeenCalledWith(mockHostUser, mockTokens);
      expect(mockNavigate).toHaveBeenCalledWith('/host/dashboard');
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

    renderHostLogin();

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

  test('disables submit button while loading', async () => {
    authAPI.login.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderHostLogin();

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
