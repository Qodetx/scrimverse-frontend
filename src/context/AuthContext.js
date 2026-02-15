import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(() => {
    try {
      const storedTokens = localStorage.getItem('tokens');
      return storedTokens ? JSON.parse(storedTokens) : null;
    } catch (e) {
      console.warn('Invalid tokens in localStorage, clearing', e);
      localStorage.removeItem('tokens');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokens) {
      // Verify token and get user data
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [tokens]);

  const fetchUserData = async (game = 'ALL') => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/accounts/me/`, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
        params: {
          game: game,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, tokenData) => {
    setUser(userData);
    setTokens(tokenData);
    localStorage.setItem('tokens', JSON.stringify(tokenData));
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('tokens');
  };

  const isAuthenticated = () => {
    return tokens !== null && user !== null;
  };

  const isHost = () => {
    return user && user.user && user.user.user_type === 'host';
  };

  const isPlayer = () => {
    return user && user.user && user.user.user_type === 'player';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        login,
        logout,
        isAuthenticated,
        isHost,
        isPlayer,
        loading,
        fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
