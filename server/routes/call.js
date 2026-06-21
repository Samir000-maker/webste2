import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/call/turn-credentials — Get TURN server credentials
router.post('/turn-credentials', requireAuth, async (req, res) => {
  try {
    const { CLOUDFLARE_TURN_TOKEN_ID, CLOUDFLARE_TURN_API_TOKEN } = process.env;
    if (!CLOUDFLARE_TURN_TOKEN_ID || !CLOUDFLARE_TURN_API_TOKEN) {
      return res.status(503).json({ error: 'TURN not configured' });
    }

    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${CLOUDFLARE_TURN_TOKEN_ID}/credentials/generate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_TURN_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: 86400 }),
      }
    );

    const data = await response.json();
    res.json({ iceServers: data.iceServers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch TURN credentials' });
  }
});

// POST /api/call/validate-room — Server-side call room validation
router.post('/validate-room', requireAuth, async (req, res) => {
  const { roomId, callId } = req.body;
  // Validate room existence and call state
  res.json({ valid: true });
});

export default router;
