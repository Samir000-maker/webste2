// ──────────────────────────────────────────────
// Universal API Client — the ONLY file that knows
// about auth tokens and server endpoints.
// All other frontend modules import this.
// ──────────────────────────────────────────────

const API_BASE = window.__VIBE_API_BASE__ || '';

class ApiClient {
  constructor() {
    this._socket = null;
    this._socketCallbacks = new Map();
  }

  // ── Auth ──
  async _getToken() {
    if (!firebase?.auth) return null;
    const user = firebase.auth().currentUser;
    if (!user) {
      // Try to wait briefly for Firebase to restore session
      return new Promise((resolve) => {
        const unsub = firebase.auth().onAuthStateChanged((u) => {
          unsub();
          resolve(u ? u.getIdToken() : null);
        }, () => resolve(null));
      });
    }
    return user.getIdToken();
  }

  _headers(token) {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  // ── HTTP ──
  async get(path) {
    const token = await this._getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: this._headers(token),
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async post(path, body = {}) {
    const token = await this._getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this._headers(token),
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── WebSocket (thin wrapper — all event logic is server-side) ──
  connectSocket() {
    if (this._socket?.connected) return this._socket;

    this._socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionAttempts: 1000,
    });

    this._socket.on('connect', async () => {
      const token = await this._getToken();
      if (token) {
        this._socket.emit('authenticate', {
          token,
          sessionId: this._getSessionId(),
          tabId: window.tabManager?.tabId || null,
        });
      }
    });

    // Forward events to registered callbacks
    for (const [event, cbs] of this._socketCallbacks) {
      for (const cb of cbs) {
        this._socket.on(event, cb);
      }
    }

    return this._socket;
  }

  on(event, callback) {
    if (!this._socketCallbacks.has(event)) {
      this._socketCallbacks.set(event, []);
    }
    this._socketCallbacks.get(event).push(callback);
    if (this._socket) {
      this._socket.on(event, callback);
    }
  }

  emit(event, data, ack) {
    if (this._socket?.connected) {
      this._socket.emit(event, data, ack);
    }
  }

  _getSessionId() {
    let sid = sessionStorage.getItem('vibe_api_session_id');
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem('vibe_api_session_id', sid);
    }
    return sid;
  }

  disconnectSocket() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    this._socketCallbacks.clear();
  }
}

// Singleton
window.__vibeApi = window.__vibeApi || new ApiClient();
export const api = window.__vibeApi;
