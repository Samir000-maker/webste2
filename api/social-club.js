// ──────────────────────────────────────────────
// Social Club API Bridge — thin client for club operations
// All club logic, SSE streaming, and FCM notifications are server-side
// ──────────────────────────────────────────────

import { api } from './client.js';

export const socialClubApi = {
  async getState() {
    return api.get('/api/social-club/state');
  },

  async join() {
    return api.post('/api/social-club/join');
  },

  async toggle() {
    return api.post('/api/social-club/toggle');
  },
};
