import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPromoter } from './lib/auth';
import { getAdminDb } from './lib/firebase-admin';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit';
import { cors } from './lib/cors';

/**
 * GET /api/scanner-stats?eventId=xxx
 *
 * Returns { usedCount, totalSold } without sending all ticket data to client.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyPromoter(req);

    // Rate limiting
    if (rateLimit(req, res, user.uid, RATE_LIMITS.GENERAL)) return;

    const db = getAdminDb();
    const eventId = req.query.eventId as string;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    // Verify organizer owns this event
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventSnap.data()!.organizer !== user.uid) {
      return res.status(403).json({ error: 'Not the organizer of this event' });
    }

    // Count tickets
    const ticketsSnap = await db
      .collection('tickets')
      .where('eventId', '==', eventId)
      .where('status', 'in', ['active', 'used'])
      .get();

    let usedCount = 0;
    let totalSold = 0;

    ticketsSnap.docs.forEach((doc) => {
      totalSold++;
      if (doc.data().status === 'used') usedCount++;
    });

    return res.status(200).json({ usedCount, totalSold });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get stats';
    return res.status(400).json({ error: message });
  }
}
