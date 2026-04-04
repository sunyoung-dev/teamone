import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      '서버 오류가 발생했습니다.';
    return Promise.reject(new Error(message));
  }
);

// ─── Players ─────────────────────────────────────────────────────────────────

export const getPlayers = () => api.get('/players');
export const getPlayer = (id) => api.get(`/players/${id}`);
export const createPlayer = (data) => api.post('/players', data);
export const updatePlayer = (id, data) => api.put(`/players/${id}`, data);
export const deletePlayer = (id) => api.delete(`/players/${id}`);
export const getPlayerStats = (id, params) =>
  api.get(`/stats/players/${id}`, { params });
export const getAllPlayerStats = (params) =>
  api.get('/stats/players', { params });

// ─── Games ────────────────────────────────────────────────────────────────────

export const getGames = (params) => api.get('/games', { params });
export const getGame = (id) => api.get(`/games/${id}`);
export const createGame = (data) => api.post('/games', data);
export const updateGame = (id, data) => api.put(`/games/${id}`, data);
export const deleteGame = (id) => api.delete(`/games/${id}`);

// ─── Lineup ───────────────────────────────────────────────────────────────────

export const getLineup = (gameId) => api.get(`/games/${gameId}/lineup`);
export const updateLineup = (gameId, lineup) =>
  api.put(`/games/${gameId}/lineup`, { lineup });

// ─── At-Bats ─────────────────────────────────────────────────────────────────

export const getAtBats = (gameId, params) =>
  api.get(`/games/${gameId}/atbats`, { params });
export const addAtBat = (gameId, data) =>
  api.post(`/games/${gameId}/atbats`, data);
export const updateAtBat = (gameId, atBatId, data) =>
  api.put(`/games/${gameId}/atbats/${atBatId}`, data);
export const deleteAtBat = (gameId, atBatId) =>
  api.delete(`/games/${gameId}/atbats/${atBatId}`);

// ─── Opponent At-Bats ─────────────────────────────────────────────────────────

export const getOpponentAtBats = (gameId) => api.get(`/games/${gameId}/opponent-atbats`);
export const addOpponentAtBat = (gameId, data) => api.post(`/games/${gameId}/opponent-atbats`, data);
export const updateOpponentAtBat = (gameId, id, data) => api.put(`/games/${gameId}/opponent-atbats/${id}`, data);
export const deleteOpponentAtBat = (gameId, id) => api.delete(`/games/${gameId}/opponent-atbats/${id}`);

// ─── Opponent Lineup ──────────────────────────────────────────────────────────

export const getOpponentLineup = (gameId) => api.get(`/games/${gameId}/opponent-lineup`);
export const updateOpponentLineup = (gameId, lineup) => api.put(`/games/${gameId}/opponent-lineup`, { lineup });

// ─── Pitching ─────────────────────────────────────────────────────────────────

export const getPitching = (gameId) => api.get(`/games/${gameId}/pitching`);
export const addPitching = (gameId, data) => api.post(`/games/${gameId}/pitching`, data);
export const updatePitching = (gameId, id, data) => api.put(`/games/${gameId}/pitching/${id}`, data);
export const deletePitching = (gameId, id) => api.delete(`/games/${gameId}/pitching/${id}`);

// ─── Pitching Stats ───────────────────────────────────────────────────────────

export const getPitchingStats = () => api.get('/stats/pitching');

// ─── Substitutions ────────────────────────────────────────────────────────────

export const getSubstitutions = (gameId) => api.get(`/games/${gameId}/substitutions`);
export const addSubstitution = (gameId, data) => api.post(`/games/${gameId}/substitutions`, data);
export const deleteSubstitution = (gameId, id) => api.delete(`/games/${gameId}/substitutions/${id}`);

// ─── Inning Events ───────────────────────────────────────────────────────────

export const getInningEvents = (gameId, params) =>
  api.get(`/games/${gameId}/inning-events`, { params });
export const addInningEvent = (gameId, data) =>
  api.post(`/games/${gameId}/inning-events`, data);
export const updateInningEvent = (gameId, eventId, data) =>
  api.put(`/games/${gameId}/inning-events/${eventId}`, data);
export const deleteInningEvent = (gameId, eventId) =>
  api.delete(`/games/${gameId}/inning-events/${eventId}`);

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getTeamStats = (params) => api.get('/stats/team', { params });
export const getLeaders = (params) => api.get('/stats/leaders', { params });

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = () => api.get('/dashboard');

// ─── Leagues ─────────────────────────────────────────────────────────────────

export const getLeagues = () => api.get('/leagues');
export const getLeague = (id) => api.get(`/leagues/${id}`);
export const createLeague = (data) => api.post('/leagues', data);
export const updateLeague = (id, data) => api.put(`/leagues/${id}`, data);
export const deleteLeague = (id) => api.delete(`/leagues/${id}`);

export default api;
