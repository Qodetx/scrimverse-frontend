import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    let tokens = null;
    const stored = localStorage.getItem('tokens');
    if (stored) {
      try {
        tokens = JSON.parse(stored);
      } catch (e) {
        console.warn('Invalid tokens in localStorage, clearing', e);
        localStorage.removeItem('tokens');
        tokens = null;
      }
    }
    if (tokens && tokens.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints — let login/register handle their own 401s
    const isAuthEndpoint =
      originalRequest.url?.includes('/accounts/login/') ||
      originalRequest.url?.includes('/accounts/player/register/') ||
      originalRequest.url?.includes('/accounts/host/register/') ||
      originalRequest.url?.includes('/accounts/google-auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const stored = localStorage.getItem('tokens');
        if (!stored) throw new Error('no_tokens');
        let tokens = null;
        try {
          tokens = JSON.parse(stored);
        } catch (e) {
          localStorage.removeItem('tokens');
          throw e;
        }
        const response = await axios.post(`${API_URL}/accounts/token/refresh/`, {
          refresh: tokens.refresh,
        });

        const newTokens = {
          access: response.data.access,
          refresh: tokens.refresh,
        };

        localStorage.setItem('tokens', JSON.stringify(newTokens));
        api.defaults.headers.Authorization = `Bearer ${newTokens.access}`;
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('tokens');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  playerRegister: (data) => api.post('/accounts/player/register/', data),
  hostRegister: (data) => api.post('/accounts/host/register/', data),
  login: (data) => api.post('/accounts/login/', data),
  getCurrentUser: (game = 'ALL') => api.get('/accounts/me/', { params: { game } }),
  getPlayerProfile: (id) => api.get(`/accounts/player/profile/${id}/`),
  getHostProfile: (id) => api.get(`/accounts/host/profile/${id}/`),
  updateUser: (data) => {
    const config =
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.patch('/accounts/me/', data, config);
  },
  updatePlayerProfile: (data) => api.patch('/accounts/player/profile/me/', data),
  updateHostProfile: (data) => api.patch('/accounts/host/profile/me/', data),
  searchPlayerUsernames: (query, forTeam = false) =>
    api.get('/accounts/players/search/', { params: { q: query, for_team: forTeam } }),
  googleAuth: (data) => api.post('/accounts/google-auth/', data),
};

// Tournament APIs
export const tournamentAPI = {
  getTournaments: (params) => api.get('/tournaments/', { params }),
  getTournament: (id) => api.get(`/tournaments/${id}/`),
  createTournament: (data) => {
    // If data is FormData (for file uploads), let browser set Content-Type
    const config =
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post('/tournaments/create/', data, config);
  },
  updateTournament: (id, data) => api.put(`/tournaments/${id}/update/`, data),
  deleteTournament: (id) => api.delete(`/tournaments/${id}/delete/`),
  getHostTournaments: (hostId) => api.get(`/tournaments/host/${hostId}/`),
  registerForTournament: (tournamentId, data) =>
    api.post(`/tournaments/${tournamentId}/register/`, data),
  registerInitiate: (tournamentId, data) =>
    api.post(`/tournaments/${tournamentId}/register-init/`, data),
  getMyRegistrations: () => api.get('/tournaments/my-registrations/'),
  // Platform Stats
  getPlatformStats: () => api.get('/tournaments/stats/platform/'),
  // Host dashboard stats
  getHostStats: () => api.get('/tournaments/stats/host/'),
  // Tournament Management (Host only)
  getManageTournament: (id) => api.get(`/tournaments/${id}/manage/`),
  updateTournamentFields: (id, data) => {
    // Handle FormData for file uploads
    const config =
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.patch(`/tournaments/${id}/update-fields/`, data, config);
  },
  getTournamentRegistrations: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}/registrations/`),
  startRound: (tournamentId, roundNumber) =>
    api.post(`/tournaments/${tournamentId}/start-round/${roundNumber}/`),
  selectTeams: (tournamentId, data) => api.post(`/tournaments/${tournamentId}/select-teams/`, data),
  submitScores: (tournamentId, data) =>
    api.post(`/tournaments/${tournamentId}/submit-scores/`, data),
  selectWinner: (tournamentId, data) =>
    api.post(`/tournaments/${tournamentId}/select-winner/`, data),
  endRound: (tournamentId) => api.post(`/tournaments/${tournamentId}/end-round/`),
  endTournament: (tournamentId) => api.post(`/tournaments/${tournamentId}/end/`),
  startTournament: (tournamentId) => api.post(`/tournaments/${tournamentId}/start/`),
  // Round groups with matches (includes scheduled_date, scheduled_time, map_name)
  getRoundGroups: (tournamentId, roundNumber) =>
    api.get(`/tournaments/${tournamentId}/rounds/${roundNumber}/groups/`),
  // Fetch players for a team registration within a tournament
  getTeamPlayers: (tournamentId, registrationId) =>
    api.get(`/tournaments/${tournamentId}/teams/${registrationId}/players/`),
  // Bulk schedule update (Host only)
  bulkSchedule: (tournamentId, schedules) =>
    api.put(`/tournaments/${tournamentId}/bulk-schedule/`, { schedules }),
  // 5v5 / Match control APIs
  // Configure a round (e.g., create lobbies/groups for 5v5)
  configureRound: (tournamentId, roundNumber, data) =>
    api.post(`/tournaments/${tournamentId}/rounds/${roundNumber}/configure/`, data),
  // Start a specific match (by groupId)
  startMatch: (tournamentId, groupId, data) =>
    api.post(`/tournaments/${tournamentId}/groups/${groupId}/matches/start/`, data),
  // End a specific match (by matchId)
  endMatch: (tournamentId, matchId, data) =>
    api.post(`/tournaments/${tournamentId}/matches/${matchId}/end/`, data),
  // Submit scores for a match (matchId)
  submitMatchScores: (tournamentId, matchId, data) =>
    api.post(`/tournaments/${tournamentId}/matches/${matchId}/scores/`, data),
  // Get aggregated results for a round
  getRoundResults: (tournamentId, roundNumber) =>
    api.get(`/tournaments/${tournamentId}/rounds/${roundNumber}/results/`),
  // Update a registration/team status (e.g., eliminate, advance)
  updateTeamStatus: (tournamentId, registrationId, data) =>
    api.patch(`/tournaments/${tournamentId}/registrations/${registrationId}/status/`, data),
};

// Scrim APIs
export const scrimAPI = {
  getScrims: (params) => api.get('/tournaments/scrims/', { params }),
  getScrim: (id) => api.get(`/tournaments/scrims/${id}/`),
  createScrim: (data) => api.post('/tournaments/scrims/create/', data),
  updateScrim: (id, data) => api.put(`/tournaments/scrims/${id}/update/`, data),
  deleteScrim: (id) => api.delete(`/tournaments/scrims/${id}/delete/`),
  registerForScrim: (scrimId, data) => api.post(`/tournaments/scrims/${scrimId}/register/`, data),
  getMyRegistrations: () => api.get('/tournaments/scrims/my-registrations/'),
};

// Host Rating APIs
export const ratingAPI = {
  rateHost: (hostId, data) => api.post(`/tournaments/host/${hostId}/rate/`, data),
  getHostRatings: (hostId) => api.get(`/tournaments/host/${hostId}/ratings/`),
};

export default api;

// Payments API
export const paymentsAPI = {
  // Start a payment for an entry fee or plan.
  // For entry fee payments, pass { registration_id, amount, currency? }
  startPayment: (data) =>
    api.post('/payments/initiate/', {
      payment_type: data.payment_type || 'entry_fee',
      amount: data.amount,
      registration_id: data.registration_id,
      tournament_id: data.tournament_id,
      redirect_url: data.redirect_url,
    }),
};

// Invite APIs
export const inviteAPI = {
  getInviteDetails: (token) => api.get(`/accounts/invites/${token}/`),
  acceptInvite: (token) => api.post(`/accounts/invites/${token}/accept/`),
  declineInvite: (token) => api.post(`/accounts/invites/${token}/decline/`),
};

// Team APIs (accounts/teams/ router)
export const teamAPI = {
  getTeams: (params) => api.get('/accounts/teams/', { params }),
  createTeam: (data) => api.post('/accounts/teams/', data),
  getTeam: (id) => api.get(`/accounts/teams/${id}/`),
  updateTeam: (id, data) => api.put(`/accounts/teams/${id}/`, data),
  partialUpdateTeam: (id, data) => api.patch(`/accounts/teams/${id}/`, data),
  addMember: (teamId, username) => api.post(`/accounts/teams/${teamId}/add_member/`, { username }),
  removeMember: (teamId, memberId) =>
    api.post(`/accounts/teams/${teamId}/remove_member/`, { member_id: memberId }),
  transferCaptaincy: (teamId, memberId) =>
    api.post(`/accounts/teams/${teamId}/transfer_captaincy/`, { member_id: memberId }),
  leaveTeam: (teamId) => api.post(`/accounts/teams/${teamId}/leave_team/`),
  invitePlayer: (teamId, playerId) =>
    api.post(`/accounts/teams/${teamId}/invite_player/`, { player_id: playerId }),
  getJoinRequests: (teamId) => api.get(`/accounts/teams/${teamId}/join_requests/`),
  acceptRequest: (teamId, requestId) =>
    api.post(`/accounts/teams/${teamId}/accept_request/`, { request_id: requestId }),
  rejectRequest: (teamId, requestId) =>
    api.post(`/accounts/teams/${teamId}/reject_request/`, { request_id: requestId }),
  requestJoin: (teamId) => api.post(`/accounts/teams/${teamId}/request_join/`),
  getPastTournaments: (teamId) => api.get(`/accounts/teams/${teamId}/past_tournaments/`),
  getMyInvites: () => api.get('/accounts/teams/my_invites/'),
};

// Leaderboard APIs
export const leaderboardAPI = {
  getLeaderboard: (limit = 50, type = 'tournaments', game = 'ALL') =>
    api.get('/accounts/leaderboard/', { params: { limit, type, game } }),
  getTeamRank: (teamId) => api.get(`/accounts/teams/${teamId}/rank/`),
};
