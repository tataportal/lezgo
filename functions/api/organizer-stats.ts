import { verifyPromoter } from './_lib/auth.js';
import { getAdminDb } from './_lib/firebase-admin.js';
import { rateLimit, RATE_LIMITS } from './_lib/rate-limit.js';
import { json, errorResponse, type Env } from './_lib/types.js';

/**
 * GET /api/organizer-stats
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = await verifyPromoter(context.request, context.env);

    const rateLimited = rateLimit(user.uid, RATE_LIMITS.GENERAL);
    if (rateLimited) return rateLimited;

    const db = getAdminDb(context.env);

    const eventsSnap = await db
      .collection('events')
      .where('organizer', '==', user.uid)
      .get();

    const eventStats = await Promise.all(
      eventsSnap.docs.map(async (eventDoc) => {
        const event = { id: eventDoc.id, ...eventDoc.data() };

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

        return { event, ticketsSold, revenue, capacity };
      })
    );

    return json({ events: eventStats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get stats';
    return errorResponse(message);
  }
};
