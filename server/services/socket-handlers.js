import { getDB } from '../../database.js';

export function registerSocketHandlers(io, redis) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Authentication ──
    socket.on('authenticate', async ({ token, sessionId, tabId }) => {
      try {
        const { uid } = await verifyToken(token);
        socket.data.userId = uid;
        socket.join(`user:${uid}`);
        socket.emit('authenticated', { userId: uid, sessionId });

        // Restore room if exists
        const db = getDB();
        const room = await db.collection('active_rooms').findOne({ userId: uid });
        if (room) {
          socket.join(room.roomId);
          socket.emit('room_restored', room);
        }
      } catch {
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // ── Chat ──
    socket.on('chat_message', async (data) => {
      const userId = socket.data.userId;
      if (!userId) return;

      const db = getDB();
      const message = {
        roomId: data.roomId,
        userId,
        text: data.text,
        createdAt: new Date(),
        type: data.type || 'text',
      };

      await db.collection('messages').insertOne(message);
      io.to(data.roomId).emit('chat_message', message);
    });

    socket.on('user_typing', ({ roomId, username }) => {
      socket.to(roomId).emit('user_typing', { userId: socket.data.userId, username });
    });

    socket.on('user_stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing', { userId: socket.data.userId });
    });

    // ── Call Signaling ──
    socket.on('initiate_call', ({ roomId, callType }) => {
      io.to(roomId).emit('incoming_call', {
        callerId: socket.data.userId,
        callerSocketId: socket.id,
        callType,
      });
    });

    socket.on('call_accepted', ({ roomId, callId }) => {
      socket.to(roomId).emit('call_accepted', {
        callId,
        userId: socket.data.userId,
        socketId: socket.id,
      });
    });

    socket.on('call_declined', ({ roomId, callId }) => {
      socket.to(roomId).emit('call_declined', { callId, userId: socket.data.userId });
    });

    socket.on('call_state_update', ({ roomId, callId, state }) => {
      socket.to(roomId).emit('call_state_update', { callId, userId: socket.data.userId, state });
    });

    socket.on('ice_candidate', ({ roomId, candidate, callId }) => {
      socket.to(roomId).emit('ice_candidate', { candidate, userId: socket.data.userId, callId });
    });

    socket.on('offer', ({ roomId, offer, callId }) => {
      socket.to(roomId).emit('offer', { offer, userId: socket.data.userId, callId });
    });

    socket.on('answer', ({ roomId, answer, callId }) => {
      socket.to(roomId).emit('answer', { answer, userId: socket.data.userId, callId });
    });

    // ── File Transfers ──
    socket.on('file_chunk', async ({ fileId, chunk, index }) => {
      // Server-mediated chunk relay
      socket.to(socket.data.currentRoom).emit('file_chunk', { fileId, chunk, index });
    });

    // ── Heartbeat ──
    socket.on('client_pong', async () => {
      if (socket.data.userId) {
        await redis?.hset('presence:heartbeat', socket.data.userId, Date.now().toString());
      }
    });

    // ── Leave / Disconnect ──
    socket.on('leave_room', async ({ roomId }, ack) => {
      const userId = socket.data.userId;
      if (userId) {
        const db = getDB();
        await db.collection('active_rooms').deleteOne({ userId });
        io.to(roomId).emit('user_left', { userId, username: socket.data.username });
      }
      socket.leave(roomId);
      ack?.({ success: true });
    });

    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}

async function verifyToken(token) {
  const admin = await import('firebase-admin');
  return admin.default.auth().verifyIdToken(token);
}
