import { Router } from 'express';
import { getDB } from '../../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/mood/select — Select mood & begin matchmaking
router.post('/select', requireAuth, async (req, res) => {
  const { mood } = req.body;
  const userId = req.firebaseUser.uid;

  const validMoods = ['happy','sad','angry','lonely','calm','excited','tired','stressed','confused'];
  if (!validMoods.includes(mood)) {
    return res.status(400).json({ error: 'Invalid mood' });
  }

  const db = getDB();
  // Validate user is not already in a room, then add to matchmaking queue
  const activeRoom = await db.collection('active_rooms').findOne({ userId });
  if (activeRoom) {
    return res.status(409).json({ error: 'Already in a room', roomId: activeRoom.roomId });
  }

  // Add to matchmaking pool (Redis-backed in original, abstracted here)
  // Return queue position or match result
  res.json({ success: true, mood, queued: true });
});

// GET /api/mood/counts — Get current mood counts
router.get('/counts', async (req, res) => {
  const db = getDB();
  const moods = await db.collection('mood_counts').find().toArray();
  res.json({ moods });
});

// POST /api/mood/cancel — Cancel matchmaking
router.post('/cancel', requireAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  // Remove from matchmaking queue
  res.json({ success: true });
});

export default router;
