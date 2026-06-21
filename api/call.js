// ──────────────────────────────────────────────
// Call API Bridge — thin client for WebRTC calling
// Signaling logic is server-side in server/services/socket-handlers.js
// TURN credentials are fetched via API (server-only keys never hit the client)
// ──────────────────────────────────────────────

import { api } from './client.js';

export const callApi = {
  // ── HTTP (secure, keys stay server-side) ──
  async getTurnCredentials() {
    return api.post('/api/call/turn-credentials');
  },

  async validateRoom(roomId, callId) {
    return api.post('/api/call/validate-room', { roomId, callId });
  },

  // ── WebSocket Signaling (relayed by server, no client logic) ──
  initiateCall(roomId, callType) {
    api.emit('initiate_call', { roomId, callType });
  },

  acceptCall(roomId, callId) {
    api.emit('call_accepted', { roomId, callId });
  },

  declineCall(roomId, callId) {
    api.emit('call_declined', { roomId, callId });
  },

  sendCallState(roomId, callId, state) {
    api.emit('call_state_update', { roomId, callId, state });
  },

  sendIceCandidate(roomId, callId, candidate) {
    api.emit('ice_candidate', { roomId, callId, candidate });
  },

  sendOffer(roomId, callId, offer) {
    api.emit('offer', { roomId, callId, offer });
  },

  sendAnswer(roomId, callId, answer) {
    api.emit('answer', { roomId, callId, answer });
  },

  // ── Event Subscriptions ──
  onIncomingCall(callback) {
    api.on('incoming_call', callback);
  },

  onCallAccepted(callback) {
    api.on('call_accepted', callback);
  },

  onCallDeclined(callback) {
    api.on('call_declined', callback);
  },

  onCallStateUpdate(callback) {
    api.on('call_state_update', callback);
  },

  onIceCandidate(callback) {
    api.on('ice_candidate', callback);
  },

  onOffer(callback) {
    api.on('offer', callback);
  },

  onAnswer(callback) {
    api.on('answer', callback);
  },
};
