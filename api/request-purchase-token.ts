import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { generatePurchaseToken } from './lib/purchase-token.js';
import { cors } from './lib/cors.js';

/**
 * POST /api/request-purchase-token
 * Body: { eventId }
 *
 * Security Layer 3: Virtual Queue.
 * Issues a time-limited, single-use purchase token.
 * Client must include this token in the purchase request.
 * Token expires in 2 minutes.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyAuth(req);

    // Rate limiting: same as general (30/min)
    if (rateLimit(req, res, user.uid, RATE_LIMITS.GENERAL)) return;

    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const token = generatePurchaseToken(user.uid, eventId);

    return res.status(200).json({
      purchaseToken: token,
      expiresIn: 120, // seconds
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate token';
    return res.status(400).json({ error: message });
  }
}
