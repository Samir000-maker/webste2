// ──────────────────────────────────────────────
// Chat API Bridge — thin client for chat operations
// All proprietary logic is server-side in server/services/socket-handlers.js
// ──────────────────────────────────────────────

import { api } from './client.js';

export const chatApi = {
  // ── HTTP ──
  async getHistory(roomId) {
    return api.get(`/api/chat/history/${roomId}`);
  },

  async getRoom(roomId) {
    return api.get(`/api/chat/room/${roomId}`);
  },

  async validateFile(name, type, size) {
    return api.post('/api/chat/validate-file', { name, type, size });
  },

  // ── WebSocket Events (sent to server, which handles the logic) ──
  sendMessage(roomId, text, type = 'text', metadata = {}) {
    api.emit('chat_message', { roomId, text, type, ...metadata });
  },

  sendTyping(roomId) {
    api.emit('user_typing', { roomId });
  },

  sendStopTyping(roomId) {
    api.emit('user_stop_typing', { roomId });
  },

  leaveRoom(roomId) {
    return new Promise((resolve) => {
      api.emit('leave_room', { roomId }, (response) => {
        resolve(response);
      });
    });
  },

  // ── Event Subscriptions (server handles logic, client only renders) ──
  onMessage(callback) {
    api.on('chat_message', callback);
  },

  onTyping(callback) {
    api.on('user_typing', callback);
  },

  onStopTyping(callback) {
    api.on('user_stop_typing', callback);
  },

  onUserJoined(callback) {
    api.on('user_joined', callback);
  },

  onUserLeft(callback) {
    api.on('user_left', callback);
  },

  onRoomExpired(callback) {
    api.on('room_expired', callback);
  },

  onError(callback) {
    api.on('error', callback);
  },
};
