# Frontend API Bridge Examples

## Before (exposed logic in browser)

```js
// chat.js (client-side, currently sent to browser)
function setupSocketHandlers() {
  socketInstance.on('chat_message', async (data) => {
    // All message handling logic visible in DevTools
    appendMessage(data);
    playNotificationSound();
  });

  socketInstance.on('user_typing', ({ userId, username }) => {
    showTypingIndicator(userId, username);
    setTimeout(() => hideTypingIndicator(userId), 3000);
  });
}
```

## After (thin API bridge in browser, logic on server)

```js
// chat-bridge.js — only this file is sent to the browser
// All proprietary logic stays server-side in server/services/socket-handlers.js

import { api } from './api-client.js';

export const chat = {
  async sendMessage(roomId, text) {
    return api.post('/api/chat/messages', { roomId, text });
  },

  async getHistory(roomId) {
    return api.get(`/api/chat/history/${roomId}`);
  },

  subscribe(roomId, handlers) {
    const socket = io();
    socket.on('connect', () => {
      socket.emit('authenticate', { token: getAuthToken() });
    });
    socket.on('chat_message', handlers.onMessage);
    socket.on('user_typing', handlers.onTyping);
    return () => socket.disconnect();
  }
};
```

## Before (mood.js exposed algorithm)

```js
// mood.js (currently in browser)
async function selectMood(mood) {
  const auth = firebase.auth();
  const user = auth.currentUser;
  const token = await user.getIdToken();
  // All mood matching, queue logic, and room creation visible
  const response = await fetch('/api/matchmaking/join', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mood })
  });
  // Client has to handle all response logic
}
```

## After

```js
// mood-bridge.js — thin client, all logic server-side

import { api } from './api-client.js';

export const mood = {
  async select(moodId) {
    // Server handles validation, queueing, matching algorithms
    const { data } = await api.post('/api/mood/select', { mood: moodId });
    return data;
  },

  async getCounts() {
    const { data } = await api.get('/api/mood/counts');
    return data.moods;
  },

  async cancel() {
    await api.post('/api/mood/cancel');
  }
};
```

## API Client (the only shared auth logic)

```js
// api-client.js — simple fetch wrapper, no proprietary logic

function getAuthToken() {
  return firebase.auth().currentUser?.getIdToken();
}

export const api = {
  async get(path) {
    const token = await getAuthToken();
    const res = await fetch(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return { data: await res.json() };
  },

  async post(path, body) {
    const token = await getAuthToken();
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return { data: await res.json() };
  },
};
```
