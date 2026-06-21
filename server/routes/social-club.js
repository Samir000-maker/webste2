import { Router } from 'express';
import { getDB } from '../../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/social-club/state — Get current social club state
router.get('/state', requireAuth, async (req, res) => {
  const db = getDB();
  const doc = await db.collection('event').findOne(
    { name: 'social_club' },
    { projection: { _id: 0, isEventOpen: 1, updatedAt: 1 } }
  );
  res.json({ event: { name: 'social_club', isEventOpen: !!doc?.isEventOpen, updatedAt: doc?.updatedAt || null } });
});

// POST /api/social-club/join — Request to join social club
router.post('/join', requireAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  const db = getDB();

  const doc = await db.collection('event').findOne({ name: 'social_club' });
  if (!doc?.isEventOpen) {
    return res.status(403).json({ error: 'Social Club is not open' });
  }

  // Generate or return room URL for social club
  res.json({ success: true, roomUrl: '/chat.html?mode=social-club' });
});

// POST /api/social-club/toggle — Owner-only toggle event state
router.post('/toggle', requireAuth, async (req, res) => {
  const userId = req.firebaseUser.uid;
  const db = getDB();

  const user = await db.collection('users').findOne(
    { firebaseUid: userId },
    { projection: { email: 1 } }
  );

  if (!user || user.email !== 'samirahmed1887@gmail.com') {
    return res.status(403).json({ error: 'Only the owner can toggle' });
  }

  const doc = await db.collection('event').findOneAndUpdate(
    { name: 'social_club' },
    [{ $set: { isEventOpen: { $not: '$isEventOpen' }, updatedAt: new Date().toISOString() } }],
    { returnDocument: 'after', upsert: true }
  );

  res.json({ success: true, isEventOpen: !!doc?.isEventOpen });
});

export default router;
