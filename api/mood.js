// ──────────────────────────────────────────────
// Mood API Bridge — thin client for mood selection & matchmaking
// All matching algorithms, queue logic, and room creation is server-side
// ──────────────────────────────────────────────

import { api } from './client.js';

export const moodApi = {
  async select(mood) {
    return api.post('/api/mood/select', { mood });
  },

  async getCounts() {
    return api.get('/api/mood/counts');
  },

  async cancel() {
    return api.post('/api/mood/cancel');
  },
};
