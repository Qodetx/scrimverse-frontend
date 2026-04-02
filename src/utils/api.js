import axios from 'axios';

// Allow a sensible default when the build/env doesn't provide an API URL.
// In production the hosting may serve the frontend and backend on the same domain
// under the `/api` prefix. Falling back to `/api` avoids broken undefined baseURLs.
const API_URL = process.env.REACT_APP_API_URL || '/api';

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
  searchHosts: (query) => api.get('/accounts/hosts/search/', { params: { q: query } }),
  googleAuth: (data) => api.post('/accounts/google-auth/', data),
  changePassword: (data) => api.post('/accounts/change-password/', data),
  sendOTP: (purpose, phone) => api.post('/accounts/send-otp/', { purpose, phone }),
  updatePhone: (phone, otp) => api.patch('/accounts/update-phone/', { phone, otp }),
  sendRegistrationOTP: (phone) => api.post('/accounts/send-registration-otp/', { phone }),
  verifyRegistrationOTP: (phone, otp) =>
    api.post('/accounts/verify-registration-otp/', { phone, otp }),
  exportData: () => api.get('/accounts/export-data/', { responseType: 'blob' }),
  requestDataExport: () => api.post('/accounts/request-data-export/'),
  getDataExport: (token) => api.get(`/accounts/data-export/${token}/`),
  deleteAccount: (password) => api.post('/accounts/delete-account/', { password }),
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
  getPlayerRegistrations: (playerId, params) =>
    api.get(`/tournaments/player/${playerId}/registrations/`, { params }),
  getTournamentStats: (id) => api.get(`/tournaments/${id}/stats/`),
  // Platform Stats
  getPlatformStats: () => api.get('/tournaments/stats/platform/'),
  // Host dashboard stats
  getHostStats: () => api.get('/tournaments/stats/host/'),
  getHostAnalytics: () => api.get('/tournaments/stats/host/analytics/'),
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
  exportTournamentRegistrationsCSV: (tournamentId) =>
    api.get(`/tournaments/${tournamentId}/registrations/export/`, {
      responseType: 'blob',
    }),
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
  // Reset a round configuration (delete groups/matches so organizer can reconfigure)
  resetRound: (tournamentId, roundNumber) =>
    api.delete(`/tournaments/${tournamentId}/rounds/${roundNumber}/configure/`),
  // Start a specific match (by groupId)
  startMatch: (tournamentId, groupId, data) =>
    api.post(`/tournaments/${tournamentId}/groups/${groupId}/matches/start/`, data),
  // Update match credentials only (Save Only — without changing status)
  updateMatchCredentials: (tournamentId, matchId, data) =>
    api.patch(`/tournaments/${tournamentId}/matches/${matchId}/credentials/`, data),
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
  listPayments: () => api.get('/payments/list/'),
  getEarnings: () => api.get('/payments/earnings/'),
  getHostTransactions: () => api.get('/payments/host-transactions/'),
};

// Public axios instance — no auth header (for AllowAny endpoints)
const publicApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Invite APIs
export const inviteAPI = {
  getInviteDetails: (token) => publicApi.get(`/accounts/invites/${token}/`),
  acceptInvite: (token) => api.post(`/accounts/invites/${token}/accept/`),
  declineInvite: (token) => api.post(`/accounts/invites/${token}/decline/`),
};

// Team APIs (accounts/teams/ router)
export const teamAPI = {
  getTeams: (params) => api.get('/accounts/teams/', { params }),
  createTeam: (data) => api.post('/accounts/teams/', data),
  getTeam: (id) => api.get(`/accounts/teams/${id}/`),
  updateTeam: (id, data) => api.put(`/accounts/teams/${id}/`, data),
  partialUpdateTeam: (id, data) => {
    const config =
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.patch(`/accounts/teams/${id}/`, data, config);
  },
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
  handleInvite: (inviteId, action) =>
    api.post('/accounts/teams/handle_invite/', { invite_id: inviteId, action }),
  getMyTournamentInvites: () => api.get('/accounts/teams/my_tournament_invites/'),
  sendInvites: (teamId, invites) =>
    api.post(`/accounts/teams/${teamId}/send_invites/`, { invites }),
  generateInviteLink: (teamId) => api.post(`/accounts/teams/${teamId}/generate-invite-link/`),
  searchPlayers: (query, game = null) =>
    api.get('/accounts/players/search/', { params: { q: query, for_team: true, game } }),
  convertPermanent: (teamId) => api.post(`/accounts/teams/${teamId}/convert_permanent/`),
  declineConversion: (teamId) => api.post(`/accounts/teams/${teamId}/decline_conversion/`),
  setMemberRole: (teamId, memberId, role) =>
    api.patch(`/accounts/teams/${teamId}/set-member-role/`, { member_id: memberId, role }),
};

// Leaderboard APIs
export const leaderboardAPI = {
  getLeaderboard: (limit = 50, type = 'tournaments', game = 'ALL') =>
    api.get('/accounts/leaderboard/', { params: { limit, type, game } }),
  getTeamRank: (teamId) => api.get(`/accounts/teams/${teamId}/rank/`),
};

export const analyticsAPI = {
  getStats: (game) =>
    api.get('/accounts/players/analytics/stats/', { params: game ? { game } : {} }),
  getTrend: (game) =>
    api.get('/accounts/players/analytics/trend/', { params: game ? { game } : {} }),
  getWeeklyTrend: (game) =>
    api.get('/accounts/players/analytics/weekly-trend/', { params: game ? { game } : {} }),
  getActivity: (game) =>
    api.get('/accounts/players/analytics/activity/', { params: game ? { game } : {} }),
  getRecentResults: (game) =>
    api.get('/accounts/players/analytics/recent-results/', { params: game ? { game } : {} }),
  getWeeklyActivity: (game) =>
    api.get('/accounts/players/analytics/weekly-activity/', { params: game ? { game } : {} }),
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/accounts/notifications/', { params }),
  markRead: (id) => api.patch(`/accounts/notifications/${id}/read/`),
  markAllRead: () => api.post('/accounts/notifications/mark-all-read/'),
  deleteOne: (id) => api.delete(`/accounts/notifications/${id}/`),
  bulkAction: (ids, action) => api.post('/accounts/notifications/bulk/', { ids, action }),
};
