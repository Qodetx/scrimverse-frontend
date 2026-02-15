// Mock API for testing

export const authAPI = {
  playerRegister: jest.fn(),
  hostRegister: jest.fn(),
  login: jest.fn(),
  getCurrentUser: jest.fn(),
  getPlayerProfile: jest.fn(),
  getHostProfile: jest.fn(),
  updatePlayerProfile: jest.fn(),
  updateHostProfile: jest.fn(),
};

export const tournamentAPI = {
  getTournaments: jest.fn(),
  getTournament: jest.fn(),
  createTournament: jest.fn(),
  updateTournament: jest.fn(),
  deleteTournament: jest.fn(),
  getHostTournaments: jest.fn(),
  registerForTournament: jest.fn(),
  getMyRegistrations: jest.fn(),
};

export const scrimAPI = {
  getScrims: jest.fn(),
  getScrim: jest.fn(),
  createScrim: jest.fn(),
  updateScrim: jest.fn(),
  deleteScrim: jest.fn(),
  registerForScrim: jest.fn(),
  getMyRegistrations: jest.fn(),
};

export const ratingAPI = {
  rateHost: jest.fn(),
  getHostRatings: jest.fn(),
};

const api = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

export default api;
