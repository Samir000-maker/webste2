import { Router } from 'express';
import { getDB } from '../../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/chat/history/:roomId — Get chat history
router.get('/history/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.firebaseUser.uid;
  const db = getDB();

  const messages = await db.collection('messages')
    .find({ roomId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  res.json({ messages: messages.reverse() });
});

// GET /api/chat/room/:roomId — Get room metadata
router.get('/room/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const db = getDB();
  const room = await db.collection('rooms').findOne({ roomId });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room });
});

// POST /api/chat/validate-file — Server-side file validation
router.post('/validate-file', requireAuth, async (req, res) => {
  const { name, type, size } = req.body;
  const MAX_SIZE = 10 * 1024 * 1024;
  const errors = [];

  if (size > MAX_SIZE) errors.push('File exceeds 10MB limit');
  if (!name || name.length > 255) errors.push('Invalid filename');

  res.json({ valid: errors.length === 0, errors });
});

export default router;
