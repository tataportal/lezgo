import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPromoter } from './lib/auth.js';
import { getAdminDb } from './lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './lib/rate-limit.js';
import { cors } from './lib/cors.js';

/**
 * GET /api/organizer-stats
 *
 * Returns aggregated stats for all events owned by the authenticated organizer.
 * Avoids sending all raw ticket data to the client.
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

    // Get organizer's events
    const eventsSnap = await db
      .collection('events')
      .where('organizer', '==', user.uid)
      .get();

    const eventStats = await Promise.all(
      eventsSnap.docs.map(async (eventDoc) => {
        const event = { id: eventDoc.id, ...eventDoc.data() };

        // Count tickets for this event
        const ticketsSnap = await db
          .collection('tickets')
          .where('eventId', '==', eventDoc.id)
          .where('status', 'in', ['active', 'transferred', 'used'])
          .get();

        let ticketsSold = 0;
        let revenue = 0;

        ticketsSnap.docs.forEach((ticketDoc) => {
          ticketsSold++;
          revenue += ticketDoc.data().price || 0;
        });

        const capacity = ((event as any).tiers || []).reduce(
          (sum: number, tier: any) => sum + (tier.capacity || 0),
          0
        );

        return {
          event,
          ticketsSold,
          revenue,
          capacity,
        };
      })
    );

    return res.status(200).json({ events: eventStats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get stats';
    return res.status(400).json({ error: message });
  }
}
