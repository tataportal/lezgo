import { verifyPromoter } from './_lib/auth.js';
import { queryDocs } from './_lib/firestore-rest.js';
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

    const env = context.env;

    const eventsSnap = await queryDocs(env, 'events', [
      { field: 'organizer', op: 'EQUAL', value: user.uid },
    ]);

    const eventStats = await Promise.all(
      eventsSnap.docs.map(async (eventDoc) => {
        const event = { id: eventDoc.id, ...eventDoc.data() };

        const ticketsSnap = await queryDocs(env, 'tickets', [
          { field: 'eventId', op: 'EQUAL', value: eventDoc.id },
          { field: 'status', op: 'IN', value: ['active', 'transferred', 'used'] },
        ]);

        let ticketsSold = 0;
        let revenue = 0;

        ticketsSnap.docs.forEach((ticketDoc) => {
          ticketsSold++;
          revenue += ticketDoc.data()?.price || 0;
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
